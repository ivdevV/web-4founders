# Workflows n8n — Web 4Founders Studio

Los formularios de la web envían JSON a la API (`server/index.js`), que reenvía a webhooks de n8n. Odoo nunca recibe peticiones directas del navegador.

## Variables de entorno (Coolify / `.env`)

```env
N8N_CONTACT_WEBHOOK=https://tu-n8n.example.com/webhook/contact
N8N_LEAD_WEBHOOK=https://tu-n8n.example.com/webhook/lead
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

## Errores

Si n8n responde con status distinto de 2xx, la API devuelve `502` al frontend con:

```json
{ "error": "No pudimos procesar tu solicitud. Inténtalo de nuevo." }
```

## Prueba local sin n8n

Sin `N8N_*_WEBHOOK` configuradas, la API acepta el envío y registra un warning en consola (útil para desarrollo).
