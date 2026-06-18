---
name: web-4founders-best-practices
description: >-
  Buenas prácticas obligatorias para el proyecto Web 4Founders Studio: stack
  HTML/CSS/JS + Express, brand kit, flujo PR, formularios n8n/Odoo y deploy
  Coolify. Usar en toda implementación, revisión o refactor de este repo.
---

# Web 4Founders — Buenas prácticas

## Stack (no cambiar sin PR de arquitectura)

| Capa | Tecnología |
|------|------------|
| Landing | HTML estático en `public/` |
| Estilos | `public/styles.css` — tokens Brand Kit v1.0 |
| Interacción | Vanilla JS en `public/app.js` |
| Guía | dc-runtime en `guia/` — servida en `/guia` |
| API | Express ESM en `server/index.js` |
| Deploy | Docker → Coolify |

**Prohibido en producción:** `tweaks-panel.jsx`, React/Babel CDN en la landing.

## Identidad visual (Brand Kit)

Colores y tipografía en `docs/brand-kit.html`:

- Grafito `#2B2B2B`, champán `#E8D9B0`, crema `#F7F4EE`
- Serif: Georgia · Sans: Arial
- Tono: directo, premium, sin jerga vacía de “transformación digital”

Antes de tocar UI, leer también las skills de diseño instaladas en `.agents/skills/`:

- `frontend-design`
- `web-design-guidelines`
- `ui-ux-pro-max`

## Git y despliegue

1. **Nunca push directo a `main`** — siempre rama `feat/*` o `fix/*` → PR
2. Repo: `git@github-personal:Ivrogo/web-4founders.git`
3. Coolify despliega `main` tras merge del PR
4. Commits: mensajes en español o inglés, imperativo, enfocados en el porqué

## Formularios

- Frontend solo llama `/api/contact` y `/api/lead`
- URLs de n8n **solo** en variables de entorno del servidor (`N8N_*_WEBHOOK`)
- Nunca exponer credenciales Odoo al cliente
- Estados UX obligatorios: loading, éxito, error visible
- Spec n8n: `docs/n8n-workflows.md`

## Estructura de archivos

```
public/index.html    # Landing — no renombrar la ruta de entrada
public/assets/       # Imágenes y vídeos — rutas relativas
guia/index.html      # Guía interactiva
server/index.js      # Rutas API + static + /health
```

Al añadir rutas estáticas, registrar **antes** del catch-all de `public/`.

## Código

- JS del frontend: IIFE, `'use strict'`, sin frameworks
- Server: ESM (`import`), validación en servidor aunque el cliente valide
- Cambios mínimos: no refactorizar fuera del alcance del PR
- Comentarios solo para lógica no obvia

## SEO y accesibilidad

- `alt` descriptivos en imágenes con contenido
- Meta OG/Twitter en `public/index.html`
- FAQ JSON-LD ya presente — mantener sincronizado con el HTML
- Contraste según paleta Brand Kit

## Verificación antes de cerrar PR

```bash
cd server && npm run dev   # http://localhost:3000
curl http://localhost:3000/health
# Probar /, /guia, POST /api/lead con email válido
```

Checklist:

- [ ] Sin scripts de desarrollo (tweaks) en `public/index.html`
- [ ] Enlaces legales en `/legal/`
- [ ] Guía accesible en `/guia`
- [ ] Formularios con feedback de error
- [ ] Dockerfile build OK: `docker compose build`

## Fuera de alcance (requiere issue/PR dedicado)

- Descarga automática de guía tras formulario
- Calendly embebido
- Migración a Next.js/React SPA
- Backend con base de datos propia
