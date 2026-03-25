# Eagle Learning Management System (Eagle LMS) 🦅💎

Welcome to the **Eagle LMS** ecosystem—an enterprise-grade learning platform designed for high-performance training environments. This repository contains the full stack, including the backend API, a dual-role web frontend, and a premium mobile experience for trainees.

---

## 🏗️ Project Architecture

The Eagle LMS is structured as a monorepo containing three primary sub-systems:

### 1. [Backend](file:///Users/shlokbam/Documents/Code/lms/backend) (Python/FastAPI)
The central intelligence of the platform.
- **API Engine**: Built with FastAPI for high performance and scalability.
- **Database**: Manages modules, chapters, assessments, and trainee progress tracking.
- **Security**: Handles authentication, registration, and role-based access control.

### 2. [Web Frontend](file:///Users/shlokbam/Documents/Code/lms/frontend) (React/Vite)
A sophisticated, dark-themed "TrainerPro" interface.
- **Trainer Dashboard**: Comprehensive tools for module creation, scheduling, and trainee performance reporting.
- **Trainee Dashboard**: A centralized "Learning Journey" view with real-time progress tracking, discovery filters, and course management.
- **Unified Design**: Standardized search and discovery tools across both trainer and trainee faces.

### 3. [Mobile Application](file:///Users/shlokbam/Documents/Code/lms/mobile) (React Native/Expo)
A premium, "On-the-Go" learning experience for trainees.
- **Immersive Learning**: Access materials, watch videos with secure watermarking, and take tests directly from your mobile device.
- **Premium UI**: Featuring custom themed notifications, specialized loading states, and a refined enterprise-grade aesthetic.
- **Productivity**: Integrated calendar view and push-notification-ready architecture.

---

## 🚀 Getting Started

To run the full Eagle LMS stack, follow these steps:

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000 --host 0.0.0.0
```
*Runs on `http://localhost:8000`*

### Web Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Runs on `http://localhost:5173`*

### Mobile App Setup
```bash
cd mobile
npm install
npx expo start
```
*Requires Expo Go or a configured emulator.*

---

## ✨ Key Features
- **Dynamic Scheduling**: Real-time module availability based on trainer-defined windows.
- **Assessment Engine**: Comprehensive test-taking with automated grading and result analysis.
- **Secure Watermarking**: Automatic watermarking for documents and videos to protect intellectual property.
- **Themed Experience**: A unified, high-contrast dark theme across all platforms for maximum focus and professional appeal.

---

**Eagle LMS** - *Elevating the Learning Experience.*
