from fastapi.testclient import TestClient
import sys
import os

# Ensure the backend directory is in the import path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Eagle LMS API is running", "docs": "/docs"}
