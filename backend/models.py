from sqlalchemy import (Column, Integer, String, Text, Boolean, DateTime, Float,
                        ForeignKey, UniqueConstraint, Index)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(64), nullable=False)
    role = Column(String(20), nullable=False, default="trainee")
    phone = Column(String(30))
    department = Column(String(255))
    profile_pic = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    modules = relationship("Module", back_populates="trainer")
    enrollments = relationship("Enrollment", back_populates="trainee")
    notifications = relationship("Notification", back_populates="user")


class Module(Base):
    __tablename__ = "modules"
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    trainer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    start_datetime = Column(DateTime)
    end_datetime = Column(DateTime)
    status = Column(String(20), default="draft")
    is_default = Column(Boolean, default=False)
    color = Column(String(10), default="#3B5BDB")
    created_at = Column(DateTime, server_default=func.now())

    trainer = relationship("User", back_populates="modules")
    chapters = relationship("Chapter", back_populates="module", cascade="all, delete-orphan")
    materials = relationship("Material", back_populates="module", cascade="all, delete-orphan")
    tests = relationship("Test", back_populates="module", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="module", cascade="all, delete-orphan")


class Chapter(Base):
    __tablename__ = "chapters"
    id = Column(Integer, primary_key=True, autoincrement=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    order_num = Column(Integer, default=0)

    module = relationship("Module", back_populates="chapters")
    materials = relationship("Material", back_populates="chapter")


class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), index=True)
    trainee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    enrolled_at = Column(DateTime, server_default=func.now())
    completed = Column(Boolean, default=False)
    __table_args__ = (UniqueConstraint("module_id", "trainee_id"),)

    module = relationship("Module", back_populates="enrollments")
    trainee = relationship("User", back_populates="enrollments")


class Material(Base):
    __tablename__ = "materials"
    id = Column(Integer, primary_key=True, autoincrement=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    file_path = Column(String(500))
    watermarked_path = Column(String(500))
    file_type = Column(String(20))
    release_phase = Column(String(10), default="pre")
    order_num = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    module = relationship("Module", back_populates="materials")
    chapter = relationship("Chapter", back_populates="materials")


class Test(Base):
    __tablename__ = "tests"
    id = Column(Integer, primary_key=True, autoincrement=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), index=True)
    title = Column(String(255), nullable=False)
    test_type = Column(String(10), nullable=False)  # pre/mid/post
    duration_minutes = Column(Integer, default=30)
    start_datetime = Column(DateTime)
    end_datetime = Column(DateTime)
    passing_marks = Column(Integer, default=60)
    max_attempts = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())

    module = relationship("Module", back_populates="tests")
    questions = relationship("Question", back_populates="test", cascade="all, delete-orphan")
    attempts = relationship("TestAttempt", back_populates="test", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    test_id = Column(Integer, ForeignKey("tests.id", ondelete="CASCADE"), index=True)
    question_text = Column(Text, nullable=False)
    option_a = Column(Text)
    option_b = Column(Text)
    option_c = Column(Text)
    option_d = Column(Text)
    correct_option = Column(String(1))
    marks = Column(Integer, default=1)

    test = relationship("Test", back_populates="questions")


class TestAttempt(Base):
    __tablename__ = "test_attempts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    test_id = Column(Integer, ForeignKey("tests.id", ondelete="CASCADE"), index=True)
    trainee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    score = Column(Integer)
    total_marks = Column(Integer)
    percentage = Column(Float)
    passed = Column(Boolean)
    answers = Column(Text)  # JSON string
    started_at = Column(DateTime, server_default=func.now())
    submitted_at = Column(DateTime)

    test = relationship("Test", back_populates="attempts")
    trainee = relationship("User")


class Progress(Base):
    __tablename__ = "progress"
    id = Column(Integer, primary_key=True, autoincrement=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), index=True)
    trainee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), index=True)
    completed = Column(Boolean, default=False)
    watch_percent = Column(Integer, default=0)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    material = relationship("Material")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    body = Column(Text)
    type = Column(String(30), default="info")
    link = Column(String(500), default="")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="notifications")
