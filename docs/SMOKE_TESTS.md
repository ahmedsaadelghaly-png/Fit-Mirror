# Smoke Tests

Two layers of smoke testing validate the full stack: a `curl`-based API script (backend + AI service, no browser) and the Playwright e2e suite (frontend, real browser). Both were run against a real `docker compose up` stack as part of Phase 2.7 — see `docs/VALIDATION_REPORT.md` for what they found.

## Layer 1 — API smoke script

Exercises every endpoint listed in the Phase 2.7 validation scope: health checks, auth (register/login/duplicate-conflict), users, body profile, store, products, try-on (upload URL/create/get/list), wardrobe (create/list/delete).

Requires the stack up (`make up`) and reachable at `localhost:8000`/`localhost:8001`.

```bash
#!/usr/bin/env bash
set -uo pipefail
BASE="http://localhost:8000/api/v1"
PASS=0; FAIL=0

check() {
  local desc="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then echo "PASS  [$actual] $desc"; PASS=$((PASS+1))
  else echo "FAIL  expected=$expected actual=$actual  $desc"; FAIL=$((FAIL+1)); fi
}

RAND=$RANDOM
SHOPPER_EMAIL="smoke-shopper-$RAND@example.com"
BRAND_EMAIL="smoke-brand-$RAND@example.com"
PASSWORD="SmokeTest123!"

check "GET /health" 200 "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health)"
check "GET ai-service health" 200 "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8001/api/v1/health)"

check "POST /auth/register (shopper)" 201 "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" -d "{\"email\":\"$SHOPPER_EMAIL\",\"password\":\"$PASSWORD\",\"full_name\":\"Smoke Shopper\"}")"
check "POST /auth/register (brand)" 201 "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" -d "{\"email\":\"$BRAND_EMAIL\",\"password\":\"$PASSWORD\",\"full_name\":\"Smoke Brand\"}")"

curl -s -o /tmp/login.json -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$SHOPPER_EMAIL\",\"password\":\"$PASSWORD\"}"
SHOPPER_TOKEN=$(python3 -c "import json;print(json.load(open('/tmp/login.json'))['access_token'])")
curl -s -o /tmp/login_brand.json -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$BRAND_EMAIL\",\"password\":\"$PASSWORD\"}"
BRAND_TOKEN=$(python3 -c "import json;print(json.load(open('/tmp/login_brand.json'))['access_token'])")
AUTH_S="Authorization: Bearer $SHOPPER_TOKEN"
AUTH_B="Authorization: Bearer $BRAND_TOKEN"

check "GET /users/me" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/users/me" -H "$AUTH_S")"
check "PUT /users/me/body-profile" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X PUT "$BASE/users/me/body-profile" \
  -H "$AUTH_S" -H "Content-Type: application/json" \
  -d '{"height_cm":175,"weight_kg":70,"chest_cm":95,"waist_cm":80,"hip_cm":98,"body_shape":"rectangle"}')"

SLUG="smoke-store-$RAND"
check "POST /store" 201 "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/store" \
  -H "$AUTH_B" -H "Content-Type: application/json" -d "{\"name\":\"Smoke Store\",\"slug\":\"$SLUG\"}")"
check "GET /store/me" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/store/me" -H "$AUTH_B")"
check "GET /store/me/summary" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/store/me/summary" -H "$AUTH_B")"
check "POST /store/products" 201 "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/store/products" \
  -H "$AUTH_B" -H "Content-Type: application/json" -d '{"title":"Smoke T-Shirt","category":"tops","price":"19.99","currency":"USD"}')"
check "GET /store/products" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/store/products" -H "$AUTH_B")"

curl -s -o /tmp/upload.json -X POST "$BASE/tryon/upload-url?filename=selfie.jpg&content_type=image/jpeg" -H "$AUTH_S"
check "POST /tryon/upload-url" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/tryon/upload-url?filename=x.jpg&content_type=image/jpeg" -H "$AUTH_S")"

curl -s -o /tmp/job.json -X POST "$BASE/tryon" -H "$AUTH_S" -H "Content-Type: application/json" \
  -d '{"user_image_key":"user-photos/smoke-user.jpg","garment_image_key":"seed-data/garment.jpg"}'
JOB_ID=$(python3 -c "import json;print(json.load(open('/tmp/job.json'))['job_id'])")
check "POST /tryon" 202 "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/tryon" -H "$AUTH_S" -H "Content-Type: application/json" \
  -d '{"user_image_key":"user-photos/x.jpg","garment_image_key":"seed-data/x.jpg"}')"
check "GET /tryon/{job_id}" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/tryon/$JOB_ID" -H "$AUTH_S")"
check "GET /tryon (list)" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/tryon" -H "$AUTH_S")"

curl -s -o /tmp/wardrobe.json -X POST "$BASE/wardrobe" -H "$AUTH_S" -H "Content-Type: application/json" \
  -d '{"source":"uploaded","category":"tops","label":"Smoke item","image_key":"wardrobe/smoke.jpg"}'
ITEM_ID=$(python3 -c "import json;print(json.load(open('/tmp/wardrobe.json'))['id'])")
check "POST /wardrobe" 201 "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/wardrobe" -H "$AUTH_S" -H "Content-Type: application/json" \
  -d '{"source":"uploaded","category":"tops","label":"x","image_key":"wardrobe/x.jpg"}')"
check "GET /wardrobe" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/wardrobe" -H "$AUTH_S")"
check "DELETE /wardrobe/{id}" 204 "$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "$BASE/wardrobe/$ITEM_ID" -H "$AUTH_S")"

echo "PASS=$PASS FAIL=$FAIL"
```

**Last run (Phase 2.7): 20/20 pass.**

### Real end-to-end try-on flow (beyond the script above)

The script above creates try-on jobs pointing at object keys that don't exist in storage (fine for checking the API contract, not for checking the actual pipeline). To validate the *real* flow, including the Celery worker and AI service actually processing a job:

```bash
# 1. Get a real presigned upload URL and PUT a real image to it.
curl -s -X POST "http://localhost:8000/api/v1/tryon/upload-url?filename=photo.jpg&content_type=image/jpeg" \
  -H "Authorization: Bearer $SHOPPER_TOKEN"
# -> {"object_key": "...", "upload_url": "http://localhost:9000/...", ...}
curl -X PUT "<upload_url>" -H "Content-Type: image/jpeg" --data-binary @photo.jpg

# 2. Create the job using the real object_key, plus any existing garment image
#    (e.g. a seeded product variant's garment_image_key, or another uploaded key).
curl -s -X POST "http://localhost:8000/api/v1/tryon" -H "Authorization: Bearer $SHOPPER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_image_key":"<object_key from step 1>","garment_image_key":"<any real key>"}'

# 3. Poll until status is "completed".
curl -s "http://localhost:8000/api/v1/tryon/<job_id>" -H "Authorization: Bearer $SHOPPER_TOKEN"
```

**Last run (Phase 2.7):** job went `pending` → `completed` in a single poll (well under a second), with a real `result_image_key` and `ai_model_name: "placeholder-v0"`. Confirmed the step-1 upload URL is genuinely browser-reachable (`localhost:9000`, not the Docker-internal `minio:9000` — see `docs/VALIDATION_REPORT.md` item 4).

## Layer 2 — Playwright e2e suite (real browser)

```bash
cd frontend
npx playwright install chromium   # one-time
npm run test:e2e                  # or: npx playwright test --project=chromium
```

Covers, across `tests/e2e/*.spec.ts`:

- **`smoke.spec.ts`** — public marketing pages (`/`, `/features`, `/pricing`, `/about`, `/contact`, `/privacy`, `/terms`), auth pages render, cross-page navigation, middleware route protection (unauthenticated → `/login`), 404 page.
- **`accessibility.spec.ts`** — axe-core WCAG 2.1 AA scan on all 7 public + 3 auth pages, asserts zero violations.
- **`shopper-smoke.spec.ts`** — dashboard (empty-state summary), body profile page, virtual try-on workspace, wardrobe page, route protection for every shopper route.
- **`brand-smoke.spec.ts`** — dashboard (existing store / no-store-yet prompt), store onboarding, products list (empty + populated), create product form submission, product details, route protection.
- **`admin-smoke.spec.ts`** — dashboard, users/stores/products/try-on-jobs monitoring, feature flags (toggle persists across reload), route protection.

Every authenticated test fakes a session via an unsigned-but-well-formed JWT in the `fm_access_token` cookie (matching exactly what `middleware/auth-guard.ts` validates — see that file's docstring) and stubs the specific backend endpoints each page calls via `page.route`, matching `docs/API_CONTRACTS.md`'s documented response shapes. Real components, real TanStack Query hooks, real middleware — only the network layer is a fake.

**Last run (Phase 2.7): 58/58 pass** (`--project=chromium`, `--workers=4`). See `docs/VALIDATION_REPORT.md` for the bugs this run surfaced and fixed (items 5, 6, 7, 8) — every one of them was invisible to prior phases because this suite had never actually been executed (no Node.js in the sandbox until this phase).

Run with `--workers=1` if you see intermittent navigation-timing failures — the dev-mode Next.js server (on-demand route compilation) can get overwhelmed under `fullyParallel: true` with many workers on a resource-constrained machine; this is test-infra flakiness, not a product bug, and disappears with more moderate parallelism (`--workers=4` on a 16-core sandbox was reliable in this validation).

`mobile-safari` project requires `npx playwright install webkit`, which needs system libraries not installable without root in this sandbox — see `docs/KNOWN_ISSUES.md`.

## Layer 3 — Manual route + middleware checks (no browser, `curl` + a hand-built JWT)

Useful for a quick sanity check without installing Playwright browsers at all:

```bash
# Unauthenticated — every protected route should 307 to /login?redirectTo=...
for route in /shopper /brand /admin; do
  curl -s -o /dev/null -w "%{http_code} " "http://localhost:3000$route"; echo "$route"
done

# Authenticated as shopper — shopper routes 200, other roles' routes redirect to /unauthorized
python3 -c "
import base64, json, time
def b64url(d): return base64.urlsafe_b64encode(json.dumps(d).encode()).decode().rstrip('=')
h = {'alg':'none','typ':'JWT'}
p = {'sub':'smoke-user','role':'shopper','exp':int(time.time())+3600}
print(b64url(h) + '.' + b64url(p) + '.sig')
" > /tmp/shopper_jwt.txt

curl -s -o /dev/null -w "%{http_code}\n" --cookie "fm_access_token=$(cat /tmp/shopper_jwt.txt)" http://localhost:3000/shopper   # 200
curl -s -o /dev/null -w "%{http_code}\n" --cookie "fm_access_token=$(cat /tmp/shopper_jwt.txt)" http://localhost:3000/brand      # 307 -> /unauthorized
```
