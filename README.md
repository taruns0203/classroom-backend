# 📚 Classroom Backend

A RESTful API server for the Classroom management platform, built with **Express.js**, **Drizzle ORM**, and **Neon PostgreSQL**. It handles authentication, CRUD operations for classes/subjects/users, and provides robust security through Arcjet.

---

## 🏗️ Tech Stack

| Layer          | Technology                                                       |
| -------------- | ---------------------------------------------------------------- |
| **Runtime**    | Node.js (ES2022)                                                 |
| **Framework**  | Express.js v5                                                    |
| **Language**   | TypeScript v6                                                    |
| **Database**   | PostgreSQL (Neon Serverless)                                     |
| **ORM**        | Drizzle ORM + Drizzle Kit                                        |
| **Auth**       | Better Auth (email/password with role-based access)              |
| **Security**   | Arcjet (bot detection, rate limiting, shield/WAF)                |
| **Monitoring** | Site24x7 APM Insight                                             |

---

## 📁 Project Structure

```
classroom-backend/
├── src/
│   ├── config/
│   │   └── arcjet.ts          # Arcjet security configuration
│   ├── db/
│   │   ├── schema/
│   │   │   ├── app.ts         # App tables (departments, subjects, classes, enrollments)
│   │   │   ├── auth.ts        # Auth tables (user, session, account, verification)
│   │   │   └── index.ts       # Barrel export for all schemas
│   │   └── index.ts           # Neon database connection
│   ├── lib/
│   │   └── auth.ts            # Better Auth instance & configuration
│   ├── middleware/
│   │   └── security.ts        # Role-based rate limiting + Arcjet enforcement
│   ├── routes/
│   │   ├── classes.ts         # /api/classes endpoints
│   │   ├── subjects.ts        # /api/subjects endpoints
│   │   └── users.ts           # /api/users endpoints
│   ├── express.d.ts           # Express Request type augmentation
│   ├── type.d.ts              # Global type definitions
│   └── index.ts               # Application entry point
├── drizzle/                   # Generated migration files
├── drizzle.config.ts          # Drizzle Kit configuration
├── server.ts                  # Standalone server (dev scaffold)
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Neon PostgreSQL** database (or any PostgreSQL instance)
- **Arcjet** API key ([get one here](https://app.arcjet.com))

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd classroom-backend

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require

# Frontend origin (for CORS)
FRONTEND_URL=http://localhost:5173

# Arcjet security
ARCJET_KEY=your_arcjet_key
ARCJET_ENV=development

# Better Auth
BETTER_AUTH_SECRET=your_secret_key
```

### Database Setup

```bash
# Generate migration files from schema
npm run db:generate

# Run migrations against the database
npm run db:migrate
```

### Running the Server

```bash
# Development (with hot-reload via tsx)
npm run dev

# Production
npm run build
npm start
```

The server starts on **port 8080** by default (configurable via `PORT` env var).

---

## 📡 API Endpoints

### Authentication

All auth routes are handled by **Better Auth** under `/api/auth/*`:

| Method | Endpoint                  | Description          |
| ------ | ------------------------- | -------------------- |
| POST   | `/api/auth/sign-up/email` | Register a new user  |
| POST   | `/api/auth/sign-in/email` | Sign in with email   |
| POST   | `/api/auth/sign-out`      | Sign out             |
| GET    | `/api/auth/get-session`   | Get current session  |

### Subjects

| Method | Endpoint        | Description                          | Query Params                        |
| ------ | --------------- | ------------------------------------ | ----------------------------------- |
| GET    | `/api/subjects` | List subjects (paginated, filtered)  | `search`, `department`, `page`, `limit` |

### Classes

| Method | Endpoint          | Description                         | Query Params                             |
| ------ | ----------------- | ----------------------------------- | ---------------------------------------- |
| GET    | `/api/classes`    | List classes (paginated, filtered)  | `search`, `subject`, `teacher`, `page`, `limit` |
| GET    | `/api/classes/:id`| Get class details with relations    | —                                        |
| POST   | `/api/classes`    | Create a new class                  | —                                        |

### Users

| Method | Endpoint      | Description                       | Query Params                        |
| ------ | ------------- | --------------------------------- | ----------------------------------- |
| GET    | `/api/users`  | List users (paginated, filtered)  | `search`, `role`, `page`, `limit`   |

> All list endpoints return paginated responses with `{ data, pagination: { total, page, limit, totalPages } }`.

---

## 🗄️ Database Schema

### Entity Relationship

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  departments │────▶│   subjects   │────▶│   classes    │
│              │ 1:N │              │ 1:N │              │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                 │
                                           ┌─────┴─────┐
                                           │           │
                                      teacher_id  ┌────┴─────┐
                                           │      │enrollments│
                                           ▼      │          │
                                      ┌────────┐  └────┬─────┘
                                      │  user  │◀──────┘
                                      └────────┘  student_id
```

### Tables

| Table           | Description                                       |
| --------------- | ------------------------------------------------- |
| `user`          | Users with roles (`student`, `teacher`, `admin`)  |
| `session`       | Active auth sessions                              |
| `account`       | Linked auth provider accounts                     |
| `verification`  | Email verification tokens                         |
| `departments`   | Academic departments                              |
| `subjects`      | Subjects belonging to departments                 |
| `classes`       | Classes with teacher, subject, schedules, capacity|
| `enrollments`   | Student ↔ Class many-to-many join table           |

---

## 🔒 Security

The application implements multiple layers of security via **Arcjet**:

- **Shield (WAF)** — Protects against common web attacks (SQL injection, XSS, etc.)
- **Bot Detection** — Blocks automated requests (allows search engines and link previews)
- **Token Bucket Rate Limiting** — Global rate limit of 5 tokens/2s with capacity of 10
- **Role-Based Sliding Window Rate Limiting** — Per-role limits enforced in middleware:
  - `admin`: 20 requests/minute
  - `teacher` / `student`: 10 requests/minute
  - `guest`: 25 requests/minute

---

## 📜 Scripts

| Script          | Command                  | Description                         |
| --------------- | ------------------------ | ----------------------------------- |
| `dev`           | `npm run dev`            | Start dev server with hot-reload    |
| `build`         | `npm run build`          | Compile TypeScript to JavaScript    |
| `start`         | `npm start`              | Run the compiled production build   |
| `db:generate`   | `npm run db:generate`    | Generate Drizzle migration files    |
| `db:migrate`    | `npm run db:migrate`     | Apply migrations to the database    |

---

## 🛠️ Development Notes

- The project uses **ES Modules** (`"type": "module"` in package.json, `"module": "nodenext"` in tsconfig).
- Strict TypeScript is enabled with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- CORS is configured to only accept requests from the `FRONTEND_URL` origin.
- The Express `Request` type is augmented to include an optional `user.role` field for middleware use.

---

## 📄 License

ISC
