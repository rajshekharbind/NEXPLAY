from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.models.content import ContentType, AvailabilityType

class GenreRead(BaseModel):
    id: str
    name: str
    slug: str
    category_type: str

    model_config = ConfigDict(from_attributes=True)

class ContentPlatformRead(BaseModel):
    platform_name: str
    platform_slug: str
    platform_logo: Optional[str] = None
    availability_type: AvailabilityType
    pricing_details: str
    stream_url: str

class ContentRead(BaseModel):
    id: str
    title: str
    slug: str
    content_type: ContentType
    description: Optional[str] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    release_date: Optional[str] = None
    duration_minutes: int
    rating: float
    maturity_rating: str
    original_language: str
    view_count: int
    is_featured: bool
    is_free: bool
    genres: List[str] = []
    streaming_options: List[ContentPlatformRead] = []

    model_config = ConfigDict(from_attributes=True)

class ContentSearchResults(BaseModel):
    total: int
    items: List[ContentRead]
    query: Optional[str] = None
    content_type: Optional[str] = None
    genre: Optional[str] = None
    platform: Optional[str] = None
    is_free_only: bool = False

class ContentCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    content_type: ContentType = ContentType.MOVIE
    description: Optional[str] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    release_date: Optional[str] = None
    duration_minutes: int = 0
    rating: float = 0.0
    maturity_rating: str = "U/A"
    original_language: str = "en"
    is_featured: bool = False
    is_free: bool = False
    genre_slugs: List[str] = Field(default_factory=list)

class ContentPlatformLinkCreate(BaseModel):
    platform_slug: str
    availability_type: AvailabilityType = AvailabilityType.SUBSCRIPTION
    pricing_details: str = "Included with Subscription"
    stream_url: str
    region: str = "IN"
