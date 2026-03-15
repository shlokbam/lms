from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from typing import Optional
import os

from auth import decode_token
from database import get_db
from sqlalchemy.orm import Session
import models
from watermark import UPLOAD_DIR

router = APIRouter(tags=["files"])


def _get_user_from_request(token: Optional[str], db: Session) -> Optional[models.User]:
    """Accept JWT from query param ?token=... (for direct browser navigation)"""
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None
    user = db.query(models.User).filter_by(id=int(payload.get("sub", 0))).first()
    return user


@router.get("/uploads/{filename}")
def serve_file(
    filename: str,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    # Accept auth via query param (direct browser nav) or fall back to unauthenticated
    current_user = _get_user_from_request(token, db)

    if current_user and current_user.role == "trainee":
        # Trainees get the watermarked version
        wm = "wm_" + filename
        wm_path = os.path.join(UPLOAD_DIR, wm)
        if os.path.exists(wm_path):
            return FileResponse(wm_path)

    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found")
    return FileResponse(file_path)
