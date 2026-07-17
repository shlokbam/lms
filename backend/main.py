from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, notifications, trainer, trainee, progress, files
from database import engine, Base, SessionLocal
from auth import hash_password
import models

# Auto-create database tables
Base.metadata.create_all(bind=engine)

# Seed default demo credentials
db = SessionLocal()
try:
    if not db.query(models.User).filter_by(email="trainer@eagle.com").first():
        db.add(models.User(
            name="Demo Trainer",
            email="trainer@eagle.com",
            password=hash_password("trainer123"),
            role="trainer"
        ))
    if not db.query(models.User).filter_by(email="trainee@eagle.com").first():
        db.add(models.User(
            name="Demo Trainee",
            email="trainee@eagle.com",
            password=hash_password("trainee123"),
            role="trainee"
        ))
    db.commit()
finally:
    db.close()


app = FastAPI(
    title="Eagle Security LMS API",
    description="Backend API for Eagle Industrial Services Learning Management System",
    version="2.0.0",
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth.router)
app.include_router(notifications.router)
app.include_router(trainer.router)
app.include_router(trainee.router)
app.include_router(progress.router)
app.include_router(files.router)


@app.get("/")
def root():
    return {"message": "Eagle LMS API is running", "docs": "/docs"}
