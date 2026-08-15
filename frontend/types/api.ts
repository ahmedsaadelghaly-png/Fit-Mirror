/**
 * API-wide error types. See backend docs/ERROR_CODES.md for the full
 * catalog and backend docs/RESPONSE_STANDARDS.md for the envelope shape.
 * `ApiError` (the class instances every failed API call actually throws)
 * lives in api/client.ts — this file holds the plain data shapes.
 */

/** The backend's structured error response body. */
export interface ApiErrorBody {
  error_code: string;
  message: string;
}

/**
 * Known error codes as currently implemented by the backend (see backend
 * docs/ERROR_CODES.md "Implementation status" — several of these are
 * still generic today, e.g. every 404 is `not_found`, not yet split into
 * `USER_NOT_FOUND`/`STORE_NOT_FOUND`/etc.). Kept as a union of string
 * literals, not an enum, so an unrecognized code from a future backend
 * change still type-checks as `string` via the fallback branch.
 */
export type KnownErrorCode =
  | "not_found"
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "conflict"
  | "external_service_error"
  | "internal_error"
  | "rate_limited"
  | "network_error";

export type ErrorCode = KnownErrorCode | (string & {});

/** FastAPI's default validation error shape (not yet unified with ApiErrorBody — see backend docs/RESPONSE_STANDARDS.md §4). */
export interface FastApiValidationErrorBody {
  detail: Array<{ type: string; loc: (string | number)[]; msg: string }> | string;
}
