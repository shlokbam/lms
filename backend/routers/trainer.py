from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc, text
from typing import List, Optional
from datetime import datetime
import os, shutil

from database import get_db
from deps import get_current_user, require_trainer
from watermark import watermark_image, watermark_pdf, UPLOAD_DIR
import models, schemas

router = APIRouter(prefix="/api/trainer", tags=["trainer"])

ALLOWED_EXT = {'pdf', 'ppt', 'pptx', 'mp4', 'mov', 'avi', 'mkv', 'webm', 'png', 'jpg', 'jpeg'}


def _notify_trainees(db, title, body, ntype="info", link=""):
    trainees = db.query(models.User).filter(models.User.role == "trainee").all()
    for t in trainees:
        db.add(models.Notification(user_id=t.id, title=title, body=body, type=ntype, link=link))


def _module_phase(module):
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
def trainer_dashboard(db: Session = Depends(get_db), trainer: models.User = Depends(require_trainer)):
    now = datetime.now()
    modules = db.query(models.Module).filter(models.Module.trainer_id == trainer.id).order_by(models.Module.start_datetime).all()
    total_trainees = db.query(models.User).filter(models.User.role == "trainee").count()
    upcoming = [m for m in modules if m.start_datetime and m.start_datetime > now]
    ongoing = [m for m in modules if m.start_datetime and m.end_datetime and m.start_datetime <= now <= m.end_datetime]

    recent = db.execute(
        text("""SELECT u.name, m.title, e.enrolled_at FROM enrollments e
           JOIN users u ON e.trainee_id=u.id JOIN modules m ON e.module_id=m.id
           WHERE m.trainer_id=:tid ORDER BY e.enrolled_at DESC LIMIT 6"""),
        {"tid": trainer.id}
    ).fetchall()

    mod_stats = {}
    for m in modules:
        total_e = db.query(models.Enrollment).filter_by(module_id=m.id).count()
        done_e = db.query(models.Enrollment).filter_by(module_id=m.id, completed=True).count()
        mod_stats[m.id] = {"total": total_e, "done": done_e}

    return {
        "modules": [schemas.ModuleOut.from_orm(m) for m in modules],
        "total_trainees": total_trainees,
        "total_modules": len(modules),
        "upcoming": len(upcoming),
        "ongoing": len(ongoing),
        "recent": [{"name": r[0], "title": r[1], "enrolled_at": str(r[2])} for r in recent],
        "mod_stats": mod_stats,
        "now": now.isoformat(),
    }


# ─── Modules list ─────────────────────────────────────────────────────────────
@router.get("/modules")
def list_modules(db: Session = Depends(get_db), trainer: models.User = Depends(require_trainer)):
    now = datetime.now()
    modules = db.query(models.Module).filter(models.Module.trainer_id == trainer.id).order_by(models.Module.start_datetime).all()
    mod_stats = {}
    for m in modules:
        ch = db.query(models.Chapter).filter_by(module_id=m.id).count()
        mat = db.query(models.Material).filter_by(module_id=m.id).count()
        tr = db.query(models.Enrollment).filter_by(module_id=m.id).count()
        mod_stats[m.id] = {"chapters": ch, "materials": mat, "trainees": tr}
    return {"modules": [schemas.ModuleOut.from_orm(m) for m in modules], "mod_stats": mod_stats, "now": now.isoformat()}


# ─── Module detail ────────────────────────────────────────────────────────────
@router.get("/module/{module_id}")
def module_detail(module_id: int, db: Session = Depends(get_db), trainer: models.User = Depends(require_trainer)):
    module = db.query(models.Module).filter_by(id=module_id).first()
    if not module:
        raise HTTPException(404, "Module not found")
    chapters = db.query(models.Chapter).filter_by(module_id=module_id).order_by(models.Chapter.order_num).all()
    materials = db.query(models.Material).filter_by(module_id=module_id).order_by(models.Material.chapter_id, models.Material.order_num).all()
    tests = db.query(models.Test).filter_by(module_id=module_id).order_by(models.Test.created_at).all()
    enrollments = db.execute(
        text("""SELECT u.name, u.email, u.department, e.enrolled_at, e.completed, e.trainee_id
           FROM enrollments e JOIN users u ON e.trainee_id=u.id WHERE e.module_id=:mid"""),
        {"mid": module_id}
    ).fetchall()

    mat_by_chapter = {}
    for mat in materials:
        cid = mat.chapter_id or 0
        mat_by_chapter.setdefault(cid, []).append(schemas.MaterialOut.from_orm(mat))

    return {
        "module": schemas.ModuleOut.from_orm(module),
        "chapters": [schemas.ChapterOut.from_orm(c) for c in chapters],
        "mat_by_chapter": {k: [m.dict() for m in v] for k, v in mat_by_chapter.items()},
        "tests": [schemas.TestOut.from_orm(t) for t in tests],
        "enrollments": [{"name": r[0], "email": r[1], "department": r[2],
                         "enrolled_at": str(r[3]), "completed": bool(r[4]), "trainee_id": r[5]} for r in enrollments],
    }


# ─── Schedule module ──────────────────────────────────────────────────────────
@router.post("/module/{module_id}/schedule")
def schedule_module(module_id: int, body: schemas.ScheduleRequest,
                    db: Session = Depends(get_db), trainer: models.User = Depends(require_trainer)):
    module = db.query(models.Module).filter_by(id=module_id).first()
    if not module:
        raise HTTPException(404)
    old_status = module.status
    module.start_datetime = datetime.fromisoformat(body.start_datetime)
    module.end_datetime   = datetime.fromisoformat(body.end_datetime)
    module.status = body.status
    module.color  = body.color
    if body.status == "published" and old_status != "published":
        _notify_trainees(db, f"📚 Module Scheduled: {module.title}",
                         f'"{module.title}" has been scheduled starting {body.start_datetime[:10]}.',
                         "module_published", f"/trainee/module/{module_id}")
    db.commit()
    return {"ok": True}


# ─── Chapters ─────────────────────────────────────────────────────────────────
@router.post("/module/{module_id}/chapter/add")
def add_chapter(module_id: int, body: schemas.AddChapterRequest,
                db: Session = Depends(get_db), trainer: models.User = Depends(require_trainer)):
    count = db.query(models.Chapter).filter_by(module_id=module_id).count()
    ch = models.Chapter(module_id=module_id, title=body.chapter_title, order_num=count)
    db.add(ch); db.commit(); db.refresh(ch)
    return schemas.ChapterOut.from_orm(ch)


@router.delete("/module/{module_id}/chapter/{chapter_id}")
def delete_chapter(module_id: int, chapter_id: int,
                   db: Session = Depends(get_db), trainer: models.User = Depends(require_trainer)):
    db.query(models.Material).filter_by(chapter_id=chapter_id).delete()
    db.query(models.Chapter).filter_by(id=chapter_id).delete()
    db.commit()
    return {"ok": True}


@router.delete("/module/{module_id}")
def delete_module(module_id: int, db: Session = Depends(get_db), trainer: models.User = Depends(require_trainer)):
    db.query(models.Module).filter_by(id=module_id).delete()
    db.commit()
    return {"ok": True}


# ─── Upload material ──────────────────────────────────────────────────────────
@router.post("/module/{module_id}/upload")
async def upload_material(
    module_id: int,
    file: UploadFile = File(...),
    title: str = Form(...),
    phase: str = Form("pre"),
    chapter_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    trainer: models.User = Depends(require_trainer)
):
    module = db.query(models.Module).filter_by(id=module_id).first()
    if not module:
        raise HTTPException(404)
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, "File type not allowed")

    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    safe_name = "".join(c for c in file.filename if c.isalnum() or c in "._-")
    fname = f"{module_id}_{ts}_{safe_name}"
    orig_path = os.path.join(UPLOAD_DIR, fname)

    with open(orig_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    ftype = ("video" if ext in {"mp4", "mov", "avi", "mkv", "webm"}
             else "pdf" if ext == "pdf"
             else "ppt" if ext in {"ppt", "pptx"}
             else "image")

    wm_fname = f"wm_{fname}"
    wm_path = os.path.join(UPLOAD_DIR, wm_fname)
    if ftype == "pdf":
        watermark_pdf(orig_path, wm_path)
    elif ftype == "image":
        watermark_image(orig_path, wm_path)
    else:
        shutil.copy(orig_path, wm_path)

    count = db.query(models.Material).filter_by(module_id=module_id, chapter_id=chapter_id).count()
    mat = models.Material(module_id=module_id, chapter_id=chapter_id, title=title,
                          file_path=fname, watermarked_path=wm_fname,
                          file_type=ftype, release_phase=phase, order_num=count)
    db.add(mat); db.commit(); db.refresh(mat)
    _notify_trainees(db, f"📎 New Material: {title}",
                     f'"{title}" has been added to "{module.title}".',
                     "material_upload", f"/trainee/module/{module_id}")
    db.commit()
    return schemas.MaterialOut.from_orm(mat)


@router.delete("/module/{module_id}/material/{mat_id}")
def delete_material(module_id: int, mat_id: int,
                    db: Session = Depends(get_db), trainer: models.User = Depends(require_trainer)):
    mat = db.query(models.Material).filter_by(id=mat_id).first()
    if mat:
        for fname in [mat.file_path, mat.watermarked_path]:
            if fname:
                p = os.path.join(UPLOAD_DIR, fname)
                if os.path.exists(p):
                    os.remove(p)
        db.delete(mat); db.commit()
    return {"ok": True}


# ─── Tests ────────────────────────────────────────────────────────────────────
@router.post("/module/{module_id}/test", response_model=schemas.TestDetailOut)
def create_test(module_id: int, body: schemas.TestCreateRequest,
                db: Session = Depends(get_db), trainer: models.User = Depends(require_trainer)):
    module = db.query(models.Module).filter_by(id=module_id).first()
    if not module:
        raise HTTPException(404)
    test = models.Test(
        module_id=module_id, title=body.title, test_type=body.test_type,
        duration_minutes=body.duration,
        start_datetime=datetime.fromisoformat(body.start_datetime),
        end_datetime=datetime.fromisoformat(body.end_datetime),
        passing_marks=body.passing_marks, max_attempts=body.max_attempts
    )
    db.add(test); db.commit(); db.refresh(test)
    for q in body.questions:
        db.add(models.Question(test_id=test.id, question_text=q.text,
                               option_a=q.a, option_b=q.b, option_c=q.c, option_d=q.d,
                               correct_option=q.correct, marks=q.marks))
    db.commit()
    _notify_trainees(db, f"📝 New Test: {body.title}",
                     f'A {body.test_type}-test has been added to "{module.title}".',
                     "test_created", f"/trainee/module/{module_id}")
    db.commit(); db.refresh(test)
    test.questions = db.query(models.Question).filter_by(test_id=test.id).all()
    return schemas.TestDetailOut.from_orm(test)


@router.get("/module/{module_id}/test/{test_id}", response_model=schemas.TestDetailOut)
def get_test(module_id: int, test_id: int,
             db: Session = Depends(get_db), trainer: models.User = Depends(require_trainer)):
    test = db.query(models.Test).filter_by(id=test_id, module_id=module_id).first()
    if not test:
        raise HTTPException(404)
    test.questions = db.query(models.Question).filter_by(test_id=test_id).all()
    return schemas.TestDetailOut.from_orm(test)


@router.put("/module/{module_id}/test/{test_id}", response_model=schemas.TestDetailOut)
def update_test(module_id: int, test_id: int, body: schemas.TestCreateRequest,
                db: Session = Depends(get_db), trainer: models.User = Depends(require_trainer)):
    test = db.query(models.Test).filter_by(id=test_id, module_id=module_id).first()
    if not test:
        raise HTTPException(404)
    test.title = body.title; test.test_type = body.test_type
    test.duration_minutes = body.duration
    test.start_datetime = datetime.fromisoformat(body.start_datetime)
    test.end_datetime = datetime.fromisoformat(body.end_datetime)
    test.passing_marks = body.passing_marks; test.max_attempts = body.max_attempts
    db.query(models.Question).filter_by(test_id=test_id).delete()
    for q in body.questions:
        db.add(models.Question(test_id=test_id, question_text=q.text,
                               option_a=q.a, option_b=q.b, option_c=q.c, option_d=q.d,
                               correct_option=q.correct, marks=q.marks))
    db.commit(); db.refresh(test)
    test.questions = db.query(models.Question).filter_by(test_id=test_id).all()
    return schemas.TestDetailOut.from_orm(test)


@router.delete("/module/{module_id}/test/{test_id}")
def delete_test(module_id: int, test_id: int,
                db: Session = Depends(get_db), trainer: models.User = Depends(require_trainer)):
    db.query(models.TestAttempt).filter_by(test_id=test_id).delete()
    db.query(models.Question).filter_by(test_id=test_id).delete()
    db.query(models.Test).filter_by(id=test_id).delete()
    db.commit()
    return {"ok": True}


# ─── Reports ────────────────────────────────────────────────────────────────
@router.get("/module/{module_id}/reports")
def module_reports(module_id: int, db: Session = Depends(get_db), trainer: models.User = Depends(require_trainer)):
    module = db.query(models.Module).filter_by(id=module_id).first()
    if not module:
        raise HTTPException(404)
    tests = db.query(models.Test).filter_by(module_id=module_id).all()
    trainees = db.execute(
        text("""SELECT u.id, u.name, u.email, u.department, e.completed
           FROM enrollments e JOIN users u ON e.trainee_id=u.id WHERE e.module_id=:mid"""),
        {"mid": module_id}
    ).fetchall()
    report_data = []
    for t in trainees:
        row = {"id": t[0], "name": t[1], "email": t[2], "department": t[3], "completed": bool(t[4]), "attempts": {}}
        for test in tests:
            att = db.query(models.TestAttempt).filter_by(test_id=test.id, trainee_id=t[0])\
                    .order_by(models.TestAttempt.started_at.desc()).first()
            row["attempts"][test.id] = schemas.TestAttemptOut.from_orm(att).dict() if att else None
        report_data.append(row)
    return {
        "module": schemas.ModuleOut.from_orm(module),
        "tests": [schemas.TestOut.from_orm(t) for t in tests],
        "report_data": report_data,
    }


# ─── Trainees ────────────────────────────────────────────────────────────────
@router.get("/trainees")
def list_trainees(db: Session = Depends(get_db), trainer: models.User = Depends(require_trainer)):
    trainees = db.query(models.User).filter(models.User.role == "trainee").all()
    result = []
    for t in trainees:
        enrolled = db.query(models.Enrollment).filter_by(trainee_id=t.id).count()
        attempts = db.query(models.TestAttempt).filter_by(trainee_id=t.id).count()
        result.append({**schemas.UserOut.from_orm(t).dict(), "enrolled": enrolled, "attempts": attempts})
    return result
