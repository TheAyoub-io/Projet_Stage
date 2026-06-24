"""
test_auth.py — Tests for POST /auth/register and POST /auth/login.
"""
import pytest


class TestRegister:
    def test_register_success(self, client):
        """A new student account is created and returns 201."""
        res = client.post("/auth/register", json={
            "email": "new@test.ma",
            "password": "Password@123"
        })
        assert res.status_code == 201
        body = res.json()
        assert body["email"] == "new@test.ma"
        assert body["role"] == "student"
        assert "id" in body
        assert "hashed_password" not in body  # never expose password hash

    def test_register_duplicate_email(self, client):
        """Registering the same email twice returns 400."""
        payload = {"email": "dup@test.ma", "password": "Pass@123"}
        client.post("/auth/register", json=payload)
        res = client.post("/auth/register", json=payload)
        assert res.status_code == 400
        assert "already registered" in res.json()["detail"]

    def test_register_invalid_email(self, client):
        """An invalid email format returns 422 Unprocessable Entity."""
        res = client.post("/auth/register", json={
            "email": "not-an-email",
            "password": "Pass@123"
        })
        assert res.status_code == 422


class TestLogin:
    def test_login_success(self, client, student_token):
        """A valid login returns an access token."""
        assert student_token is not None
        assert isinstance(student_token, str)
        assert len(student_token) > 10

    def test_login_wrong_password(self, client):
        """Wrong password returns 401 Unauthorized."""
        client.post("/auth/register", json={
            "email": "user@test.ma",
            "password": "Correct@123"
        })
        res = client.post("/auth/login", json={
            "email": "user@test.ma",
            "password": "Wrong@123"
        })
        assert res.status_code == 401
        assert "Incorrect" in res.json()["detail"]

    def test_login_nonexistent_user(self, client):
        """Logging in with an email that was never registered returns 401."""
        res = client.post("/auth/login", json={
            "email": "ghost@test.ma",
            "password": "Pass@123"
        })
        assert res.status_code == 401

    def test_login_returns_bearer_type(self, client, student_token):
        """The token type in the response is 'bearer'."""
        res = client.post("/auth/login", json={
            "email": "student@test.ma",
            "password": "Student@123"
        })
        assert res.json()["token_type"] == "bearer"
