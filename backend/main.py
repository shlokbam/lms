from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, notifications, trainer, trainee, progress, files

app = FastAPI(
    title="Eagle Security LMS API",
    description="Backend API for Eagle Industrial Services Learning Management System",
    version="2.0.0",
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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
