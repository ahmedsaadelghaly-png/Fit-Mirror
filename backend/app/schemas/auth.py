from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

Password = Field(min_length=8, max_length=128)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Password
    full_name: str | None = None
    # "brand" signs up a brand admin, who then creates their store
    # (unverified until a platform admin verifies it). Admins can't self-register.
    account_type: Literal["shopper", "brand"] = "shopper"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=10, max_length=200)
    new_password: str = Password


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Password


class MessageResponse(BaseModel):
    message: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class DeleteAccountRequest(BaseModel):
    password: str = Field(min_length=1, max_length=128)


class AccountDeletionScheduled(BaseModel):
    deletion_scheduled_for: datetime
