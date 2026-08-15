# Feature Flags Design

## Current state

No feature-flag system exists in the codebase today. The closest
equivalent is the AI service's `TRYON_MODEL_NAME` environment variable
(see `AI_INTERFACES.md`), which is a deploy-time config switch, not a
runtime-toggleable flag. This document specifies the **planned** design.

## Why flags, and why not yet

Feature flags earn their complexity once you need to: ship dark, roll out
gradually, run an A/B test, or let different tenants see different
capabilities. At current scope (single-tenant-per-brand, no A/B testing,
small team), environment variables and the `501` stub pattern already used
for Stylist/Sizing/Shopping serve the same purpose with far less
infrastructure. Flags are planned for the point where that stops being
true — namely, once the first of these features goes from `501` to a real
implementation and needs a gradual rollout.

## Planned flag catalog

| Flag | Default | Controls |
|---|---|---|
| `FEATURE_AI_STYLIST_ENABLED` | `false` | Whether `/stylist/suggestions` attempts real generation vs. returning `501` |
| `FEATURE_SHOPPING_ASSISTANT_ENABLED` | `false` | Whether `/shopping/ask` attempts real generation vs. returning `501` |
| `FEATURE_REAL_TRYON_MODEL_ENABLED` | `false` | Whether the AI service's model registry may resolve to a non-`placeholder` `TRYON_MODEL_NAME` in this environment (a safety interlock — see below) |
| `FEATURE_STORE_DASHBOARD_BETA` | `false` | Gates in-progress Store Dashboard features (e.g. bulk import, analytics — see `ROADMAP.md` Phase 7) behind a beta flag for early brand partners |
| `FEATURE_SOCIAL_SHARING_ENABLED` | `false` | Gates a future "share your try-on/look" capability (no design work done yet beyond the flag's existence) |

## Planned mechanism

Simplest viable design, consistent with the existing `Settings`
(pydantic-settings) pattern already used for all other configuration —
**no new infrastructure** (no LaunchDarkly/Unleash dependency) for the
initial version:

```python
# Planned addition to app/core/config.py
class Settings(BaseSettings):
    ...
    FEATURE_AI_STYLIST_ENABLED: bool = False
    FEATURE_SHOPPING_ASSISTANT_ENABLED: bool = False
    FEATURE_REAL_TRYON_MODEL_ENABLED: bool = False
    FEATURE_STORE_DASHBOARD_BETA: bool = False
    FEATURE_SOCIAL_SHARING_ENABLED: bool = False
```

Endpoint-level usage pattern (planned, mirrors the existing `501` stub
structure in `app/api/v1/endpoints/stylist.py`):

```python
@router.post("/suggestions", response_model=OutfitSuggestionResponse)
def get_outfit_suggestion(payload: OutfitSuggestionRequest, ...):
    if not settings.FEATURE_AI_STYLIST_ENABLED:
        raise HTTPException(status_code=501, detail="AI Stylist is scheduled for a later phase.")
    # real implementation once built
```

This means turning a feature on/off is an environment-variable change —
identical operational story to `TRYON_MODEL_NAME` — with **no code
deploy** required to flip a flag, only a container restart/env update.

## Per-tenant flags (planned, later)

The design above is global (one value per environment). Once a flag needs
to vary per-store (e.g. `FEATURE_STORE_DASHBOARD_BETA` only for specific
early-access brand partners), the plan is:
- Add a `feature_overrides` JSON column on `stores` (or a dedicated
  `store_feature_flags` table if the override set grows large), checked
  **in addition to** the global env-var default (global `false` + a
  per-store `true` override = enabled for that store only).
- This is explicitly not needed yet — no flag above requires per-tenant
  granularity at Phase 1.75's scope.

## `FEATURE_REAL_TRYON_MODEL_ENABLED` — a safety interlock, not a normal flag

This flag is different in kind from the others: it's not gating an
unfinished feature, it's a **deliberate extra confirmation** that a real
(non-placeholder) AI model has been consciously enabled in this
environment — because swapping `TRYON_MODEL_NAME` alone (see
`AI_INTERFACES.md`) is a single env-var edit, and a real model carries
cost/compute/content-safety implications (see `AI_INTERFACES.md`
"Do consider" section) that a placeholder swap doesn't. Planned check:

```python
# Planned addition to model_registry.py
def get_tryon_pipeline() -> TryOnPipeline:
    if settings.TRYON_MODEL_NAME != "placeholder" and not settings.FEATURE_REAL_TRYON_MODEL_ENABLED:
        raise RuntimeError(
            "A non-placeholder TRYON_MODEL_NAME is set, but FEATURE_REAL_TRYON_MODEL_ENABLED "
            "is false. This is a safety interlock — enable the flag explicitly to confirm."
        )
    ...
```

## Feature flag admin visibility (planned)

Once flags exist, `platform_admin`-only tooling (see `RBAC.md` admin
operations) should expose current flag state read-only at minimum (e.g.
`GET /admin/feature-flags`), and eventually allow runtime overrides without
a redeploy — but that requires a real flag *store* (database-backed, not
env-var-only), which is a bigger step than Phase 1.75's scope and is
tracked as a follow-on to this initial design, not part of it.
