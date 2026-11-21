import enum
from sqlalchemy import String, Boolean, Enum, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class WatchlistStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    WATCHING = "WATCHING"
    COMPLETED = "COMPLETED"
    DROPPED = "DROPPED"

class Watchlist(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "watchlists"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), default="My Watchlist", nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="watchlists")
    items: Mapped[list["WatchlistItem"]] = relationship("WatchlistItem", back_populates="watchlist", cascade="all, delete-orphan")

class WatchlistItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "watchlist_items"

    watchlist_id: Mapped[str] = mapped_column(String(36), ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=False)
    content_id: Mapped[str] = mapped_column(String(36), ForeignKey("content.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[WatchlistStatus] = mapped_column(Enum(WatchlistStatus), default=WatchlistStatus.PLANNED, nullable=False)
    personal_rating: Mapped[float] = mapped_column(Float, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    watchlist: Mapped["Watchlist"] = relationship("Watchlist", back_populates="items")
    content: Mapped["Content"] = relationship("Content", back_populates="watchlist_entries")

class UserPreference(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "user_preferences"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    favorite_genres: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    preferred_languages: Mapped[list] = mapped_column(JSON, default=lambda: ["Hindi", "English"], nullable=False)
    connected_platforms_filter: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    mood_tags: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="preferences")

class UserActivity(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "user_activity"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    activity_type: Mapped[str] = mapped_column(String(80), nullable=False) # SEARCH, REDIRECT, WATCHLIST_ADD, AI_QUERY
    content_id: Mapped[str] = mapped_column(String(36), nullable=True)
    platform_id: Mapped[str] = mapped_column(String(36), nullable=True)
    metadata_payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="activities")
