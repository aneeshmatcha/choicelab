from datetime import datetime
from typing import Optional

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
    test_type: str
    template_key: str
    task_prompt: str
    created_at: datetime
    variations: list[VariationOut]
    response_count: int = 0


class VariationInput(BaseModel):
    label: str = Field(pattern="^[AB]$")
    title: str = Field(min_length=2, max_length=120)
    description: str = Field(min_length=4, max_length=1000)
    accent_color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")


class ExperimentCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=8, max_length=2000)
    status: str = Field(default="draft", pattern="^(draft|active|paused|completed)$")
    test_type: str = Field(default="preference", pattern="^(preference|first-click|task-completion)$")
    template_key: str = Field(default="checkout", pattern="^(travel|checkout|pricing|onboarding)$")
    task_prompt: str = Field(min_length=5, max_length=1000)
    variations: list[VariationInput] = Field(min_length=2, max_length=2)


class ExperimentUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=200)
    description: Optional[str] = Field(default=None, min_length=8, max_length=2000)
    status: Optional[str] = Field(default=None, pattern="^(draft|active|paused|completed)$")
    task_prompt: Optional[str] = Field(default=None, min_length=5, max_length=1000)


class ResponseCreate(BaseModel):
    selected_variation_id: int
    anonymous_id: str = Field(min_length=3, max_length=80)
    decision_latency_ms: int = Field(ge=100, le=600_000)
    confidence_score: int = Field(ge=1, le=5)
    task_completed: bool = True
    ease_score: int = Field(default=4, ge=1, le=5)
    interaction_count: int = Field(default=1, ge=0, le=500)
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
    task_success_rate: float
    average_ease_score: float


class SegmentMetric(BaseModel):
    segment: str
    responses: int
    variation_b_percentage: float
    average_latency_ms: float


class RecentResponse(BaseModel):
    id: int
    selected_label: str
    confidence_score: int
    task_completed: bool
    ease_score: int
    interaction_count: int
    decision_latency_ms: int
    device_type: str
    feedback: str
    created_at: datetime


class AnalyticsOut(BaseModel):
    experiment_id: int
    total_responses: int
    average_latency_ms: float
    average_confidence: float
    task_success_rate: float
    average_ease_score: float
    average_interactions: float
    choices: list[ChoiceMetric]
    p_value: float
    confidence_interval: list[float]
    is_significant: bool
    effect_summary: str
    device_segments: list[SegmentMetric]
    recent_responses: list[RecentResponse]


class ProgramExperimentMetric(BaseModel):
    experiment_id: int
    title: str
    template_key: str
    status: str
    total_responses: int
    winning_label: str
    winning_percentage: float
    task_success_rate: float
    average_ease_score: float
    average_latency_ms: float
    is_significant: bool


class ProgramSummaryOut(BaseModel):
    total_experiments: int
    total_responses: int
    overall_success_rate: float
    average_ease_score: float
    evidence_ready: int
    experiments: list[ProgramExperimentMetric]
