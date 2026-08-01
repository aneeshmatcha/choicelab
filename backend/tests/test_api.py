def test_seeded_experiment_and_analytics(client):
    experiments = client.get("/api/experiments")
    assert experiments.status_code == 200
    experiment = experiments.json()[0]
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
