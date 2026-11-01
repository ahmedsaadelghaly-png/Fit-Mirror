from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.user import UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.user import UserRead
from app.services.auth_service import AuthService
from app.services.email_service import EmailSender, get_email_sender, send_email_safely
from app.services.password_reset_service import PasswordResetService

router = APIRouter()

ACCOUNT_TYPE_ROLES = {"shopper": UserRole.SHOPPER, "brand": UserRole.BRAND_ADMIN}


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(UserRepository(db))


@router.post("/register", response_model=UserRead, status_code=201)
def register(payload: RegisterRequest, service: AuthService = Depends(get_auth_service)):
    """`account_type: "brand"` creates a brand admin, who sets up their store
    next (it stays unverified until a platform admin verifies it)."""
    return service.register(
        payload.email,
        payload.password,
        payload.full_name,
        role=ACCOUNT_TYPE_ROLES[payload.account_type],
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, service: AuthService = Depends(get_auth_service)):
    user = service.authenticate(payload.email, payload.password)
    return service.issue_tokens(user)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, service: AuthService = Depends(get_auth_service)):
    return service.refresh(payload.refresh_token)


@router.post("/forgot-password", response_model=MessageResponse, status_code=202)
def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    sender: EmailSender = Depends(get_email_sender),
):
    """Emails a single-use reset link. Answers the same whether or not the
    account exists, so it can't be used to discover registered emails."""
    message = PasswordResetService(db).request_reset(payload.email)
    if message:
        background_tasks.add_task(send_email_safely, sender, message)
    return MessageResponse(
        message="If an account exists for that email, we've sent a link to reset your password."
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """422 if the link is unknown, used, or expired. Other sessions end at
    their next token refresh."""
    PasswordResetService(db).reset(payload.token, payload.new_password)
    return MessageResponse(message="Your password has been reset. You can log in now.")
