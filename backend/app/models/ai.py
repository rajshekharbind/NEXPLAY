from sqlalchemy import String, Boolean, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class Recommendation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "recommendations"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content_id: Mapped[str] = mapped_column(String(36), ForeignKey("content.id", ondelete="CASCADE"), nullable=False)
    score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    reasoning: Mapped[str] = mapped_column(Text, nullable=True)
    algorithm_source: Mapped[str] = mapped_column(String(50), default="GENRE_COLLABORATIVE", nullable=False)

    user: Mapped["User"] = relationship("User")
    content: Mapped["Content"] = relationship("Content")

class Notification(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "notifications"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(String(50), default="INFO", nullable=False) # RELEASE, REMINDER, SYSTEM
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    action_url: Mapped[str] = mapped_column(String(500), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="notifications")
