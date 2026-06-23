import sys
sys.path.append('.')
from sqlalchemy import text
from app.models.database import engine

with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
    try:
        conn.execute(text("ALTER TYPE applicationstatus ADD VALUE 'awaiting_receipt';"))
        print("Added awaiting_receipt")
    except Exception as e:
        print(f"Error adding awaiting_receipt: {e}")

    try:
        conn.execute(text("ALTER TYPE applicationstatus ADD VALUE 'incomplete';"))
        print("Added incomplete")
    except Exception as e:
        print(f"Error adding incomplete: {e}")
