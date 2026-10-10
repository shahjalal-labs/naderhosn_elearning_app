# 🎓 Nader Hosn LMS — Enterprise School Management & E-Learning Engine

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
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Worker_Queues-2563EB?style=for-the-badge&logo=cpu&logoColor=white" alt="Worker_Queues" />
  <img src="https://img.shields.io/badge/EdTech-06B6D4?style=for-the-badge&logo=bookopen&logoColor=white" alt="EdTech" />
  
</p>

---

## 📌 Executive Overview

Nader Hosn LMS coordinates academic school administration, digital assignment distribution, gradebook records, learning resources, and asynchronous background worker queues for email and notification delivery.

---

## 🚀 Key Architectural Highlights

- **Multi-Worker Architecture**: Dedicated background workers for email delivery (`email.worker.ts`), user sync (`users.worker.ts`), and push notifications (`notification.worker.ts`).
- **Academic Gradebook**: Student report cards, grading rubrics, and GPA calculation rules.
- **Course Resource Library**: Digital textbook distribution and homework submission uploads.
- **Role-Based Security**: Segregated portals for School Admins, Teachers, Parents, and Students.
- **Type-Safe Database**: Fully indexed MongoDB collections managed with Prisma ORM.

---

## 📬 API Documentation & Interactive Postman Collection

The complete REST API specification is published in our public Postman showcase workspace:

* 🌐 **Instant Live API Documentation**: [Explore naderhosn_elearning_app in Postman (Instant Web View)](https://www.postman.com/shahjalal-backend-9458759/shahjalal-api-portfolio/collection/48491387-696907ed-41a1-43d6-889e-eb06ea0b1688)
* 📁 **Local Postman File**: [`docs/postman_collection.json`](./docs/postman_collection.json) (import directly into Postman Desktop or Newman CLI).

### Core Endpoint Modules

| Module | Base Route | Key Capabilities |
|---|---|---|
| **Authentication** | `/api/v1/auth` | Multi-role academic login, password reset, JWT tokens |
| **Schools** | `/api/v1/school` | School profile, academic terms, department configuration |
| **Assignments** | `/api/v1/assignment` | Homework creation, deadline reminders, student submissions |
| **Grades** | `/api/v1/grades` | Report card generation, term GPA, gradebook reviews |
| **Resources** | `/api/v1/resource` | Course syllabus files, PDF textbooks, digital assets |

---

## 📂 Project Architecture

```plaintext
naderhosn_elearning_app/
├── assets/
│   └── banner.svg               # Project architecture visual banner
├── docs/
│   └── postman_collection.json  # Full Postman API collection v2.1
├── src/
│   ├── app/
│   │   ├── middlewares/         # Global error handlers, auth & validation guards
│   │   ├── modules/             # Domain-driven feature modules
│   │   └── routes/              # Centralized route aggregator
│   ├── config/                  # Environment & external service configurations
│   ├── server.ts                # Application bootstrapper & HTTP server
│   └── workers/                 # Dedicated background job workers
├── prisma/
│   └── schema.prisma            # Database schema definition
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

### 2. Environment Configuration
Copy the provided `.env.example` file to create your local `.env`:
```bash
cp .env.example .env
```

### 3. Initialize Prisma Client
```bash
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 👨‍💻 Engineering & Authorship

Developed and maintained by **Md. Shahjalal**.

* **GitHub**: [@shahjalal-labs](https://github.com/shahjalal-labs)
* **Email**: [muhommodshahjalal@gmail.com](mailto:muhommodshahjalal@gmail.com)

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
