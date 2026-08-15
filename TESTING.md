# Testing Guide

## Test layout

```
backend/tests/
├── conftest.py            shared fixtures (TestClient, DB session, env defaults)
├── unit/                   fast, no external services (mocked repos/storage/Celery)
└── integration/            requires real Postgres + Redis (and MinIO for storage)

ai-service/tests/
├── conftest.py
├── unit/                   fast, no external services (mocked storage)
└── integration/            requires real MinIO
```

Every test file sets `pytestmark = pytest.mark.unit` or
`pytest.mark.integration` (enforced by `--strict-markers` in `pyproject.toml`
— an unmarked or misspelled marker will fail the run instead of silently
passing).

## Running tests

```bash
make test              # everything: backend + ai-service, unit + integration
make test-backend      # backend only
make test-ai           # ai-service only
```

Or directly with pytest, from inside each service directory:

```bash
cd backend
python -m pytest tests/unit -m unit                      # fast, no infra needed
python -m pytest tests/integration -m integration          # needs Postgres/Redis up
python -m pytest --cov=app --cov-report=term-missing       # everything + coverage
```

### Running just the unit suite (no Docker needed)

Unit tests are designed to run with zero external services — they use
in-memory fakes for repositories/storage and monkeypatch Celery's
`.delay()`. This is the fast inner-loop suite:

```bash
cd backend && python -m pytest tests/unit -m unit -v
cd ai-service && python -m pytest tests/unit -m unit -v
```

### Running integration tests

Integration tests hit a real database (and, for the AI service, a real
S3-compatible bucket). Start the infra first:

```bash
docker compose up -d postgres redis minio
docker compose exec minio mc alias set local http://localhost:9000 fitmirror fitmirror123
docker compose exec minio mc mb local/fitmirror-media-test

cp .env.test.example .env.test
export $(grep -v '^#' .env.test | xargs)

cd backend && python -m pytest tests/integration -m integration
cd ai-service && python -m pytest tests/integration -m integration
```

Backend integration tests create their own tables via `Base.metadata` at
session start and drop them at the end (`tests/conftest.py::db_engine`), and
each test runs inside a transaction that's rolled back afterward — so
integration tests never leave residue in the test database.

## What's covered so far (Phase 1.5)

- **Health endpoints** — both services, no external dependencies.
- **Config loading** — env var overrides, defaults, `lru_cache` behavior.
- **Auth service** — registration, duplicate-email rejection, login
  success/failure, token issuance (using an in-memory fake repository).
- **Storage abstraction** — the `ObjectStorage` interface contract via an
  in-memory fake, plus `S3ObjectStorage`'s pure key-building logic.
- **Try-on job creation** — pending status, Celery dispatch (mocked),
  garment-image resolution from a product variant, ownership checks; an
  integration test additionally verifies real persistence to Postgres.
- **AI placeholder pipeline** — reads/writes via a mocked storage client,
  returns the correct output contract, produces a real decodable PNG; the
  model registry's resolution and error-on-unknown-model behavior.
- **AI service storage round-trip and `/tryon/generate` endpoint** —
  integration-only, against real MinIO.

## Coverage

```bash
make test-backend   # includes --cov=app --cov-report=term-missing
make test-ai
```

Coverage config lives in each service's `pyproject.toml`
(`[tool.coverage.run]` / `[tool.coverage.report]`). `app/main.py` and
`alembic/` are excluded from the denominator since they're wiring, not
business logic.

## Writing new tests

- Prefer a **unit** test with a fake/mock over an integration test whenever
  the thing you're testing is business logic, not actual I/O — it's faster
  and doesn't need Docker.
- When mocking a repository, only implement the methods the service under
  test actually calls (see `FakeUserRepository` / `FakeTryOnJobRepository`
  in `tests/unit/` for the pattern).
- When you do need a real database, add the test to `tests/integration/`
  and use the `db_session` fixture (transactional, auto-rolled-back).
- Don't mock `app.core.config.settings` values by mutating the singleton
  directly in a way that leaks across tests — use `monkeypatch` (see
  `test_config.py` and
  `test_placeholder_pipeline.py::test_model_registry_raises_for_unknown_model`
  for examples); it auto-reverts after each test.

## CI

`.github/workflows/ci.yml` runs, on every push/PR to `main`/`develop`:

1. `backend-lint` → Ruff, Black (check), isort (check), MyPy
2. `backend-tests` → unit tests, then integration tests against real
   Postgres + Redis service containers
3. `ai-service-lint` → same lint suite
4. `ai-service-tests` → unit tests (AI service integration tests need
   MinIO, which isn't wired into CI yet — see `ROADMAP.md`)
5. `docker-build-check` → builds both Docker images and validates
   `docker-compose.yml`

All jobs must pass before a PR can merge.
