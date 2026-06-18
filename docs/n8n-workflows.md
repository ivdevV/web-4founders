# Workflows n8n — Web 4Founders Studio

Los formularios de la web envían JSON a la API (`server/index.js`), que reenvía a webhooks de n8n. Odoo nunca recibe peticiones directas del navegador.

## Variables de entorno (Coolify / `.env`)

```env
N8N_CONTACT_WEBHOOK=https://tu-n8n.example.com/webhook/contact
N8N_LEAD_WEBHOOK=https://tu-n8n.example.com/webhook/lead
BLOG_PUBLISH_SECRET=genera-un-secreto-largo-aleatorio
GITHUB_TOKEN=ghp_...
GITHUB_REPO=Ivrogo/web-4founders
GITHUB_BRANCH=main
PORT=3000
```

## Workflow 1 — Contacto (`POST /api/contact`)

**Trigger:** Webhook POST (path sugerido: `contact`)

**Payload recibido desde la API:**

```json
{
  "source": "web-4founders",
  "type": "contact",
  "nombre": "Ana García",
  "email": "ana@ejemplo.com",
  "prefijo": "+34",
  "telefono": "600000000",
  "profesion": "Abogada",
  "descripcion": "Quiero montar mi despacho online",
  "submittedAt": "2026-06-18T12:00:00.000Z"
}
```

**Pasos sugeridos:**

1. Validar campos obligatorios (`nombre`, `email`, `telefono`, `profesion`, `descripcion`)
2. Nodo Odoo — crear `crm.lead` o `res.partner` según tu configuración
3. (Opcional) Notificación email/Slack al equipo
4. Responder HTTP 200 `{ "ok": true }`

## Workflow 2 — Lead guía (`POST /api/lead`)

**Trigger:** Webhook POST (path sugerido: `lead`)

**Payload:**

```json
{
  "source": "web-4founders",
  "type": "lead",
  "email": "usuario@ejemplo.com",
  "submittedAt": "2026-06-18T12:00:00.000Z"
}
```

**Pasos sugeridos:**

1. Validar email
2. Nodo Odoo — crear contacto o añadir a lista de marketing
3. Responder HTTP 200 `{ "ok": true }`

## Workflow 3 — Publicar blog (`POST /api/blog/publish`)

**Trigger sugerido:** Cron semanal, manual o webhook interno.

**Flujo:**

1. **Nodo IA** — generar artículo en tono 4Founders (directo, premium, sin jerga vacía). Output JSON:
   - `slug` (kebab-case)
   - `title`
   - `excerpt` (máx. ~160 caracteres)
   - `category` (ej. `Negocio digital`, `Marca`, `Estrategia`)
   - `bodyHtml` (HTML con tags: `p`, `h2`, `h3`, `ul`, `ol`, `li`, `a`, `strong`, `em`, `blockquote`)
2. **(Recomendado)** Nodo de aprobación humana (Telegram, Slack o email)
3. **HTTP Request** — publicar en la API:

```
POST https://4founders.studio/api/blog/publish
Authorization: Bearer <BLOG_PUBLISH_SECRET>
Content-Type: application/json
```

**Payload:**

```json
{
  "slug": "como-montar-despacho-online",
  "title": "Cómo montar tu despacho online sin perder el foco profesional",
  "excerpt": "Guía práctica para profesionales que quieren digitalizar su consulta.",
  "category": "Negocio digital",
  "bodyHtml": "<p>Primer párrafo...</p><h2>Sección</h2><p>Más contenido...</p>",
  "cover": "/assets/escritorio-planificando.jpg",
  "published": true,
  "author": "4Founders Studio"
}
```

**Respuesta exitosa:**

```json
{ "ok": true, "url": "/blog/como-montar-despacho-online/" }
```

**Pasos en el servidor:**

1. Valida secret y campos
2. Sanitiza `bodyHtml`
3. Genera `public/blog/{slug}/index.html` y actualiza `public/blog/posts.json`
4. Si `GITHUB_TOKEN` está configurado, hace commit atómico a `main` → Coolify redespliega
5. Responde con la URL pública

**Errores:** `400` validación · `401` secret inválido · `409` slug duplicado · `502` fallo GitHub

4. **(Opcional)** Notificación con la URL del artículo publicado

## Errores

Si n8n responde con status distinto de 2xx, la API devuelve `502` al frontend con:

```json
{ "error": "No pudimos procesar tu solicitud. Inténtalo de nuevo." }
```

## Prueba local sin n8n

Sin `N8N_*_WEBHOOK` configuradas, la API acepta el envío y registra un warning en consola (útil para desarrollo).

Sin `GITHUB_TOKEN`, la publicación de blog escribe en disco local pero no commitea al repo (útil para desarrollo).
