from pathlib import Path

from fastapi.testclient import TestClient

from app import TEMP_DIR, app


def _post(client: TestClient, path: Path, **data):
    with path.open("rb") as handle:
        return client.post(
            "/predict",
            files={"audio": (path.name, handle, "application/octet-stream")},
            data=data,
        )


def test_health():
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "model_version": "v3"}


def test_predict_success_contract(fixture_dir: Path):
    with TestClient(app) as client:
        response = _post(client, fixture_dir / "cough.wav")

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "success"
    assert body["result"] in {"normal", "risk"}
    assert body["raw_label"] in {"Pneumonia", "Bukan Pneumonia"}
    assert isinstance(body["agreement"], bool)
    assert set(body["votes"]) == {"autoencoder", "ocsvm"}
    assert set(body["autoencoder"]) == {"error", "threshold"}
    assert body["autoencoder"]["threshold"] == 0.03890753164887428
    assert "score" in body["ocsvm"]
    assert body["chunks"] >= 1
    assert body["duration_sec"] > 0
    assert len(body["waveform"]) == 100
    assert all(0.0 <= value <= 1.0 for value in body["waveform"])
    assert body["model_version"] == "v3"
    assert isinstance(body["summary"], str) and body["summary"]
    assert "menderita pneumonia" not in body["summary"].lower()


def test_predict_accepts_m4a(fixture_dir: Path):
    with TestClient(app) as client:
        response = _post(client, fixture_dir / "cough.m4a")

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "success"


def test_predict_accepts_child_id_without_echo(fixture_dir: Path):
    with TestClient(app) as client:
        response = _post(
            client,
            fixture_dir / "cough.wav",
            child_id="11111111-1111-1111-1111-111111111111",
        )

    assert response.status_code == 200
    assert "child_id" not in response.text


def test_predict_silent(fixture_dir: Path):
    with TestClient(app) as client:
        response = _post(client, fixture_dir / "silent.wav")

    assert response.status_code == 422
    assert response.json()["code"] == "AUDIO_SILENT"


def test_predict_too_short(fixture_dir: Path):
    with TestClient(app) as client:
        response = _post(client, fixture_dir / "short.wav")

    assert response.status_code == 422
    assert response.json()["code"] == "AUDIO_TOO_SHORT"


def test_predict_noise(fixture_dir: Path):
    with TestClient(app) as client:
        response = _post(client, fixture_dir / "noise.wav")

    assert response.status_code == 422
    assert response.json()["code"] in {"AUDIO_TOO_NOISY", "NO_COUGH_DETECTED"}


def test_predict_unsupported_format(fixture_dir: Path):
    with TestClient(app) as client:
        response = _post(client, fixture_dir / "notaudio.txt")

    assert response.status_code == 422
    assert response.json()["code"] == "UNSUPPORTED_FORMAT"


def test_predict_file_too_large(oversized_wav: Path):
    with TestClient(app) as client:
        response = _post(client, oversized_wav)

    assert response.status_code == 422
    assert response.json()["code"] == "FILE_TOO_LARGE"


def test_predict_missing_audio():
    with TestClient(app) as client:
        response = client.post("/predict")

    assert response.status_code == 422
    body = response.json()
    assert body["status"] == "error"
    assert body["code"] == "INVALID_REQUEST"


def test_temp_dir_is_cleaned(fixture_dir: Path):
    with TestClient(app) as client:
        _post(client, fixture_dir / "cough.wav")
        _post(client, fixture_dir / "silent.wav")

    assert list(TEMP_DIR.glob("*")) == []
