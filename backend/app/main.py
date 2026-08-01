import csv
import io
import os
import secrets
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request, Response as FastAPIResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .analytics import choice_metrics, device_metrics, significance
from .database import Base, SessionLocal, engine, get_db
from .models import Experiment, Response, Variation
from .schemas import (
    AnalyticsOut,
    AuthOut,
    ExperimentOut,
    LoginRequest,
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
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(
    title="ChoiceLab API",
    description="Behavioral experimentation and product preference analytics.",
    version="1.0.0",
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
    experiments = db.scalars(experiment_query().order_by(Experiment.created_at.desc())).all()
    return [
        ExperimentOut.model_validate(experiment).model_copy(
            update={"response_count": len(experiment.responses)}
        )
        for experiment in experiments
    ]


@app.get("/api/experiments/{experiment_id}", response_model=ExperimentOut)
def get_experiment(experiment_id: int, db: Session = Depends(get_db)):
    experiment = db.scalar(experiment_query().where(Experiment.id == experiment_id))
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return ExperimentOut.model_validate(experiment).model_copy(
        update={"response_count": len(experiment.responses)}
    )


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
                decision_latency_ms=response.decision_latency_ms,
                device_type=response.device_type,
                feedback=response.qualitative_feedback,
                created_at=response.created_at,
            )
            for response in responses[:6]
        ],
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
        "confidence_score", "device_type", "experience_level", "age_range",
        "qualitative_feedback", "created_at",
    ])
    for response in responses:
        writer.writerow([
            response.id, response.anonymous_id, response.selected_variation.label,
            response.decision_latency_ms, response.confidence_score, response.device_type,
            response.experience_level, response.age_range, response.qualitative_feedback,
            response.created_at.isoformat(),
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=choicelab-responses.csv"},
    )
