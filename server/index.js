import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { publishBlogPost } from './blog/publish.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
dotenv.config({ path: path.join(root, '.env') });
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '32kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
}

// Debe coincidir con las opciones del <select name="franjaHoraria"> en public/index.html
const FRANJAS = {
  manana: 'Mañana (9:00–12:00)',
  mediodia: 'Mediodía (12:00–15:00)',
  tarde: 'Tarde (15:00–18:00)',
  'tarde-noche': 'Tarde-noche (18:00–21:00)',
  cualquiera: 'Cualquier hora',
};

// Debe coincidir con las opciones del <select name="prefijo"> en public/index.html
const PAISES_POR_PREFIJO = {
  '+34': { pais: 'España', paisIso: 'ES' },
  '+52': { pais: 'México', paisIso: 'MX' },
  '+54': { pais: 'Argentina', paisIso: 'AR' },
  '+57': { pais: 'Colombia', paisIso: 'CO' },
  '+56': { pais: 'Chile', paisIso: 'CL' },
  '+51': { pais: 'Perú', paisIso: 'PE' },
  '+1': { pais: 'Estados Unidos', paisIso: 'US' },
  '+44': { pais: 'Reino Unido', paisIso: 'GB' },
  '+33': { pais: 'Francia', paisIso: 'FR' },
  '+49': { pais: 'Alemania', paisIso: 'DE' },
  '+351': { pais: 'Portugal', paisIso: 'PT' },
};

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
  const { nombre, email, prefijo, telefono, franjaHoraria, profesion, descripcion } = req.body || {};
  if (!nombre?.trim() || !isEmail(email) || !telefono?.trim() || !profesion?.trim() || !descripcion?.trim()) {
    return res.status(400).json({ error: 'Datos incompletos o inválidos.' });
  }
  if (!Object.hasOwn(FRANJAS, String(franjaHoraria || ''))) {
    return res.status(400).json({ error: 'Selecciona una franja horaria válida.' });
  }
  const prefijoNormalizado = String(prefijo || '+34').trim();
  const { pais = null, paisIso = null } = PAISES_POR_PREFIJO[prefijoNormalizado] || {};
  try {
    await forwardToN8n(process.env.N8N_CONTACT_WEBHOOK, {
      source: 'web-4founders',
      type: 'contact',
      nombre: nombre.trim(),
      email: email.trim(),
      prefijo: prefijoNormalizado,
      telefono: telefono.trim(),
      pais,
      paisIso,
      franjaHoraria,
      franjaHorariaLabel: FRANJAS[franjaHoraria],
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
