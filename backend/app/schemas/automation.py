from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class AutomationJobCreate(BaseModel):
    name: str
    job_type: str = Field(..., description="PLAYWRIGHT_CHECK, CATALOG_SYNC, RENEWAL_REMINDER, HEALTH_CHECK_ALL_PLATFORMS")
    cron_schedule: Optional[str] = "0 */6 * * *"
    is_active: bool = True
    config_payload: Dict[str, Any] = Field(default_factory=dict)

class AutomationJobRead(BaseModel):
    id: str
    name: str
    job_type: str
    cron_schedule: Optional[str] = None
    is_active: bool
    config_payload: Dict[str, Any] = Field(default_factory=dict)
    last_run_at: Optional[str] = None
    last_status: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)

class AutomationRunRead(BaseModel):
    id: str
    job_id: str
    job_name: Optional[str] = None
    status: str # SUCCESS, FAILED, RUNNING
    duration_ms: int
    details: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)

class PlatformHealthCheckItem(BaseModel):
    platform_id: str
    platform_name: str
    platform_slug: str
    official_url: str
    status_code: int
    is_healthy: bool
    latency_ms: int
    last_checked: str

class DeepLinkHealthCheckItem(BaseModel):
    content_title: str
    platform_name: str
    stream_url: str
    status_code: int
    is_valid: bool
    latency_ms: int

class EcosystemHealthSummary(BaseModel):
    total_platforms: int
    healthy_platforms: int
    degraded_platforms: int
    down_platforms: int
    health_percentage: float
    average_latency_ms: float
    deep_links_checked: int
    last_scan_timestamp: str

class NotificationRead(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str
    is_read: bool
    action_url: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)
