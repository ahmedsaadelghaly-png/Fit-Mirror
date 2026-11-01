from pydantic import BaseModel


class TryOnGenerateRequest(BaseModel):
    job_id: str
    user_image_key: str
    garment_image_key: str
    # Optional hints (sent for catalog try-ons): "upper_body" | "lower_body"
    # | "dresses", and a short description such as the product title.
    garment_category: str | None = None
    garment_description: str | None = None


class TryOnGenerateResponse(BaseModel):
    job_id: str
    result_image_key: str
    model_name: str
    # The routed model that failed, when a fallback produced the result.
    fallback_from: str | None = None
