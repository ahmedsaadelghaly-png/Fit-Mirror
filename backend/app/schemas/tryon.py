import uuid
from datetime import datetime

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
    # Who the try-on is for, when a family profile was chosen.
    body_profile_id: uuid.UUID | None = None


class TryOnJobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: TryOnJobStatus
    user_image_key: str
    garment_image_key: str
    result_image_key: str | None
    ai_model_name: str | None
    error_message: str | None
    created_at: datetime
    product_variant_id: uuid.UUID | None
    # Set for catalog try-ons: what was tried on, in which size.
    product_title: str | None
    size_label: str | None


class TryOnJobAccepted(BaseModel):
    job_id: uuid.UUID
    status: TryOnJobStatus
