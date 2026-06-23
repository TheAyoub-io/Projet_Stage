import os
import sys

# Ensure the project root is in the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.models.database import SessionLocal, engine, Base
from app.models.models import Room

def setup():
    # 1. Create new tables (like 'rooms')
    Base.metadata.create_all(bind=engine)
    print("Tables ensured.")

    db = SessionLocal()
    try:
        # 2. Add new columns to rooms if they don't exist
        try:
            db.execute(text("ALTER TABLE rooms ADD COLUMN student_section VARCHAR(20) DEFAULT 'LYCEE' NOT NULL;"))
            db.commit()
            print("Column student_section added.")
        except Exception:
            db.rollback()
            
        try:
            db.execute(text("ALTER TABLE rooms ADD COLUMN category VARCHAR(5);"))
            db.commit()
            print("Column category added.")
        except Exception:
            db.rollback()

        # 3. Add room_id to applications if it doesn't exist
        try:
            db.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL;"))
            db.commit()
            print("Column room_id ensured on applications table.")
        except Exception:
            db.rollback()

        # 4. Seed rooms
        count = db.query(Room).count()
        if count < 80:
            print("Seeding rooms...")
            rooms_to_add = []
            
            # --- CPGE Rooms ---
            # Category A: 20 rooms, Male, capacity 3
            for i in range(1, 21):
                rooms_to_add.append(Room(room_number=f"A-{i:03d}", capacity=3, gender_type="Male", student_section="CPGE", category="A"))
            
            # Category B: 20 rooms, Male, capacity 3
            for i in range(1, 21):
                rooms_to_add.append(Room(room_number=f"B-{i:03d}", capacity=3, gender_type="Male", student_section="CPGE", category="B"))
            
            # Category C: 20 rooms, Female, capacity 3
            for i in range(1, 21):
                rooms_to_add.append(Room(room_number=f"C-{i:03d}", capacity=3, gender_type="Female", student_section="CPGE", category="C"))
            
            # Category D: 20 rooms, Female, capacity 3
            for i in range(1, 21):
                rooms_to_add.append(Room(room_number=f"D-{i:03d}", capacity=3, gender_type="Female", student_section="CPGE", category="D"))
                
            # --- Lycée Technique Rooms ---
            # Just an example of some rooms for the Lycée
            for i in range(1, 11):
                rooms_to_add.append(Room(room_number=f"L-M{i:02d}", capacity=4, gender_type="Male", student_section="LYCEE", category=None))
            for i in range(1, 11):
                rooms_to_add.append(Room(room_number=f"L-F{i:02d}", capacity=4, gender_type="Female", student_section="LYCEE", category=None))
                
            # Note: If some rooms already exist, they might conflict with unique constraint on room_number.
            # In a real scenario, you'd check for existing rooms. Here we just add if count is very low.
            # Let's delete existing to be safe and have a clean state for testing if count < 80
            db.query(Room).delete()
            db.commit()
            
            db.add_all(rooms_to_add)
            db.commit()
            print("Rooms seeded successfully.")
        else:
            print(f"Rooms already exist ({count} rooms), skipping seed.")
            
    except Exception as e:
        print(f"Error during setup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    setup()
