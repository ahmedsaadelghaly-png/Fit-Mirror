import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SavedLookCreate(BaseModel):
    tryon_job_id: uuid.UUID
    label: str | None = Field(default=None, max_length=255)


class SavedLookRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tryon_job_id: uuid.UUID
    result_image_key: str | None
    garment_image_key: str
    label: str | None
    created_at: datetime
