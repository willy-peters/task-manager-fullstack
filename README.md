# TaskFlow — Full-Stack Task Manager 

A responsive, full-stack task management application featuring JWT authentication, full task CRUD, real-time search and filtering, Render free-tier cold-start handling, and a clean Material-3-inspired workspace UI.

---

## Live Links & Deployment

| Resource | URL |
| :--- | :--- |
| **GitHub Repository** | `https://github.com/<your-username>/task-manager-fullstack` |
| **Live Frontend (Vercel)** | `https://<your-vercel-app>.vercel.app` |
| **Live Backend API (Render)** | https://task-api-yhl4.onrender.com |
| **Swagger / OpenAPI Docs** | https://task-api-yhl4.onrender.com/api-docs |


---


### Repository Structure

```text
task-manager-fullstack/
├── frontend/                  # React + Vite + Tailwind CSS SPA
│   ├── e2e/                   # Headless Playwright E2E & responsive tests
│   ├── public/                # Static assets & SVG favicon
│   ├── src/
│   │   ├── api/               # Axios client, authApi, tasksApi, cold-start tracker
│   │   ├── components/        # Auth guards, layout, dashboard, task modals, feedback
│   │   ├── context/           # AuthContext (JWT persistence & 401 handling)
│   │   ├── hooks/             # useTasks (optimistic updates), useColdStart
│   │   ├── pages/             # LoginPage, RegisterPage, DashboardPage
│   │   ├── utils/             # Date/status formatters & RFC-4180 CSV exporter
│   │   └── __tests__/         # Vitest + React Testing Library suites
│   ├── vercel.json            # SPA catch-all rewrite rules
│   └── .env.example
├── backend/                   # Node.js + Express 5 + Mongoose REST API
│   ├── src/
│   │   ├── config/            # Env validation, MongoDB connection, Swagger setup
│   │   ├── controllers/       # Auth & Task route handlers
│   │   ├── docs/              # OpenAPI 3.0.3 JSDoc definitions
│   │   ├── middleware/        # JWT protect, Joi validate, ObjectId check, errorHandler
│   │   ├── models/            # User & Task Mongoose schemas
│   │   ├── routes/            # /api/v1/health, /auth, /tasks
│   │   ├── utils/             # ApiError, JWT signing
│   │   └── validators/        # Joi request schemas
│   ├── tests/                 # Node test runner + Supertest contract & deploy tests
│   ├── render.yaml            # Render Blueprint configuration
│   ├── railway.json           # Railway deployment configuration
│   └── .env.example
└── README.md
```

---

## Tech Stack

- **Frontend:** React 18, Vite 6, React Router 6, Tailwind CSS 3, Axios, Inter + Material Symbols Outlined
- **Backend:** Node.js 20+, Express 5, MongoDB + Mongoose 9, JWT (`jsonwebtoken`), `bcryptjs`, Joi, Helmet, CORS, Morgan, Swagger UI
- **Testing:** Vitest + React Testing Library, Playwright (Chromium headless E2E), `node:test` + Supertest

---

## Core Features

1. **Authentication & Protected Routes:** Register, Login, Logout, persistent JWT session restoration via `GET /api/v1/auth/me`, automatic logout on `401`, and client/server validation feedback.
2. **Task Dashboard & Full CRUD:** Create, view, edit, and delete tasks scoped to the authenticated user, with live KPI metrics (Total, Active, Completed & completion rate), one-click optimistic completion toggling, and delete confirmation dialogs.
3. **Real-Time Search, Filtering & Export:** Instant search across title and description, segmented status tabs (`All`, `Pending`, `In Progress`, `Completed`) with live counts, sort order (`Newest First`, `Oldest First`, `Title A–Z`), removable active filter chips, Grid/List view switcher, and CSV export.
4. **Cold-Start & Error Resilience:** Shimmer skeletons + live elapsed timer banner during Render wake-ups, plus a global error banner with one-click retry.
5. **Responsive Across All Viewports:** Adaptive 3-column desktop grid, 2-column tablet layout, and mobile layout with overflow user menu, sticky `+ Add Task` FAB, `>= 44px` touch targets, and a slide-up bottom sheet modal.

---

## API Reference Summary

Base URL: `https://task-api-yhl4.onrender.com/api/v1`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | API health check & uptime |
| `POST` | `/auth/register` | Public | Register user (`{ name, email, password }`) → `201` + JWT |
| `POST` | `/auth/login` | Public | Login (`{ email, password }`) → `200` + JWT |
| `GET` | `/auth/me` | Bearer JWT | Get current authenticated user |
| `GET` | `/tasks` | Bearer JWT | List user tasks (optional `?status=pending\|in-progress\|completed`) |
| `POST` | `/tasks` | Bearer JWT | Create task (`{ title, description?, status? }`) |
| `GET` | `/tasks/:id` | Bearer JWT | Fetch a single task by ObjectId |
| `PUT` | `/tasks/:id` | Bearer JWT | Partial update (`title`, `description`, `status`) |
| `DELETE` | `/tasks/:id` | Bearer JWT | Delete a task |

---

## Local Development Setup

### Prerequisites
- Node.js `>= 20`
- npm `>= 10`
- MongoDB Atlas URI or local MongoDB (only needed if running `/backend` locally; `/frontend` connects to the hosted Render API by default)

### 1. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. By default, `VITE_API_BASE_URL` points to `https://task-api-yhl4.onrender.com/api/v1`.

### 2. Backend Setup (Optional Local API)

```bash
cd backend
cp .env.example .env
# Edit .env with your MONGODB_URI and JWT_SECRET
npm install
npm run dev
```

The local API runs on `http://localhost:3000` (Swagger UI at `http://localhost:3000/api-docs`). To point the frontend at it, update `frontend/.env` to `VITE_API_BASE_URL=http://localhost:3000/api/v1`.

---

## Running Tests

```bash
# Backend contract & deployment config tests
cd backend && npm test

# Frontend unit & integration tests (Vitest + RTL)
cd frontend && npm test

# Frontend lint & production build
cd frontend && npm run lint && npm run build

# Headless Playwright E2E + responsive QA (Desktop, Tablet, Mobile)
cd frontend && npm run test:e2e
```


