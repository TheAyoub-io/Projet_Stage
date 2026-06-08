import sqlite3

def add_col():
    conn = sqlite3.connect('test.db')
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE applications ADD COLUMN signature TEXT;")
        conn.commit()
        print("Column 'signature' added successfully.")
    except sqlite3.OperationalError as e:
        print(f"Error (maybe column exists?): {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    add_col()
