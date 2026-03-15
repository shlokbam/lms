from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from deps import get_current_user
import models, schemas

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=List[schemas.NotificationOut])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notifs = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).limit(60).all()
    # Mark all as read
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).update({"is_read": True})
    db.commit()
    return notifs


@router.get("/unread")
def unread_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    count = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).count()
    items = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).limit(8).all()
    return {"count": count, "items": [schemas.NotificationOut.from_orm(n) for n in items]}


@router.post("/mark-read")
def mark_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).update({"is_read": True})
    db.commit()
    return {"status": "ok"}
