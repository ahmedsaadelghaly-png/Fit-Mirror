# Deployment Guide

> Phase 1.5 status: this describes how to deploy what exists today (backend
> + AI service, no frontend). Treat `docker-compose.prod.yml` as a reviewed
> starting template, not a one-command production launcher — see the
> warnings in that file's header.

## Environments

| File | Purpose |
|---|---|
| `.env.dev.example` | Local Docker Compose development |
| `.env.test.example` | Running tests locally / reference for CI env vars |
| `.env.production.example` | Production — every `CHANGE_ME` must come from a secrets manager |

Never commit a real `.env`, `.env.production`, or any file containing real
credentials. All four example files are templates only.

## Deployment options

### Option A — Single VM with Docker Compose

Suitable for early-stage/low-traffic deployment.

```bash
# On the target machine:
git clone <repo-url> fitmirror-ai && cd fitmirror-ai
cp .env.production.example .env.production
# Fill in every CHANGE_ME in .env.production using your secrets manager —
# do not hand-type secrets into this file on the server; pull them from
# your secret store at deploy time (e.g. via a deploy script or CI/CD secret
# injection).

docker compose -f docker-compose.prod.yml up -d --build

# One-time bootstrap:
docker compose -f docker-compose.prod.yml exec minio mc alias set local http://localhost:9000 <S3_ACCESS_KEY> <S3_SECRET_KEY>
docker compose -f docker-compose.prod.yml exec minio mc mb local/fitmirror-media-prod
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

Put a reverse proxy (nginx, Caddy, or a cloud load balancer) in front of
the `backend` container with TLS termination — the app itself does not
terminate TLS.

### Option B — Managed infrastructure (recommended for real production)

The app is deliberately decoupled from infrastructure specifics via the
`ObjectStorage` interface and standard connection-string configuration, so
swapping to managed services requires **config changes only, no code
changes**:

- **Database:** point `DATABASE_URL` at RDS / Cloud SQL / Azure Database for
  PostgreSQL. Enable SSL (`?sslmode=require`).
- **Redis:** point `REDIS_URL` / `CELERY_BROKER_URL` /
  `CELERY_RESULT_BACKEND` at ElastiCache / Memorystore / Azure Cache. Use
  TLS (`rediss://`) if the provider supports it.
- **Object storage:** point `S3_ENDPOINT_URL` at real AWS S3 (or leave it
  unset and use `boto3`'s default resolution) with IAM credentials scoped
  to only the required bucket/actions.
- **Backend / worker / AI service:** deploy as containers on ECS/Fargate,
  Cloud Run, GKE, or any container platform, using the same Dockerfiles.
  Each is stateless and horizontally scalable independently — scale the
  `worker` service based on Celery queue depth, and the `ai-service`
  separately once it needs GPU-backed real models (Phase 6 in
  `ROADMAP.md`).

## Health checks

Both services expose a health endpoint for load balancers / orchestrators:

- Backend: `GET /health` → `{"status": "ok", "service": "..."}`
- AI service: `GET /api/v1/health` → `{"status": "ok", "service": "...", "active_model": "..."}`

Docker healthchecks are already defined in both compose files.

## Database migrations in production

Run migrations as a separate step before rolling out new app containers,
never automatically on container start (avoids race conditions across
multiple replicas starting simultaneously):

```bash
docker compose -f docker-compose.prod.yml run --rm backend alembic upgrade head
# then roll out the new backend/worker containers
```

## Rolling back

- **App code:** redeploy the previous image tag.
- **Database:** `alembic downgrade -1` only if the migration is safely
  reversible (check the generated migration file — not all schema changes
  are). Prefer forward-fixes over downgrades once real user data exists.

## Secrets checklist before going live

- [ ] `JWT_SECRET_KEY` is a real random value (`openssl rand -hex 64`), not
      the dev/test placeholder.
- [ ] `CORS_ORIGINS` is an explicit allow-list, not `["*"]`.
- [ ] `RATE_LIMIT_ENABLED=true` with a real backing store — the current
      in-process implementation (`app/core/middleware.py`) is a
      single-instance placeholder; replace it before running multiple
      replicas (see `ROADMAP.md` Phase 8).
- [ ] `SECURE_HEADERS_ENABLED=true`.
- [ ] Database, Redis, and storage credentials are scoped to least privilege
      and rotated via a secrets manager.
- [ ] `DEBUG=false`.
- [ ] `LOG_FORMAT=json` pointed at your log aggregator.

## What's NOT production-ready yet (tracked in ROADMAP.md)

- Rate limiting is a single-process placeholder (Phase 8).
- No CDN/edge caching in front of object storage.
- No automated CI/CD deploy pipeline (CI currently only lints/tests/builds).
- No load testing has been performed against the async try-on pipeline.
