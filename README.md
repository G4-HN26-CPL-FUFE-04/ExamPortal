# ExamPortal

ExamPortal is a first-version online examination system built from the handoff spec in [exam-portal-handoff-spec-en.txt](/C:/Users/VuDino/OneDrive/Documents/GitHub/ExamPortal/exam-portal-handoff-spec-en.txt:1).

## Stack

- `frontend/`: React + React Router + Axios
- `backend/`: Spring Boot 3 + Spring Security + Spring Data JPA
- Database target: SQL Server
- Test database: H2 in-memory

## Current MVP Scope

- JWT authentication and role-based access
- User, subject, topic, question, exam, and exam session management APIs
- Student exam participation flow with countdown UI and auto-submit request path
- Automatic grading and result review
- Dashboard overview and basic statistics

Challenge mode and leaderboard are intentionally excluded from this version.

## Run Locally

### Backend

1. Open SQL Server Management Studio and run [backend/database/schema.sql](/C:/Users/VuDino/OneDrive/Documents/GitHub/ExamPortal/backend/database/schema.sql:1) one time.
2. Update SQL Server connection values in [backend/src/main/resources/application.properties](/C:/Users/VuDino/OneDrive/Documents/GitHub/ExamPortal/backend/src/main/resources/application.properties:1) or provide `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET`.
3. Start the API.

```powershell
cd backend
./mvnw.cmd spring-boot:run
```

If you are using Windows `cmd`, do not use `./`.

```cmd
cd C:\Users\VuDino\OneDrive\Documents\GitHub\ExamPortal\backend
mvnw.cmd spring-boot:run
```

### Frontend

1. Optionally create `frontend/.env` with:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

2. Start the app:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

If you are using Windows `cmd`:

```cmd
cd C:\Users\VuDino\OneDrive\Documents\GitHub\ExamPortal\frontend
npm.cmd install
npm.cmd run dev
```

## Seed Accounts

These are inserted by the backend on first successful start, after the schema already exists.

- `admin@examportal.local` / `Admin@123`
- `instructor@examportal.local` / `Instructor@123`
- `student@examportal.local` / `Student@123`

## Verification

- Backend: `mvnw.cmd test`
- Frontend: `npm.cmd run build`
