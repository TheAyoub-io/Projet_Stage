"""
test_admin.py — Tests for GET /admin/applications and PATCH /admin/applications/{id}/status.
"""
import io
import pytest


def _fake_file(name="test.pdf"):
    return (name, io.BytesIO(b"fake"), "application/pdf")


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


def _submit_application(client, token):
    """Helper: submit a valid application as the given student."""
    return client.post(
        "/applications/apply",
        data=VALID_PAYLOAD,
        files={"cin_copy": _fake_file(), "transcript": _fake_file()},
        headers={"Authorization": f"Bearer {token}"}
    )


class TestAdminListApplications:
    def test_list_empty(self, client, admin_token):
        """Admin sees an empty list when no applications exist."""
        res = client.get(
            "/admin/applications",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res.status_code == 200
        body = res.json()
        assert body["total"] == 0
        assert body["items"] == []

    def test_list_after_application(self, client, student_token, admin_token):
        """Admin sees the application after a student submits."""
        _submit_application(client, student_token)
        res = client.get(
            "/admin/applications",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res.status_code == 200
        body = res.json()
        apps = body["items"]
        assert len(apps) == 1
        assert apps[0]["student_email"] == "student@test.ma"
        assert apps[0]["status"] == "pending"

    def test_list_filter_by_pending(self, client, student_token, admin_token):
        """Filtering by ?status=pending returns only pending apps."""
        _submit_application(client, student_token)
        res = client.get(
            "/admin/applications?status=pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res.status_code == 200
        assert all(a["status"] == "pending" for a in res.json()["items"])

    def test_list_filter_by_approved_returns_empty(self, client, student_token, admin_token):
        """Filtering by approved returns empty list when no approved apps exist."""
        _submit_application(client, student_token)
        res = client.get(
            "/admin/applications?status=approved",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res.status_code == 200
        body = res.json()
        assert body["total"] == 0
        assert body["items"] == []

    def test_student_cannot_list(self, client, student_token):
        """A student is forbidden from the admin list endpoint."""
        res = client.get(
            "/admin/applications",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert res.status_code == 403

    def test_unauthenticated_cannot_list(self, client):
        """Unauthenticated request returns 401."""
        res = client.get("/admin/applications")
        assert res.status_code == 401


class TestAdminUpdateStatus:
    def test_approve_application(self, client, student_token, admin_token, room):
        """Admin can approve a pending application."""
        _submit_application(client, student_token)
        # Get the application id
        apps = client.get(
            "/admin/applications",
            headers={"Authorization": f"Bearer {admin_token}"}
        ).json()
        app_id = apps["items"][0]["id"]

        res = client.patch(
            f"/admin/applications/{app_id}/status",
            json={"status": "approved"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res.status_code == 200
        assert res.json()["status"] == "approved"

    def test_reject_application(self, client, student_token, admin_token):
        """Admin can reject a pending application."""
        _submit_application(client, student_token)
        apps = client.get(
            "/admin/applications",
            headers={"Authorization": f"Bearer {admin_token}"}
        ).json()
        app_id = apps["items"][0]["id"]

        res = client.patch(
            f"/admin/applications/{app_id}/status",
            json={"status": "rejected"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res.status_code == 200
        assert res.json()["status"] == "rejected"

    def test_update_nonexistent_application(self, client, admin_token):
        """Updating a non-existent application id returns 404."""
        res = client.patch(
            "/admin/applications/9999/status",
            json={"status": "approved"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res.status_code == 404

    def test_student_cannot_update_status(self, client, student_token, admin_token):
        """A student cannot update the status of an application."""
        _submit_application(client, student_token)
        apps = client.get(
            "/admin/applications",
            headers={"Authorization": f"Bearer {admin_token}"}
        ).json()
        app_id = apps["items"][0]["id"]

        res = client.patch(
            f"/admin/applications/{app_id}/status",
            json={"status": "approved"},
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert res.status_code == 403

    def test_status_reflected_in_student_view(self, client, student_token, admin_token, room):
        """After admin approves, student sees 'approved' in /my-status."""
        _submit_application(client, student_token)
        apps = client.get(
            "/admin/applications",
            headers={"Authorization": f"Bearer {admin_token}"}
        ).json()
        app_id = apps["items"][0]["id"]

        client.patch(
            f"/admin/applications/{app_id}/status",
            json={"status": "approved"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        status_res = client.get(
            "/applications/my-status",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert status_res.json()["application"]["status"] == "approved"
