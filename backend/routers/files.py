from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
import os
from deps import get_current_user
import models
from watermark import UPLOAD_DIR

router = APIRouter(tags=["files"])


@router.get("/uploads/{filename}")
def serve_file(filename: str, current_user: models.User = Depends(get_current_user)):
    # Trainees always get the watermarked version
    if current_user.role == "trainee":
        wm = "wm_" + filename
        wm_path = os.path.join(UPLOAD_DIR, wm)
        if os.path.exists(wm_path):
            return FileResponse(wm_path)
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found")
    return FileResponse(file_path)
