# LeadFlow CRM

A focused full-stack evaluation MVP built for digital marketing and web agencies to centralize prospective client enquiries, manage pipeline stages, and schedule follow-ups.

---

## 1. Technology Stack

- **Frontend**: React 18, Vite, React Router v6, Axios, Lucide Icons, Vanilla CSS
- **Backend**: Node.js, Express.js REST API
- **Database**: MongoDB, Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens), `bcryptjs` password hashing
- **Validation**: Server-side field validation & `express-validator`

---

## 2. Architecture & Design

```
React Frontend (Port 5173)
       │ HTTP / REST (JWT Bearer Token)
       ▼
Express API (Port 5000 /api/v1)
 ├── Middleware (Auth check, ObjectId validation, Error handling)
 ├── Controllers (Auth, Leads, Activities, Dashboard)
 └── Mongoose Models (User, Lead, Activity)
       │
       ▼
MongoDB Server (Port 27017 / leadflow_crm)
```

- **Separation of Concerns**: Routes, controllers, models, and middleware are cleanly decoupled.
- **Data Integrity**: Deleting a lead automatically deletes all associated follow-ups (cascading delete).
- **Security**:
  - Passwords hashed with `bcryptjs` (salt factor 10).
  - `passwordHash` is excluded from all API responses.
  - Ownership (`createdBy`) is strictly assigned server-side from JWT claims—never trusted from the request body.
  - Restricted fields (`_id`, `createdBy`, `createdAt`, `updatedAt`) are rejected on update.
  - Stack traces and sensitive internal configuration are suppressed from API error responses.

---

## 3. Prerequisites

- **Node.js**: v18.x or higher (tested on v24.14.1)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI

---

## 4. Local Setup

### 1. Clone the repository
```bash
git clone <repository_url>
cd "Leadflow crm"
```

### 2. Configure Environment Variables
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

Example configuration (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/leadflow_crm
JWT_SECRET=leadflow_crm_super_secret_jwt_key_evaluation_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

---

## 5. Running the Application

### Start the Backend Server (Port 5000)
```bash
cd backend
npm start
# Or for development with hot reload:
npm run dev
```

### Start the Frontend Client (Port 5173)
```bash
cd frontend
npm run dev
```
Open **http://localhost:5173** in your browser.

### Run Automated Test Suite
With the backend server running, execute:
```bash
node backend/test/run-checklist.js
```

---

## 6. REST API Summary (Base Path: `/api/v1`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | API health check and server uptime |
| `POST` | `/auth/register` | Public | Register new user; returns JWT token + user profile |
| `POST` | `/auth/login` | Public | Authenticate user; returns JWT token + user profile |
| `GET` | `/auth/me` | Protected | Returns authenticated user's safe profile |
| `GET` | `/leads` | Protected | List leads; supports `?search=` and `?stage=` |
| `POST` | `/leads` | Protected | Create a new prospective lead |
| `GET` | `/leads/:id` | Protected | Get single lead with associated follow-ups |
| `PATCH` | `/leads/:id` | Protected | Update permitted lead fields / change stage |
| `DELETE` | `/leads/:id` | Protected | Delete lead and cascade-delete its follow-ups |
| `GET` | `/activities` | Protected | List follow-ups; supports `?status=` and `?leadId=` |
| `POST` | `/activities` | Protected | Create follow-up activity for a lead |
| `PATCH` | `/activities/:id` | Protected | Update activity or toggle completion status |
| `GET` | `/dashboard/summary`| Protected | Live metrics: total, active, won, pending, overdue |

---

## 7. Known Limitations & Architecture Notes

- **Single Workspace Demo**: The app is designed for a single-workspace agency evaluation; multi-tenant workspace routing is intentionally out of scope.
- **Timezone Assumptions**: Due dates are transmitted as ISO 8601 strings in UTC and rendered locally via browser locale.
- **Out of Scope Features**: Per the specification, external automation (WhatsApp, email delivery), payment gateways, and AI lead scoring are excluded to focus on a robust evaluation MVP.
