"""
test_new_features.py — Tests for the four new features:
  1. Password reset flow  (POST /auth/forgot-password + POST /auth/reset-password)
  2. Application withdrawal  (DELETE /applications/withdraw)
  3. Pagination on admin list  (GET /admin/applications?page=&limit=)
  4. Email notifications — verified via mock so no real SMTP needed
"""
import io
import pytest
from unittest.mock import patch, call


# ── helpers ───────────────────────────────────────────────────────────────────

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
    "gender": "Male",
    "student_type": "CPGE",
    "filière": "MPSI",
    "grade_average": "17.50",
    "signature": "data:image/png;base64,iVBORw0KGgo=",
}


def _apply(client, token):
    """Submit a valid application for the authenticated student."""
    return client.post(
        "/applications/apply",
        data=VALID_PAYLOAD,
        files={"cin_copy": _fake_file(), "transcript": _fake_file()},
        headers={"Authorization": f"Bearer {token}"},
    )


# ── 1. Password Reset ─────────────────────────────────────────────────────────

class TestPasswordReset:
    def test_forgot_password_unknown_email_still_200(self, client):
        """Requesting reset for a non-existent email still returns 200 (no enumeration)."""
        res = client.post("/auth/forgot-password", json={"email": "ghost@test.ma"})
        assert res.status_code == 200
        assert "reset code" in res.json()["message"]

    def test_forgot_password_known_email(self, client, db_session):
        """A reset token is created in DB for a registered user."""
        from app.models.models import PasswordResetToken
        client.post("/auth/register", json={"email": "reset@test.ma", "password": "Pass@123"})
        res = client.post("/auth/forgot-password", json={"email": "reset@test.ma"})
        assert res.status_code == 200
        token_row = db_session.query(PasswordResetToken).first()
        assert token_row is not None
        assert token_row.used is False

    def test_reset_password_success(self, client, db_session):
        """Valid token + new password resets the password and marks token as used."""
        from app.models.models import PasswordResetToken
        client.post("/auth/register", json={"email": "reset2@test.ma", "password": "OldPass@1"})
        client.post("/auth/forgot-password", json={"email": "reset2@test.ma"})
        token_row = db_session.query(PasswordResetToken).first()
        assert token_row is not None

        res = client.post("/auth/reset-password", json={
            "token": token_row.token,
            "new_password": "NewPass@99"
        })
        assert res.status_code == 200
        assert "successfully" in res.json()["message"]

        db_session.refresh(token_row)
        assert token_row.used is True

        # Can now login with new password
        login = client.post("/auth/login", json={
            "email": "reset2@test.ma",
            "password": "NewPass@99"
        })
        assert login.status_code == 200

    def test_reset_password_token_reuse_blocked(self, client, db_session):
        """A used token cannot be reused."""
        from app.models.models import PasswordResetToken
        client.post("/auth/register", json={"email": "reset3@test.ma", "password": "Pass@1"})
        client.post("/auth/forgot-password", json={"email": "reset3@test.ma"})
        token_row = db_session.query(PasswordResetToken).first()

        client.post("/auth/reset-password", json={
            "token": token_row.token, "new_password": "NewPass@1"
        })
        # Try to reuse
        res = client.post("/auth/reset-password", json={
            "token": token_row.token, "new_password": "AnotherPass@1"
        })
        assert res.status_code == 400
        assert "already been used" in res.json()["detail"]

    def test_reset_password_invalid_token(self, client):
        """Submitting a bogus token returns 400."""
        res = client.post("/auth/reset-password", json={
            "token": "totally-fake-token",
            "new_password": "Whatever@1"
        })
        assert res.status_code == 400


# ── 2. Application Withdrawal ─────────────────────────────────────────────────

class TestWithdraw:
    def test_withdraw_pending_application(self, client, student_token):
        """A student can withdraw a pending application."""
        _apply(client, student_token)
        res = client.delete(
            "/applications/withdraw",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert res.status_code == 200
        assert "withdrawn" in res.json()["message"]

        # Status endpoint now shows no application
        status_res = client.get(
            "/applications/my-status",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert status_res.json()["application"] is None

    def test_withdraw_no_application(self, client, student_token):
        """Withdrawing when no application exists returns 404."""
        res = client.delete(
            "/applications/withdraw",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert res.status_code == 404

    def test_withdraw_approved_application_blocked(self, client, student_token, admin_token, db_session, room):
        """An approved application cannot be withdrawn."""
        apply_res = _apply(client, student_token)
        app_id = apply_res.json()["id"]

        # Admin approves it
        client.patch(
            f"/admin/applications/{app_id}/status",
            json={"status": "approved"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        res = client.delete(
            "/applications/withdraw",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert res.status_code == 400
        assert "approved" in res.json()["detail"]

    def test_withdraw_unauthenticated(self, client):
        """Withdrawing without a token returns 401."""
        res = client.delete("/applications/withdraw")
        assert res.status_code == 401


# ── 3. Pagination ─────────────────────────────────────────────────────────────

class TestPagination:
    def test_pagination_default(self, client, admin_token):
        """Admin list returns pagination metadata even when empty."""
        res = client.get(
            "/admin/applications",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res.status_code == 200
        body = res.json()
        assert "total" in body
        assert "page" in body
        assert "limit" in body
        assert "pages" in body
        assert "items" in body

    def test_pagination_page_and_limit(self, client, admin_token):
        """page and limit query params are echoed back in the response."""
        res = client.get(
            "/admin/applications?page=2&limit=5",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res.status_code == 200
        body = res.json()
        assert body["page"] == 2
        assert body["limit"] == 5

    def test_pagination_invalid_page(self, client, admin_token):
        """page=0 is rejected with 422."""
        res = client.get(
            "/admin/applications?page=0",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res.status_code == 422

    def test_pagination_limit_too_large(self, client, admin_token):
        """limit > 10000 is rejected with 422."""
        res = client.get(
            "/admin/applications?limit=10001",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res.status_code == 422


# ── 4. Email Notifications ────────────────────────────────────────────────────

class TestEmailNotifications:
    def test_email_sent_on_approval(self, client, student_token, admin_token, room):
        """Approving an application triggers send_application_approved."""
        apply_res = _apply(client, student_token)
        app_id = apply_res.json()["id"]

        with patch("app.routers.admin.send_application_approved") as mock_approved:
            client.patch(
                f"/admin/applications/{app_id}/status",
                json={"status": "approved"},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            mock_approved.assert_called_once()
            args = mock_approved.call_args[0]
            assert "student@test.ma" in args[0]  # email

    def test_email_sent_on_rejection(self, client, student_token, admin_token, room):
        """Rejecting an application triggers send_application_rejected."""
        apply_res = _apply(client, student_token)
        app_id = apply_res.json()["id"]

        with patch("app.routers.admin.send_application_rejected") as mock_rejected:
            client.patch(
                f"/admin/applications/{app_id}/status",
                json={"status": "rejected"},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            mock_rejected.assert_called_once()

    def test_no_email_on_pending(self, client, student_token, admin_token, room):
        """Setting status back to pending does not trigger any email."""
        apply_res = _apply(client, student_token)
        app_id = apply_res.json()["id"]

        with patch("app.routers.admin.send_application_approved") as mock_a, \
             patch("app.routers.admin.send_application_rejected") as mock_r:
            client.patch(
                f"/admin/applications/{app_id}/status",
                json={"status": "pending"},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            mock_a.assert_not_called()
            mock_r.assert_not_called()

    def test_reset_email_sent(self, client, db_session):
        """forgot-password triggers send_password_reset with the user's email."""
        client.post("/auth/register", json={"email": "notify@test.ma", "password": "Pass@1"})

        with patch("app.routers.auth.send_password_reset") as mock_reset:
            client.post("/auth/forgot-password", json={"email": "notify@test.ma"})
            mock_reset.assert_called_once()
            args = mock_reset.call_args[0]
            assert args[0] == "notify@test.ma"
