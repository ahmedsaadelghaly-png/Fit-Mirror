"""Password reset, password change, profile edit, brand sign-up, contact form."""

import re
from datetime import UTC, datetime, timedelta

import pytest

from app.core.security import TokenType, create_token, hash_password
from app.main import app
from app.models.account_support import ContactMessage, PasswordResetToken
from app.models.user import UserRole
from app.services.email_service import EmailMessage, get_email_sender

AUTH = "/api/v1/auth"


class OutboxSender:
    def __init__(self):
        self.sent: list[EmailMessage] = []

    def send(self, message: EmailMessage) -> None:
        self.sent.append(message)


@pytest.fixture
def outbox():
    sender = OutboxSender()
    app.dependency_overrides[get_email_sender] = lambda: sender
    yield sender
    app.dependency_overrides.pop(get_email_sender, None)


def _reset_token(message: EmailMessage) -> str:
    match = re.search(r"/reset-password\?token=(\S+)", message.body)
    assert match, message.body
    return match.group(1)


def _user_with_password(make_user, password="OldPass123!", **fields):
    return make_user(hashed_password=hash_password(password), **fields)


# --- Password reset ---------------------------------------------------------------


def test_reset_flow_end_to_end(api, make_user, outbox):
    user = _user_with_password(make_user, full_name="Ada")

    r = api.post(f"{AUTH}/forgot-password", json={"email": user.email})
    assert r.status_code == 202
    assert len(outbox.sent) == 1 and outbox.sent[0].to == user.email
    token = _reset_token(outbox.sent[0])

    r = api.post(f"{AUTH}/reset-password", json={"token": token, "new_password": "NewPass456!"})
    assert r.status_code == 200, r.text

    login = api.post(f"{AUTH}/login", json={"email": user.email, "password": "NewPass456!"})
    assert login.status_code == 200
    old = api.post(f"{AUTH}/login", json={"email": user.email, "password": "OldPass123!"})
    assert old.status_code == 401

    # Single use.
    again = api.post(f"{AUTH}/reset-password", json={"token": token, "new_password": "Other789!"})
    assert again.status_code == 422


def test_unknown_email_gets_the_same_answer_and_no_email(api, outbox):
    r = api.post(f"{AUTH}/forgot-password", json={"email": "nobody@example.com"})
    assert r.status_code == 202
    assert "If an account exists" in r.json()["message"]
    assert outbox.sent == []


def test_new_link_invalidates_the_previous_one(api, make_user, outbox):
    user = _user_with_password(make_user)
    api.post(f"{AUTH}/forgot-password", json={"email": user.email})
    api.post(f"{AUTH}/forgot-password", json={"email": user.email})
    first, second = (_reset_token(m) for m in outbox.sent)

    r = api.post(f"{AUTH}/reset-password", json={"token": first, "new_password": "NewPass456!"})
    assert r.status_code == 422
    r = api.post(f"{AUTH}/reset-password", json={"token": second, "new_password": "NewPass456!"})
    assert r.status_code == 200


def test_expired_link_is_rejected(api, db, make_user, outbox):
    user = _user_with_password(make_user)
    api.post(f"{AUTH}/forgot-password", json={"email": user.email})
    db.query(PasswordResetToken).update(
        {PasswordResetToken.expires_at: datetime.now(UTC) - timedelta(minutes=1)}
    )
    db.commit()
    token = _reset_token(outbox.sent[0])
    r = api.post(f"{AUTH}/reset-password", json={"token": token, "new_password": "NewPass456!"})
    assert r.status_code == 422


def test_reset_stores_only_a_hash(api, db, make_user, outbox):
    user = _user_with_password(make_user)
    api.post(f"{AUTH}/forgot-password", json={"email": user.email})
    token = _reset_token(outbox.sent[0])
    stored = db.query(PasswordResetToken).one()
    assert stored.token_hash != token and len(stored.token_hash) == 64


def test_password_reset_revokes_older_refresh_tokens(api, make_user, outbox):
    user = _user_with_password(make_user)
    old_refresh = create_token(str(user.id), TokenType.REFRESH, {"iat": 1_000_000})
    assert api.post(f"{AUTH}/refresh", json={"refresh_token": old_refresh}).status_code == 200

    api.post(f"{AUTH}/forgot-password", json={"email": user.email})
    token = _reset_token(outbox.sent[0])
    api.post(f"{AUTH}/reset-password", json={"token": token, "new_password": "NewPass456!"})

    r = api.post(f"{AUTH}/refresh", json={"refresh_token": old_refresh})
    assert r.status_code == 401


# --- Account self-service ------------------------------------------------------------


def test_change_password_returns_working_tokens(api, make_user, auth_headers):
    user = _user_with_password(make_user)
    headers = auth_headers(user)

    wrong = api.post(
        "/api/v1/users/me/password",
        json={"current_password": "nope", "new_password": "NewPass456!"},
        headers=headers,
    )
    assert wrong.status_code == 422

    r = api.post(
        "/api/v1/users/me/password",
        json={"current_password": "OldPass123!", "new_password": "NewPass456!"},
        headers=headers,
    )
    assert r.status_code == 200, r.text
    refreshed = api.post(f"{AUTH}/refresh", json={"refresh_token": r.json()["refresh_token"]})
    assert refreshed.status_code == 200


def test_update_full_name(api, make_user, auth_headers):
    headers = auth_headers(make_user(full_name="Old Name"))
    r = api.patch("/api/v1/users/me", json={"full_name": "Ada Lovelace"}, headers=headers)
    assert r.json()["full_name"] == "Ada Lovelace"
    assert api.patch("/api/v1/users/me", json={"full_name": ""}, headers=headers).status_code == 422


# --- Brand sign-up ----------------------------------------------------------------------


def test_brand_self_signup_gets_brand_role_and_can_create_store(api):
    r = api.post(
        f"{AUTH}/register",
        json={"email": "atelier@example.com", "password": "BrandPass1!", "account_type": "brand"},
    )
    assert r.status_code == 201 and r.json()["role"] == "brand_admin"

    tokens = api.post(
        f"{AUTH}/login", json={"email": "atelier@example.com", "password": "BrandPass1!"}
    ).json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    store = api.post("/api/v1/store", json={"name": "Atelier", "slug": "atelier"}, headers=headers)
    assert store.status_code == 201
    assert store.json()["is_verified"] is False


def test_admin_role_cannot_be_self_registered(api):
    r = api.post(
        f"{AUTH}/register",
        json={"email": "x@example.com", "password": "Password1!", "account_type": "platform_admin"},
    )
    assert r.status_code == 422


# --- Contact form + support inbox ------------------------------------------------------


def test_contact_message_is_stored_and_forwarded(api, db, outbox):
    r = api.post(
        "/api/v1/contact",
        json={"name": "Sam", "email": "sam@example.com", "message": "Do you ship to Cairo?"},
    )
    assert r.status_code == 201
    assert db.query(ContactMessage).one().email == "sam@example.com"
    assert outbox.sent[0].reply_to == "sam@example.com"


def test_contact_message_validation(api, outbox):
    r = api.post("/api/v1/contact", json={"name": "Sam", "email": "bad", "message": "short"})
    assert r.status_code == 422
    assert outbox.sent == []


def test_admin_works_through_the_support_inbox(api, make_user, auth_headers, outbox):
    api.post(
        "/api/v1/contact",
        json={"name": "Sam", "email": "sam@example.com", "message": "Do you ship to Cairo?"},
    )
    admin = auth_headers(make_user(UserRole.PLATFORM_ADMIN))
    open_items = api.get("/api/v1/admin/contact-messages?is_resolved=false", headers=admin).json()
    assert len(open_items) == 1

    r = api.patch(
        f"/api/v1/admin/contact-messages/{open_items[0]['id']}",
        json={"is_resolved": True},
        headers=admin,
    )
    assert r.json()["is_resolved"] is True
    assert api.get("/api/v1/admin/contact-messages?is_resolved=false", headers=admin).json() == []

    shopper = auth_headers(make_user())
    assert api.get("/api/v1/admin/contact-messages", headers=shopper).status_code == 403
