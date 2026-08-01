import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Experiment, Response, Variation


FEEDBACK_A = [
    "The day-by-day timeline made the whole trip easy to understand.",
    "I liked comparing time, cost, and travel distance in one place.",
    "The structured itinerary felt practical and ready to use.",
    "I could quickly see what the full day would feel like.",
]
FEEDBACK_B = [
    "Exploring places directly on the map felt more inspiring.",
    "The neighborhood filters made discovery much easier.",
    "I liked saving places before committing to an itinerary.",
    "The map made distances and nearby options immediately clear.",
]

EXPERIMENT_TITLE = "Plan a three-day city escape"
EXPERIMENT_DESCRIPTION = (
    "Explore both interactive travel-planning concepts. Which experience would you prefer "
    "for discovering places and building a realistic trip?"
)


def seed_database(db: Session) -> None:
    existing = db.scalar(select(Experiment).order_by(Experiment.id))
    if existing:
        existing.slug = "travel-planner-experience"
        existing.title = EXPERIMENT_TITLE
        existing.description = EXPERIMENT_DESCRIPTION
        variations = sorted(existing.variations, key=lambda item: item.label)
        if len(variations) == 2:
            variations[0].title = "Itinerary Studio"
            variations[0].description = (
                "A structured day-by-day workspace with schedules, travel time, budgets, "
                "and editable activity cards."
            )
            variations[0].accent_color = "#5b63d3"
            variations[1].title = "Discovery Map"
            variations[1].description = (
                "A visual neighborhood explorer with map pins, live filters, saved places, "
                "and a flexible trip collection."
            )
            variations[1].accent_color = "#df6b47"
            for response in existing.responses:
                if response.qualitative_feedback:
                    pool = FEEDBACK_B if response.selected_variation_id == variations[1].id else FEEDBACK_A
                    response.qualitative_feedback = pool[response.id % len(pool)]
        db.commit()
        return

    experiment = Experiment(
        slug="travel-planner-experience",
        title=EXPERIMENT_TITLE,
        description=EXPERIMENT_DESCRIPTION,
        status="active",
    )
    variation_a = Variation(
        label="A",
        title="Itinerary Studio",
        description="A structured day-by-day workspace with schedules, travel time, budgets, and editable activity cards.",
        accent_color="#5b63d3",
    )
    variation_b = Variation(
        label="B",
        title="Discovery Map",
        description="A visual neighborhood explorer with map pins, live filters, saved places, and a flexible trip collection.",
        accent_color="#df6b47",
    )
    experiment.variations = [variation_a, variation_b]
    db.add(experiment)
    db.flush()

    rng = random.Random(42)
    devices = ["desktop", "desktop", "desktop", "mobile", "mobile", "tablet"]
    experience_levels = ["new", "intermediate", "intermediate", "expert"]
    age_ranges = ["18-24", "25-34", "25-34", "35-44", "45+"]

    for index in range(180):
        device = rng.choice(devices)
        experience = rng.choice(experience_levels)
        choose_b_probability = 0.63
        if device == "mobile":
            choose_b_probability += 0.05
        if experience == "expert":
            choose_b_probability -= 0.04
        selected = variation_b if rng.random() < choose_b_probability else variation_a
        baseline = 6200 if device == "desktop" else 7600 if device == "mobile" else 7000
        latency = max(900, int(rng.gauss(baseline, 1900)))
        confidence = min(5, max(1, round(rng.gauss(4 if selected == variation_b else 3.5, 0.8))))
        feedback_pool = FEEDBACK_B if selected == variation_b else FEEDBACK_A
        feedback = rng.choice(feedback_pool) if rng.random() < 0.72 else ""
        db.add(
            Response(
                experiment_id=experiment.id,
                selected_variation_id=selected.id,
                anonymous_id=f"seed-participant-{index + 1:03d}",
                decision_latency_ms=latency,
                confidence_score=confidence,
                qualitative_feedback=feedback,
                device_type=device,
                experience_level=experience,
                age_range=rng.choice(age_ranges),
                created_at=datetime.now(timezone.utc) - timedelta(hours=180 - index),
            )
        )
    db.commit()
