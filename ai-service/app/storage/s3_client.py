"""
Minimal S3-compatible object storage client for the AI service.

Deliberately independent from the backend's storage abstraction (separate
deployable service) but keyed against the same bucket, so object keys
written here are directly readable by the backend and vice versa.
"""

import io
import uuid

import boto3
from botocore.client import Config as BotoConfig

from app.core.config import settings


class ObjectStorageClient:
    def __init__(self) -> None:
        self._bucket = settings.S3_BUCKET_NAME
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION,
            use_ssl=settings.S3_USE_SSL,
            config=BotoConfig(signature_version="s3v4"),
        )

    def read_object(self, object_key: str) -> bytes:
        response = self._client.get_object(Bucket=self._bucket, Key=object_key)
        return response["Body"].read()

    def write_object(self, data: bytes, *, namespace: str, content_type: str = "image/png") -> str:
        object_key = f"{namespace}/{uuid.uuid4().hex}.png"
        self._client.put_object(
            Bucket=self._bucket, Key=object_key, Body=io.BytesIO(data), ContentType=content_type
        )
        return object_key
