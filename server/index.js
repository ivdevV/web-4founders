import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { publishBlogPost } from './blog/publish.js';
import { buildContactWebhookPayload, countryFromPrefix, timeSlotLabel, validateContactPayload } from './contact.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
dotenv.config({ path: path.join(root, '.env') });
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '32kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

async function forwardToN8n(webhookUrl, payload) {
  if (!webhookUrl) {
    console.warn('Webhook URL not configured — accepting submission locally only');
    return { ok: true, skipped: true };
  }
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`n8n responded ${res.status}: ${text.slice(0, 200)}`);
  }
  return { ok: true };
}

app.post('/api/contact', async (req, res) => {
  const result = validateContactPayload(req.body);
  if (result.error) return res.status(400).json({ error: result.error });

  const { payload } = result;
  const { pais = null, paisIso = null } = countryFromPrefix(payload.prefijo);
  try {
    await forwardToN8n(process.env.N8N_CONTACT_WEBHOOK, {
      ...buildContactWebhookPayload(payload, process.env.CONTACT_RECIPIENT_EMAIL),
      pais,
      paisIso,
      franjaHorariaLabel: timeSlotLabel(payload.franjaHoraria),
      submittedAt: new Date().toISOString(),
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Contact webhook error:', err.message);
    res.status(502).json({ error: 'No pudimos procesar tu solicitud. Inténtalo de nuevo.' });
  }
});

app.post('/api/lead', async (req, res) => {
  const { email } = req.body || {};
  if (!isEmail(email)) {
    return res.status(400).json({ error: 'Introduce un email válido.' });
  }
  const webhookUrl = process.env.N8N_LEAD_WEBHOOK;
  if (!webhookUrl) {
    console.error('N8N_LEAD_WEBHOOK not set — cannot forward lead');
    return res.status(503).json({ error: 'No pudimos procesar tu solicitud. Inténtalo de nuevo.' });
  }
  try {
    await forwardToN8n(webhookUrl, {
      source: 'web-4founders',
      type: 'lead',
      email: email.trim(),
      submittedAt: new Date().toISOString(),
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Lead webhook error:', err.message);
    res.status(502).json({ error: 'No pudimos procesar tu solicitud. Inténtalo de nuevo.' });
  }
});

app.post('/api/blog/publish', publishBlogPost);

app.use('/guia', express.static(path.join(root, 'guia'), { index: 'index.html' }));
app.use(express.static(path.join(root, 'public'), { index: 'index.html' }));

app.listen(PORT, () => {
  console.log(`4Founders Studio listening on :${PORT}`);
  if (process.env.N8N_LEAD_WEBHOOK) {
    console.log('N8N lead webhook: configured');
  } else {
    console.warn('N8N_LEAD_WEBHOOK not set — lead form saves UI state only, no n8n call');
  }
});
