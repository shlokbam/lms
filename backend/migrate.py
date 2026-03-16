from database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE modules ADD COLUMN training_type VARCHAR(50) DEFAULT 'self_paced'"))
            print("Added training_type")
        except Exception as e:
            print("Error adding training_type:", e)
        
        try:
            conn.execute(text("ALTER TABLE modules ADD COLUMN meet_link VARCHAR(500) DEFAULT NULL"))
            print("Added meet_link")
        except Exception as e:
            print("Error adding meet_link:", e)
        conn.commit()
        print("Migration done")
except Exception as e:
    print("Connection error:", e)
