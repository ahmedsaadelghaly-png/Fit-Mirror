"""
Unit tests for AuthService.

Uses a minimal in-memory fake repository instead of a real database, so
these tests exercise business logic (hashing, duplicate-email rejection,
token issuance) without needing Postgres.
"""

import pytest

from app.core.exceptions import ConflictError, UnauthorizedError
from app.models.user import User
from app.services.auth_service import AuthService

pytestmark = pytest.mark.unit


class FakeUserRepository:
    """In-memory stand-in for UserRepository, satisfying the same interface
    surface AuthService actually calls: get_by_email, add, get."""

    def __init__(self):
        self._users: dict[str, User] = {}

    def get_by_email(self, email: str) -> User | None:
        return self._users.get(email)

    def add(self, user: User) -> User:
        import uuid

        user.id = uuid.uuid4()
        self._users[user.email] = user
        return user

    def get(self, user_id):
        for user in self._users.values():
            if user.id == user_id:
                return user
        return None


@pytest.fixture
def auth_service() -> AuthService:
    return AuthService(FakeUserRepository())


def test_register_creates_user_with_hashed_password(auth_service):
    user = auth_service.register("shopper@example.com", "supersecret123", "Ada Shopper")

    assert user.email == "shopper@example.com"
    assert user.hashed_password != "supersecret123"
    assert user.full_name == "Ada Shopper"


def test_register_rejects_duplicate_email(auth_service):
    auth_service.register("dup@example.com", "password123", None)

    with pytest.raises(ConflictError):
        auth_service.register("dup@example.com", "anotherpassword", None)


def test_authenticate_succeeds_with_correct_password(auth_service):
    auth_service.register("login@example.com", "correct-password", None)

    user = auth_service.authenticate("login@example.com", "correct-password")

    assert user.email == "login@example.com"


def test_authenticate_fails_with_wrong_password(auth_service):
    auth_service.register("login2@example.com", "correct-password", None)

    with pytest.raises(UnauthorizedError):
        auth_service.authenticate("login2@example.com", "wrong-password")


def test_authenticate_fails_for_unknown_email(auth_service):
    with pytest.raises(UnauthorizedError):
        auth_service.authenticate("nobody@example.com", "whatever")


def test_issue_tokens_returns_access_and_refresh(auth_service):
    user = auth_service.register("tokens@example.com", "password123", None)

    tokens = auth_service.issue_tokens(user)

    assert tokens.access_token
    assert tokens.refresh_token
    assert tokens.token_type == "bearer"
