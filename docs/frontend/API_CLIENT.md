# API Client

## Architecture

```
api/client.ts          One Axios instance + interceptors + normalizeError() + ApiError class
types/api.ts             Error shape types (ApiErrorBody, ErrorCode, FastApiValidationErrorBody)
features/*/api.ts        Feature-local, typed functions calling apiClient (e.g. features/auth/api.ts)
features/*/hooks/*       TanStack Query hooks wrapping those functions (useLogin, useCurrentUser, ...)
```

Components never import `axios` or call `apiClient` directly — they call
a feature hook (`useLogin()`, `useCurrentUser()`, ...), which calls a
feature-local `api.ts` function, which calls `apiClient`. This keeps every
endpoint URL and request/response type in exactly one place per feature.

## The Axios instance

```ts
// api/client.ts
export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});
```

`baseURL` comes from `config/env.ts`, which validates
`NEXT_PUBLIC_API_BASE_URL` with Zod at import time (see that file) —
misconfiguration fails loudly at build/boot, not with a confusing runtime
fetch error deep in a component.

## Request interceptor: auth token injection

```ts
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken(); // lib/auth-token.ts, reads a cookie
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});
```

Every request automatically carries the current access token — no
feature code ever sets an `Authorization` header manually.

## Response interceptor: refresh-on-401, then error normalization

This is the most involved piece — see `docs/frontend/AUTHENTICATION.md`
for the full session-lifecycle picture; this section is the client-side
half of it.

1. A `401` from any endpoint **except** `/auth/login`, `/auth/register`,
   `/auth/refresh` (excluding these avoids a meaningless or looping
   refresh attempt) triggers exactly one silent refresh attempt.
2. Concurrent 401s are **de-duplicated** via a single shared
   `inFlightRefresh` promise — five requests failing at once trigger one
   `/auth/refresh` call, not five, and all five retry with its result.
3. If the refresh succeeds, the original request is retried once (marked
   `_retry` so it can't loop) with the new token.
4. If the refresh fails (no refresh token, or it's also invalid), the
   session is cleared and the browser is sent to `/session-expired`.
5. Every failure — refreshed-and-still-failing, non-401, or the initial
   error if no refresh was attempted — is passed through
   `normalizeError()`.

## Error normalization

```ts
export function normalizeError(error: AxiosError<ApiErrorBody | { detail: unknown }>): ApiError
```

A **pure function**, deliberately extracted from the interceptor so it's
unit-testable without mocking Axios or spinning up a server (see
`tests/unit/api/normalize-error.test.ts`). It handles three shapes:

| Input | Result |
|---|---|
| No `error.response` at all (network failure, timeout, CORS) | `ApiError(message, null, "network_error")` |
| Backend's structured envelope `{error_code, message}` (see backend `docs/ERROR_CODES.md`) | `ApiError(message, status, error_code)` — passed straight through |
| FastAPI's default validation shape `{detail: [...]}` or `{detail: "..."}` | `ApiError(..., status, "validation_error")` — see backend `docs/RESPONSE_STANDARDS.md` §4 for the planned unification this papers over today |
| Anything else | `ApiError("Something went wrong...", status, "internal_error")` |

## `ApiError` — the one shape everything throws

```ts
export class ApiError extends Error {
  readonly status: number | null;
  readonly errorCode: string;
}
```

Every feature hook's `mutation.error` / `query.error` is an `ApiError`
instance (TanStack Query passes through whatever the `mutationFn`/
`queryFn` rejects with, which is always this class, never a raw
`AxiosError`). Forms check `error instanceof ApiError` before reading
`.message` — see `features/auth/components/login-form.tsx` for the
pattern every form in this codebase follows.

## API error types (`types/api.ts`)

```ts
export interface ApiErrorBody { error_code: string; message: string }
export type KnownErrorCode = "not_found" | "validation_error" | ...;
export type ErrorCode = KnownErrorCode | (string & {});
export interface FastApiValidationErrorBody { detail: ... }
```

`ErrorCode` is a union of known literals **plus** a permissive `string`
fallback (the `(string & {})` trick) — this gives autocomplete for known
codes in editors while still type-checking a future, not-yet-cataloged
code from the backend without a type error. See backend
`docs/ERROR_CODES.md` for what "known" means today (several codes are
still generic — e.g. every `404` is `not_found`, not yet split per entity
type).

## Network error handling

A request that never reaches the server (offline, DNS failure, CORS
rejection, timeout past 15s) has `error.response === undefined` in
Axios — `normalizeError` catches this as the very first check and
returns a user-readable "Could not reach the server" message rather than
letting a raw network exception surface to a form.

## Refresh token — real, not a placeholder

Unlike `forgotPassword` (see `docs/frontend/AUTHENTICATION.md`), the
refresh flow calls a **real, already-implemented** backend endpoint
(`POST /auth/refresh` — see backend `docs/API_CONTRACTS.md`). The only
reason `performRefresh()` in `api/client.ts` uses a bare `axios.post(...)`
rather than `apiClient` is to avoid a circular import
(`features/auth/api.ts` imports `apiClient`, so `apiClient` can't import
back from there) — not because the call itself is faked.

## Typed responses

Every `features/*/api.ts` function has an explicit return type
(`Promise<TokenResponse>`, `Promise<User>`, etc. — see `types/auth.ts`,
`types/domain.ts`). These are hand-written to mirror the backend's
Pydantic schemas today; see
`docs/frontend/FRONTEND_ARCHITECTURE.md` "Planned: typed API client
generation" for the plan to generate them from the backend's OpenAPI
schema instead once that's worth the setup cost.
