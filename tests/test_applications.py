"""
test_applications.py — Tests for POST /applications/apply and GET /applications/my-status.

File uploads are simulated with in-memory BytesIO objects so no real files are needed.
"""
import io
import pytest


def _fake_file(name: str = "test.pdf", content: bytes = b"fake-content"):
    return (name, io.BytesIO(content), "application/pdf")


VALID_PAYLOAD = {
    "full_name": "Ahmed Yassine",
    "cin": "AB123456",
    "phone": "0612345678",
    "date_of_birth": "2000-05-15",
    "address": "Rue Hassan II",
    "city": "Beni Mellal",
    "province": "Beni Mellal",
    "student_type": "CPGE",
    "filière": "MPSI",
    "grade_average": "17.50",
    "signature": "data:image/png;base64,iVBORw0KGgo=",
}


class TestApply:
    def test_apply_success(self, client, student_token):
        """A student can submit a valid application with documents."""
        res = client.post(
            "/applications/apply",
            data=VALID_PAYLOAD,
            files={
                "cin_copy": _fake_file("cin.pdf"),
                "transcript": _fake_file("releve.pdf"),
            },
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert res.status_code == 201
        body = res.json()
        assert body["status"] == "pending"
        assert body["student_type"] == "CPGE"
        assert body["filière"] == "MPSI"
        assert len(body["documents"]) == 2  # CIN + transcript

    def test_apply_with_optional_residency_cert(self, client, student_token):
        """Application succeeds with all three documents including residency cert."""
        res = client.post(
            "/applications/apply",
            data=VALID_PAYLOAD,
            files={
                "cin_copy": _fake_file("cin.pdf"),
                "transcript": _fake_file("releve.pdf"),
                "residency_cert": _fake_file("cert.pdf"),
            },
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert res.status_code == 201
        assert len(res.json()["documents"]) == 3

    def test_apply_invalid_province(self, client, student_token):
        """A province outside Beni Mellal-Khénifra returns 400."""
        bad_payload = {**VALID_PAYLOAD, "province": "Casablanca"}
        res = client.post(
            "/applications/apply",
            data=bad_payload,
            files={
                "cin_copy": _fake_file(),
                "transcript": _fake_file(),
            },
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert res.status_code == 400
        assert "Beni Mellal-Khénifra" in res.json()["detail"]

    def test_apply_valid_provinces(self, client, db_session, student_token):
        """All five valid provinces are accepted."""
        from app.models.models import Application, Profile
        valid_provinces = [
            "Azilal", "Fkih Ben Salah", "Khénifra", "Khouribga", "Beni Mellal"
        ]
        # Use a fresh student for each province test
        for province in valid_provinces:
            # Clean slate between sub-tests
            db_session.query(Application).delete()
            db_session.query(Profile).delete()
            db_session.commit()

            payload = {**VALID_PAYLOAD, "province": province, "city": province}
            res = client.post(
                "/applications/apply",
                data=payload,
                files={
                    "cin_copy": _fake_file(),
                    "transcript": _fake_file(),
                },
                headers={"Authorization": f"Bearer {student_token}"}
            )
            assert res.status_code == 201, f"Province '{province}' should be accepted"

    def test_apply_unauthenticated(self, client):
        """Submitting without a token returns 401."""
        res = client.post(
            "/applications/apply",
            data=VALID_PAYLOAD,
            files={
                "cin_copy": _fake_file(),
                "transcript": _fake_file(),
            }
        )
        assert res.status_code == 401

    def test_apply_duplicate_application(self, client, student_token):
        """A student cannot submit more than one application."""
        files = {"cin_copy": _fake_file(), "transcript": _fake_file()}
        client.post(
            "/applications/apply", data=VALID_PAYLOAD, files=files,
            headers={"Authorization": f"Bearer {student_token}"}
        )
        # Reset files (BytesIO is exhausted after first read)
        files = {"cin_copy": _fake_file(), "transcript": _fake_file()}
        res = client.post(
            "/applications/apply", data=VALID_PAYLOAD, files=files,
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert res.status_code == 400
        assert "already submitted" in res.json()["detail"]


class TestMyStatus:
    def test_status_no_application(self, client, student_token):
        """A student with no application gets a helpful message."""
        res = client.get(
            "/applications/my-status",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert res.status_code == 200
        body = res.json()
        assert body["application"] is None
        assert "No application" in body["message"]

    def test_status_after_apply(self, client, student_token):
        """After submitting, status returns the application with pending status."""
        client.post(
            "/applications/apply",
            data=VALID_PAYLOAD,
            files={"cin_copy": _fake_file(), "transcript": _fake_file()},
            headers={"Authorization": f"Bearer {student_token}"}
        )
        res = client.get(
            "/applications/my-status",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert res.status_code == 200
        body = res.json()
        assert body["application"]["status"] == "pending"
        assert body["profile"]["full_name"] == "Ahmed Yassine"

    def test_status_unauthenticated(self, client):
        """Accessing /my-status without token returns 401."""
        res = client.get("/applications/my-status")
        assert res.status_code == 401
