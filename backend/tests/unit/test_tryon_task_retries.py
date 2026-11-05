"""
Regression tests for the try-on worker's retry handling: a transient AI
service failure must not flip the job to FAILED while retries remain
(clients polling the job would stop and show an error), and a redelivered
message for a completed job must not regenerate it.
"""

import httpx
import pytest

from app.models.tryon_job import TryOnJob, TryOnJobStatus
from app.workers.tasks import tryon_tasks
from app.workers.tasks.tryon_tasks import process_tryon_job

pytestmark = pytest.mark.unit


@pytest.fixture
def job(db, make_user, sqlite_sessionmaker, monkeypatch):
    monkeypatch.setattr(tryon_tasks, "SessionLocal", sqlite_sessionmaker)
    job = TryOnJob(
        user_id=make_user().id,
        user_image_key="u.png",
        garment_image_key="g.png",
        status=TryOnJobStatus.PENDING,
    )
    db.add(job)
    db.commit()
    return job


def _status(db, job):
    db.expire_all()
    return db.get(TryOnJob, job.id)


def _failing_post(*args, **kwargs):
    raise httpx.ConnectError("AI service unreachable")


def test_transient_failure_with_retries_left_keeps_job_pending(db, job, monkeypatch):
    monkeypatch.setattr(tryon_tasks.httpx, "post", _failing_post)

    with pytest.raises(httpx.ConnectError):
        process_tryon_job(str(job.id))

    refreshed = _status(db, job)
    assert refreshed.status == TryOnJobStatus.PENDING
    assert refreshed.error_message is None


def test_failure_after_last_retry_marks_job_failed(db, job, monkeypatch):
    monkeypatch.setattr(tryon_tasks.httpx, "post", _failing_post)

    # .run, not __call__: calling the task pushes a fresh request (retries=0)
    # over this one.
    process_tryon_job.push_request(retries=process_tryon_job.max_retries)
    try:
        process_tryon_job.run(str(job.id))
    finally:
        process_tryon_job.pop_request()

    refreshed = _status(db, job)
    assert refreshed.status == TryOnJobStatus.FAILED
    assert "unreachable" in refreshed.error_message


def test_success_marks_job_completed(db, job, monkeypatch):
    request = httpx.Request("POST", "http://ai/api/v1/tryon/generate")
    monkeypatch.setattr(
        tryon_tasks.httpx,
        "post",
        lambda *a, **k: httpx.Response(
            200,
            json={"result_image_key": "tryon-results/r.png", "model_name": "placeholder-v0"},
            request=request,
        ),
    )

    process_tryon_job(str(job.id))

    refreshed = _status(db, job)
    assert refreshed.status == TryOnJobStatus.COMPLETED
    assert refreshed.result_image_key == "tryon-results/r.png"


def test_redelivered_completed_job_is_not_regenerated(db, job, monkeypatch):
    job.status = TryOnJobStatus.COMPLETED
    db.commit()
    calls = []
    monkeypatch.setattr(tryon_tasks.httpx, "post", lambda *a, **k: calls.append(1))

    process_tryon_job(str(job.id))

    assert calls == []


def test_rejected_input_fails_immediately_with_the_reason(db, job, monkeypatch):
    def rejecting_post(*args, **kwargs):
        return httpx.Response(
            422,
            json={"detail": "The photo is too small (120x160)."},
            request=httpx.Request("POST", "http://ai.test"),
        )

    monkeypatch.setattr(tryon_tasks.httpx, "post", rejecting_post)

    process_tryon_job(str(job.id))  # no exception: nothing to retry

    refreshed = _status(db, job)
    assert refreshed.status == TryOnJobStatus.FAILED
    assert refreshed.error_message == "The photo is too small (120x160)."


def test_catalog_job_sends_garment_hints(db, job, make_store, make_product, make_user, monkeypatch):
    from app.models.user import UserRole

    product = make_product(
        make_store(make_user(UserRole.BRAND_ADMIN)), title="Red Gown", category="dresses"
    )
    job.product_variant_id = product.variants[0].id
    db.commit()
    sent = {}

    def ok_post(url, json, timeout):
        sent.update(json)
        return httpx.Response(
            200,
            json={"result_image_key": "r.png", "model_name": "idm-vton@abc"},
            request=httpx.Request("POST", url),
        )

    monkeypatch.setattr(tryon_tasks.httpx, "post", ok_post)
    process_tryon_job(str(job.id))

    assert sent["garment_category"] == "dresses"
    assert sent["garment_description"] == "Red Gown"
    refreshed = _status(db, job)
    assert refreshed.status == TryOnJobStatus.COMPLETED
    assert refreshed.ai_model_name == "idm-vton@abc"
