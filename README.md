# StaffSync - Modern Human Resource Management

A MERN-stack HRMS with three roles (HR, Manager, Employee), JWT authentication and role-based access.

**Stack:** MongoDB, Express.js, React.js (Vite), Node.js, JWT, Bootstrap 5, HTML5, CSS3, async/await JavaScript.

## Features

| Area | HR | Manager | Employee |
|---|---|---|---|
| Sign up / sign in (JWT) | yes | yes | yes |
| Employee records (add, edit, delete, assign manager) | full | view own team | view directory |
| Attendance check-in / check-out (late after 9:30 AM) | yes | yes | yes |
| Attendance for others | everyone | own team | - |
| Apply for leave (balance checked, weekends skipped) | yes | yes | yes |
| Approve / reject leave | everyone | own team | - |
| Announcements | post and delete | read | read |
| Training programs | create, delete | create, delete own | enroll / leave |
| Dashboard | company stats | team stats | personal stats |
| Profile + change password | yes | yes | yes |

## Setup

You need Node.js 18+ and MongoDB running locally (or a MongoDB Atlas connection string).

### 1. Backend
```bash
cd server
npm install
cp .env.example .env      # then edit MONGO_URI and JWT_SECRET
npm run seed              # optional: loads demo users and data
npm run dev               # API on http://localhost:5000
```

### 2. Frontend (new terminal)
```bash
cd client
npm install
npm run dev               # App on http://localhost:5173
```

Open http://localhost:5173.

### Demo logins (after `npm run seed`, password `Password@123`)
- HR: `hr@staffsync.com`
- Manager: `manager@staffsync.com`
- Employee: `employee@staffsync.com`

Without seeding, the **first account you register becomes the HR admin**; later sign-ups are employees.

## Project structure
```
server/
  server.js            Express app entry
  seed.js              demo data
  config/db.js         MongoDB connection
  models/              User, Leave, Attendance, Announcement, Training
  middleware/          auth.js (JWT + roles), error.js
  routes/              auth, users, leaves, attendance, announcements, trainings, dashboard
client/
  src/api.js           axios instance + JWT interceptor
  src/context/         AuthContext, ToastContext
  src/components/      Layout, Modal, PunchCard, shared UI
  src/pages/           Login, Register, Dashboard, Employees, Attendance,
                       Leaves, Announcements, Training, Profile
```

## API overview (all except /auth/login and /auth/register need `Authorization: Bearer <token>`)
- `POST /api/auth/register`, `POST /api/auth/login`, `GET/PUT /api/auth/me`, `PUT /api/auth/password`
- `GET/POST /api/users`, `PUT/DELETE /api/users/:id`, `GET /api/users/meta` (HR)
- `POST /api/leaves`, `GET /api/leaves/mine`, `GET /api/leaves/manage`, `PUT /api/leaves/:id/status`, `DELETE /api/leaves/:id`
- `POST /api/attendance/check-in`, `POST /api/attendance/check-out`, `GET /api/attendance/mine`, `GET /api/attendance/team`
- `GET/POST/DELETE /api/announcements`
- `GET/POST/DELETE /api/trainings`, `POST /api/trainings/:id/enroll`
- `GET /api/dashboard`

## Production notes
Set a long random `JWT_SECRET`, set `CLIENT_URL` to your deployed frontend, build the client with `npm run build`
(set `VITE_API_URL` to your API URL if it is on another domain), and serve `client/dist` from any static host.
