# RBAC (Role-Based Access Control) Design

## Roles

Defined today in `app/models/user.py::UserRole`:

| Role | Description |
|---|---|
| `shopper` | Default role. Browses, tries on garments, manages their own wardrobe/body profile. |
| `brand_admin` | Owns and manages one store and its product catalog. |
| `platform_admin` | Platform operator. Intended for moderation/verification/support tooling. |

A user has exactly one role, set at registration (`AuthService.register`
always assigns `UserRole.SHOPPER` today — there is no self-service
"become a brand" endpoint yet; brand accounts are provisioned directly,
e.g. via the seed script or a planned admin-only user-management endpoint).

## Permission matrix

`own` = only on rows the caller owns (via `user_id`/`owner_user_id`/
`store_id` chains). `any` = across all rows, no ownership check.
`—` = no access. `*` = not yet an enforced distinction (see note below).

| Resource | Action | shopper | brand_admin | platform_admin |
|---|---|---|---|---|
| **Users** | read own profile | ✅ own | ✅ own | ✅ own |
| | read any profile | — | — | ✅ any *(planned endpoint)* |
| | deactivate a user | — | — | ✅ any *(planned endpoint)* |
| **Body profiles** | read/write own | ✅ own | ✅ own | ✅ own |
| | read any | — | — | ✅ any *(planned, support tooling)* |
| **Wardrobe** | create/read/delete own items | ✅ own | ✅ own | ✅ own |
| | read any user's wardrobe | — | — | — *(not planned — private by default; see `MULTI_TENANCY.md`)* |
| **Try-on jobs** | create own | ✅ own | ✅ own | ✅ own |
| | read/poll own | ✅ own | ✅ own | ✅ own |
| | read any (for support/debugging) | — | — | ✅ any *(planned endpoint)* |
| **Stores** | create own store | — | ✅ own | ✅ (not typical usage) |
| | read/update own store | — | ✅ own | ✅ any |
| | verify a store (`is_verified`) | — | — | ✅ any *(planned workflow)* |
| | delete/suspend a store | — | — | ✅ any *(planned)* |
| **Products** | create/update/delete within own store | — | ✅ own | ✅ any |
| | read (public catalog browse) | ✅ any *(planned public endpoint)* | ✅ any | ✅ any |
| **Recommendations** *(planned)* | read own | ✅ own | ✅ own | ✅ own |
| | generate for any user | — | — | ✅ any *(support/debug only)* |
| **Admin operations** | view audit logs | — | — | ✅ any |
| | feature flag overrides | — | — | ✅ any |
| | manage rate-limit exemptions | — | — | ✅ any |

\* **Current enforcement reality (Phase 3.0):** role checks are
enforced by `require_role(...)` — `/store/*` accepts `brand_admin` and
`platform_admin`, `/admin/*` accepts only `platform_admin`, anything else
gets `403`. "Own" rows are still enforced by ownership-scoped queries.
Implemented admin endpoints: read any user / change role / deactivate
(`/admin/users`), verify a store (`/admin/stores`), read any try-on job
(`/admin/tryon-jobs`), platform stats. Still planned: audit logs, feature
flag overrides, rate-limit exemptions, store suspension, admin body-profile
access. Brand accounts are provisioned by an admin promoting a user
(`PATCH /admin/users/{id}` with `role: brand_admin`) or by the seed script.

## Enforcement mechanism (implemented)

```python
# app/core/dependencies.py
def require_role(*allowed_roles: UserRole):
    def _dependency(
        user_id: str = Depends(get_current_user_id),
        db: Session = Depends(get_db),
    ) -> User:
        user = db.get(User, uuid.UUID(user_id))
        if not user or user.role not in allowed_roles:
            raise ForbiddenError("You do not have permission to perform this action.")
        return user
    return _dependency

# Usage on a future admin-only endpoint:
# @router.get("/admin/users")
# def list_all_users(admin: User = Depends(require_role(UserRole.PLATFORM_ADMIN))): ...
```

This keeps role checks declarative and centralized (consistent with the
existing `Depends()`-based DI pattern) rather than scattered `if` checks
inside endpoint bodies.

## Design principles

1. **Ownership before role.** Even where a role check exists, it never
   substitutes for an ownership check — a `brand_admin` can only manage
   *their own* store, never another brand's, regardless of role.
2. **404 over 403 for cross-tenant access**, intentionally — see
   `SECURITY.md` for the rationale (don't confirm a resource exists to a
   caller who isn't allowed to see it).
3. **`platform_admin` is additive, not a bypass switch.** Planned admin
   endpoints are separate routes (e.g. `/admin/*`), not hidden query
   params that unlock broader access on existing shopper/brand routes.
4. New roles (e.g. a future `team_member` role under multi-tenant stores —
   see `MULTI_TENANCY.md`) should extend `UserRole`, not overload the
   meaning of an existing role.
