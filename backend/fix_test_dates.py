from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/eagle_lms")
engine = create_engine(DATABASE_URL)

def increase_max_attempts():
    with engine.connect() as conn:
        print("Increasing max attempts for all tests to 3...")
        conn.execute(text("UPDATE tests SET max_attempts = 3"))
        conn.commit()
        print("Success! You can now take each test up to 3 times for testing purposes.")

if __name__ == "__main__":
    increase_max_attempts()
