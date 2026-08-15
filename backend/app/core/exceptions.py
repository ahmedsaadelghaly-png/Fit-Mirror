"""
Application-wide exception hierarchy.

Domain/service code should raise these instead of HTTPException directly,
keeping business logic decoupled from the web framework (Clean Architecture).
FastAPI exception handlers (see app/main.py) translate these into HTTP responses.
"""


class AppError(Exception):
    """Base class for all application-raised errors."""

    status_code: int = 500
    error_code: str = "internal_error"

    def __init__(self, message: str = "An unexpected error occurred."):
        self.message = message
        super().__init__(message)


class NotFoundError(AppError):
    status_code = 404
    error_code = "not_found"


class ValidationAppError(AppError):
    status_code = 422
    error_code = "validation_error"


class UnauthorizedError(AppError):
    status_code = 401
    error_code = "unauthorized"


class ForbiddenError(AppError):
    status_code = 403
    error_code = "forbidden"


class ConflictError(AppError):
    status_code = 409
    error_code = "conflict"


class ExternalServiceError(AppError):
    """Raised when a downstream service (AI service, storage, etc.) fails."""

    status_code = 502
    error_code = "external_service_error"
