import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import Experiment, Response, Variation


FEEDBACK_A = [
    "The layout feels familiar and easy to scan.",
    "I like seeing the details before the action.",
    "The neutral colors feel trustworthy.",
    "It takes less effort to understand.",
]
FEEDBACK_B = [
    "The primary action is much clearer.",
    "This version feels modern and focused.",
    "The visual hierarchy helped me decide quickly.",
    "I noticed the important information immediately.",
]


def seed_database(db: Session) -> None:
    if db.scalar(select(func.count(Experiment.id))) > 0:
        return

    experiment = Experiment(
        slug="checkout-clarity",
        title="Checkout page clarity",
        description="Which checkout summary makes the next step feel clearer and more trustworthy?",
        status="active",
    )
    variation_a = Variation(
        label="A",
        title="Classic summary",
        description="A familiar order summary with neutral styling and details presented before the primary action.",
        accent_color="#7467e8",
    )
    variation_b = Variation(
        label="B",
        title="Focused checkout",
        description="A streamlined summary with stronger hierarchy, reassurance cues, and a prominent primary action.",
        accent_color="#ef6d4e",
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

