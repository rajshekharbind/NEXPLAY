from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.watchlist import WatchlistStatus
from app.schemas.content import ContentRead

class WatchlistItemBase(BaseModel):
    content_id: str
    status: WatchlistStatus = WatchlistStatus.PLANNED
    personal_rating: Optional[float] = Field(None, ge=0.0, le=10.0, description="Personal rating from 0.0 to 10.0")
    notes: Optional[str] = Field(None, max_length=1000, description="Personal notes or review")

class WatchlistItemCreate(WatchlistItemBase):
    pass

class WatchlistItemUpdate(BaseModel):
    status: Optional[WatchlistStatus] = None
    personal_rating: Optional[float] = Field(None, ge=0.0, le=10.0)
    notes: Optional[str] = Field(None, max_length=1000)

class WatchlistItemRead(BaseModel):
    id: str
    watchlist_id: str
    content_id: str
    status: WatchlistStatus
    personal_rating: Optional[float] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    content: Optional[ContentRead] = None

    model_config = ConfigDict(from_attributes=True)

class WatchlistBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    is_public: bool = False

class WatchlistCreate(WatchlistBase):
    pass

class WatchlistUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_public: Optional[bool] = None

class WatchlistRead(BaseModel):
    id: str
    user_id: str
    name: str
    is_default: bool
    is_public: bool
    items_count: int = 0
    items: List[WatchlistItemRead] = []
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class WatchlistToggleRequest(BaseModel):
    content_id: str
    status: Optional[WatchlistStatus] = WatchlistStatus.PLANNED

class WatchlistToggleResponse(BaseModel):
    action: str  # "added" or "removed"
    content_id: str
    watchlist_id: str
    item: Optional[WatchlistItemRead] = None

class WatchlistCheckResponse(BaseModel):
    in_watchlist: bool
    item_id: Optional[str] = None
    watchlist_id: Optional[str] = None
    status: Optional[WatchlistStatus] = None
    personal_rating: Optional[float] = None
