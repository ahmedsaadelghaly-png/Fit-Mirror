# Development Guide

## Prerequisites

- Docker & Docker Compose (recommended path)
- Python 3.12+ (for running services outside Docker, or for tooling like
  `mypy`/`ruff` in your editor)
- `make` (optional but all commands below assume it — see the Makefile for
  the raw `docker compose` commands if you don't have `make`)

## First-time setup

```bash
git clone <repo-url> fitmirror-ai && cd fitmirror-ai
cp .env.dev.example .env
make up
```

`make up` builds and starts: Postgres, Redis, MinIO, the AI service, the
backend API, and a Celery worker.

Then, one-time bootstrap:

```bash
# Create the MinIO bucket (MinIO doesn't auto-create it)
# Optional since the photo seed: `make seed` creates the bucket if it is missing.
docker compose exec minio mc alias set local http://localhost:9000 fitmirror fitmirror123
docker compose exec minio mc mb local/fitmirror-media

# Apply database migrations
make migrate

# Load demo data (admin, shopper, brand, store, products, wardrobe items)
make seed
```

Now:
- Backend API docs: http://localhost:8000/docs
- AI service docs: http://localhost:8001/docs
- MinIO console: http://localhost:9001 (`fitmirror` / `fitmirror123` by default)

## Day-to-day commands

| Command | What it does |
|---|---|
| `make up` | Start everything (dev overlay: hot-reload enabled) |
| `make down` | Stop everything |
| `make build` | Rebuild images after a dependency change |
| `make logs` | Tail logs from all containers |
| `make restart` | `down` + `up` |
| `make test` | Run backend + AI service test suites |
| `make lint` | Ruff + Black (check) + isort (check) on both services |
| `make format` | Auto-fix formatting/lint issues |
| `make typecheck` | MyPy on both services |
| `make migrate` | Apply Alembic migrations |
| `make seed` | Load demo data |
| `make clean` | Remove caches, coverage artifacts, `__pycache__` |

Backend and AI-service source directories are bind-mounted in the dev
overlay (`docker-compose.dev.yml`), so `uvicorn --reload` picks up code
changes without a rebuild. Celery doesn't support hot-reload — after
changing worker/task code, run `docker compose restart worker`.

## Running without Docker

```bash
make venv-backend   # creates backend/.venv with all deps
make venv-ai        # creates ai-service/.venv with all deps

# You'll need Postgres, Redis, and MinIO reachable locally — either run
# `docker compose up postgres redis minio` and point .env at localhost
# (the defaults in .env.dev.example already do this), or install them
# natively.

cd backend && source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload
# in another terminal:
celery -A app.workers.celery_app worker --loglevel=info -Q tryon

cd ai-service && source .venv/bin/activate
uvicorn app.main:app --reload --port 8001
```

## Testing the end-to-end try-on flow

1. `POST /api/v1/auth/register`, then `POST /api/v1/auth/login` → access token.
2. `POST /api/v1/tryon/upload-url` → pre-signed URL; `PUT` your photo there.
3. `POST /api/v1/tryon` with `user_image_key` + `garment_image_key` (or a
   `product_variant_id` from the seeded demo products).
4. Poll `GET /api/v1/tryon/{job_id}` until `status` is `completed` — the
   Celery worker calls the AI service's placeholder pipeline, which
   overlays a banner on your photo and stores the result.

See `TESTING.md` for how to run the automated test suite, and
`API_CONTRACTS.md` for the full endpoint reference.

## Editor setup

`.vscode/settings.json` and `.vscode/extensions.json` are checked in —
opening the repo in VS Code will prompt you to install the recommended
extensions (Python, Ruff, Black, MyPy) and will use the repo's formatting
settings automatically. See `.devcontainer/` for an optional fully
containerized dev environment.

## Validating your setup

```bash
python scripts/check_project.py
```

Verifies that all expected files/folders from this phase are present —
useful after pulling changes or if something seems missing.
