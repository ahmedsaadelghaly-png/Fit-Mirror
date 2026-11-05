"""
Diffusion virtual try-on hosted on Replicate (IDM-VTON by default).

Runs on Replicate's GPUs, so the AI service itself stays CPU-only. Flow:
upload both images with the Files API, create a prediction against the
pinned model version (waiting up to 60s server-side), poll until it
finishes, then download the output image.

Configure with REPLICATE_API_TOKEN and REPLICATE_TRYON_VERSION (the exact
model version id — pinned, so results don't change under us; bump it
deliberately and route a share of traffic to compare, see
TRYON_MODEL_ROUTES). Input field names follow IDM-VTON's schema
(`human_img`, `garm_img`, `garment_des`, `category`).
"""

import time
from io import BytesIO

import httpx
from PIL import Image

from app.core.config import settings
from app.pipelines.base_pipeline import GARMENT_CATEGORIES, TryOnModel

API = "https://api.replicate.com/v1"
TERMINAL = {"succeeded", "failed", "canceled"}


class ReplicateError(RuntimeError):
    pass


def _jpeg(image: Image.Image) -> bytes:
    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=92)
    return buffer.getvalue()


class ReplicateTryOnModel(TryOnModel):
    def __init__(self, client: httpx.Client | None = None, *, poll_interval: float = 2.0):
        if not settings.REPLICATE_API_TOKEN or not settings.REPLICATE_TRYON_VERSION:
            raise ValueError(
                "The 'idm-vton' model needs REPLICATE_API_TOKEN and REPLICATE_TRYON_VERSION."
            )
        self.version = settings.REPLICATE_TRYON_VERSION
        self.name = f"idm-vton@{self.version[:8]}"
        self.poll_interval = poll_interval
        self.client = client or httpx.Client(timeout=60)
        self.headers = {"Authorization": f"Bearer {settings.REPLICATE_API_TOKEN}"}

    def generate(
        self,
        person: Image.Image,
        garment: Image.Image,
        *,
        garment_category: str | None = None,
        garment_description: str | None = None,
    ) -> Image.Image:
        prediction = self._post(
            "/predictions",
            json={
                "version": self.version,
                "input": {
                    "human_img": self._upload(person, "person.jpg"),
                    "garm_img": self._upload(garment, "garment.jpg"),
                    "garment_des": garment_description or "a garment",
                    "category": (
                        garment_category if garment_category in GARMENT_CATEGORIES else "upper_body"
                    ),
                    "crop": False,
                },
            },
            headers={"Prefer": "wait=60"},
        )
        prediction = self._wait(prediction)
        if prediction["status"] != "succeeded":
            raise ReplicateError(f"prediction {prediction['status']}: {prediction.get('error')}")

        output = prediction["output"]
        url = output[0] if isinstance(output, list) else output
        response = self.client.get(url)
        response.raise_for_status()
        return Image.open(BytesIO(response.content)).convert("RGB")

    def _upload(self, image: Image.Image, filename: str) -> str:
        response = self.client.post(
            f"{API}/files",
            headers=self.headers,
            files={"content": (filename, _jpeg(image), "image/jpeg")},
        )
        response.raise_for_status()
        return response.json()["urls"]["get"]

    def _post(self, path: str, *, json: dict, headers: dict[str, str]) -> dict:
        response = self.client.post(f"{API}{path}", headers={**self.headers, **headers}, json=json)
        response.raise_for_status()
        return response.json()

    def _wait(self, prediction: dict) -> dict:
        deadline = time.monotonic() + settings.REPLICATE_TIMEOUT_SECONDS
        while prediction["status"] not in TERMINAL:
            if time.monotonic() > deadline:
                self.client.post(prediction["urls"]["cancel"], headers=self.headers)
                raise ReplicateError("prediction timed out")
            time.sleep(self.poll_interval)
            response = self.client.get(prediction["urls"]["get"], headers=self.headers)
            response.raise_for_status()
            prediction = response.json()
        return prediction
