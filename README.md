# ChoiceLab

ChoiceLab is a full-stack product research platform for validating an interface journey before launch. Instead of asking only which mockup people prefer, it connects preference to task completion, perceived ease, decision time, interaction count, confidence, and qualitative feedback.

The included portfolio program evaluates **Roamly**, a fictional travel product, across four connected stages:

1. Activate — set up a personalized travel profile
2. Plan — build a realistic Rome itinerary
3. Decide — choose a travel membership
4. Book — complete the trip booking

Each stage compares two working UI concepts. The research-program dashboard combines their evidence into one launch-readiness view and identifies the strongest design signal and the largest source of friction.

## Product features

- Four interactive UI studies with functional controls and deliberately contrasting design systems
- Detailed comparison briefs explaining each concept's strategy, interaction model, and research hypothesis
- Participant study switcher and shareable experiment URLs
- A/B preference, first-click, and task-completion test types
- Automatic decision-time and interaction-count tracking
- Task success, ease, confidence, demographic, and feedback collection
- Protected multi-experiment admin workspace
- Experiment creation, duplication, launch, pause, and draft workflows
- Cross-experiment customer-journey comparison dashboard
- A/B outcome scorecards that compare stated preference with task success, ease, and decision speed
- Per-experiment statistical reports and device segmentation
- Exact binomial significance testing and Wilson confidence intervals
- CSV export including behavioral and outcome fields
- Deterministic seed dataset with 432 interaction records
- Responsive React interface, FastAPI API, automated tests, and Docker setup

## Why the project is useful

Preference alone can select a visually appealing design that is difficult to use. ChoiceLab keeps the preference question but adds outcome measures, allowing a researcher to see cases where people say they like a design while failing its task or requiring excessive interaction.

The application labels statistical relationships as associations rather than causal conclusions. Seed records demonstrate the analytics workflow and are not presented as real participants.

## Architecture

```text
React + TypeScript + Recharts
             |
             | JSON / REST
             v
FastAPI + SciPy analytics
             |
             v
SQLAlchemy -> SQLite locally / PostgreSQL in production
```

## Run locally

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`. Interactive API documentation is available at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The participant research experience is the default view.

Demo administrator credentials:

```text
Username: admin
Password: admin123
```

These credentials are intentionally public for this portfolio demo. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` for a non-demo environment.

## Verify

```bash
cd backend && pytest
cd frontend && npm run build
```

## Main API routes

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/experiments` | List active participant studies |
| `GET` | `/api/experiments/{id}` | Load one study and its variations |
| `POST` | `/api/experiments/{id}/responses` | Record a behavioral response |
| `POST` | `/api/auth/login` | Start an HTTP-only admin session |
| `GET` | `/api/admin/experiments` | List every managed experiment |
| `POST` | `/api/admin/experiments` | Create an experiment |
| `PATCH` | `/api/admin/experiments/{id}` | Update status or study content |
| `POST` | `/api/admin/experiments/{id}/duplicate` | Duplicate an experiment as a draft |
| `GET` | `/api/admin/program-summary` | Compare outcomes across the journey |
| `GET` | `/api/experiments/{id}/analytics` | Calculate protected experiment analytics |
| `GET` | `/api/experiments/{id}/responses.csv` | Export protected response data |

## Technology

React, TypeScript, Vite, Recharts, FastAPI, Pydantic, SQLAlchemy, SciPy, SQLite/PostgreSQL, Pytest, Docker, and GitHub Actions.
