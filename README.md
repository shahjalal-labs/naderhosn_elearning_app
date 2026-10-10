# 📖 Nader Hosn — K-12 School Management, Digital Textbook Publishing & Grade Book LMS API

![Architecture Banner](./assets/banner.svg)

<p align="center">
  <a href="https://www.postman.com/shahjalal-backend-9458759/shahjalal-api-portfolio/collection/48491387-696907ed-41a1-43d6-889e-eb06ea0b1688" target="_blank">
    <img src="https://run.pstmn.io/button.svg" alt="View in Postman" />
  </a>
  <a href="https://www.postman.com/shahjalal-backend-9458759/shahjalal-api-portfolio/collection/48491387-696907ed-41a1-43d6-889e-eb06ea0b1688" target="_blank">
    <img src="https://img.shields.io/badge/Postman-Instant_Live_API_Docs-FF6C37?style=for-the-badge&logo=postman&logoColor=white" alt="Live API Documentation" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Education_LMS-2563EB?style=for-the-badge&logo=book-open&logoColor=white" alt="Education_LMS" />
  
</p>

---

## 📌 Executive Overview

**Nader Hosn Backend** is an enterprise academic learning management and school operations API that serves as the backend engine for the Dar El Chimal academic portal. Built on **Node.js, TypeScript, Express, and Prisma ORM**, the platform manages multi-school administrative networks: **school campus onboarding**, **grade-level student rosters and teacher assignments**, **digital textbook catalog publishing**, curriculum resource distribution, homework submission grading, and administrative announcements.

---

## 🚀 Key Architectural & Domain Capabilities

- **Multi-School Campus Hierarchy**: Manage independent schools (`School`), campus administrative roles, and institutional configurations.
- **Digital Textbook & Curriculum Publishing**: Categorized book repositories (`Books`, `BookCategory`) with grade and subject-level curriculum bindings.
- **Academic Grade Books & Roster Tracking**: Comprehensive grade book matrix (`Grades`, `StudentGrades`, `TeacherGrades`) tracking student academic performance.
- **Classroom Homework & Assignments**: Teacher assignment creation (`Assignment`), student submission tracking, and grading feedback cycles.
- **Role-Based Access Control**: Strict institutional security separating Super Admins, School Principals, Teachers, and Students.

---

## 📬 API Documentation & Interactive Postman Collection

The complete REST API specification is published in our public Postman showcase workspace:

* 🌐 **Instant Live API Documentation**: [Explore naderhosn_elearning_app in Postman (Instant Web View)](https://www.postman.com/shahjalal-backend-9458759/shahjalal-api-portfolio/collection/48491387-696907ed-41a1-43d6-889e-eb06ea0b1688)
* 📁 **Local Postman File**: [`docs/postman_collection.json`](./docs/postman_collection.json) (ready for Postman Desktop or Newman CLI).

### Core Endpoint Modules

| Module | Base Route | Key Capabilities |
|---|---|---|
| **Authentication** | `/api/v1/auth` | Institutional onboarding, student/teacher identity verification, JWT rotation |
| **Schools** | `/api/v1/school` | Campus management, school profile, administrator assignments |
| **Textbooks & Catalog** | `/api/v1/books` | Curriculum books, academic categories, digital PDF resources |
| **Grades & Rosters** | `/api/v1/grades` | Grade-level classes, teacher grade assignments, student enrollment |
| **Assignments** | `/api/v1/assignment` | Homework prompts, due dates, student submissions, evaluation feedback |

---

## 📂 Project Architecture

```plaintext
naderhosn_elearning_app/
├── assets/
│   └── banner.svg               # Architectural visual banner
├── docs/
│   └── postman_collection.json  # Full Postman API collection v2.1
├── src/
│   ├── app/
│   │   ├── middlewares/         # Global error handlers, auth & validation guards
│   │   ├── modules/             # Domain feature modules
│   │   └── routes/              # Centralized route registration
│   ├── config/                  # Environment & external service configurations
│   └── server.ts                # Application bootstrapper
├── prisma/
│   └── schema.prisma            # Prisma database schema definition
├── .env.example                 # Sanitized environment template
├── package.json
└── tsconfig.json
```

---

## 🛠️ Quickstart & Local Setup

### Prerequisites
* **Node.js**: `v20.x` or higher
* **Database**: MongoDB or PostgreSQL (as specified in `schema.prisma`)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/shahjalal-labs/naderhosn_elearning_app.git
cd naderhosn_elearning_app
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 👨‍💻 Engineering & Authorship

Developed and engineered by **Md. Shahjalal**.

* **GitHub**: [@shahjalal-labs](https://github.com/shahjalal-labs)
* **Email**: [muhommodshahjalal@gmail.com](mailto:muhommodshahjalal@gmail.com)

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
