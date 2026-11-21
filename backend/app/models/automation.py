from sqlalchemy import String, Text, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class AutomationJob(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "automation_jobs"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    job_type: Mapped[str] = mapped_column(String(80), nullable=False) # PLAYWRIGHT_CHECK, CATALOG_SYNC, DIGEST_NOTIFICATION
    cron_schedule: Mapped[str] = mapped_column(String(60), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    config_payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

class AutomationRun(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "automation_runs"

    job_id: Mapped[str] = mapped_column(String(36), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="SUCCESS", nullable=False) # SUCCESS, FAILED, RUNNING
    duration_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=True)

class AuditLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "audit_logs"

    user_id: Mapped[str] = mapped_column(String(36), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[str] = mapped_column(String(50), nullable=True)
    details: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
