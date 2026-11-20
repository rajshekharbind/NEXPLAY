import enum
from sqlalchemy import String, Boolean, Enum, ForeignKey, Text, Integer, Float, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class ContentType(str, enum.Enum):
    MOVIE = "MOVIE"
    SERIES = "SERIES"
    SONG = "SONG"
    ALBUM = "ALBUM"
    VIDEO = "VIDEO"
    ANIME = "ANIME"
    PODCAST = "PODCAST"
    AUDIOBOOK = "AUDIOBOOK"

class AvailabilityType(str, enum.Enum):
    SUBSCRIPTION = "SUBSCRIPTION"
    FREE = "FREE"
    RENT = "RENT"
    BUY = "BUY"
    MIXED = "MIXED"

class Genre(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "genres"

    name: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    category_type: Mapped[str] = mapped_column(String(50), default="ALL", nullable=False)

    content_items: Mapped[list["ContentGenre"]] = relationship("ContentGenre", back_populates="genre", cascade="all, delete-orphan")

class ContentGenre(Base):
    __tablename__ = "content_genres"

    content_id: Mapped[str] = mapped_column(String(36), ForeignKey("content.id", ondelete="CASCADE"), primary_key=True)
    genre_id: Mapped[str] = mapped_column(String(36), ForeignKey("genres.id", ondelete="CASCADE"), primary_key=True)

    content: Mapped["Content"] = relationship("Content", back_populates="genres")
    genre: Mapped["Genre"] = relationship("Genre", back_populates="content_items")

class Content(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "content"

    title: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    content_type: Mapped[ContentType] = mapped_column(Enum(ContentType), default=ContentType.MOVIE, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    poster_url: Mapped[str] = mapped_column(String(500), nullable=True)
    backdrop_url: Mapped[str] = mapped_column(String(500), nullable=True)
    release_date: Mapped[str] = mapped_column(String(30), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    maturity_rating: Mapped[str] = mapped_column(String(20), default="U/A", nullable=False)
    original_language: Mapped[str] = mapped_column(String(20), default="en", nullable=False)
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_free: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    genres: Mapped[list["ContentGenre"]] = relationship("ContentGenre", back_populates="content", cascade="all, delete-orphan")
    platforms: Mapped[list["ContentPlatform"]] = relationship("ContentPlatform", back_populates="content", cascade="all, delete-orphan")
    watchlist_entries: Mapped[list["WatchlistItem"]] = relationship("WatchlistItem", back_populates="content", cascade="all, delete-orphan")

class ContentPlatform(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "content_platforms"

    content_id: Mapped[str] = mapped_column(String(36), ForeignKey("content.id", ondelete="CASCADE"), nullable=False)
    platform_id: Mapped[str] = mapped_column(String(36), ForeignKey("platforms.id", ondelete="CASCADE"), nullable=False)
    availability_type: Mapped[AvailabilityType] = mapped_column(Enum(AvailabilityType), default=AvailabilityType.SUBSCRIPTION, nullable=False)
    pricing_details: Mapped[str] = mapped_column(String(100), default="Included in Plan", nullable=False)
    stream_url: Mapped[str] = mapped_column(String(500), nullable=False)
    region: Mapped[str] = mapped_column(String(10), default="IN", nullable=False)

    content: Mapped["Content"] = relationship("Content", back_populates="platforms")
    platform: Mapped["Platform"] = relationship("Platform", back_populates="content_links")
