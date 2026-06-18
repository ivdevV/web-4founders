import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { publishBlogPost } from './blog/publish.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '32kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
}

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
  const { nombre, email, prefijo, telefono, profesion, descripcion } = req.body || {};
  if (!nombre?.trim() || !isEmail(email) || !telefono?.trim() || !profesion?.trim() || !descripcion?.trim()) {
    return res.status(400).json({ error: 'Datos incompletos o inválidos.' });
  }
  try {
    await forwardToN8n(process.env.N8N_CONTACT_WEBHOOK, {
      source: 'web-4founders',
      type: 'contact',
      nombre: nombre.trim(),
      email: email.trim(),
      prefijo: prefijo || '+34',
      telefono: telefono.trim(),
      profesion: profesion.trim(),
      descripcion: descripcion.trim(),
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
  try {
    await forwardToN8n(process.env.N8N_LEAD_WEBHOOK, {
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
});
