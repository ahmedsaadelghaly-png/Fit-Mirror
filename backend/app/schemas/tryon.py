import uuid

from pydantic import BaseModel, ConfigDict

from app.models.tryon_job import TryOnJobStatus


class TryOnJobCreate(BaseModel):
    """
    Request to start a virtual try-on. Image keys must already exist in
    object storage (uploaded via the storage pre-signed URL flow) OR
    product_variant_id can be supplied to use a catalog garment image.
    """

    user_image_key: str
    garment_image_key: str | None = None
    product_variant_id: uuid.UUID | None = None


class TryOnJobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: TryOnJobStatus
    user_image_key: str
    garment_image_key: str
    result_image_key: str | None
    ai_model_name: str | None
    error_message: str | None


class TryOnJobAccepted(BaseModel):
    job_id: uuid.UUID
    status: TryOnJobStatus
