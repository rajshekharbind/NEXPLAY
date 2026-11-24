from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel
from datetime import datetime

T = TypeVar("T")

class ResponseEnvelope(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Success"
    data: Optional[T] = None
    timestamp: datetime = datetime.utcnow()

class PaginatedData(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    pages: int

class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    environment: str
    database_status: str
    platforms_loaded: int
    timestamp: datetime
