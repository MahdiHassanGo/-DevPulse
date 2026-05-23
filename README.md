# DevPulse — Internal Tech Issue & Feature Tracker

A collaborative REST API platform for software teams to report bugs, suggest features, and coordinate resolutions. Built with Node.js, TypeScript, Express.js, and PostgreSQL.

---

## Live URL

```
https://dev-pulse-zeh6-cotkt2oou-asif-s-projects1.vercel.app
```

---

## Features

- **User Authentication** — JWT-based signup and login with secure password hashing
- **Role-Based Access Control** — Two roles (`contributor`, `maintainer`) with enforced permission boundaries
- **Issue Management** — Full CRUD for bug reports and feature requests
- **Smart Filtering & Sorting** — Query issues by type, status, and creation date
- **Reporter Details** — Issues return nested reporter info (no SQL JOINs — fetched in a separate query)
- **Ownership Enforcement** — Contributors can only edit their own open issues
- **Centralized Error Handling** — Global error handler for consistent error responses

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js (LTS 24.x) | Runtime |
| TypeScript | Type-safe development |
| Express.js | HTTP server & modular routing |
| PostgreSQL | Relational database |
| `pg` (native driver) | Raw SQL via `pool.query()` |
| `bcrypt` | Password hashing (salt rounds: 10) |
| `jsonwebtoken` | JWT generation & verification |
| `dotenv` | Environment variable management |
| `cookie-parser` | Refresh token cookie handling |
| `cors` | Cross-origin resource sharing |

---

## Project Structure

```
src/
├── config/
│   └── index.ts              # Environment config
├── db/
│   └── index.ts              # PostgreSQL pool + DB init
├── middleware/
│   ├── auth.ts               # JWT auth & role guard
│   ├── globalErrorHandler.ts # Centralized error handler
│   └── logger.ts             # Request logger
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.route.ts
│   ├── issues/
│   │   ├── issue.controller.ts
│   │   ├── issue.service.ts
│   │   ├── issue.routes.ts
│   │   └── issue.interface.ts
│   └── user/
│       ├── user.controller.ts
│       ├── user.service.ts
│       ├── user.routes.ts
│       └── user.interface.ts
├── types/
│   └── index.ts              # Shared types & role constants
├── utility/
│   └── sendResponse.ts       # Reusable response formatter
├── app.ts
└── server.ts
```

---

## Database Schema

### `users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | SERIAL | PRIMARY KEY |
| `name` | VARCHAR(100) | NOT NULL |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL |
| `password` | TEXT | NOT NULL — never returned in responses |
| `role` | VARCHAR(20) | DEFAULT `'contributor'`, CHECK IN (`contributor`, `maintainer`) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### `issues`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | SERIAL | PRIMARY KEY |
| `title` | VARCHAR(150) | NOT NULL |
| `description` | TEXT | NOT NULL, min 20 characters |
| `type` | VARCHAR(20) | CHECK IN (`bug`, `feature_request`) |
| `status` | VARCHAR(20) | DEFAULT `'open'`, CHECK IN (`open`, `in_progress`, `resolved`) |
| `reporter_id` | INTEGER | NOT NULL — validated in application logic |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

## Setup & Installation

### Prerequisites

- Node.js LTS (24.x or higher)
- PostgreSQL running locally or a remote connection string

### Steps

**1. Clone the repository**
```bash
git clone <repository-url>
cd assignment-2
```

**2. Install dependencies**
```bash
npm install
```

**3. Create a `.env` file** in the project root
```env
CONNECTION=postgresql://username:password@localhost:5432/devpulse
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
```

**4. Start the development server**
```bash
npm run dev
```

The server starts at `http://localhost:5000`. The database tables are created automatically on first run.

---

## API Endpoints

### Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/signup` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login and receive JWT |

### Issues

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/issues` | Public | Get all issues (supports filtering & sorting) |
| `GET` | `/api/issues/:id` | Public | Get a single issue by ID |
| `POST` | `/api/issues` | Authenticated | Create a new issue |
| `PATCH` | `/api/issues/:id` | Authenticated | Update an issue |
| `DELETE` | `/api/issues/:id` | Maintainer only | Delete an issue |

#### Query Parameters — `GET /api/issues`

| Param | Values | Default |
|-------|--------|---------|
| `sort` | `newest`, `oldest` | `newest` |
| `type` | `bug`, `feature_request` | — |
| `status` | `open`, `in_progress`, `resolved` | — |

---

## Authentication

All protected endpoints require a JWT in the `Authorization` header:

```
Authorization: <token>
```

The token is returned from `POST /api/auth/login` as `data.token`.

---

## Role Permissions

| Action | Contributor | Maintainer |
|--------|-------------|------------|
| Register / Login | ✅ | ✅ |
| Create issue | ✅ | ✅ |
| View all issues | ✅ | ✅ |
| Update own issue (status `open` only) | ✅ | ✅ |
| Update any issue | ❌ | ✅ |
| Change issue status | ❌ | ✅ |
| Delete any issue | ❌ | ✅ |

---

## Response Format

### Success
```json
{
  "success": true,
  "message": "Operation description",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Error description",
  "errors": {}
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| `200` | Successful GET, PATCH, DELETE |
| `201` | Successful POST (resource created) |
| `400` | Validation error or duplicate resource |
| `401` | Missing or invalid JWT token |
| `403` | Valid token but insufficient permissions |
| `404` | Resource not found |
| `409` | Business logic conflict |
| `500` | Unexpected server error |

---

## Example Requests

### Signup
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@devpulse.com",
  "password": "securePassword123",
  "role": "contributor"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@devpulse.com",
  "password": "securePassword123"
}
```

### Create Issue
```bash
POST /api/issues
Authorization: <your_jwt_token>
Content-Type: application/json

{
  "title": "Database connection timeout under load",
  "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
  "type": "bug"
}
```
