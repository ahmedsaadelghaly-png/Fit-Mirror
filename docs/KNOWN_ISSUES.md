# Known Issues

Tracked gaps as of Phase 2.7 (full-system validation). Distinguishes real, open issues from things that are *intentionally* mocked/deferred and already documented elsewhere — this file doesn't repeat those, it links to them.

## Open issues

### `mobile-safari` (webkit) Playwright project isn't exercised anywhere

`playwright.config.ts` defines two projects: `chromium` and `mobile-safari`. CI's `frontend-e2e`/`frontend-a11y` jobs explicitly scope to `--project=chromium`; `make test-frontend-e2e`/`make test-frontend-a11y` don't scope at all, so they attempt both. In this validation's sandbox, webkit's browser binary needs system libraries (`libavif16`, `libwoff1`) that aren't installable without root — `npx playwright install-deps` requires `sudo`.

**Impact:** `make test-frontend-e2e`/`make test-frontend-a11y` fail locally in any environment without those system libs preinstalled, even though the actual chromium results (the ones CI checks) are fine.

**Recommendation:** Either install the missing libs in the documented dev environment (`.devcontainer/`, CI runner images already have them — that's why `frontend-a11y`'s `--project=chromium` scoping works there without issue), or drop `mobile-safari` from `playwright.config.ts` if it was aspirational and never actually meant to be run outside a fully-provisioned CI image.

### npm audit: 2 moderate vulnerabilities in production dependencies

`npm audit --omit=dev` reports a moderate-severity XSS advisory in `postcss` (GHSA-qx2v-qp2m-jg93), pulled in transitively via Next.js's bundled `postcss`. The only fix `npm audit fix --force` offers is downgrading Next.js to the `9.x` canary line — a major breaking change, out of scope for a validation pass with an explicit "no rewrite" rule.

**Recommendation:** Track the upstream Next.js release that bumps its internal `postcss` dependency past 8.5.10 and take a normal `npm install`/lockfile bump when it ships; don't force a Next.js downgrade for this alone.

### `RBAC.md`'s permission matrix is not enforced server-side

Documented since Phase 1.75 (`docs/RBAC.md` "planned enforcement mechanism"), unchanged by this phase. The backend currently checks authentication (a valid JWT) but does not have a generic role/permission-based authorization layer — individual endpoints happen to be scoped correctly (e.g. `/store/*` implicitly operates on `current_user`'s own store) but there's no central enforcement matching the documented matrix. Not a regression from this phase; flagged here because full-system validation is exactly the point where this gap becomes visible in practice, not just on paper.

### Admin platform surface is still mostly mocked data

Documented in detail in `docs/frontend/ADMIN_APP.md` since Phase 2.5 — only `GET /health` is a real backend call from the Admin app; everything else (user/store/product moderation, queue/worker monitoring, feature flags, reports) is realistic mocked data with visible "Mocked data" labels, because the corresponding backend admin endpoints don't exist. Confirmed still accurate by reading the current backend route table (`backend/app/api/v1/router.py`) during this validation pass — no new admin endpoints were added between Phase 2.5 and now.

### Brand product variant management has no backend endpoint

Documented in `docs/frontend/BRAND_APP.md` since Phase 2.4 — variant CRUD is a localStorage-backed overlay on top of the real `POST /store/products` endpoint, since no `POST/PUT/DELETE /store/products/{id}/variants` exists on the backend. Still accurate.

### Shopper "style preferences" (preferred fit / favorite colors / style tags) has no backend field

Documented in `docs/frontend/SHOPPER_APP.md` and `types/shopper.ts` since Phase 2.3 — these three fields are saved to `localStorage`, namespaced per user, because `BodyProfileUpsert` on the backend has no corresponding columns. Still accurate; `backend/app/schemas/user.py`'s `BodyProfileUpsert` confirmed unchanged.

### `passlib`'s `crypt` module deprecation warning

`backend/.venv/lib/.../passlib/utils/__init__.py` imports the standard-library `crypt` module, which is deprecated since Python 3.12 and scheduled for removal in 3.13. Shows up as a `DeprecationWarning` in every backend pytest run. Not a bug today (Python 3.12 still has the module), but will break outright on a future Python 3.13 upgrade. Tracked here rather than fixed now since `passlib`'s bcrypt backend (what this project actually uses via `app/core/security.py`) doesn't need `crypt` at all — the warning fires from an unrelated code path `passlib` imports eagerly. A `passlib` version bump or a switch to `bcrypt` directly (already a pinned dependency) would resolve it; deferred as a dependency-upgrade task, not a validation-blocking issue.

## Environment-specific, not project issues

These came up during this validation pass but are properties of *this sandbox*, not the repository — a normal developer machine won't hit them the same way, so they're not "fixed" in the repo, just documented here for the next person who validates in a similarly constrained environment.

- **Host port conflicts on 5432/6379.** This particular sandbox had a system-level `redis-server` and (apparently) something else already bound to the default Postgres/Redis ports. `docker-compose.yml` intentionally publishes standard ports for local debugging convenience — that's correct behavior, not a bug. If you hit `address already in use` on `docker compose up`, either free the conflicting local service or use a Compose override with the `!override` YAML merge tag (plain list concatenation in Compose means a naive `ports:` override *adds* a mapping rather than replacing it — see `docs/LOCAL_RUNBOOK.md` "Port conflicts").
- **No sudo in this sandbox** meant `playwright install --with-deps` and `apt install`-based fixes weren't available; worked around via user-local installs (`~/.local/opt`, `~/.docker/cli-plugins`) — see `docs/LOCAL_RUNBOOK.md`.

## Explicitly not fixed (by design, this phase's rules)

- No real AI model — the placeholder try-on pipeline (`ai-service/app/pipelines/placeholder_tryon_pipeline.py`) is unchanged and still produces a synthetic overlay image, not a real virtual try-on.
- No mobile app.
- No new product features.
- No architecture rewrite — e.g. the CSP duplication between `lib/security/*.ts` and `next.config.mjs` (documented as a known cross-module-system limitation since Phase 2.6) is still duplicated; this phase fixed the *bug* in the duplicate (the missing origin-reduction), not the duplication itself. Unifying it would mean converting to `next.config.ts`, a build-tooling change bigger than a validation-and-fix pass should make unreviewed.
