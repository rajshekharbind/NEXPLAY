import enum
from sqlalchemy import String, Boolean, Enum, ForeignKey, Text, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class PlatformPricingType(str, enum.Enum):
    FREE = "FREE"
    PAID = "PAID"
    FREEMIUM = "FREEMIUM"
    SUBSCRIPTION = "SUBSCRIPTION"

class PlatformIntegrationType(str, enum.Enum):
    OFFICIAL_LINK = "OFFICIAL_LINK"
    OFFICIAL_API = "OFFICIAL_API"
    OAUTH = "OAUTH"
    PARTNER = "PARTNER"
    FREE_CONTENT = "FREE_CONTENT"

class PlatformCategory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "platform_categories"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    icon: Mapped[str] = mapped_column(String(50), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    platforms: Mapped[list["Platform"]] = relationship("Platform", back_populates="category", cascade="all, delete-orphan")

class Platform(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "platforms"

    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("platform_categories.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    logo_url: Mapped[str] = mapped_column(String(500), nullable=True)
    banner_url: Mapped[str] = mapped_column(String(500), nullable=True)
    official_url: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    pricing_type: Mapped[PlatformPricingType] = mapped_column(Enum(PlatformPricingType), default=PlatformPricingType.SUBSCRIPTION, nullable=False)
    integration_type: Mapped[PlatformIntegrationType] = mapped_column(Enum(PlatformIntegrationType), default=PlatformIntegrationType.OFFICIAL_LINK, nullable=False)
    supported_features: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    region_availability: Mapped[list] = mapped_column(JSON, default=lambda: ["IN", "GLOBAL"], nullable=False)
    display_priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    category: Mapped["PlatformCategory"] = relationship("PlatformCategory", back_populates="platforms")
    integrations: Mapped[list["PlatformIntegration"]] = relationship("PlatformIntegration", back_populates="platform", cascade="all, delete-orphan")
    content_links: Mapped[list["ContentPlatform"]] = relationship("ContentPlatform", back_populates="platform", cascade="all, delete-orphan")
    connected_users: Mapped[list["UserConnectedAccount"]] = relationship("UserConnectedAccount", back_populates="platform", cascade="all, delete-orphan")

class PlatformIntegration(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "platform_integrations"

    platform_id: Mapped[str] = mapped_column(String(36), ForeignKey("platforms.id", ondelete="CASCADE"), nullable=False)
    api_endpoint: Mapped[str] = mapped_column(String(500), nullable=True)
    auth_type: Mapped[str] = mapped_column(String(50), default="NONE", nullable=False)
    status_health: Mapped[str] = mapped_column(String(50), default="OPERATIONAL", nullable=False)
    last_checked_at: Mapped[str] = mapped_column(String(50), nullable=True)

    platform: Mapped["Platform"] = relationship("Platform", back_populates="integrations")
