# Local Runbook

A from-zero guide to actually running the whole FitMirror AI stack locally and confirming it works — written from the full validation pass in Phase 2.7 (`docs/VALIDATION_REPORT.md`). If you just want the quickstart, `README.md` has a shorter version; this doc goes deeper into troubleshooting.

## Prerequisites

- Docker & Docker Compose v2 (the `docker compose` subcommand, not the standalone `docker-compose` binary — see "No `docker compose` plugin" below if `docker compose version` fails)
- Node.js 20.19+ (Storybook enforces this minimum; plain `next dev`/`next build` work down to 20.x). **Not 20.18 or earlier** — see "Node version too old for Storybook" below.
- Python 3.12+ for non-Docker backend/AI-service development
- `make` (optional)

## Standard path (Docker Compose)

```bash
cp .env.dev.example .env
make up   # docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Then, **every time you start from a fresh Postgres/MinIO volume** (first run, or after `docker compose down -v`):

```bash
# 1. Create the MinIO bucket — nothing else works without this.
docker compose exec minio mc alias set local http://localhost:9000 fitmirror fitmirror123
docker compose exec minio mc mb local/fitmirror-media

# 2. Apply the database schema.
make migrate   # docker compose exec backend alembic upgrade head

# 3. Load demo accounts + sample data.
make seed      # docker compose exec backend python -m app.db.seed
```

Verify everything is actually healthy, not just "started":

```bash
docker compose ps          # every service should say "healthy" (frontend has no
                            # healthcheck in dev mode — curl it manually, see below)
curl http://localhost:8000/health
curl http://localhost:8001/api/v1/health
curl http://localhost:3000/api/health
```

If all three return `{"status":"ok",...}`, the stack is genuinely up — not just "containers running."

## Demo credentials (after `make seed`)

| Role | Email | Password |
|---|---|---|
| Platform admin | `admin@fitmirror.ai` | `DemoPass123!` |
| Shopper | `shopper@fitmirror.ai` | `DemoPass123!` |
| Brand admin | `brand@fitmirror.ai` | `DemoPass123!` |

## Troubleshooting

### `docker compose: command not found` / `unknown command: compose`

Docker is installed but the Compose v2 plugin isn't. Without root:

```bash
mkdir -p ~/.docker/cli-plugins
curl -fsSL https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64 \
  -o ~/.docker/cli-plugins/docker-compose
chmod +x ~/.docker/cli-plugins/docker-compose
docker compose version   # should now work
```

### Port conflicts (`address already in use`) on 5432 or 6379

`docker-compose.yml` publishes Postgres on 5432 and Redis on 6379 by default — convenient for connecting a local DB client, but it'll collide if you already have Postgres/Redis running natively on your machine. Two options:

1. Stop the local service (`sudo systemctl stop postgresql`/`redis-server`), or
2. Remap the host port in a local override file (don't commit this):

   ```yaml
   # docker-compose.local-override.yml
   services:
     redis:
       ports: !override
         - "16379:6379"
     postgres:
       ports: !override
         - "15432:5432"
   ```

   **Use `!override`, not a plain `ports:` list.** Compose merges list-type fields like `ports` across `-f` files by *concatenation*, not replacement — a naive override adds a second mapping instead of replacing the first, so the original port is still requested and the conflict persists. `!override` (supported since Compose v2.24) forces full replacement. `!reset` looks similar but clears the field to empty instead — not what you want here.

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.local-override.yml up -d
   ```

### Node version too old for Storybook

```
■  To run Storybook, you need Node.js version 20.19+ or 22.12+.
```

`npm run dev`/`npm run build` work fine on older 20.x, but `npm run storybook`/`npm run build-storybook` enforce this floor. Install a current 20.x (e.g. 20.20.2) from nodejs.org.

### `npm run build-storybook` fails with `Cannot find native binding` / `oxc-parser`

A known npm optional-dependencies bug (npm/cli#4828) — the platform-specific native binding for `oxc-parser` sometimes doesn't get installed correctly. Fix:

```bash
rm -rf node_modules
npm install
```

Don't delete `package-lock.json` unless the above doesn't work — deleting it changes resolved versions.

### `docker build` for the frontend is extremely slow / sends hundreds of MB of context

If you've run `npm install` on the host (e.g. for local dev without Docker), `node_modules` (~1 GB) sits in the build context. Confirm `frontend/.dockerignore` exists and excludes `node_modules`, `.next`, `storybook-static` — it should already, as of Phase 2.7. If somehow missing, `docker build` context size is the tell (`transferring context: 8XXMB` in the build log).

### `docker compose exec backend python -m app.db.seed` fails with `relation "users" does not exist`

The Alembic migration hasn't been applied yet (or was somehow reverted — see "Don't run backend integration tests against your Docker Compose dev database" below). Run `make migrate` first.

### Don't run backend integration tests against your Docker Compose dev database

`backend/tests/conftest.py`'s fixtures call `Base.metadata.create_all()` at setup and `Base.metadata.drop_all()` at teardown — they assume a **disposable** database. The default `DATABASE_URL` they fall back to (`.../fitmirror_test`) is already a different database name than the dev default (`.../fitmirror`), specifically so a normal `pytest` run doesn't touch your seeded dev data. If you explicitly override `DATABASE_URL` to point at your dev database when running integration tests, they *will* drop every table at the end of the run, leaving your `docker compose up` environment with data you thought was there.

If you need to run the backend test suite against a local (non-CI) Postgres, create a dedicated database first:

```bash
docker compose exec -T postgres psql -U fitmirror -d fitmirror -c "CREATE DATABASE fitmirror_test;"
DATABASE_URL="postgresql+psycopg2://fitmirror:fitmirror@localhost:5432/fitmirror_test" \
  bash -c "cd backend && python -m pytest --cov=app"
```

If you did accidentally wipe your dev database this way, recover with:

```bash
docker compose exec backend alembic stamp base    # alembic_version thinks it's at head; reset that
docker compose exec backend alembic upgrade head  # actually recreate the tables
docker compose exec backend python -m app.db.seed
```

### Presigned try-on upload URL doesn't work from a real browser

If `POST /tryon/upload-url`'s `upload_url` in the response contains `http://minio:9000/...`, your `.env` is missing `S3_PUBLIC_ENDPOINT_URL`. Both `.env.example` and `.env.dev.example` set this to `http://localhost:9000` already — if you're still seeing the internal hostname, you likely copied an older `.env` before Phase 2.7. Add the line manually and recreate the backend container (`docker compose up -d backend worker` — a `restart` alone won't reload `env_file` changes, the container must be recreated).

### Frontend pages stuck on a loading skeleton forever, nothing in Network tab looks like it failed

Open the browser console, not just Network — check for `Content-Security-Policy` violation messages. If `connect-src` in the CSP header doesn't match your `NEXT_PUBLIC_API_BASE_URL`'s origin, every fetch is silently blocked by the browser itself (no red network entry, just a console warning). This exact bug existed in `next.config.mjs` and was fixed in Phase 2.7 (see `docs/VALIDATION_REPORT.md` item 5) — if you're hitting it again, you likely edited `next.config.mjs`'s CSP `connect-src` line without re-deriving just the origin.

Also remember: `next.config.mjs` is **not** bind-mounted in `docker-compose.dev.yml` (only `app/`, `features/`, `shared/`, `components/`, `hooks/`, `lib/`, `api/`, `layouts/`, `providers/`, `config/`, `middleware/`, `types/` are). A change to `next.config.mjs`, `tailwind.config.ts`, `package.json`, or anything else at the repo root requires `docker compose build frontend` — a plain `docker compose restart frontend` won't pick it up.

### Photo upload fails with "Upload failed. Please try again."

Same class of bug as above, one origin further: `features/shopper/hooks/use-upload.ts` PUTs the file **directly to the pre-signed storage URL** (`http://localhost:9000/...`), a different origin than the backend API. If `NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL` isn't set, `connect-src` never allows that origin and the browser silently blocks the upload PUT the same way it blocks any other CSP violation — check the console for `Content-Security-Policy` violation messages naming `localhost:9000` (or your MinIO host). `.env.example`/`.env.dev.example`/`docker-compose.yml`'s frontend service all set this as of the fix for this exact bug — if you're missing it, you copied an `.env` from before that fix. Add `NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL=http://localhost:9000` and rebuild the frontend image (`docker compose build frontend && docker compose up -d frontend` — same bind-mount caveat as above, this lives in `config/env.ts` which also isn't mounted).

### Login fails with "Could not reach the server. Check your connection and try again." even though `docker compose ps` shows everything healthy

This is the frontend's generic network-error message — it means the *backend* couldn't complete the request, not that the frontend couldn't reach the backend. Check the backend's own logs (`docker compose logs backend --tail=50`) for the real error before assuming it's a frontend problem. One specific cause seen in practice: a Docker daemon restart (VM pause/resume, host reboot, `dockerd` restart) can leave some containers — especially ones that were *already running* rather than freshly created — disconnected from the Compose network entirely, while others reconnect fine. Symptom: the backend's own logs show `could not translate host name "postgres" to address: Temporary failure in name resolution` (or `redis`) for every DB-touching request, even though `docker compose ps` still reports `postgres`/`redis` as `healthy` (a stale healthcheck result — the healthcheck runs *inside* the container and doesn't test network reachability *from other containers*).

Confirm with:

```bash
docker inspect fitmirror-postgres --format '{{json .NetworkSettings.Networks}}'
```

An empty `{}` means it's not attached to any network. Fix by recreating the whole stack (not just the affected container — the network itself may need recreating too):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down   # stops + removes containers, volumes untouched
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d  # recreates everything, fresh network attachment
```

Your data survives — it lives in the named volumes (`postgres_data`, `minio_data`), not in the containers themselves. You may hit the port-conflict issue above again on `up` if a local override was needed before; recreate it if so.

## Non-Docker path (running services directly)

See `DEVELOPMENT.md` for the full non-Docker setup. Quick reference for what Phase 2.7 validated works:

```bash
# Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r ../requirements-dev.txt
uvicorn app.main:app --reload   # needs DATABASE_URL/REDIS_URL/etc. pointed at something real

# AI service — same pattern, cd ai-service

# Frontend
cd frontend
npm install
npm run dev
```

## Tearing down

```bash
make down                 # stop and remove containers, keep volumes (data survives)
docker compose down -v    # also remove volumes — full reset, you'll need to
                           # re-run the MinIO bucket + migrate + seed steps above
```
