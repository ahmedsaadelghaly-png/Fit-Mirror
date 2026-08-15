"""
S3-compatible object storage implementation (works with AWS S3, MinIO,
DigitalOcean Spaces, Cloudflare R2, etc. via the S3 protocol).
"""

import uuid
from datetime import timedelta

import boto3
from botocore.client import Config as BotoConfig

from app.core.config import settings
from app.core.exceptions import ExternalServiceError
from app.core.logging_config import get_logger
from app.storage.base import ObjectStorage

logger = get_logger(__name__)


class S3ObjectStorage(ObjectStorage):
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
        # Presigned URLs are signed against whichever endpoint_url generated
        # them — fine for this client's own direct calls (get/head/delete,
        # always from inside the Docker network), but a URL a browser must
        # follow (the upload PUT, and the download GET fallback below) needs
        # to be signed against a host the browser can actually resolve. When
        # S3_PUBLIC_ENDPOINT_URL isn't set, this is just `self._client` again
        # (identical behavior to before this existed).
        self._presign_client = (
            boto3.client(
                "s3",
                endpoint_url=settings.S3_PUBLIC_ENDPOINT_URL,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
                region_name=settings.S3_REGION,
                use_ssl=settings.S3_USE_SSL,
                config=BotoConfig(signature_version="s3v4"),
            )
            if settings.S3_PUBLIC_ENDPOINT_URL
            else self._client
        )

    def generate_upload_url(self, object_key: str, content_type: str, expires_in: timedelta) -> str:
        try:
            return self._presign_client.generate_presigned_url(
                "put_object",
                Params={"Bucket": self._bucket, "Key": object_key, "ContentType": content_type},
                ExpiresIn=int(expires_in.total_seconds()),
            )
        except Exception as exc:  # noqa: BLE001 - translate any SDK error uniformly
            logger.exception("Failed to generate upload URL for key=%s", object_key)
            raise ExternalServiceError("Could not generate upload URL.") from exc

    def generate_download_url(self, object_key: str, expires_in: timedelta) -> str:
        if settings.S3_PUBLIC_BASE_URL:
            return f"{settings.S3_PUBLIC_BASE_URL.rstrip('/')}/{object_key}"
        try:
            return self._presign_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": object_key},
                ExpiresIn=int(expires_in.total_seconds()),
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Failed to generate download URL for key=%s", object_key)
            raise ExternalServiceError("Could not generate download URL.") from exc

    def object_exists(self, object_key: str) -> bool:
        try:
            self._client.head_object(Bucket=self._bucket, Key=object_key)
            return True
        except self._client.exceptions.ClientError:
            return False

    def delete_object(self, object_key: str) -> None:
        try:
            self._client.delete_object(Bucket=self._bucket, Key=object_key)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Failed to delete object key=%s", object_key)
            raise ExternalServiceError("Could not delete object.") from exc

    def build_object_key(self, *, namespace: str, owner_id: str, filename: str) -> str:
        unique_suffix = uuid.uuid4().hex[:12]
        safe_filename = filename.replace(" ", "_")
        return f"{namespace}/{owner_id}/{unique_suffix}_{safe_filename}"
