import sys
sys.path.append('.')
from sqlalchemy import text
from app.models.database import engine

with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
    try:
        conn.execute(text("ALTER TYPE applicationstatus ADD VALUE 'AWAITING_RECEIPT';"))
        print("Added AWAITING_RECEIPT")
    except Exception as e:
        print(f"Error adding AWAITING_RECEIPT: {e}")

    try:
        # Just in case we also need uppercase INCOMPLETE but fix_appstatus_enum already renamed it
        pass
    except Exception as e:
        pass
