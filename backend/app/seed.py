import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Experiment, Response, Variation


STUDIES = [
    {
        "slug": "roamly-onboarding-setup",
        "title": "Set up a personalized travel profile",
        "description": "Compare two onboarding patterns for helping a new Roamly user reach a useful first recommendation.",
        "status": "active", "test_type": "task-completion", "template_key": "onboarding",
        "task_prompt": "Tell Roamly that you enjoy food and culture, set a mid-range budget, and finish your profile.",
        "responses": 84, "b_probability": 0.60,
        "variations": [
            ("A", "Setup Checklist", "A flexible workspace where travelers can complete profile steps in any order.", "#5b63d3"),
            ("B", "Guided Setup", "A focused question-by-question flow with visible progress and instant recommendations.", "#df6b47"),
        ],
        "feedback": {"A": ["The checklist let me control the setup order.", "I liked seeing every profile task at once."], "B": ["The guided questions felt quick and clear.", "Seeing a recommendation at the end felt rewarding."]},
    },
    {
        "slug": "travel-planner-experience",
        "title": "Build the first version of a Rome trip",
        "description": "Compare two Roamly planning workspaces for turning recommendations into a realistic three-day itinerary.",
        "status": "active", "test_type": "task-completion", "template_key": "travel",
        "task_prompt": "Save a Rome activity, inspect a daily route, and decide which planner makes the trip easiest to organize.",
        "responses": 180, "b_probability": 0.63,
        "variations": [
            ("A", "Itinerary Studio", "A day-by-day workspace with schedules, travel time, budgets, and editable activity cards.", "#5b63d3"),
            ("B", "Discovery Map", "A neighborhood explorer with map pins, filters, saved places, and flexible trip building.", "#df6b47"),
        ],
        "feedback": {"A": ["The daily structure made the trip easy to understand.", "I liked seeing time and budget together."], "B": ["The map made exploring feel natural.", "Saving nearby places was quick and inspiring."]},
    },
    {
        "slug": "checkout-flow-clarity",
        "title": "Book the trip with confidence",
        "description": "Compare two Roamly booking flows for reviewing traveler details, protection, and the final trip total.",
        "status": "active", "test_type": "task-completion", "template_key": "checkout",
        "task_prompt": "Add trip protection, verify the total, and locate the final booking action in both concepts.",
        "responses": 96, "b_probability": 0.57,
        "variations": [
            ("A", "One-page Booking", "Traveler details, protection, payment, and trip review presented in one compact workspace.", "#316f65"),
            ("B", "Guided Booking", "A calm three-step booking flow that reveals one decision at a time and confirms progress.", "#d96a45"),
        ],
        "feedback": {"A": ["Everything was visible without moving between steps.", "The order total stayed easy to check."], "B": ["The steps reduced the amount I had to process.", "The progress indicator made checkout feel safer."]},
    },
    {
        "slug": "pricing-page-decision",
        "title": "Choose a Roamly membership",
        "description": "Compare two membership pages for choosing travel benefits without losing important plan details.",
        "status": "active", "test_type": "first-click", "template_key": "pricing",
        "task_prompt": "Find the plan that includes price alerts and shared trips, then compare monthly and annual billing.",
        "responses": 72, "b_probability": 0.67,
        "variations": [
            ("A", "Benefit Comparison", "A detailed membership matrix designed for methodical feature-by-feature comparison.", "#5b63d3"),
            ("B", "Trip-based Recommendations", "Goal-based plan cards that highlight the membership best suited to each traveler.", "#df6b47"),
        ],
        "feedback": {"A": ["The table made feature differences explicit.", "I could verify every limitation before choosing."], "B": ["The recommended plan was immediately clear.", "The cards made pricing much less overwhelming."]},
    },
]


def upsert_study(db: Session, spec: dict) -> Experiment:
    experiment = db.scalar(select(Experiment).where(Experiment.slug == spec["slug"]))
    if not experiment:
        experiment = Experiment(slug=spec["slug"])
        db.add(experiment)
    for field in ("title", "description", "status", "test_type", "template_key", "task_prompt"):
        setattr(experiment, field, spec[field])
    db.flush()
    by_label = {variation.label: variation for variation in experiment.variations}
    for label, title, description, accent_color in spec["variations"]:
        variation = by_label.get(label)
        if not variation:
            variation = Variation(label=label)
            experiment.variations.append(variation)
        variation.title = title
        variation.description = description
        variation.accent_color = accent_color
    db.flush()
    return experiment


def seed_responses(db: Session, experiment: Experiment, spec: dict, seed: int) -> None:
    if experiment.responses:
        rng = random.Random(seed)
        for response in experiment.responses:
            selected_label = response.selected_variation.label
            if response.interaction_count <= 1:
                response.task_completed = rng.random() < (0.88 if selected_label == "B" else 0.78)
                response.ease_score = min(5, max(1, round(rng.gauss(4.2 if selected_label == "B" else 3.6, 0.8))))
                response.interaction_count = max(1, round(rng.gauss(5 if selected_label == "B" else 7, 2)))
        return
    rng = random.Random(seed)
    variations = {variation.label: variation for variation in experiment.variations}
    devices = ["desktop", "desktop", "desktop", "mobile", "mobile", "tablet"]
    experience_levels = ["new", "intermediate", "intermediate", "expert"]
    age_ranges = ["18-24", "25-34", "25-34", "35-44", "45+"]
    count = spec["responses"]
    for index in range(count):
        device = rng.choice(devices)
        experience = rng.choice(experience_levels)
        probability = spec["b_probability"] + (0.04 if device == "mobile" else 0)
        selected_label = "B" if rng.random() < probability else "A"
        selected = variations[selected_label]
        baseline = 6400 if device == "desktop" else 7800 if device == "mobile" else 7100
        latency = max(900, int(rng.gauss(baseline, 1850)))
        confidence = min(5, max(1, round(rng.gauss(4 if selected_label == "B" else 3.6, 0.75))))
        success_probability = 0.88 if selected_label == "B" else 0.78
        task_completed = rng.random() < success_probability
        ease_score = min(5, max(1, round(rng.gauss(4.2 if selected_label == "B" else 3.6, 0.8))))
        interaction_count = max(1, round(rng.gauss(5 if selected_label == "B" else 7, 2)))
        feedback = rng.choice(spec["feedback"][selected_label]) if rng.random() < 0.72 else ""
        db.add(Response(
            experiment_id=experiment.id, selected_variation_id=selected.id,
            anonymous_id=f"seed-{spec['template_key']}-{index + 1:03d}",
            decision_latency_ms=latency, confidence_score=confidence,
            task_completed=task_completed, ease_score=ease_score,
            interaction_count=interaction_count,
            qualitative_feedback=feedback, device_type=device, experience_level=experience,
            age_range=rng.choice(age_ranges),
            created_at=datetime.now(timezone.utc) - timedelta(hours=count - index),
        ))


def seed_database(db: Session) -> None:
    for seed, spec in enumerate(STUDIES, start=42):
        experiment = upsert_study(db, spec)
        seed_responses(db, experiment, spec, seed)
    db.commit()
