"""
conftest.py — shared pytest fixtures.

Strategy:
  - Use an in-memory SQLite database so tests never need a running PostgreSQL server.
  - Override the `get_db` dependency for every test so each test gets a fresh,
    isolated database session.
  - Provide helper fixtures: `client`, `student_token`, `admin_token`.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.models.database import Base, get_db
from app.models.models import User, UserRole
from app.auth.security import get_password_hash

# ── In-memory SQLite engine ───────────────────────────────────────────────
SQLALCHEMY_TEST_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False}   # required for SQLite
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── Fixtures ──────────────────────────────────────────────────────────────

@pytest.fixture(scope="function", autouse=True)
def setup_db():
    """Create all tables before each test and drop them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(setup_db):
    """Return a fresh DB session per test, bound to the test engine."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client(db_session):
    """TestClient with the get_db dependency overridden to use SQLite."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── User helpers ──────────────────────────────────────────────────────────

STUDENT_EMAIL    = "student@test.ma"
STUDENT_PASSWORD = "Student@123"
ADMIN_EMAIL      = "admin@test.ma"
ADMIN_PASSWORD   = "Admin@123"


@pytest.fixture
def student_token(client, db_session):
    """Register a student and return their JWT token."""
    res = client.post("/auth/register", json={
        "email": STUDENT_EMAIL,
        "password": STUDENT_PASSWORD
    })
    assert res.status_code == 201
    login = client.post("/auth/login", json={
        "email": STUDENT_EMAIL,
        "password": STUDENT_PASSWORD
    })
    assert login.status_code == 200
    return login.json()["access_token"]


@pytest.fixture
def admin_token(client, db_session):
    """Create an admin user directly in DB and return their JWT token."""
    admin = User(
        email=ADMIN_EMAIL,
        hashed_password=get_password_hash(ADMIN_PASSWORD),
        role=UserRole.ADMIN
    )
    db_session.add(admin)
    db_session.commit()

    login = client.post("/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert login.status_code == 200
    return login.json()["access_token"]


@pytest.fixture
def room(db_session):
    """Create a room with capacity to allow approvals."""
    from app.models.models import Room
    room = Room(room_number="Test Room 101", capacity=10, gender_type="Male", student_section="CPGE", category="A")
    db_session.add(room)
    db_session.commit()
    return room
