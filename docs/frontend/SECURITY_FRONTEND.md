# Frontend Security (Phase 2.6)

Hardening applied to the Next.js app itself — see `docs/SECURITY.md` (if
present) and `backend/docs/RBAC.md` for backend-side security; this
document is scoped to what runs in the browser and at the edge of the
frontend server.

## CSP header strategy

`lib/security/csp.ts` (`buildContentSecurityPolicy`) is the canonical,
unit-tested source. `next.config.mjs` hand-mirrors the same directives
inline in its `headers()` function — **it cannot `import` the `.ts`
module**: `next.config.mjs` is a plain Node ESM file, loaded before any
TypeScript compilation runs. Keep the two in sync when changing either;
`tests/unit/lib/security.test.ts` covers the `.ts` version's logic, but
nothing currently asserts the two stay identical — a manual diff is
required today (documented as a known gap, not silently ignored).

Current policy, and why:

| Directive | Value | Why |
|---|---|---|
| `default-src` | `'self'` | Deny-by-default baseline |
| `script-src` | `'self' 'unsafe-inline'` (+ `'unsafe-eval'` in dev) | Next.js App Router injects inline bootstrap scripts; a zero-`unsafe-inline` policy needs a per-request nonce threaded through every layout via middleware — bigger than this pass's scope, see "Follow-ups" below |
| `style-src` | `'self' 'unsafe-inline'` | Tailwind + Radix inject inline styles |
| `img-src` | `'self' data: blob: https:` | `data:`/`blob:` for local upload previews (`URL.createObjectURL`, see `features/shopper/hooks/use-upload.ts`); `https:` because the configured S3/bucket host (`NEXT_PUBLIC_S3_PUBLIC_BASE_URL`) is deployment-specific — `lib/security/headers.ts`'s TS version narrows this to the actual configured origin when known, `next.config.mjs`'s hand-mirrored version can't easily do the same string-processing inline, so it stays broader there |
| `font-src` | `'self'` | `next/font` self-hosts Space Grotesk/Inter/JetBrains Mono at build time — no external font host is ever requested |
| `connect-src` | `'self' <API origin>` (+ `ws: wss:` in dev) | XHR/fetch to the backend API; websocket for Next's dev-mode HMR |
| `frame-ancestors` | `'none'` | This app should never be framed — clickjacking defense |
| `base-uri` / `form-action` | `'self'` | Prevents `<base>` tag injection and cross-origin form submission |

### Follow-ups (not done in this pass)

- Nonce-based `script-src`/`style-src` (drop `'unsafe-inline'` entirely) —
  needs per-request nonce generation in `middleware.ts`, threaded into
  `app/layout.tsx`'s `<script>`/`<style>` tags via Next's nonce support.
- Narrow `img-src` to the exact configured bucket origin in
  `next.config.mjs` (currently only done in the unused-by-config
  `lib/security/headers.ts` TS version).

## Security headers config

Applied via `next.config.mjs`'s `headers()` (all routes, `/:path*`):

- `X-Content-Type-Options: nosniff` — stops MIME-sniffing away from a
  declared `Content-Type`.
- `X-Frame-Options: DENY` — belt-and-suspenders with `frame-ancestors`
  above, for older browsers that don't read CSP.
- `Referrer-Policy: strict-origin-when-cross-origin` — sends the full URL
  as referrer only on same-origin navigations.
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
  — this app never uses the camera/mic/geolocation APIs (photo upload is a
  file `<input>`, not `getUserMedia`), and opts out of FLoC/Topics
  (`interest-cohort`).

`lib/security/headers.ts` is the canonical TS source (used by
`tests/unit/lib/security.test.ts`); see the CSP section above for why
`next.config.mjs` can't import it directly.

## XSS prevention checklist

- React escapes all interpolated JSX by default. The only
  `dangerouslySetInnerHTML` in this app is the JSON-LD `<script>` tag on
  the public landing page (`app/(public)/page.tsx`), and its content comes
  entirely from `lib/seo/structured-data.ts`'s static `siteConfig` values
  — never user input — which is the standard safe pattern for structured
  data (there's no other way to emit a raw `<script type="application/ld+json">` tag).
- User-supplied text (wardrobe labels, product titles/descriptions, store
  descriptions, audit log actor/target strings, ...) is always rendered as
  plain JSX text content, never parsed as HTML/Markdown.
- The CSP's `script-src`/`style-src` (see above) is defense-in-depth, not
  the primary defense — React's escaping is.

## Trusted image domains

`next.config.mjs`'s `images.remotePatterns`: `localhost` (http, dev) and
`**.amazonaws.com` (https, default S3 endpoint shape). If
`NEXT_PUBLIC_S3_PUBLIC_BASE_URL` points at a custom domain or a different
provider in a given deployment, add that specific host here rather than
widening the wildcard further.

## Token storage review

Unchanged from Phase 2.2 (`docs/frontend/AUTHENTICATION.md` covers this in
full) — summarized here for the security review:

- Access/refresh tokens live in cookies (`lib/auth-token.ts`,
  `lib/cookies.ts`), not `localStorage` — readable by `middleware.ts`
  (Edge Runtime) for route protection, and marginally more defensible
  against XSS token theft than `localStorage` (though this app's cookies
  are **not** currently `httpOnly` — see that doc's documented trade-off:
  `middleware.ts` needs to read them synchronously and `js-cookie`-style
  client writes are simpler without a server round-trip; a real
  `httpOnly` + backend-set-cookie flow is a documented future hardening
  step, not implemented here).
- `lib/stores/auth-store.ts` persists only the non-sensitive `user` object
  to `localStorage` (for instant "logged in as X" UI on reload) —
  explicitly never the tokens themselves.

## Auth redirect safety

`middleware/auth-guard.ts`'s `decideRedirect` only ever redirects to one
of three fixed, internal routes (`/login`, `/session-expired`,
`/unauthorized`) plus `ROLE_HOME[role]` (also a fixed internal map) — never
to a URL derived from user input, so there's no open-redirect surface.
`redirectTo` (the query param `/login` reads to bounce back after
sign-in) is only ever used as a same-app relative path passed to
`router.push`, never as `window.location.href` to an arbitrary string —
confirmed by reading `app/(auth)/login/page.tsx` and
`features/auth/components/login-form.tsx`.

## Dependency audit

```bash
npm run audit          # npm audit --omit=dev — production dependency tree only
npm audit               # full tree including devDependencies, for local review
```

Not wired into CI as a hard gate yet (a transitive dev-only advisory
shouldn't fail a build) — see `docs/frontend/PERFORMANCE.md`/CI section for
what *is* gated. Documented here as a manual/periodic check until a
policy for which severities block CI is decided.

## Environment variable validation

`config/env.ts` validates every `NEXT_PUBLIC_*` variable's *shape* via Zod
at import time (fails loudly on a malformed value). This only checks
"is this a valid URL/enum member," not "does this value make sense in
production" — see the next section.

## Production env safety checks

`lib/security/validate-production-env.ts` (`validateProductionEnv`),
called once on first client render from `providers/app-providers.tsx`,
checks — only when `NEXT_PUBLIC_APP_ENV=production` — for:

- `NEXT_PUBLIC_API_BASE_URL` pointing at `localhost`/`127.0.0.1`.
- `NEXT_PUBLIC_API_BASE_URL` or `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` using
  `http://` instead of `https://`.

Every failure logs a `logger.warn` (see `lib/monitoring/logger.ts`) rather
than throwing — a misconfigured-but-technically-valid env shouldn't crash
the app, but should be loud in logs/monitoring.

## API base URL validation

Already covered by `config/env.ts`'s `z.string().url()` — a malformed
`NEXT_PUBLIC_API_BASE_URL` fails at import time app-wide, not silently at
the first API call. `validateProductionEnv()` above adds the
production-specific "is this URL *appropriate*" layer on top.
