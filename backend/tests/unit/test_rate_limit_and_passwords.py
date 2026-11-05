"""Rate limiting (fake Redis) and password hashing without passlib."""

import pytest
from redis.exceptions import ConnectionError as RedisConnectionError

from app.core import middleware
from app.core.config import settings
from app.core.security import hash_password, verify_password

PASSLIB_HASH = "$2b$12$0k7tobTBHr5Wk38SuFJaPeIlk6iWcs/uHUhfaZGqAdngWNJGBl8S."
HEALTH = "/health"
LOGIN = "/api/v1/auth/login"
ME = "/api/v1/users/me"


class FakePipeline:
    def __init__(self, redis):
        self.redis = redis
        self.keys: list[str] = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    def incr(self, key):
        self.keys.append(key)

    def expire(self, key, seconds):
        self.redis.expiries[key] = seconds

    async def execute(self):
        if self.redis.down:
            raise RedisConnectionError("redis is down")
        key = self.keys[0]
        self.redis.counts[key] = self.redis.counts.get(key, 0) + 1
        return [self.redis.counts[key], True]


class FakeRedis:
    def __init__(self):
        self.counts: dict[str, int] = {}
        self.expiries: dict[str, int] = {}
        self.down = False

    def pipeline(self, transaction=True):
        return FakePipeline(self)


@pytest.fixture
def redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(middleware, "get_rate_limit_redis", lambda: fake)
    monkeypatch.setattr(settings, "RATE_LIMIT_ENABLED", True)
    monkeypatch.setattr(settings, "RATE_LIMIT_REQUESTS_PER_MINUTE", 3)
    monkeypatch.setattr(settings, "RATE_LIMIT_AUTH_REQUESTS_PER_MINUTE", 2)
    return fake


def test_requests_over_the_limit_get_429_with_retry_after(api, redis):
    statuses = [api.get(ME).status_code for _ in range(4)]
    assert statuses == [401, 401, 401, 429]

    blocked = api.get(ME)
    assert 1 <= int(blocked.headers["Retry-After"]) <= 60
    assert blocked.json()["error_code"] == "rate_limited"


def test_sign_in_has_its_own_stricter_budget(api, redis):
    body = {"email": "a@example.com", "password": "wrong-password"}
    statuses = [api.post(LOGIN, json=body).status_code for _ in range(3)]
    assert statuses[-1] == 429
    # Spent sign-in attempts don't lock the rest of the API.
    assert api.get(ME).status_code == 401


def test_health_checks_are_never_limited(api, redis):
    assert {api.get(HEALTH).status_code for _ in range(10)} == {200}


def test_counters_expire(api, redis):
    api.get(ME)
    assert list(redis.expiries.values()) == [120]


def test_requests_pass_when_redis_is_down(api, redis):
    redis.down = True
    assert {api.get(ME).status_code for _ in range(10)} == {401}


def test_limiter_is_off_by_default_in_tests(api, redis, monkeypatch):
    monkeypatch.setattr(settings, "RATE_LIMIT_ENABLED", False)
    assert {api.get(ME).status_code for _ in range(10)} == {401}
    assert redis.counts == {}


def test_password_round_trip():
    hashed = hash_password("CorrectHorse1!")
    assert hashed.startswith("$2b$")
    assert verify_password("CorrectHorse1!", hashed)
    assert not verify_password("wrong", hashed)


def test_hashes_made_by_passlib_still_verify():
    # Made with passlib 1.7.4 for "DemoPass123!": existing accounts must keep working.
    legacy = PASSLIB_HASH
    assert verify_password("DemoPass123!", legacy)


def test_something_that_is_not_a_hash_never_matches():
    assert not verify_password("anything", "not-a-bcrypt-hash")
