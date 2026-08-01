# ChoiceLab

ChoiceLab is a full-stack product experimentation platform for running A/B tests and analyzing how people make decisions. It captures product preference, confidence, qualitative feedback, and millisecond-level decision latency, then turns those responses into statistical insights.

## Highlights

- Participant-first, randomized A/B experiment experience
- Interactive travel-planning concepts with working tabs, filters, map pins, and saved places
- Protected admin dashboard with an HTTP-only session cookie
- Automatic decision-latency measurement
- Confidence and qualitative-feedback collection
- Admin dashboard with preference, latency, and segment analytics
- Exact binomial significance testing and Wilson confidence intervals
- Deterministic seed dataset with 180 realistic interaction records
- CSV export and documented REST API
- React, TypeScript, FastAPI, SQLAlchemy, and PostgreSQL-ready persistence

## Architecture

```text
React + TypeScript frontend
        |
        | JSON / REST
        v
FastAPI analytics API
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

The API runs at `http://localhost:8000`, and interactive documentation is available at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

The participant study is the default view. Use the **Admin login** link to access analytics with the demo credentials:

```text
Username: admin
Password: admin123
```

These credentials are intentionally public for portfolio demonstration purposes. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` to different values for any non-demo deployment.

## Test

```bash
cd backend && pytest
cd frontend && npm run build
```

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/experiments` | List experiments |
| `GET` | `/api/experiments/{id}` | Load a participant experiment |
| `POST` | `/api/experiments/{id}/responses` | Record a participant choice |
| `POST` | `/api/auth/login` | Create an HTTP-only admin session |
| `POST` | `/api/auth/logout` | End the admin session |
| `GET` | `/api/experiments/{id}/analytics` | Calculate protected experiment analytics |
| `GET` | `/api/experiments/{id}/responses.csv` | Export protected response data |

## Responsible interpretation

ChoiceLab labels model output as association rather than causation. Statistical significance alone does not establish practical importance, and segment results should be treated as exploratory unless they were specified before an experiment began.
