from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Experiment(Base):
    __tablename__ = "experiments"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    variations: Mapped[list["Variation"]] = relationship(
        back_populates="experiment", cascade="all, delete-orphan"
    )
    responses: Mapped[list["Response"]] = relationship(
        back_populates="experiment", cascade="all, delete-orphan"
    )


class Variation(Base):
    __tablename__ = "variations"

    id: Mapped[int] = mapped_column(primary_key=True)
    experiment_id: Mapped[int] = mapped_column(ForeignKey("experiments.id"), index=True)
    label: Mapped[str] = mapped_column(String(1))
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    accent_color: Mapped[str] = mapped_column(String(20))

    experiment: Mapped[Experiment] = relationship(back_populates="variations")


class Response(Base):
    __tablename__ = "responses"

    id: Mapped[int] = mapped_column(primary_key=True)
    experiment_id: Mapped[int] = mapped_column(ForeignKey("experiments.id"), index=True)
    selected_variation_id: Mapped[int] = mapped_column(ForeignKey("variations.id"))
    anonymous_id: Mapped[str] = mapped_column(String(80), index=True)
    decision_latency_ms: Mapped[int] = mapped_column(Integer)
    confidence_score: Mapped[int] = mapped_column(Integer)
    qualitative_feedback: Mapped[str] = mapped_column(Text, default="")
    device_type: Mapped[str] = mapped_column(String(20))
    experience_level: Mapped[str] = mapped_column(String(30))
    age_range: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    experiment: Mapped[Experiment] = relationship(back_populates="responses")
    selected_variation: Mapped[Variation] = relationship()

