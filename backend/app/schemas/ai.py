from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.content import ContentPlatformRead

class AIMoodItem(BaseModel):
    id: str
    name: str
    icon: str
    description: str
    gradient: str
    sample_prompt: str
    suggested_genres: List[str] = []

class AIRecommendRequest(BaseModel):
    query: Optional[str] = None
    mood: Optional[str] = None
    content_type: Optional[str] = None
    platform_slug: Optional[str] = None
    max_runtime: Optional[int] = None
    min_rating: Optional[float] = None
    is_free_only: bool = False
    limit: int = Field(default=6, ge=1, le=20)

class AIRecommendationItem(BaseModel):
    id: str
    title: str
    slug: str
    content_type: str
    description: Optional[str] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    rating: float
    duration_minutes: int
    maturity_rating: str
    original_language: str
    genres: List[str] = []
    match_score: float
    reasoning: str
    algorithm_source: str
    streaming_options: List[ContentPlatformRead] = []

    model_config = ConfigDict(from_attributes=True)

class AIRecommendResponse(BaseModel):
    success: bool = True
    query: Optional[str] = None
    detected_intent: str = "RECOMMEND"
    detected_mood: Optional[str] = None
    detected_filters: Dict[str, Any] = {}
    recommendations: List[AIRecommendationItem] = []
    total_results: int = 0
    credits_used: int = 1
    credits_remaining: Optional[int] = None

class AIChatMessage(BaseModel):
    role: str # "user", "assistant", "system"
    content: str
    timestamp: Optional[str] = None

class AIChatRequest(BaseModel):
    messages: List[AIChatMessage]
    mood: Optional[str] = None
    preferred_platforms: Optional[List[str]] = None

class AIChatResponse(BaseModel):
    role: str = "assistant"
    content: str
    detected_intent: str = "RECOMMEND"
    recommendations: List[AIRecommendationItem] = []
    suggested_followups: List[str] = []
    credits_remaining: Optional[int] = None

class RecommendationHistoryItem(BaseModel):
    id: str
    content_id: str
    content_title: str
    content_type: str
    poster_url: Optional[str] = None
    score: float
    reasoning: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)
