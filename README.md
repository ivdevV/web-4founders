# Web 4Founders Studio

Landing corporativa + guía práctica interactiva para 4Founders Studio.

## Estructura

```
public/     # Landing (HTML/CSS/JS + assets)
guia/       # Guía "De la idea al mercado" (dc-runtime)
server/     # Express: estáticos + API + /health
docs/       # Brand kit, workflows n8n
```

## Desarrollo local

```bash
cp .env.example .env
cd server && npm install && npm run dev
```

Abre http://localhost:3000

## Docker

```bash
docker compose up --build
```

## Deploy (Coolify)

- Repo: `git@github-personal:Ivrogo/web-4founders.git`
- Rama: `main` (solo vía **pull request**)
- Build: `Dockerfile` en raíz
- Variables: `N8N_CONTACT_WEBHOOK`, `N8N_LEAD_WEBHOOK`, `BLOG_PUBLISH_SECRET`, `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`, `PORT=3000`
- Healthcheck: `GET /health`

## Flujo Git

1. Crear rama desde `main`: `feat/nombre-cambio`
2. Commit + push
3. Abrir PR hacia `main`
4. Merge tras revisión → Coolify despliega automáticamente

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing corporativa |
| `/blog` | Listado de artículos |
| `/blog/{slug}/` | Artículo individual |
| `/guia` | Guía interactiva (10 fases) |
| `/api/contact` | Formulario diagnóstico → n8n |
| `/api/lead` | Formulario lead magnet → n8n |
| `/api/blog/publish` | Publicar artículo (n8n + IA, Bearer secret) |
| `/health` | Healthcheck |

## Agentes y skills

Ver [AGENTS.md](AGENTS.md) para el flujo obligatorio de desarrollo.

Skills del proyecto en `.cursor/skills/`.
