# WBCode Platform

Modern, gamified CS learning platform with NestJS + Prisma backend, React + Tailwind frontend, and a sandbox worker for running C/C++/Python code.

## Tech Stack
- **Backend:** NestJS, Prisma, MySQL, JWT, BullMQ-ready architecture, Jest.
- **Frontend:** Vite + React + TypeScript, TailwindCSS, React Query, Zustand, Monaco.
- **Sandbox:** Node worker executing code securely via child processes.

## Getting Started

### Prerequisites
- Node.js 18+
- npm 10+
- MySQL 8 (or compatible)

### Environment Variables
Create `backend/.env`:
```
DATABASE_URL="mysql://user:password@localhost:3306/wbcode"
JWT_ACCESS_SECRET="access-secret"
JWT_REFRESH_SECRET="refresh-secret"
FRONTEND_URL="http://localhost:5173"
SANDBOX_URL="http://localhost:5051/run"
```

Frontend uses `.env` (optional):
```
VITE_API_BASE="http://localhost:4000/api"
```

### Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run seed
npm run start:dev
```

### Sandbox Worker
```bash
cd backend
npm run start:sandbox
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Available Scripts
- `npm run test` (backend) – unit tests.
- `npm run test:e2e` (backend) – integration test suite.
- `npm run test` (frontend) – Vitest component tests.

## Database Schema
Key tables:
- `User`, `Role` – accounts + roles (Student, Professor, Admin)
- `Lesson`, `Quiz`, `QuizQuestion`, `CodingExercise`
- `Submission` – quiz + coding attempts with feedback
- `XPEvent`, `Badge`, `LeaderboardEntry`
- `Friendship`, `Challenge`
- `WeeklyMission`, `MissionParticipant`
- `ProfessorReport`

See `prisma/schema.prisma` for full ER model.

## Testing

### Backend Tests

**Unit Tests** (Jest):
- `AuthService` - Registration, login, token refresh
- `UsersService` - Profile management
- `LessonsService` - CRUD operations, authorization
- `QuizzesService` - Quiz creation, submission, grading
- `CodingService` - Exercise management, code execution
- `ChallengesService` - Challenge creation, acceptance, scoring
- `MissionsService` - Mission management, progress tracking
- `GamificationService` - XP awards, badges, leaderboard
- `ProfessorDashboardService` - Dashboard stats, report export
- `AdminService` - User management, role assignment

**Integration Tests** (E2E):
- Auth flows (register, login, token refresh)
- Quiz submission and XP awarding
- Submission history retrieval

Run backend tests:
```bash
cd backend
npm test              # Unit tests
npm run test:e2e      # Integration tests
npm run test:cov      # Coverage report
```

### Frontend Tests

**Component Tests** (Vitest + React Testing Library):
- `LoginPage` - Form rendering, validation
- `StudentDashboard` - Data display, loading states
- `CodeEditor` - Code editing, language switching
- `QuizRunner` - Question rendering, answer selection, submission
- `ProfilePage` - Avatar/title selection, form submission
- `AdminPanelPage` - User list, role management

Run frontend tests:
```bash
cd frontend
npm run test          # Run all tests
npm run test:watch    # Watch mode
```

## Deployment Notes
- Containerize backend + sandbox separately; expose API on `4000`, sandbox on `5051`.
- Run Prisma migrations during deploy.
- Frontend built via `npm run build` (outputs to `dist/`).
- Set up CRON / worker for weekly mission scheduler (part of Nest `@nestjs/schedule`).



