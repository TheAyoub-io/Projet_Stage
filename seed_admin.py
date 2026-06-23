"""
Seed script to create the initial admin user in the database.
Run this once after setting up the database:

    python seed_admin.py

"""
import sys
import os

# Ensure the project root is in the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.database import SessionLocal, engine, Base
from app.models.models import User, UserRole
from app.auth.security import get_password_hash

# ── Configure your admin credentials here ──────────────────────────────────
ADMIN_EMAIL    = "tarikkhalfaoui4@gmail.com"
ADMIN_PASSWORD = "spark_sql"
# ───────────────────────────────────────────────────────────────────────────

def seed_admin():
    # Create all tables if they don't exist yet
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing:
            print(f"[INFO] Admin user '{ADMIN_EMAIL}' already exists. Skipping.")
            return

        admin = User(
            email=ADMIN_EMAIL,
            hashed_password=get_password_hash(ADMIN_PASSWORD),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"[SUCCESS] Admin user created:")
        print(f"          Email    : {ADMIN_EMAIL}")
        print(f"          Password : {ADMIN_PASSWORD}")
        print(f"          Role     : {admin.role}")
        print()
        print("[WARNING] Change the password after first login!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
