def test_seeded_experiment_and_analytics(client):
    experiments = client.get("/api/experiments")
    assert experiments.status_code == 200
    assert len(experiments.json()) == 4
    experiment = next(item for item in experiments.json() if item["slug"] == "travel-planner-experience")
    assert experiment["response_count"] == 180
    assert len(experiment["variations"]) == 2
    assert experiment["slug"] == "travel-planner-experience"

    unauthorized = client.get(f"/api/experiments/{experiment['id']}/analytics")
    assert unauthorized.status_code == 401

    invalid_login = client.post(
        "/api/auth/login", json={"username": "admin", "password": "wrong"}
    )
    assert invalid_login.status_code == 401

    login = client.post(
        "/api/auth/login", json={"username": "admin", "password": "admin123"}
    )
    assert login.status_code == 200
    assert login.json()["authenticated"] is True

    analytics = client.get(f"/api/experiments/{experiment['id']}/analytics")
    assert analytics.status_code == 200
    result = analytics.json()
    assert result["total_responses"] == 180
    assert sum(choice["count"] for choice in result["choices"]) == 180
    assert 0 <= result["p_value"] <= 1

    logout = client.post("/api/auth/logout")
    assert logout.status_code == 200
    assert client.get(f"/api/experiments/{experiment['id']}/analytics").status_code == 401


def test_admin_can_manage_multiple_experiments(client):
    assert client.get("/api/admin/experiments").status_code == 401
    client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})

    experiments = client.get("/api/admin/experiments")
    assert experiments.status_code == 200
    assert {item["template_key"] for item in experiments.json()} == {"travel", "checkout", "pricing", "onboarding"}

    program = client.get("/api/admin/program-summary")
    assert program.status_code == 200
    assert program.json()["total_experiments"] == 4
    assert program.json()["total_responses"] == 432
    assert 0 <= program.json()["overall_success_rate"] <= 100

    created = client.post("/api/admin/experiments", json={
        "title": "Test onboarding flow",
        "description": "Compare two ways to help a new user create a workspace.",
        "status": "draft",
        "test_type": "task-completion",
        "template_key": "onboarding",
        "task_prompt": "Create a workspace and invite one teammate.",
        "variations": [
            {"label": "A", "title": "Setup checklist", "description": "A persistent checklist with setup tasks.", "accent_color": "#5b63d3"},
            {"label": "B", "title": "Guided tour", "description": "A focused step-by-step product tour.", "accent_color": "#df6b47"},
        ],
    })
    assert created.status_code == 201
    assert created.json()["status"] == "draft"
    experiment_id = created.json()["id"]

    launched = client.patch(f"/api/admin/experiments/{experiment_id}", json={"status": "active"})
    assert launched.status_code == 200
    assert launched.json()["status"] == "active"

    duplicated = client.post(f"/api/admin/experiments/{experiment_id}/duplicate")
    assert duplicated.status_code == 201
    assert duplicated.json()["status"] == "draft"
    assert duplicated.json()["title"].endswith("(Copy)")


def test_create_response(client):
    experiment = client.get("/api/experiments/1").json()
    response = client.post(
        "/api/experiments/1/responses",
        json={
            "selected_variation_id": experiment["variations"][1]["id"],
            "anonymous_id": "test-participant",
            "decision_latency_ms": 3200,
            "confidence_score": 4,
            "qualitative_feedback": "The main action was easy to find.",
            "device_type": "desktop",
            "experience_level": "intermediate",
            "age_range": "25-34",
        },
    )
    assert response.status_code == 201
    assert response.json()["decision_latency_ms"] == 3200


def test_rejects_unrelated_variation(client):
    response = client.post(
        "/api/experiments/999/responses",
        json={
            "selected_variation_id": 1,
            "anonymous_id": "test-participant",
            "decision_latency_ms": 3200,
            "confidence_score": 4,
            "device_type": "desktop",
            "experience_level": "intermediate",
            "age_range": "25-34",
        },
    )
    assert response.status_code == 404
