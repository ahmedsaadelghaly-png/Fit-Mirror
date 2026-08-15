"""Unit tests for the backend health endpoint. No external services required."""

import pytest

pytestmark = pytest.mark.unit


def test_health_check_returns_ok(client):
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "service" in body


def test_openapi_schema_is_served(client):
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert response.json()["info"]["title"]
