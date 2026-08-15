# Contributing to FitMirror AI

## Branching

- `main` — always deployable.
- `develop` — integration branch for the next release.
- Feature branches: `feature/<short-description>`, `fix/<short-description>`.

Open PRs against `develop` unless you're shipping a hotfix to `main`.

## Before you open a PR

```bash
make format      # auto-format (ruff --fix, isort, black)
make lint         # verify formatting/lint (what CI runs)
make typecheck    # mypy on both services
make test         # unit + integration tests
```

All four must pass locally before pushing — CI runs the same checks
(`.github/workflows/ci.yml`) and will block merges otherwise.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(tryon): add job cancellation endpoint
fix(auth): correct refresh-token expiry check
docs(readme): update quickstart instructions
test(wardrobe): add unit tests for delete_item
chore(deps): bump fastapi to 0.115.7
```

## Code style

- Formatting is enforced by **Black** (line length 100) — don't hand-format,
  run `make format`.
- Import order is enforced by **isort** (`profile = "black"`).
- Linting is enforced by **Ruff** (pyflakes, pycodestyle, bugbear, pyupgrade,
  flake8-comprehensions). Fix warnings rather than suppressing them; if a
  suppression is genuinely correct (e.g. an intentional broad `except`),
  use a scoped `# noqa: <code>` with a one-line reason.
- Type hints are required on new public functions/methods where practical.
  `mypy` runs in `check_untyped_defs` mode — untyped code isn't rejected
  outright, but anything inside a typed function must still type-check.
- Follow the existing Clean Architecture layering: `api` → `services` →
  `repositories` → `models`. New endpoints should not talk to the database
  directly except in `store_dashboard.py`-style plain CRUD, which is an
  accepted exception for AI-independent admin/catalog endpoints.

## Adding a dependency

- Runtime dependency: add it to the relevant service's `requirements.txt`
  with a pinned version.
- Dev/tooling dependency: add it to the root `requirements-dev.txt`.
- Re-run `make build` so Docker images pick up the change, and confirm
  `make lint && make typecheck && make test` still pass.

## Database changes

Never hand-edit generated migration files after they're merged. To change
the schema:

```bash
# 1. Edit the SQLAlchemy model(s) in backend/app/models/
# 2. Generate a migration:
docker compose exec backend alembic revision --autogenerate -m "describe the change"
# 3. Review the generated file in backend/alembic/versions/ — autogenerate
#    is a starting point, not a guarantee (check enum/constraint diffs).
# 4. Apply and verify:
docker compose exec backend alembic upgrade head
```

## Adding a test

- Fast, no external services → `tests/unit/`, marked `@pytest.mark.unit`
  (or the module-level `pytestmark = pytest.mark.unit`).
- Needs a real Postgres/Redis/MinIO → `tests/integration/`, marked
  `@pytest.mark.integration`. See `TESTING.md` for how to run these locally.

## Pre-commit (optional but recommended)

```bash
pip install -r requirements-dev.txt
pre-commit install
```

This runs formatting/lint/type checks automatically on `git commit`.
