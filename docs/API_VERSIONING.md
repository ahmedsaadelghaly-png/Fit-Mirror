# API Versioning Strategy

## Current state

Every endpoint is under `/api/v1` (backend) or `/api/v1` (AI service,
internal-only). There is exactly one version in existence — this document
defines the strategy for when a second version becomes necessary, not a
retrofit of something already in place.

## Versioning scheme

- **URL path versioning**: `/api/v{n}`, not header-based or query-param
  versioning. Chosen for simplicity and cache/proxy-friendliness (a
  version is visible in the URL, easy to route at the load-balancer level
  if `v1` and `v2` ever need to run as genuinely separate deployments).
- Versions are **whole-API**, not per-endpoint. There is no
  `/api/v1/auth` + `/api/v2/wardrobe` mixing — when `v2` is introduced,
  every endpoint exists under both `v1` and `v2` (even if `v2`'s handler
  for an unchanged endpoint just delegates to the same service code as
  `v1`'s).
- The AI service's internal API is versioned identically
  (`/api/v1/tryon/generate`) for consistency, even though it's never
  exposed to external clients — this keeps the convention uniform if the
  AI service's contract ever needs a `v2` independently of the backend's.

## Backward compatibility policy

Within a version (`v1` stays `v1`), only **additive, non-breaking** changes
are allowed:

**Allowed without a version bump:**
- Adding a new optional request field (with a sensible default).
- Adding a new field to a response object.
- Adding a new endpoint.
- Adding a new `error_code` value (clients should already treat unknown
  codes as `INTERNAL_ERROR`-equivalent — see `ERROR_CODES.md`).
- Relaxing a validation constraint (e.g. lowering a minimum string length).
- Adding a new enum value to a field that is documented as
  open-for-extension (e.g. `UserRole` gaining a `team_member` value —
  see `MULTI_TENANCY.md`).

**Requires a version bump (breaking):**
- Removing or renaming a request/response field.
- Changing a field's type (e.g. `price` from string to number).
- Changing an endpoint's URL, method, or status code semantics.
- Changing the meaning of an existing field without changing its name.
- Tightening a validation constraint in a way that would reject
  previously-valid requests.
- Any change to the response *envelope* shape itself (e.g. the planned
  pagination/validation-error unification in `RESPONSE_STANDARDS.md` — 
  those are explicitly called out as `v2`-triggering changes, not silent
  `v1` updates).

## Deprecation policy

1. **Announce.** A deprecated endpoint/field is documented as such in
   `API_CONTRACTS.md` and this file, with the version it will be removed
   in and a target date/phase.
2. **Dual-run.** The deprecated version continues to function unchanged
   for a minimum deprecation window (proposed: **6 months** or **2 major
   phases**, whichever is longer, once the platform has external
   third-party API consumers — today, with only an internal/first-party
   client, this window is a formality but the *policy* is fixed now to
   avoid an ad-hoc decision under future pressure).
3. **Signal at runtime.** Deprecated endpoints return a
   `Deprecation` / `Sunset` HTTP header (planned — not yet implemented,
   since nothing is deprecated yet) pointing to the replacement.
4. **Remove.** Only after the window closes, and only in a new major
   version (`v1` endpoints are never silently removed out from under
   existing `v1` consumers).

## Breaking changes policy

- Breaking changes are **never** shipped into an existing version number.
- A breaking change always means: introduce `v{n+1}`, keep `v{n}` running
  unchanged, migrate consumers, then deprecate `v{n}` per the policy above.
- The one exception: **pre-`v1` stub endpoints returning `501`**
  (`/stylist/suggestions`, `/sizing/recommend`, `/shopping/ask`). Because
  these have never returned a real success response, changing their
  request/response shape before they go live is **not** considered a
  breaking change — no client has ever received a `200` from them to
  depend on. Once any of the three ships its first real `200` response,
  its contract is frozen under the same policy as everything else.

## Version support matrix (current)

| Version | Status | Notes |
|---|---|---|
| `v1` | **active** | Everything documented in `API_CONTRACTS.md` |
| `v2` | not started | No planned date — will be scoped when the first genuinely breaking change is needed (candidates: the pagination/validation-error envelope unification noted in `RESPONSE_STANDARDS.md`, and the error-code granularity migration noted in `ERROR_CODES.md`) |
