# 🛡️ DevOps & Local Cloud Simulation Log (Proof of Concept)

This document serves as engineering proof for the containerization, local cloud storage (AWS S3), infrastructure as code (Terraform), and automated CI/CD pipeline (Jenkins) integrated into the **Eagle LMS** project.

---

## 🛠️ Phase 1: Containerization & Port Bind Resolution

We containerized the entire stack using Docker Compose. During initial boot, a port conflict was detected on host port `3306` due to a native MySQL instance running on the host Mac.

### The Conflict
<img src="Static_Readme/Devops_Proof/Screenshot 2026-07-17 at 9.48.45 PM.png" width="800" alt="MySQL Port Conflict"/>

### The Resolution
We modified `docker-compose.yml` to expose the MySQL container on host port `3307` while retaining internal container communication on port `3306`. This isolated the stack completely.

<img src="Static_Readme/Devops_Proof/Screenshot 2026-07-17 at 9.51.08 PM.png" width="800" alt="Port Reconfigured"/>
<img src="Static_Readme/Devops_Proof/Screenshot 2026-07-17 at 9.51.13 PM.png" width="800" alt="Docker Stack Started"/>

---

## ☁️ Phase 2: Infrastructure as Code (Terraform & LocalStack S3)

We deployed a local instance of **LocalStack** to mock AWS services without cost. We wrote Terraform scripts to declare the S3 storage bucket.

### DNS & Path-Style Issues
Initially, the AWS provider attempted to resolve virtual-host-style routing (`http://eagle-lms-uploads.localhost:4566/`), resulting in DNS resolution failures and connection refusals:

<img src="Static_Readme/Devops_Proof/Screenshot 2026-07-17 at 9.52.47 PM.png" width="800" alt="Terraform Connection Refused"/>

### The Resolution
We reconfigured `infra/providers.tf` to force path-style routing (`s3_use_path_style = true`), resolving local requests to `http://localhost:4566/eagle-lms-uploads`. The apply completed successfully:

<img src="Static_Readme/Devops_Proof/Screenshot 2026-07-17 at 9.57.31 PM.png" width="800" alt="Terraform Success"/>

### S3 Verification via AWS CLI
We executed `aws --endpoint-url=http://localhost:4566 s3 ls` to prove the bucket resides in our local cloud:

<img src="Static_Readme/Devops_Proof/Screenshot 2026-07-17 at 9.59.20 PM.png" width="800" alt="AWS CLI verification"/>

---

## 🔌 Phase 3: Seeding & Backend Proxy Integration

With the database and storage services online, we ran into an empty-database and container-proxy communication issue on the web frontend.

### Authentication & Proxy Errors
*   **The Issue:** Because Vite was running inside a container, proxying traffic to `http://localhost:8000` failed since `localhost` resolved to the frontend container itself. Furthermore, the fresh MySQL database lacked tables and default credentials.

<img src="Static_Readme/Devops_Proof/Screenshot 2026-07-17 at 10.01.45 PM.png" width="800" alt="Login Failure UI"/>

### The Resolution
1.  **Proxy:** Replaced `localhost` with the container name `backend` in `frontend/vite.config.js`.
2.  **Seeding:** Updated `backend/main.py` to auto-create tables and inject demo credentials on container boot.

After container restart, login was successful, and API interactive documentation was verified online:

<img src="Static_Readme/Devops_Proof/Screenshot 2026-07-17 at 10.07.47 PM.png" width="800" alt="Trainer Dashboard Login success"/>
<img src="Static_Readme/Devops_Proof/Screenshot 2026-07-17 at 10.00.56 PM.png" width="800" alt="FastAPI Docs 1"/>
<img src="Static_Readme/Devops_Proof/Screenshot 2026-07-17 at 10.06.07 PM.png" width="800" alt="FastAPI Docs 2"/>

---

## 🚦 Phase 4: Automated CI/CD (Local Jenkins Pipeline)

We set up a local Jenkins controller via Homebrew to automate our builds and tests.

### Jenkins Security Configuration
Modern Jenkins blocks checking out from local Git directories. We accessed the Jenkins Script Console and executed Groovy code to allow local Git checkouts for this simulation:

<img src="Static_Readme/Devops_Proof/Jenkins.png" width="800" alt="Groovy system property update"/>

*(Additionally, the JVM arguments were saved permanently inside `/opt/homebrew/Cellar/jenkins-lts/2.568.1/homebrew.mxcl.jenkins-lts.plist`).*

### Pipeline SCM Configuration
We configured the pipeline to target the local Git repository on the host machine:

<img src="Static_Readme/Devops_Proof/Screenshot 2026-07-17 at 10.15.10 PM.png" width="800" alt="Jenkins Pipeline Configuration"/>

### 🏆 The Final Green Pipeline Build
Our declarative `Jenkinsfile` runs the entire lifecycle (Checkout ➡️ Backend Unit Tests ➡️ Terraform Validation ➡️ Docker Verify Build) on every repository pull. 

**Build #8 completed with all stages successfully passing:**

<img src="Static_Readme/Devops_Proof/Screenshot 2026-07-17 at 10.34.02 PM.png" width="800" alt="Jenkins Pipeline Successful Stage View"/>
