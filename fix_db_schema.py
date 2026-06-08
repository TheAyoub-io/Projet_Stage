import psycopg2

DATABASE_URL = 'postgresql://postgres:Kxsd2882@localhost:5432/internat_db'

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cur = conn.cursor()

try:
    cur.execute("ALTER TABLE applications ADD COLUMN is_paid BOOLEAN DEFAULT FALSE;")
    print('✓ Added is_paid column')
except Exception as e:
    print('is_paid error:', e)

try:
    cur.execute("ALTER TABLE applications ADD COLUMN has_new_message BOOLEAN DEFAULT FALSE;")
    print('✓ Added has_new_message column')
except Exception as e:
    print('has_new_message error:', e)

conn.close()
print('Database schema updated!')
