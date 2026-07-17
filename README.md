# 🦅 Eagle Learning Management System (Eagle LMS)

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)](https://www.terraform.io/)
[![Jenkins](https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white)](https://www.jenkins.io/)

Eagle LMS is a secure, cloud-native learning management platform designed for high-performance enterprise training. Featuring a dual-role (Trainer and Trainee) dashboard web app, a mobile learning client, secure watermarking for intellectual property protection, and an automated DevOps delivery pipeline.

---

## 🔗 Cloud Infrastructure & CI/CD Pipeline Proof

> [!TIP]
> **DevOps Portfolio Proof:**
> For the complete local cloud simulation documentation, including step-by-step resolution of Docker port bindings, S3 path-style routing, database seeding, and the local Jenkins pipeline configuration, see the **[DevOps & Cloud Simulation Log (DEVOPS_PROOF.md)](DEVOPS_PROOF.md)**.

---

## 🖼️ Application Interfaces (Website Showcase)

Here are the primary interface views from the Eagle LMS platform:

<table align="center">
  <tr>
    <td align="center"><b>Trainer Dashboard Overview</b><br/>
      <img src="Static_Readme/Website_Picture/WhatsApp Image 2026-05-20 at 16.04.43.jpeg" width="380" alt="Trainer Dashboard"/>
    </td>
    <td align="center"><b>Trainer Course Content & Module Detail</b><br/>
      <img src="Static_Readme/Website_Picture/WhatsApp Image 2026-05-20 at 16.04.43 (1).jpeg" width="380" alt="Module Details"/>
    </td>
  </tr>
  <tr>
    <td align="center"><b>Trainer Module Reports & Scores</b><br/>
      <img src="Static_Readme/Website_Picture/WhatsApp Image 2026-05-20 at 16.04.43 (2).jpeg" width="380" alt="Module Reports"/>
    </td>
    <td align="center"><b>Trainee Profile Dashboard</b><br/>
      <img src="Static_Readme/Website_Picture/WhatsApp Image 2026-05-20 at 16.04.44 (1).jpeg" width="380" alt="Trainee Profile"/>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2"><b>Trainee Training Calendar</b><br/>
      <img src="Static_Readme/Website_Picture/WhatsApp Image 2026-05-20 at 16.04.44 (2).jpeg" width="600" alt="Trainee Calendar"/>
    </td>
  </tr>
</table>

---

## 🏗️ Core Architecture & Tech Stack

Eagle LMS is organized as a monorepo containing three core subsystems:

### 1. Backend API Service (`/backend`)
*   **Framework:** FastAPI (Python 3.11/3.13) for high-performance HTTP request handling.
*   **ORM / Database:** SQLAlchemy with PyMySQL connecting to a MySQL 8.0 instance.
*   **Security:** Role-based JWT access tokens (`python-jose`) and password hashing (`passlib` with `bcrypt`).
*   **File Storage:** AWS S3 (simulated locally via LocalStack) with lazy-downloading caching routines.
*   **Watermarking Engine:** PDF rendering (`reportlab`) and image compositing (`Pillow`) for personalizing learning resources with trainees' emails.

### 2. TrainerPro Web Frontend (`/frontend`)
*   **Build Tool & Framework:** Vite + React 18.
*   **Styling:** Custom dark-themed responsive layout optimized for analytical dashboards.
*   **Routing & APIs:** React Router DOM and Axios.

### 3. Mobile Companion Client (`/mobile`)
*   **Framework:** React Native + Expo.
*   **Purpose:** Immersive, on-the-go training for field security personnel.

---

## 🚀 Quick Start (Local Run)

### 📋 Prerequisites
Ensure you have the following installed on your machine:
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (start the daemon before proceeding).
*   [Terraform CLI](https://developer.hashicorp.com/terraform/install).

### 1. Launch the Stack
Run the containers in detached mode:
```bash
docker compose up -d
```
This spins up:
*   **MySQL Database:** Exposed on host port `3307` (to prevent conflicts with any local MySQL running on port 3306).
*   **FastAPI Backend:** Exposed on host port `8000`.
*   **Vite Frontend:** Exposed on host port `5173`.
*   **LocalStack AWS Emulator:** Exposed on host port `4566`.

### 2. Provision S3 Bucket
Initialize and apply the Terraform configuration to create the S3 bucket in LocalStack:
```bash
cd infra
terraform init
terraform apply -auto-approve
```

### 3. Log In
Open your browser and navigate to:
*   **Web Frontend:** `http://localhost:5173`
*   **Demo Trainer Credentials:** `trainer@eagle.com` / `trainer123`
*   **Demo Trainee Credentials:** `trainee@eagle.com` / `trainee123`
*   **FastAPI Swagger Documentation:** `http://localhost:8000/docs`
