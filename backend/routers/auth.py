from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth import hash_password, verify_password, create_access_token
from deps import get_current_user
import models, schemas

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=schemas.TokenResponse)
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.email == body.email,
        models.User.password == hash_password(body.password)
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(user.id), "role": user.role, "name": user.name})
    return schemas.TokenResponse(access_token=token, role=user.role, name=user.name, user_id=user.id)


@router.post("/register", response_model=schemas.TokenResponse)
def register(body: schemas.RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        name=body.name, email=body.email,
        password=hash_password(body.password),
        role=body.role, phone=body.phone or "", department=body.department or ""
    )
    db.add(user); db.commit(); db.refresh(user)
    # Auto-enroll in all published modules
    published = db.query(models.Module).filter(models.Module.status == "published").all()
    for m in published:
        exists = db.query(models.Enrollment).filter_by(module_id=m.id, trainee_id=user.id).first()
        if not exists:
            db.add(models.Enrollment(module_id=m.id, trainee_id=user.id))
    db.commit()
    token = create_access_token({"sub": str(user.id), "role": user.role, "name": user.name})
    return schemas.TokenResponse(access_token=token, role=user.role, name=user.name, user_id=user.id)


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user
