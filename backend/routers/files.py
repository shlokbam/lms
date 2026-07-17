from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from typing import Optional
import os

from auth import decode_token
from database import get_db
from sqlalchemy.orm import Session
import models
from watermark import UPLOAD_DIR, watermark_pdf, watermark_image
from utils.s3 import download_file_from_s3

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

    file_path = os.path.join(UPLOAD_DIR, filename)
    # Check locally first; if not found, pull from S3
    if not os.path.exists(file_path):
        if not download_file_from_s3(filename, file_path):
            raise HTTPException(404, "File not found")

    if current_user and current_user.role == "trainee":
        # Trainees get a personalized watermarked version
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext in {"pdf", "png", "jpg", "jpeg", "webp"}:
            wm_filename = f"wm_{current_user.id}_{filename}"
            wm_path = os.path.join(UPLOAD_DIR, wm_filename)
            
            # Generate watermark if it doesn't already exist for this user + file
            if not os.path.exists(wm_path):
                text = f"Eagle Securities | {current_user.email}"
                if ext == "pdf":
                    watermark_pdf(file_path, wm_path, text)
                else:
                    watermark_image(file_path, wm_path, text)
            
            return FileResponse(wm_path)

    return FileResponse(file_path)
