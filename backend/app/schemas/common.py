from pydantic import BaseModel


class ErrorResponse(BaseModel):
    error_code: str
    message: str


class Pagination(BaseModel):
    page: int = 1
    page_size: int = 20
