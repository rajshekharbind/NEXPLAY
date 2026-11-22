from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.models.platform import PlatformPricingType, PlatformIntegrationType

class PlatformCategoryBase(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: int = 0

class PlatformCategoryCreate(PlatformCategoryBase):
    pass

class PlatformCategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: Optional[int] = None

class PlatformCategoryRead(PlatformCategoryBase):
    id: str
    slug: str

    model_config = ConfigDict(from_attributes=True)

class PlatformBase(BaseModel):
    name: str
    category_id: str
    official_url: str
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    description: Optional[str] = None
    pricing_type: PlatformPricingType = PlatformPricingType.SUBSCRIPTION
    integration_type: PlatformIntegrationType = PlatformIntegrationType.OFFICIAL_LINK
    supported_features: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True
    region_availability: List[str] = Field(default_factory=lambda: ["IN", "GLOBAL"])
    display_priority: int = 50

class PlatformCreate(PlatformBase):
    pass

class PlatformUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    official_url: Optional[str] = None
    description: Optional[str] = None
    pricing_type: Optional[PlatformPricingType] = None
    integration_type: Optional[PlatformIntegrationType] = None
    supported_features: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    region_availability: Optional[List[str]] = None
    display_priority: Optional[int] = None

class PlatformRead(BaseModel):
    id: str
    category_id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    official_url: str
    description: Optional[str] = None
    pricing_type: PlatformPricingType
    integration_type: PlatformIntegrationType
    supported_features: Dict[str, Any]
    is_active: bool
    region_availability: List[str]
    display_priority: int
    category_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class PlatformHealthCheckResult(BaseModel):
    platform_id: str
    platform_name: str
    official_url: str
    status: str # "OPERATIONAL", "DEGRADED", "OFFLINE"
    status_code: Optional[int] = None
    response_time_ms: Optional[float] = None
    last_checked_at: str

class AdminStatsRead(BaseModel):
    total_platforms: int
    active_platforms: int
    total_categories: int
    platforms_by_category: Dict[str, int]
    platforms_by_pricing: Dict[str, int]
    total_users: int
    premium_users: int

class PlatformFilterParams(BaseModel):
    category_slug: Optional[str] = None
    pricing_type: Optional[PlatformPricingType] = None
    integration_type: Optional[PlatformIntegrationType] = None
    search: Optional[str] = None
