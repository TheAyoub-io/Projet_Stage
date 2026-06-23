import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.models.database import SessionLocal, engine

def drop_cin_unique():
    db = SessionLocal()
    try:
        # PostgreSQL specific query to find unique constraint on 'profiles' table for 'cin' column
        query = """
        SELECT
            tc.constraint_name
        FROM
            information_schema.table_constraints AS tc
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
        WHERE
            tc.table_name = 'profiles'
            AND tc.constraint_type = 'UNIQUE'
            AND ccu.column_name = 'cin';
        """
        
        result = db.execute(text(query)).fetchall()
        
        if not result:
            print("No UNIQUE constraint found for 'cin' on 'profiles' table.")
        else:
            for row in result:
                constraint_name = row[0]
                print(f"Dropping constraint: {constraint_name}")
                drop_query = f"ALTER TABLE profiles DROP CONSTRAINT {constraint_name};"
                db.execute(text(drop_query))
            db.commit()
            print("Successfully dropped UNIQUE constraint(s) on 'cin'.")
            
    except Exception as e:
        print(f"Error dropping constraint: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    drop_cin_unique()
