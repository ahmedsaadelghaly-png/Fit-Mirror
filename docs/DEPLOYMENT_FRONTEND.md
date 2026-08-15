# Frontend Deployment Guide (Phase 2.6)

Companion to the root `DEPLOYMENT.md` (backend + AI service), which
explicitly scoped itself to "no frontend" as of Phase 1.5. This closes
that gap.

## Production build

`frontend/next.config.mjs` sets `output: "standalone"` — `next build`
produces `.next/standalone/` (a minimal, self-contained Node server with
only the `node_modules` actually needed at runtime traced in) plus
`.next/static/` (build assets, served separately). `frontend/Dockerfile`'s
`runner` stage copies exactly those two directories plus `public/` — no
`npm ci`/`npm install` in the final stage at all, and no full
`node_modules` tree copied in.

```bash
cd frontend
npm run build            # produces .next/standalone, .next/static
node .next/standalone/server.js   # run it directly, outside Docker, for a local smoke test
```

## Docker

```bash
docker build -t fitmirror-frontend:prod \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.example.com/api/v1 \
  --build-arg NEXT_PUBLIC_APP_ENV=production \
  ./frontend
docker run -p 3000:3000 fitmirror-frontend:prod
```

### Build-time vs runtime environment variables

Every `NEXT_PUBLIC_*` variable is **inlined into the client JavaScript
bundle at build time** — Next.js does not read them from the environment
at container start. This means:

- They must be passed as Docker **build args** (`--build-arg`), not just
  `environment:`/`env_file` on the running container — setting them only
  at `docker run`/compose runtime has no effect; the values were already
  baked into `.next/` during `docker build`.
- A different `NEXT_PUBLIC_API_BASE_URL` per environment (staging vs.
  production) means a **separate image build per environment**, not one
  image promoted across environments with different runtime config —
  this is a real constraint of any Next.js app using `NEXT_PUBLIC_*`
  variables, not specific to this one.
- `frontend/Dockerfile`'s `builder` stage declares `ARG
  NEXT_PUBLIC_API_BASE_URL` / `ARG NEXT_PUBLIC_APP_ENV` / `ARG
  NEXT_PUBLIC_S3_PUBLIC_BASE_URL` and re-exports them as `ENV` so
  `next build` (which reads `process.env`) picks them up.
- `docker-compose.prod.yml`'s `frontend` service passes these same three
  as `args:` under `build:`, sourced from `.env.production` — fill them in
  there, not just in the `environment:` block (which would be too late).

## docker-compose.prod.yml

A `frontend` service now exists (previously: backend + AI service only).
Built from `frontend/Dockerfile`'s `runner` target, healthchecked via
`GET /api/health` (see `frontend/app/api/health/route.ts`), 2 replicas by
default (stateless — scales the same way `backend` does).

```bash
docker compose -f docker-compose.prod.yml up -d --build frontend
```

## nginx (optional reverse proxy)

`deploy/frontend/nginx.conf` — a reference template proxying `/` to the
`frontend` container and `/api/v1/` to the `backend` container, with a
dedicated caching rule for `/_next/static/*` (content-hashed by Next.js,
safe to cache for a year). **Not a hard dependency** of this stack — a
managed load balancer (ALB, Cloud Load Balancing) or Caddy works equally
well; nginx is one documented option, not a requirement. Fill in
`server_name` and TLS certificate paths before use, or terminate TLS
upstream instead (e.g. at a cloud load balancer) and drop the HTTPS server
block entirely.

## Static asset caching strategy

| Path | Cache-Control | Why |
|---|---|---|
| `/_next/static/*` | `public, max-age=31536000, immutable` | Content-hashed filenames — a new build always gets new hashes, so caching forever is safe |
| Every other path (HTML, `/api/*`) | Next.js's own per-response default | Dynamic content; don't override with a blanket long cache |

Set at the nginx layer (see `nginx.conf` above) rather than in
`next.config.mjs`'s `headers()`, since `headers()` already carries the
security header list (see `docs/frontend/SECURITY_FRONTEND.md`) and mixing
concerns there would make that function harder to keep in sync with its
`lib/security/headers.ts` TypeScript counterpart.

## Healthcheck endpoint

`GET /api/health` (`frontend/app/api/health/route.ts`) — mirrors the
backend's `{status, service}` shape for consistency, but checks only that
the Next.js server process itself is alive (no dependency on the backend
being reachable — a load balancer needs to know "is this process up"
independent of anything downstream). Used by:

- `frontend/Dockerfile`'s `HEALTHCHECK` instruction.
- `docker-compose.prod.yml`'s `frontend` service healthcheck.

## Environment variables

See `frontend/README.md`'s environment variable table for the full list
and defaults. In production, `docs/frontend/SECURITY_FRONTEND.md`'s
`validateProductionEnv()` warns (doesn't block) if
`NEXT_PUBLIC_API_BASE_URL` points at `localhost` or uses `http://` while
`NEXT_PUBLIC_APP_ENV=production`.

## Deployment checklist

- [ ] `NEXT_PUBLIC_API_BASE_URL` set to the real, `https://` backend URL
      for this environment, passed as a **build arg**, not a runtime env var.
- [ ] `NEXT_PUBLIC_APP_ENV=production` (also a build arg).
- [ ] `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` set if the storage bucket is
      publicly readable (see `docs/frontend/SHOPPER_APP.md` "API contract
      mismatches" for what this does and doesn't unlock).
- [ ] A real OG image exists at whatever path `lib/seo/metadata.ts` calls
      are updated to reference (see `docs/frontend/SEO.md` "known gap" —
      none exists as of this phase).
- [ ] TLS terminated somewhere in front of the `frontend` container
      (nginx template above, or a managed load balancer) — this app never
      terminates TLS itself.
- [ ] `docker compose -f docker-compose.prod.yml config -q` validates
      cleanly (same check `docker-build-check` runs in CI for the backend/
      AI service images — extend it to build `frontend` too, see
      `.github/workflows/ci.yml`).
- [ ] Run `npm run build` locally at least once against production-like
      env vars before the first real deploy, to catch any build-time-only
      failure (e.g. a `NEXT_PUBLIC_*` var Zod-validated by `config/env.ts`
      being absent) before it happens in CI/CD.

## What's NOT production-ready yet

- No CDN/edge caching in front of the frontend container itself (the
  `_next/static` caching above happens at the nginx/proxy layer, not a
  real CDN).
- No automated CI/CD deploy pipeline for the frontend (mirrors the same
  gap the root `DEPLOYMENT.md` already documents for backend/AI service).
- The nginx config is a template requiring manual TLS setup, not a
  fully automated Let's Encrypt/ACME flow.
