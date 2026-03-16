from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ─── Auth ───────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "trainee"
    phone: Optional[str] = ""
    department: Optional[str] = ""

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    user_id: int

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    phone: Optional[str]
    department: Optional[str]
    profile_pic: Optional[str]
    created_at: Optional[datetime]
    class Config: from_attributes = True


# ─── Notifications ───────────────────────────────────────────
class NotificationOut(BaseModel):
    id: int
    title: str
    body: Optional[str]
    type: str
    link: str
    is_read: bool
    created_at: Optional[datetime]
    class Config: from_attributes = True


# ─── Modules ─────────────────────────────────────────────────
class ModuleOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    trainer_id: Optional[int]
    start_datetime: Optional[datetime]
    end_datetime: Optional[datetime]
    status: str
    is_default: bool
    color: Optional[str]
    training_type: str
    meet_link: Optional[str]
    created_at: Optional[datetime]
    class Config: from_attributes = True

class ScheduleRequest(BaseModel):
    start_datetime: str
    end_datetime: str
    status: str = "published"
    color: str = "#3B5BDB"
    training_type: str = "self_paced"
    meet_link: Optional[str] = None


# ─── Chapters ────────────────────────────────────────────────
class ChapterOut(BaseModel):
    id: int
    module_id: int
    title: str
    order_num: int
    class Config: from_attributes = True

class AddChapterRequest(BaseModel):
    chapter_title: str


# ─── Materials ───────────────────────────────────────────────
class MaterialOut(BaseModel):
    id: int
    module_id: int
    chapter_id: Optional[int]
    title: str
    file_path: Optional[str]
    watermarked_path: Optional[str]
    file_type: Optional[str]
    release_phase: str
    order_num: int
    class Config: from_attributes = True


# ─── Tests ───────────────────────────────────────────────────
class QuestionIn(BaseModel):
    text: str
    a: str
    b: str
    c: str
    d: str
    correct: str  # A/B/C/D
    marks: int = 1

class QuestionOut(BaseModel):
    id: int
    question_text: str
    option_a: Optional[str]
    option_b: Optional[str]
    option_c: Optional[str]
    option_d: Optional[str]
    correct_option: Optional[str]
    marks: int
    class Config: from_attributes = True

class TestCreateRequest(BaseModel):
    title: str
    test_type: str
    duration: int = 30
    start_datetime: str
    end_datetime: str
    passing_marks: int = 60
    max_attempts: int = 1
    questions: List[QuestionIn] = []

class TestOut(BaseModel):
    id: int
    module_id: int
    title: str
    test_type: str
    duration_minutes: int
    start_datetime: Optional[datetime]
    end_datetime: Optional[datetime]
    passing_marks: int
    max_attempts: int
    class Config: from_attributes = True

class TestDetailOut(TestOut):
    questions: List[QuestionOut] = []


# ─── Test Attempt ────────────────────────────────────────────
class SubmitTestRequest(BaseModel):
    answers: dict  # {question_id: "A"|"B"|"C"|"D"}

class TestAttemptOut(BaseModel):
    id: int
    test_id: int
    score: int
    total_marks: int
    percentage: float
    passed: bool
    answers: Optional[str]
    started_at: Optional[datetime]
    submitted_at: Optional[datetime]
    class Config: from_attributes = True


# ─── Progress ────────────────────────────────────────────────
class ProgressUpdate(BaseModel):
    module_id: int
    material_id: int
    completed: int = 0
    watch_percent: int = 0

class ProgressOut(BaseModel):
    material_id: int
    completed: bool
    watch_percent: int
    class Config: from_attributes = True


# ─── Enrollment ──────────────────────────────────────────────
class EnrollmentOut(BaseModel):
    trainee_id: int
    name: str
    email: str
    department: Optional[str]
    completed: bool
    enrolled_at: Optional[datetime]
    class Config: from_attributes = True


# ─── Profile Update ──────────────────────────────────────────
class ProfileUpdateRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = ""
    department: Optional[str] = ""

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str
