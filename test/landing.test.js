import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { buildContactWebhookPayload, normalizeContactPayload } from '../server/contact.js';

const execFileAsync = promisify(execFile);
const publicDir = new URL('../public/', import.meta.url);
const landingPath = new URL('index.html', publicDir);
const runtimePath = new URL('support.js', publicDir);

test('public landing uses the supplied 4Founders Studio document', async () => {
  const html = await readFile(landingPath, 'utf8');

  assert.match(html, /<html lang="es">/);
  assert.match(html, /<script src="\.\/support\.js"><\/script>/);
  assert.match(html, /El futuro no se sueña\.<br>Se funda\./);
  assert.match(html, /id="cursos"/);
  assert.match(html, /id="mentores"/);
  assert.match(html, /id="contacto"/);
});

test('public landing exposes the blog as a first-class section', async () => {
  const html = await readFile(landingPath, 'utf8');

  assert.match(html, /href="#blog"[^>]*>Blog<\/a>/);
  assert.match(html, /data-navlink="blog"/);
  assert.match(html, /<section id="blog"/);
  assert.match(html, /id="landingBlogGrid"/);
  assert.match(html, /Todos los artículos/);
});

test('landing blog renders every published article from the shared post feed', async () => {
  const html = await readFile(landingPath, 'utf8');

  assert.match(html, /fetch\(['"]\.\/blog\/posts\.json['"]/);
  assert.match(html, /post\.published !== false/);
  assert.match(html, /\.sort\(\(a, b\)/);
});

test('landing blog includes a CTA to the dedicated blog page', async () => {
  const html = await readFile(landingPath, 'utf8');
  const blogStart = html.indexOf('<section id="blog"');
  const contactStart = html.indexOf('<section id="contacto"');
  const ctaPosition = html.indexOf('class="landing-blog-cta"');

  assert.ok(ctaPosition > blogStart && ctaPosition < contactStart);
  assert.match(html, /<a class="landing-blog-cta" href="\/blog\/">Ver todos los artículos/);
});

test('public landing ships its runtime and contact integration', async () => {
  await access(runtimePath);
  const html = await readFile(landingPath, 'utf8');

  assert.match(html, /\/api\/contact/);
  assert.match(html, /Mensaje enviado/);
});

test('Instagram CTA points to the 4Founders Studio account', async () => {
  const html = await readFile(landingPath, 'utf8');

  assert.match(html, /href="https:\/\/www\.instagram\.com\/4founderstudio\/"/);
  assert.match(html, /aria-label="Instagram de 4Founders Studio: @4founderstudio"/);
});

test('contact payload accepts the supplied course form fields', () => {
  const payload = normalizeContactPayload({
    nombre: ' Ana ',
    email: ' ana@example.com ',
    prefijo: '🇪🇸 +34',
    telefono: '600 00 00 00',
    curso: 'Funda tu gabinete de psicología',
    mensaje: 'Quiero empezar.',
  });

  assert.deepEqual(payload, {
    nombre: 'Ana',
    email: 'ana@example.com',
    prefijo: '+34',
    telefono: '600 00 00 00',
    franjaHoraria: 'cualquiera',
    profesion: 'Funda tu gabinete de psicología',
    descripcion: 'Quiero empezar.',
    curso: 'Funda tu gabinete de psicología',
  });
});

test('contact webhook payload includes the requested recipient email', () => {
  const payload = buildContactWebhookPayload({
    nombre: 'Ana',
    email: 'ana@example.com',
    prefijo: '+34',
    telefono: '600 00 00 00',
    franjaHoraria: 'cualquiera',
    profesion: 'Psicóloga',
    descripcion: 'Quiero empezar.',
    curso: 'Funda tu gabinete de psicología',
  }, 'clayton@4founderstudio.com');

  assert.equal(payload.destinatarioEmail, 'clayton@4founderstudio.com');
  assert.equal(payload.type, 'contact');
});

test('public runtime is valid JavaScript', async () => {
  await execFileAsync(process.execPath, ['--check', fileURLToPath(runtimePath)]);
});

test('landing header has a mobile overflow guard', async () => {
  const html = await readFile(landingPath, 'utf8');

  assert.match(html, /class="site-nav"/);
  assert.match(html, /class="nav-optional"/);
  assert.match(html, /@media \(max-width: 760px\)/);
});
