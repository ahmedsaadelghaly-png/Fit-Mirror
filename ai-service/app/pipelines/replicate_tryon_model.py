"""
Diffusion virtual try-on hosted on Replicate (IDM-VTON by default).

IDM-VTON is licensed CC BY-NC-SA 4.0 (non-commercial), so this adapter is
for private testing only and refuses to start when ENVIRONMENT=production.
A commercially licensed model must replace it before launch.

Runs on Replicate's GPUs, so the AI service itself stays CPU-only. Flow:
upload both images with the Files API, create a prediction against the
pinned model version (waiting briefly server-side), poll until it finishes,
download the output, then delete the uploads. The whole call, uploads
included, stays within REPLICATE_TIMEOUT_SECONDS.

Configure with REPLICATE_API_TOKEN and REPLICATE_TRYON_VERSION (the exact
model version id — pinned, so results don't change under us; bump it
deliberately and route a share of traffic to compare, see
TRYON_MODEL_ROUTES). Input field names follow IDM-VTON's schema
(`human_img`, `garm_img`, `garment_des`, `category`, `crop`).
"""

import time
from dataclasses import dataclass
from io import BytesIO

import httpx
from PIL import Image

from app.core.config import settings
from app.core.logging_config import get_logger
from app.pipelines.base_pipeline import GARMENT_CATEGORIES, TryOnModel

logger = get_logger(__name__)

API = "https://api.replicate.com/v1"
TERMINAL = {"succeeded", "failed", "canceled"}
# Must stay well under the HTTP read timeout, or a request Replicate is
# holding open for us times out on our side first.
PREFER_WAIT_SECONDS = 30
HTTP_TIMEOUT = httpx.Timeout(60, connect=10)
THREE_BY_FOUR = 3 / 4


class ReplicateError(RuntimeError):
    pass


@dataclass(frozen=True)
class UploadedFile:
    id: str | None
    url: str


def _jpeg(image: Image.Image) -> bytes:
    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=92)
    return buffer.getvalue()


def _needs_crop(image: Image.Image) -> bool:
    """IDM-VTON works at 3:4; without its crop step other shapes get stretched."""
    return abs(image.width / image.height - THREE_BY_FOUR) > 0.01


class ReplicateTryOnModel(TryOnModel):
    def __init__(self, client: httpx.Client | None = None, *, poll_interval: float = 2.0):
        if settings.ENVIRONMENT == "production":
            raise ValueError("'idm-vton' is non-commercial and can't run in production.")
        if not settings.REPLICATE_API_TOKEN or not settings.REPLICATE_TRYON_VERSION:
            raise ValueError(
                "The 'idm-vton' model needs REPLICATE_API_TOKEN and REPLICATE_TRYON_VERSION."
            )
        self.version = settings.REPLICATE_TRYON_VERSION
        self.name = f"idm-vton@{self.version[:8]}"
        self.poll_interval = poll_interval
        self.client = client or httpx.Client(timeout=HTTP_TIMEOUT)
        self.headers = {"Authorization": f"Bearer {settings.REPLICATE_API_TOKEN}"}

    def generate(
        self,
        person: Image.Image,
        garment: Image.Image,
        *,
        garment_category: str | None = None,
        garment_description: str | None = None,
    ) -> Image.Image:
        deadline = time.monotonic() + settings.REPLICATE_TIMEOUT_SECONDS
        uploads: list[UploadedFile] = []
        try:
            uploads.append(self._upload(person, "person.jpg"))
            uploads.append(self._upload(garment, "garment.jpg"))
            prediction = self._post(
                "/predictions",
                json={
                    "version": self.version,
                    "input": {
                        "human_img": uploads[0].url,
                        "garm_img": uploads[1].url,
                        "garment_des": garment_description or "a garment",
                        "category": (
                            garment_category
                            if garment_category in GARMENT_CATEGORIES
                            else "upper_body"
                        ),
                        "crop": _needs_crop(person),
                    },
                },
                headers={"Prefer": f"wait={PREFER_WAIT_SECONDS}"},
            )
            prediction = self._finish(prediction, deadline)
            return self._download(prediction["output"])
        finally:
            self._delete_uploads(uploads)

    def _finish(self, prediction: dict, deadline: float) -> dict:
        """Waits for the result. Anything that stops the wait cancels the
        prediction, so an abandoned run doesn't keep billing."""
        try:
            prediction = self._wait(prediction, deadline)
        except Exception:
            self._cancel(prediction)
            raise
        if prediction["status"] != "succeeded":
            raise ReplicateError(f"prediction {prediction['status']}: {prediction.get('error')}")
        return prediction

    def _download(self, output: str | list[str]) -> Image.Image:
        url = output[0] if isinstance(output, list) else output
        response = self.client.get(url)
        response.raise_for_status()
        return Image.open(BytesIO(response.content)).convert("RGB")

    def _upload(self, image: Image.Image, filename: str) -> UploadedFile:
        response = self.client.post(
            f"{API}/files",
            headers=self.headers,
            files={"content": (filename, _jpeg(image), "image/jpeg")},
        )
        response.raise_for_status()
        body = response.json()
        return UploadedFile(id=body.get("id"), url=body["urls"]["get"])

    def _delete_uploads(self, uploads: list[UploadedFile]) -> None:
        """Shopper photos shouldn't outlive the run. Never fails the try-on."""
        for upload in uploads:
            if upload.id is None:
                continue
            try:
                response = self.client.delete(f"{API}/files/{upload.id}", headers=self.headers)
                if response.status_code not in (200, 204, 404):
                    logger.warning("Replicate kept file %s: %s", upload.id, response.status_code)
            except httpx.HTTPError as exc:
                logger.warning("Could not delete Replicate file %s: %s", upload.id, exc)

    def _cancel(self, prediction: dict) -> None:
        try:
            self.client.post(prediction["urls"]["cancel"], headers=self.headers)
        except httpx.HTTPError as exc:
            logger.warning("Could not cancel Replicate prediction: %s", exc)

    def _post(self, path: str, *, json: dict, headers: dict[str, str]) -> dict:
        response = self.client.post(f"{API}{path}", headers={**self.headers, **headers}, json=json)
        response.raise_for_status()
        return response.json()

    def _wait(self, prediction: dict, deadline: float) -> dict:
        while prediction["status"] not in TERMINAL:
            if time.monotonic() > deadline:
                raise ReplicateError("prediction timed out")
            time.sleep(self.poll_interval)
            response = self.client.get(prediction["urls"]["get"], headers=self.headers)
            response.raise_for_status()
            prediction = response.json()
        return prediction
