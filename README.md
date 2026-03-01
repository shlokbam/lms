# 🦅 Eagle Security LMS
### Training & Reporting System for Security & Facility Workforce

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install flask werkzeug

# 2. Run the application
python app.py

# 3. Open browser
http://localhost:5000
```

---

## 🔑 Demo Login Credentials

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Trainer | trainer@eagle.com      | trainer123  |
| Trainee | trainee@eagle.com      | trainee123  |
| Trainee | sarah@eagle.com        | trainee123  |

---

## 📁 Project Structure

```
lms/
├── app.py                  # Flask application & all routes
├── lms.db                  # SQLite database (auto-created)
├── requirements.txt
├── static/
│   ├── css/
│   │   └── main.css        # Complete design system
│   └── uploads/            # Uploaded materials storage
└── templates/
    ├── base.html            # Sidebar layout
    ├── login.html
    ├── register.html
    ├── trainer_dashboard.html
    ├── trainer_modules.html
    ├── trainer_module_detail.html
    ├── create_module.html
    ├── create_test.html
    ├── module_reports.html
    ├── trainer_trainees.html
    ├── trainee_dashboard.html
    ├── trainee_module.html
    ├── trainee_calendar.html
    ├── trainee_profile.html
    ├── take_test.html
    └── test_result.html
```

---

## ✨ Features

### 👨‍🏫 Trainer
- Dashboard with stats (trainees, modules, sessions)
- Create, edit, delete training modules
- Upload materials (PDF, PPT, Video) with phase control
- Dynamic question bank builder
- Create timed pre/post tests with MCQs
- Trainee enrollment tracking
- Per-module performance reports

### 👤 Trainee
- Phase-aware module access (pre / live / post)
- Calendar view of all modules & tests
- Timed tests with auto-submit
- Score + answer review after submission
- Progress tracking per material
- Test history in profile

### 🔒 System Rules
- Module content locked until start time
- Pre-test available only before module starts
- Post-test available only after module ends
- Test auto-closes and submits when timer hits 0
- Attempt limits enforced
- Progress saved via API

---

## 🛠 Tech Stack
- **Backend**: Flask (Python)
- **Database**: SQLite
- **Frontend**: HTML5, CSS3 (custom design system), Vanilla JS
- **Fonts**: Syne + DM Sans (Google Fonts)
