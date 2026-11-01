"""
Routes each try-on job to a model and guards it with quality gates.

- A/B routing: TRYON_MODEL_ROUTES ("idm-vton=90,placeholder=10") splits
  traffic by weight. The bucket comes from a hash of the job id, so a
  retried job lands on the same model.
- Fallback: if the routed model errors, or its output fails the output
  gate or the safety check, the next model in TRYON_FALLBACK_MODELS runs
  instead; the response names the model that produced the result and the
  one it fell back from.
- Inputs are read and checked once (quality.check_inputs) before any model
  is called; rejected inputs raise InputRejected (the endpoint's 422).
"""

import hashlib
from io import BytesIO

from app.core.logging_config import get_logger
from app.pipelines.base_pipeline import TryOnInput, TryOnModel, TryOnOutput, TryOnPipeline
from app.pipelines.quality import (
    AllowAllSafetyChecker,
    OutputRejected,
    SafetyChecker,
    check_inputs,
    check_output,
)
from app.storage.s3_client import ObjectStorageClient

logger = get_logger(__name__)


class AllModelsFailed(RuntimeError):
    pass


def parse_routes(spec: str) -> list[tuple[str, int]]:
    """'a=90,b=10' -> [('a', 90), ('b', 10)]; a bare name gets weight 1."""
    routes = []
    for part in filter(None, (p.strip() for p in spec.split(","))):
        name, _, weight = part.partition("=")
        routes.append((name.strip(), int(weight) if weight else 1))
    if any(weight < 0 for _, weight in routes) or not sum(w for _, w in routes):
        raise ValueError(f"TRYON_MODEL_ROUTES needs positive weights: {spec!r}")
    return routes


def pick_route(routes: list[tuple[str, int]], job_id: str) -> str:
    total = sum(weight for _, weight in routes)
    bucket = int(hashlib.sha256(job_id.encode()).hexdigest(), 16) % total
    for name, weight in routes:
        if bucket < weight:
            return name
        bucket -= weight
    return routes[-1][0]  # unreachable; keeps type-checkers happy


class TryOnRouter(TryOnPipeline):
    name = "router"

    def __init__(
        self,
        models: dict[str, TryOnModel],
        routes: list[tuple[str, int]],
        fallbacks: list[str],
        *,
        storage: ObjectStorageClient | None = None,
        safety: SafetyChecker | None = None,
    ):
        self.models = models
        self.routes = routes
        self.fallbacks = fallbacks
        self.storage = storage or ObjectStorageClient()
        self.safety = safety or AllowAllSafetyChecker()

    def run(self, payload: TryOnInput) -> TryOnOutput:
        images = check_inputs(
            self.storage.read_object(payload.user_image_key),
            self.storage.read_object(payload.garment_image_key),
        )
        chosen = pick_route(self.routes, payload.job_id)
        order = [chosen, *(name for name in self.fallbacks if name != chosen)]

        for name in order:
            model = self.models[name]
            try:
                result = model.generate(
                    images.person,
                    images.garment,
                    garment_category=payload.garment_category,
                    garment_description=payload.garment_description,
                )
                check_output(result, images.person)
                if not self.safety.is_safe(result):
                    raise OutputRejected("result failed the safety check")
            except Exception as exc:  # noqa: BLE001 - any model failure falls through
                logger.warning("Model %s failed for job=%s: %s", model.name, payload.job_id, exc)
                continue

            buffer = BytesIO()
            result.save(buffer, format="PNG")
            key = self.storage.write_object(
                buffer.getvalue(), namespace="tryon-results", content_type="image/png"
            )
            fallback_from = self.models[chosen].name if name != chosen else None
            logger.info("Try-on job=%s done by %s -> %s", payload.job_id, model.name, key)
            return TryOnOutput(
                result_image_key=key, model_name=model.name, fallback_from=fallback_from
            )

        raise AllModelsFailed(f"No model produced a usable result for job {payload.job_id}.")
