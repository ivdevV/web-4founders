# AGENTS.md — Web 4Founders Studio

> **Regla absoluta:** En cada iteración, este archivo y las skills referenciadas se siguen **a rajatabla**. No improvisar flujos alternativos.

## Proyecto

| Campo | Valor |
|-------|-------|
| Repo | `git@github-personal:Ivrogo/web-4founders.git` |
| Rama protegida | `main` — **solo merge vía pull request** |
| Deploy | Coolify (Docker, rama `main`) |
| Dominio objetivo | `4founders.studio` |

## Regla obligatoria de desarrollo

Todo desarrollo sigue siempre:

1. **Plan** — alcance, archivos afectados, tier de complejidad
2. **Implementación** — rama `feat/*` o `fix/*`, nunca push directo a `main`
3. **Validación** — evidencia objetiva (servidor, health, formularios, build Docker)
4. **Documentación** — README/AGENTS si cambia el contrato; PR con test plan

### Flujo Git (obligatorio)

```bash
git checkout main && git pull
git checkout -b feat/descripcion-corta
# ... cambios ...
git push -u origin feat/descripcion-corta
gh pr create --base main
```

No mergear sin PR revisado. Coolify despliega al fusionar en `main`.

## Skills — usar siempre

### Skill de proyecto (leer al inicio de cada tarea)

| Skill | Ruta |
|-------|------|
| **web-4founders-best-practices** | `.cursor/skills/web-4founders-best-practices/SKILL.md` |

### Skills de diseño UI/UX (leer antes de tocar `public/` o `guia/`)

| Skill | Ruta |
|-------|------|
| frontend-design | `.agents/skills/frontend-design/SKILL.md` |
| web-design-guidelines | `.agents/skills/web-design-guidelines/SKILL.md` |
| ui-ux-pro-max | `.agents/skills/ui-ux-pro-max/SKILL.md` |

**Orden recomendado para cambios visuales:**

1. `web-4founders-best-practices` (marca y stack)
2. `ui-ux-pro-max` (paleta, tipografía, layout)
3. `frontend-design` (calidad visual)
4. `web-design-guidelines` (accesibilidad y UX)

## Stack — no desviarse

```
public/          → Landing HTML/CSS/JS
guia/            → Guía dc-runtime en /guia
server/          → Express: estáticos + /api/* + /health
docs/            → brand-kit.html, n8n-workflows.md
Dockerfile       → Node 20 Alpine
```

**Integraciones:** formularios → `server/index.js` → webhooks n8n → Odoo CRM.

## Routing dinámico de modelos

| Tier | Señales | Modelo |
|------|---------|--------|
| `trivial` | 1 archivo, copy, typos, CSS puntual | Ligero |
| `standard` | 2–5 archivos, API, formularios, guía | Intermedio |
| `complex` | Arquitectura, seguridad, Docker/Coolify, migraciones | Alto |

**Fuerzan tier `complex`:** auth, secretos, cambios de deploy, borrado de datos.

## Artefactos de misión (cambios grandes)

Para features o refactors multi-archivo, crear:

```
missions/<nombre>/
  plan.md
  execution.log
  verification.json
```

`verification.json` con `status: "passed"` antes de abrir PR.

## Contrato de verificación mínimo

```json
{
  "status": "passed",
  "checks": [
    { "name": "server_health", "result": "pass" },
    { "name": "docker_build", "result": "pass" },
    { "name": "routes", "result": "pass", "detail": "/, /guia, /health" }
  ]
}
```

Comandos de referencia:

```bash
cd server && npm run dev &
curl -s http://localhost:3000/health
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/guia/
docker compose build
```

## Perfil Security Advisor

Invocar revisión estricta antes de:

- Cambiar variables de entorno o webhooks
- Ejecutar comandos destructivos en git
- Exponer secretos en frontend o commits
- Modificar Dockerfile o permisos de red

Veredicto: `[YES] Reason: ...` o `[NO] Reason: ...`

## Knowledge base

Guardar en `knowledge/*.md` (crear si no existe):

- Decisiones de arquitectura y gotchas del proyecto
- URLs reales de redes sociales cuando se confirmen
- IDs de workflows n8n una vez creados

Consultar en fase Plan antes de repetir trabajo.

## Checklist pre-PR

- [ ] Skill `web-4founders-best-practices` aplicada
- [ ] Skills de diseño consultadas si hay cambios UI
- [ ] Sin `tweaks-panel` ni React dev en producción
- [ ] Rama feature, no `main`
- [ ] `README.md` actualizado si cambia setup o rutas
- [ ] `docs/n8n-workflows.md` actualizado si cambian payloads API
- [ ] Build Docker OK
- [ ] PR con test plan

## Fuera de alcance (no implementar sin issue)

- Descarga automática de guía tras formulario
- Calendly embebido
- Migración a Next.js
- Backend con base de datos propia
