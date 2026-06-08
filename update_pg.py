from sqlalchemy import text
from app.models.database import engine

def main():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE applications ADD COLUMN signature TEXT;"))
            conn.commit()
            print("Column 'signature' added to 'applications' table.")
        except Exception as e:
            print(f"Failed (column might exist): {e}")

if __name__ == '__main__':
    main()
