from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from deps import get_current_user
import models, schemas

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.post("/update")
def update_progress(body: schemas.ProgressUpdate,
                    db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user)):
    now = datetime.now()
    existing = db.query(models.Progress).filter_by(
        module_id=body.module_id,
        trainee_id=current_user.id,
        material_id=body.material_id
    ).first()
    if existing:
        existing.completed = bool(body.completed)
        existing.watch_percent = body.watch_percent
        existing.updated_at = now
    else:
        db.add(models.Progress(
            module_id=body.module_id, trainee_id=current_user.id,
            material_id=body.material_id,
            completed=bool(body.completed), watch_percent=body.watch_percent
        ))
    db.commit()
    return {"status": "ok"}
