from pydantic import BaseModel


class TryOnGenerateRequest(BaseModel):
    job_id: str
    user_image_key: str
    garment_image_key: str


class TryOnGenerateResponse(BaseModel):
    job_id: str
    result_image_key: str
    model_name: str
