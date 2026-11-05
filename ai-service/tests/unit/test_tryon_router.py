"""TryOnRouter: A/B routing, quality gates, fallback; Replicate adapter over a fake transport."""

import json
from collections import Counter
from io import BytesIO
from unittest.mock import MagicMock

import httpx
import pytest
from PIL import Image, ImageDraw

from app.core.config import settings
from app.pipelines.base_pipeline import TryOnInput, TryOnModel
from app.pipelines.quality import InputRejected, check_inputs
from app.pipelines.replicate_tryon_model import ReplicateError, ReplicateTryOnModel
from app.pipelines.tryon_router import AllModelsFailed, TryOnRouter, parse_routes, pick_route

pytestmark = pytest.mark.unit


def _photo(size=(600, 800), seed=0) -> Image.Image:
    """A non-flat test image (flat images fail the output gate on purpose)."""
    image = Image.new("RGB", size, (40 + seed, 90, 160))
    draw = ImageDraw.Draw(image)
    for i in range(0, size[0], 40):
        draw.rectangle([i, 0, i + 20, size[1]], fill=(200, 120 + seed, 60))
    return image


def _png(image: Image.Image) -> bytes:
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


class FakeModel(TryOnModel):
    def __init__(self, name, result=None, error=None):
        self.name = name
        self.result = result
        self.error = error
        self.calls = []

    def generate(self, person, garment, *, garment_category=None, garment_description=None):
        self.calls.append((garment_category, garment_description))
        if self.error:
            raise self.error
        return self.result if self.result is not None else _photo(seed=60)


def _router(models, routes="a", fallbacks=("b",), person=None, garment=None):
    storage = MagicMock()
    storage.read_object.side_effect = [
        _png(person or _photo()),
        _png(garment or _photo((400, 400))),
    ]
    storage.write_object.return_value = "tryon-results/out.png"
    return (
        TryOnRouter(
            {m.name: m for m in models}, parse_routes(routes), list(fallbacks), storage=storage
        ),
        storage,
    )


JOB = TryOnInput(job_id="job-1", user_image_key="u.png", garment_image_key="g.png")


def test_routes_split_by_weight_and_stick_per_job():
    routes = parse_routes("a=90,b=10")
    picks = Counter(pick_route(routes, f"job-{i}") for i in range(2000))
    assert 0.85 < picks["a"] / 2000 < 0.95
    assert pick_route(routes, "job-42") == pick_route(routes, "job-42")


def test_parse_routes_rejects_zero_weight():
    with pytest.raises(ValueError):
        parse_routes("a=0")


def test_routed_model_result_is_stored():
    a, b = FakeModel("a"), FakeModel("b")
    router, storage = _router([a, b])
    out = router.run(
        TryOnInput(
            job_id="j", user_image_key="u", garment_image_key="g", garment_category="dresses"
        )
    )
    assert out.model_name == "a" and out.fallback_from is None
    assert a.calls == [("dresses", None)] and b.calls == []
    assert storage.write_object.call_args.kwargs["namespace"] == "tryon-results"


def test_falls_back_when_the_routed_model_errors():
    router, _ = _router([FakeModel("a", error=RuntimeError("GPU busy")), FakeModel("b")])
    out = router.run(JOB)
    assert out.model_name == "b" and out.fallback_from == "a"


def test_falls_back_when_output_is_blank_or_unchanged():
    blank = Image.new("RGB", (600, 800), (128, 128, 128))
    router, _ = _router([FakeModel("a", result=blank), FakeModel("b")])
    assert router.run(JOB).model_name == "b"

    person = _photo()
    router, _ = _router([FakeModel("a", result=person.copy()), FakeModel("b")], person=person)
    assert router.run(JOB).model_name == "b"


def test_safety_rejection_falls_back():
    router, _ = _router([FakeModel("a"), FakeModel("b")])
    router.safety = MagicMock()
    router.safety.is_safe.side_effect = [False, True]
    assert router.run(JOB).model_name == "b"


def test_all_models_failing_raises():
    router, _ = _router(
        [FakeModel("a", error=RuntimeError()), FakeModel("b", error=RuntimeError())]
    )
    with pytest.raises(AllModelsFailed):
        router.run(JOB)


@pytest.mark.parametrize(
    ("person", "message"),
    [((120, 160), "too small"), ((300, 1200), "too narrow")],
)
def test_bad_inputs_are_rejected_before_any_model_runs(person, message):
    a = FakeModel("a")
    router, _ = _router([a, FakeModel("b")], person=_photo(person))
    with pytest.raises(InputRejected, match=message):
        router.run(JOB)
    assert a.calls == []


def test_unreadable_input_is_rejected():
    with pytest.raises(InputRejected, match="readable"):
        check_inputs(b"not an image", _png(_photo()))


def test_endpoint_answers_422_for_rejected_input(client, monkeypatch):
    router = MagicMock()
    router.run.side_effect = InputRejected("The photo is too small (100x100).")
    monkeypatch.setattr("app.api.v1.endpoints.tryon.get_tryon_pipeline", lambda: router)
    r = client.post(
        "/api/v1/tryon/generate",
        json={"job_id": "j", "user_image_key": "u", "garment_image_key": "g"},
    )
    assert r.status_code == 422
    assert r.json()["detail"] == "The photo is too small (100x100)."


# --- Replicate adapter --------------------------------------------------------------


@pytest.fixture
def replicate_settings(monkeypatch):
    monkeypatch.setattr(settings, "REPLICATE_API_TOKEN", "r8_test")
    monkeypatch.setattr(settings, "REPLICATE_TRYON_VERSION", "abcdef1234567890")
    monkeypatch.setattr(settings, "REPLICATE_TIMEOUT_SECONDS", 5)


def _replicate_transport(final_status="succeeded"):
    seen = {"inputs": None, "polls": 0}
    result_png = _png(_photo(seed=90))

    def handler(request: httpx.Request) -> httpx.Response:
        url = str(request.url)
        if url.endswith("/v1/files"):
            assert request.headers["Authorization"] == "Bearer r8_test"
            return httpx.Response(201, json={"urls": {"get": f"https://files.test/{len(url)}"}})
        if url.endswith("/v1/predictions"):
            body = json.loads(request.content)
            seen["inputs"] = body
            assert request.headers["Prefer"] == "wait=60"
            return httpx.Response(
                201,
                json={
                    "status": "processing",
                    "urls": {"get": "https://api.test/p/1", "cancel": "https://api.test/p/1/c"},
                },
            )
        if url == "https://api.test/p/1":
            seen["polls"] += 1
            return httpx.Response(
                200,
                json={
                    "status": final_status,
                    "output": "https://out.test/result.png",
                    "error": "OOM" if final_status == "failed" else None,
                    "urls": {"get": "https://api.test/p/1", "cancel": "https://api.test/p/1/c"},
                },
            )
        if url == "https://out.test/result.png":
            return httpx.Response(200, content=result_png)
        raise AssertionError(f"unexpected request {url}")

    return httpx.MockTransport(handler), seen


def test_replicate_runs_a_pinned_version_and_returns_the_output(replicate_settings):
    transport, seen = _replicate_transport()
    model = ReplicateTryOnModel(httpx.Client(transport=transport), poll_interval=0)

    image = model.generate(
        _photo(), _photo((400, 400)), garment_category="dresses", garment_description="Red gown"
    )

    assert image.size == (600, 800)
    assert model.name == "idm-vton@abcdef12"
    assert seen["inputs"]["version"] == "abcdef1234567890"
    assert seen["inputs"]["input"]["category"] == "dresses"
    assert seen["inputs"]["input"]["garment_des"] == "Red gown"
    assert seen["polls"] == 1


def test_replicate_failure_raises(replicate_settings):
    transport, _ = _replicate_transport("failed")
    model = ReplicateTryOnModel(httpx.Client(transport=transport), poll_interval=0)
    with pytest.raises(ReplicateError, match="OOM"):
        model.generate(_photo(), _photo((400, 400)))


def test_replicate_requires_credentials(monkeypatch):
    monkeypatch.setattr(settings, "REPLICATE_API_TOKEN", "")
    with pytest.raises(ValueError, match="REPLICATE_API_TOKEN"):
        ReplicateTryOnModel()
