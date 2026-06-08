import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def run_migration():
    load_dotenv()
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/internat_db")
    
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print(f"Checking for missing columns in {DATABASE_URL}...")
        # Add gender to profiles if missing
        try:
            conn.execute(text("ALTER TABLE profiles ADD COLUMN gender VARCHAR"))
            conn.commit()
            print("Added 'gender' column to 'profiles' table.")
        except Exception as e:
            conn.rollback()
            if "already exists" in str(e):
                print("'gender' column already exists.")
            else:
                print(f"Error adding gender column: {e}")

        # Add signature to applications if missing
        try:
            conn.execute(text("ALTER TABLE applications ADD COLUMN signature TEXT"))
            conn.commit()
            print("Added 'signature' column to 'applications' table.")
        except Exception as e:
            conn.rollback()
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("'signature' column already exists in 'applications'.")
            else:
                print(f"Error adding signature column: {e}")

        # Ensure AuditLog table exists (Manually since I don't want to import models to avoid path issues)
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER,
                    action VARCHAR,
                    details VARCHAR,
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()
            print("Ensured 'audit_logs' table exists.")
        except Exception as e:
            conn.rollback()
            print(f"Error creating audit_logs table: {e}")

        print("Database sync complete.")

if __name__ == "__main__":
    run_migration()
