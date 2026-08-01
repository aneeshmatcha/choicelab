from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VariationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str
    title: str
    description: str
    accent_color: str


class ExperimentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    description: str
    status: str
    created_at: datetime
    variations: list[VariationOut]
    response_count: int = 0


class ResponseCreate(BaseModel):
    selected_variation_id: int
    anonymous_id: str = Field(min_length=3, max_length=80)
    decision_latency_ms: int = Field(ge=100, le=600_000)
    confidence_score: int = Field(ge=1, le=5)
    qualitative_feedback: str = Field(default="", max_length=2000)
    device_type: str = Field(pattern="^(desktop|mobile|tablet)$")
    experience_level: str = Field(pattern="^(new|intermediate|expert)$")
    age_range: str = Field(pattern=r"^(18-24|25-34|35-44|45\+|prefer-not-to-say)$")


class ResponseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    decision_latency_ms: int
    confidence_score: int
    created_at: datetime


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=120)


class AuthOut(BaseModel):
    authenticated: bool
    username: str


class ChoiceMetric(BaseModel):
    label: str
    count: int
    percentage: float
    average_latency_ms: float


class SegmentMetric(BaseModel):
    segment: str
    responses: int
    variation_b_percentage: float
    average_latency_ms: float


class RecentResponse(BaseModel):
    id: int
    selected_label: str
    confidence_score: int
    decision_latency_ms: int
    device_type: str
    feedback: str
    created_at: datetime


class AnalyticsOut(BaseModel):
    experiment_id: int
    total_responses: int
    average_latency_ms: float
    average_confidence: float
    choices: list[ChoiceMetric]
    p_value: float
    confidence_interval: list[float]
    is_significant: bool
    effect_summary: str
    device_segments: list[SegmentMetric]
    recent_responses: list[RecentResponse]
