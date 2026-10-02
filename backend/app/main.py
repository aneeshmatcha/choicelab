import csv
import io
import os
import secrets
import re
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request, Response as FastAPIResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import inspect, select
from sqlalchemy.orm import Session, selectinload

from .analytics import choice_metrics, device_metrics, significance
from .database import Base, SessionLocal, engine, get_db
from .models import Experiment, Response, Variation
from .schemas import (
    AnalyticsOut,
    AuthOut,
    ExperimentCreate,
    ExperimentOut,
    ExperimentUpdate,
    LoginRequest,
    ProgramExperimentMetric,
    ProgramSummaryOut,
    RecentResponse,
    ResponseCreate,
    ResponseOut,
)
from .seed import seed_database


ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
ADMIN_COOKIE = "choicelab_admin_session"
ACTIVE_ADMIN_SESSIONS: set[str] = set()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_experiment_columns()
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(
    title="ChoiceLab API",
    description="End-to-end product research, task outcomes, and interface comparison analytics.",
    version="2.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def experiment_query():
    return select(Experiment).options(selectinload(Experiment.variations))


def ensure_experiment_columns() -> None:
    """Keep existing portfolio databases usable without requiring Alembic."""
    existing = {column["name"] for column in inspect(engine).get_columns("experiments")}
    additions = {
        "test_type": "VARCHAR(40) NOT NULL DEFAULT 'preference'",
        "template_key": "VARCHAR(40) NOT NULL DEFAULT 'travel'",
        "task_prompt": "TEXT NOT NULL DEFAULT 'Explore both concepts, then choose the experience you prefer.'",
    }
    with engine.begin() as connection:
        for name, definition in additions.items():
            if name not in existing:
                connection.exec_driver_sql(f"ALTER TABLE experiments ADD COLUMN {name} {definition}")

    response_existing = {column["name"] for column in inspect(engine).get_columns("responses")}
    response_additions = {
        "task_completed": "BOOLEAN NOT NULL DEFAULT TRUE",
        "ease_score": "INTEGER NOT NULL DEFAULT 4",
        "interaction_count": "INTEGER NOT NULL DEFAULT 1",
    }
    with engine.begin() as connection:
        for name, definition in response_additions.items():
            if name not in response_existing:
                connection.exec_driver_sql(f"ALTER TABLE responses ADD COLUMN {name} {definition}")


def unique_slug(db: Session, title: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:80] or "experiment"
    candidate = base
    suffix = 2
    while db.scalar(select(Experiment.id).where(Experiment.slug == candidate)):
        candidate = f"{base}-{suffix}"
        suffix += 1
    return candidate


def experiment_output(experiment: Experiment) -> ExperimentOut:
    return ExperimentOut.model_validate(experiment).model_copy(
        update={"response_count": len(experiment.responses)}
    )


def require_admin(request: Request) -> str:
    token = request.cookies.get(ADMIN_COOKIE)
    if not token or token not in ACTIVE_ADMIN_SESSIONS:
        raise HTTPException(status_code=401, detail="Admin login required")
    return token


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/api/auth/login", response_model=AuthOut)
def login(payload: LoginRequest, response: FastAPIResponse):
    username_matches = secrets.compare_digest(payload.username, ADMIN_USERNAME)
    password_matches = secrets.compare_digest(payload.password, ADMIN_PASSWORD)
    if not username_matches or not password_matches:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = secrets.token_urlsafe(32)
    ACTIVE_ADMIN_SESSIONS.add(token)
    response.set_cookie(
        key=ADMIN_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=8 * 60 * 60,
    )
    return AuthOut(authenticated=True, username=ADMIN_USERNAME)


@app.post("/api/auth/logout", response_model=AuthOut)
def logout(response: FastAPIResponse, request: Request):
    token = request.cookies.get(ADMIN_COOKIE)
    if token:
        ACTIVE_ADMIN_SESSIONS.discard(token)
    response.delete_cookie(ADMIN_COOKIE)
    return AuthOut(authenticated=False, username=ADMIN_USERNAME)


@app.get("/api/auth/session", response_model=AuthOut)
def admin_session(_: str = Depends(require_admin)):
    return AuthOut(authenticated=True, username=ADMIN_USERNAME)


@app.get("/api/experiments", response_model=list[ExperimentOut])
def list_experiments(db: Session = Depends(get_db)):
    experiments = db.scalars(
        experiment_query().where(Experiment.status == "active").order_by(Experiment.id)
    ).all()
    return [experiment_output(experiment) for experiment in experiments]


@app.get("/api/admin/experiments", response_model=list[ExperimentOut])
def list_admin_experiments(
    db: Session = Depends(get_db), _: str = Depends(require_admin)
):
    experiments = db.scalars(experiment_query().order_by(Experiment.id)).all()
    return [experiment_output(experiment) for experiment in experiments]


@app.post("/api/admin/experiments", response_model=ExperimentOut, status_code=201)
def create_experiment(
    payload: ExperimentCreate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    labels = {variation.label for variation in payload.variations}
    if labels != {"A", "B"}:
        raise HTTPException(status_code=400, detail="Experiments require one A and one B variation")
    experiment = Experiment(
        slug=unique_slug(db, payload.title),
        title=payload.title,
        description=payload.description,
        status=payload.status,
        test_type=payload.test_type,
        template_key=payload.template_key,
        task_prompt=payload.task_prompt,
        variations=[Variation(**variation.model_dump()) for variation in payload.variations],
    )
    db.add(experiment)
    db.commit()
    experiment = db.scalar(experiment_query().where(Experiment.id == experiment.id))
    return experiment_output(experiment)


@app.patch("/api/admin/experiments/{experiment_id}", response_model=ExperimentOut)
def update_experiment(
    experiment_id: int,
    payload: ExperimentUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    experiment = db.scalar(experiment_query().where(Experiment.id == experiment_id))
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(experiment, field, value)
    db.commit()
    db.refresh(experiment)
    return experiment_output(experiment)


@app.post("/api/admin/experiments/{experiment_id}/duplicate", response_model=ExperimentOut, status_code=201)
def duplicate_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    source = db.scalar(experiment_query().where(Experiment.id == experiment_id))
    if not source:
        raise HTTPException(status_code=404, detail="Experiment not found")
    duplicate = Experiment(
        slug=unique_slug(db, f"{source.title} copy"),
        title=f"{source.title} (Copy)",
        description=source.description,
        status="draft",
        test_type=source.test_type,
        template_key=source.template_key,
        task_prompt=source.task_prompt,
        variations=[
            Variation(label=v.label, title=v.title, description=v.description, accent_color=v.accent_color)
            for v in source.variations
        ],
    )
    db.add(duplicate)
    db.commit()
    duplicate = db.scalar(experiment_query().where(Experiment.id == duplicate.id))
    return experiment_output(duplicate)


@app.get("/api/experiments/{experiment_id}", response_model=ExperimentOut)
def get_experiment(experiment_id: int, db: Session = Depends(get_db)):
    experiment = db.scalar(experiment_query().where(Experiment.id == experiment_id))
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return experiment_output(experiment)


@app.post(
    "/api/experiments/{experiment_id}/responses",
    response_model=ResponseOut,
    status_code=201,
)
def create_response(
    experiment_id: int,
    payload: ResponseCreate,
    db: Session = Depends(get_db),
):
    experiment = db.get(Experiment, experiment_id)
    variation = db.get(Variation, payload.selected_variation_id)
    if not experiment or experiment.status != "active":
        raise HTTPException(status_code=404, detail="Active experiment not found")
    if not variation or variation.experiment_id != experiment_id:
        raise HTTPException(status_code=400, detail="Variation does not belong to experiment")

    response = Response(experiment_id=experiment_id, **payload.model_dump())
    db.add(response)
    db.commit()
    db.refresh(response)
    return response


@app.get("/api/experiments/{experiment_id}/analytics", response_model=AnalyticsOut)
def get_analytics(
    experiment_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    experiment = db.get(Experiment, experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    responses = list(
        db.scalars(
            select(Response)
            .options(selectinload(Response.selected_variation))
            .where(Response.experiment_id == experiment_id)
            .order_by(Response.created_at.desc())
        ).all()
    )
    p_value, interval, is_significant = significance(responses)
    average_latency = sum(r.decision_latency_ms for r in responses) / len(responses) if responses else 0
    average_confidence = sum(r.confidence_score for r in responses) / len(responses) if responses else 0
    task_success_rate = sum(r.task_completed for r in responses) / len(responses) * 100 if responses else 0
    average_ease = sum(r.ease_score for r in responses) / len(responses) if responses else 0
    average_interactions = sum(r.interaction_count for r in responses) / len(responses) if responses else 0
    b_percentage = sum(r.selected_variation.label == "B" for r in responses) / len(responses) * 100 if responses else 0
    summary = (
        f"Variation B leads by {abs(b_percentage - 50):.1f} percentage points; "
        + ("the preference is statistically significant." if is_significant else "more evidence is needed.")
    )
    return AnalyticsOut(
        experiment_id=experiment_id,
        total_responses=len(responses),
        average_latency_ms=round(average_latency, 1),
        average_confidence=round(average_confidence, 2),
        task_success_rate=round(task_success_rate, 1),
        average_ease_score=round(average_ease, 2),
        average_interactions=round(average_interactions, 1),
        choices=choice_metrics(responses),
        p_value=round(p_value, 6),
        confidence_interval=[round(interval[0] * 100, 1), round(interval[1] * 100, 1)],
        is_significant=is_significant,
        effect_summary=summary,
        device_segments=device_metrics(responses),
        recent_responses=[
            RecentResponse(
                id=response.id,
                selected_label=response.selected_variation.label,
                confidence_score=response.confidence_score,
                task_completed=response.task_completed,
                ease_score=response.ease_score,
                interaction_count=response.interaction_count,
                decision_latency_ms=response.decision_latency_ms,
                device_type=response.device_type,
                feedback=response.qualitative_feedback,
                created_at=response.created_at,
            )
            for response in responses[:6]
        ],
    )


@app.get("/api/admin/program-summary", response_model=ProgramSummaryOut)
def get_program_summary(
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    experiments = db.scalars(experiment_query().order_by(Experiment.id)).all()
    metrics = []
    all_responses = []
    for experiment in experiments:
        responses = list(db.scalars(
            select(Response)
            .options(selectinload(Response.selected_variation))
            .where(Response.experiment_id == experiment.id)
        ).all())
        all_responses.extend(responses)
        choices = choice_metrics(responses)
        winner = max(choices, key=lambda choice: choice.percentage)
        _, _, is_significant = significance(responses)
        metrics.append(ProgramExperimentMetric(
            experiment_id=experiment.id,
            title=experiment.title,
            template_key=experiment.template_key,
            status=experiment.status,
            total_responses=len(responses),
            winning_label=winner.label,
            winning_percentage=winner.percentage,
            task_success_rate=round(sum(r.task_completed for r in responses) / len(responses) * 100, 1) if responses else 0,
            average_ease_score=round(sum(r.ease_score for r in responses) / len(responses), 2) if responses else 0,
            average_latency_ms=round(sum(r.decision_latency_ms for r in responses) / len(responses), 1) if responses else 0,
            is_significant=is_significant,
        ))
    return ProgramSummaryOut(
        total_experiments=len(experiments),
        total_responses=len(all_responses),
        overall_success_rate=round(sum(r.task_completed for r in all_responses) / len(all_responses) * 100, 1) if all_responses else 0,
        average_ease_score=round(sum(r.ease_score for r in all_responses) / len(all_responses), 2) if all_responses else 0,
        evidence_ready=sum(metric.is_significant for metric in metrics),
        experiments=metrics,
    )


@app.get("/api/experiments/{experiment_id}/responses.csv")
def export_responses(
    experiment_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    responses = db.scalars(
        select(Response)
        .options(selectinload(Response.selected_variation))
        .where(Response.experiment_id == experiment_id)
    ).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "response_id", "anonymous_id", "selected_variation", "decision_latency_ms",
        "confidence_score", "task_completed", "ease_score", "interaction_count",
        "device_type", "experience_level", "age_range",
        "qualitative_feedback", "created_at",
    ])
    for response in responses:
        writer.writerow([
            response.id, response.anonymous_id, response.selected_variation.label,
            response.decision_latency_ms, response.confidence_score, response.task_completed,
            response.ease_score, response.interaction_count, response.device_type,
            response.experience_level, response.age_range, response.qualitative_feedback,
            response.created_at.isoformat(),
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=choicelab-responses.csv"},
    )
