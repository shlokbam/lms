from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json, os, shutil

from database import get_db
from deps import get_current_user
from watermark import UPLOAD_DIR
import models, schemas
from auth import hash_password, verify_password

router = APIRouter(prefix="/api/trainee", tags=["trainee"])

PHASE_ORDER = {"pre": 1, "live": 2, "post": 3}


def _get_phase(module) -> str:
    now = datetime.now()
    if not module.start_datetime:
        return "upcoming"
    if now < module.start_datetime:
        return "pre"
    if module.end_datetime and now <= module.end_datetime:
        return "live"
    return "post"


# ─── Dashboard ───────────────────────────────────────────────────────────────
@router.get("/dashboard")
def trainee_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    now = datetime.now()
    enrollments = db.execute(
        """SELECT m.* FROM modules m JOIN enrollments e ON m.id=e.module_id
           WHERE e.trainee_id=:uid AND m.status='published' ORDER BY m.start_datetime""",
        {"uid": current_user.id}
    ).fetchall()

    upcoming, ongoing, completed_list = [], [], []
    for row in enrollments:
        m = db.query(models.Module).filter_by(id=row[0]).first()
        phase = _get_phase(m)
        data = schemas.ModuleOut.from_orm(m).dict()
        data["phase"] = phase
        if phase == "pre":
            upcoming.append(data)
        elif phase == "live":
            ongoing.append(data)
        else:
            completed_list.append(data)

    total_tests = db.query(models.TestAttempt).filter_by(trainee_id=current_user.id).count()
    passed_tests = db.query(models.TestAttempt).filter_by(trainee_id=current_user.id, passed=True).count()
    notifs = db.query(models.Notification).filter_by(user_id=current_user.id, is_read=False)\
               .order_by(models.Notification.created_at.desc()).limit(10).all()

    return {
        "upcoming": upcoming,
        "ongoing": ongoing,
        "completed": completed_list,
        "total_tests": total_tests,
        "passed_tests": passed_tests,
        "notifications": [schemas.NotificationOut.from_orm(n) for n in notifs],
    }


# ─── Module view ───────────────────────────────────────────────────────────────
@router.get("/module/{module_id}")
def trainee_module(module_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    module = db.query(models.Module).filter_by(id=module_id).first()
    if not module:
        raise HTTPException(404)
    if module.status != "published":
        raise HTTPException(403, "Module not available")
    enrollment = db.query(models.Enrollment).filter_by(module_id=module_id, trainee_id=current_user.id).first()
    if not enrollment:
        raise HTTPException(403, "Not enrolled")

    phase = _get_phase(module)
    chapters = db.query(models.Chapter).filter_by(module_id=module_id).order_by(models.Chapter.order_num).all()
    materials = db.query(models.Material).filter_by(module_id=module_id).order_by(models.Material.chapter_id, models.Material.order_num).all()
    tests = db.query(models.Test).filter_by(module_id=module_id).order_by(models.Test.created_at).all()
    prog_rows = db.query(models.Progress).filter_by(module_id=module_id, trainee_id=current_user.id).all()
    progress_map = {p.material_id: schemas.ProgressOut.from_orm(p).dict() for p in prog_rows}

    mat_by_chapter = {}
    for mat in materials:
        cid = mat.chapter_id or 0
        mat_by_chapter.setdefault(cid, []).append(schemas.MaterialOut.from_orm(mat).dict())

    attempts_map = {}
    for t in tests:
        att = db.query(models.TestAttempt).filter_by(test_id=t.id, trainee_id=current_user.id)\
                .order_by(models.TestAttempt.started_at.desc()).first()
        attempts_map[t.id] = schemas.TestAttemptOut.from_orm(att).dict() if att else None

    total_mats = len(materials)
    done_mats = sum(1 for m in materials if progress_map.get(m.id, {}).get("completed"))
    overall_pct = int(done_mats / total_mats * 100) if total_mats > 0 else 0

    return {
        "module": schemas.ModuleOut.from_orm(module).dict(),
        "phase": phase,
        "chapters": [schemas.ChapterOut.from_orm(c).dict() for c in chapters],
        "mat_by_chapter": mat_by_chapter,
        "tests": [schemas.TestOut.from_orm(t).dict() for t in tests],
        "progress_map": progress_map,
        "attempts_map": attempts_map,
        "overall_pct": overall_pct,
        "total_mats": total_mats,
        "done_mats": done_mats,
        "now_iso": datetime.now().isoformat(),
    }


# ─── Take / Submit test ────────────────────────────────────────────────────────
@router.get("/test/{test_id}")
def get_test_for_trainee(test_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    test = db.query(models.Test).filter_by(id=test_id).first()
    if not test:
        raise HTTPException(404)
    now = datetime.now()
    if test.start_datetime and now < test.start_datetime:
        raise HTTPException(403, "Test not started yet")
    if test.end_datetime and now > test.end_datetime:
        raise HTTPException(403, "Test window closed")
    existing = db.query(models.TestAttempt).filter_by(test_id=test_id, trainee_id=current_user.id).count()
    if existing >= test.max_attempts:
        raise HTTPException(403, "All attempts used")
    questions = db.query(models.Question).filter_by(test_id=test_id).all()
    return {
        "test": schemas.TestOut.from_orm(test).dict(),
        "questions": [schemas.QuestionOut.from_orm(q).dict() for q in questions],
    }


@router.post("/test/{test_id}/submit")
def submit_test(test_id: int, body: schemas.SubmitTestRequest,
                db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    test = db.query(models.Test).filter_by(id=test_id).first()
    if not test:
        raise HTTPException(404)
    questions = db.query(models.Question).filter_by(test_id=test_id).all()
    score = 0
    total = sum(q.marks for q in questions)
    answers_dict = {str(k): v for k, v in body.answers.items()}
    for q in questions:
        if answers_dict.get(str(q.id)) == q.correct_option:
            score += q.marks
    pct = (score / total * 100) if total > 0 else 0
    passed = pct >= test.passing_marks
    now = datetime.now()
    att = models.TestAttempt(
        test_id=test_id, trainee_id=current_user.id,
        score=score, total_marks=total, percentage=pct, passed=passed,
        answers=json.dumps(answers_dict), submitted_at=now
    )
    db.add(att); db.commit(); db.refresh(att)
    return {
        "score": score, "total": total, "percentage": pct, "passed": passed,
        "test": schemas.TestOut.from_orm(test).dict(),
        "questions": [schemas.QuestionOut.from_orm(q).dict() for q in questions],
        "answers": answers_dict,
    }


# ─── Calendar ─────────────────────────────────────────────────────────────────
@router.get("/calendar")
def trainee_calendar(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    modules = db.execute(
        """SELECT m.* FROM modules m JOIN enrollments e ON m.id=e.module_id
           WHERE e.trainee_id=:uid AND m.status='published'""",
        {"uid": current_user.id}
    ).fetchall()
    tests = db.execute(
        """SELECT t.*, m.title as module_title FROM tests t
           JOIN modules m ON t.module_id=m.id JOIN enrollments e ON m.id=e.module_id
           WHERE e.trainee_id=:uid""",
        {"uid": current_user.id}
    ).fetchall()

    events = []
    for row in modules:
        m = db.query(models.Module).filter_by(id=row[0]).first()
        if m and m.start_datetime:
            events.append({
                "title": m.title, "start": m.start_datetime.isoformat(),
                "end": m.end_datetime.isoformat() if m.end_datetime else None,
                "type": "module", "id": m.id, "color": m.color or "#3B5BDB"
            })
    for row in tests:
        t = db.query(models.Test).filter_by(id=row[0]).first()
        if t and t.start_datetime:
            events.append({
                "title": f"{t.test_type.title()} Test: {row[-1]}",
                "start": t.start_datetime.isoformat(),
                "end": t.end_datetime.isoformat() if t.end_datetime else None,
                "type": "test", "color": "#F79009"
            })
    return events


# ─── Profile ──────────────────────────────────────────────────────────────────
@router.get("/profile")
def trainee_profile(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    attempts = db.execute(
        """SELECT ta.*, t.title as test_title, t.test_type, m.title as module_title
           FROM test_attempts ta JOIN tests t ON ta.test_id=t.id JOIN modules m ON t.module_id=m.id
           WHERE ta.trainee_id=:uid ORDER BY ta.started_at DESC""",
        {"uid": current_user.id}
    ).fetchall()
    total_enrolled = db.query(models.Enrollment).filter_by(trainee_id=current_user.id).count()
    total_completed = db.query(models.Enrollment).filter_by(trainee_id=current_user.id, completed=True).count()
    avg = db.execute("SELECT AVG(percentage) FROM test_attempts WHERE trainee_id=:uid", {"uid": current_user.id}).scalar()
    return {
        "user": schemas.UserOut.from_orm(current_user).dict(),
        "attempts": [dict(zip(r.keys(), r)) for r in attempts],
        "total_enrolled": total_enrolled,
        "total_completed": total_completed,
        "avg_score": round(avg, 1) if avg else 0,
    }


@router.put("/profile")
def update_profile(body: schemas.ProfileUpdateRequest,
                   db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing = db.query(models.User).filter(
        models.User.email == body.email, models.User.id != current_user.id
    ).first()
    if existing:
        raise HTTPException(400, "Email already in use")
    current_user.name = body.name; current_user.email = body.email
    current_user.phone = body.phone; current_user.department = body.department
    db.commit()
    return {"ok": True, "name": current_user.name}


@router.put("/profile/password")
def change_password(body: schemas.PasswordChangeRequest,
                    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not verify_password(body.current_password, current_user.password):
        raise HTTPException(400, "Current password is incorrect")
    if body.new_password != body.confirm_password:
        raise HTTPException(400, "New passwords do not match")
    if len(body.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    current_user.password = hash_password(body.new_password)
    db.commit()
    return {"ok": True}


@router.post("/profile/upload-pic")
async def upload_profile_pic(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in {"jpg", "jpeg", "png", "webp"}:
        raise HTTPException(400, "Only jpg, png, webp allowed")
    fname = f"avatar_{current_user.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{ext}"
    path = os.path.join(UPLOAD_DIR, fname)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    current_user.profile_pic = fname
    db.commit()
    return {"ok": True, "profile_pic": fname}
