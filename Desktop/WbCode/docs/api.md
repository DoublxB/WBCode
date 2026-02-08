# WBCode API Reference

Base URL: `http://localhost:4000/api`

## Authentication
| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Register a new student profile. Body: `{ email, password, firstName, lastName }` |
| `POST` | `/auth/login` | Obtain JWT access + refresh tokens. |
| `POST` | `/auth/refresh` | Refresh tokens (requires `Authorization` header). |
| `GET` | `/auth/me` | Returns current JWT payload. |

All protected endpoints require `Authorization: Bearer <accessToken>`.

## Users & Profiles
- `GET /users/profile` – Detailed profile (role, XP, badges, streak).
- `PATCH /users/profile` – Update avatar/title `{ avatarUrl?, title? }`.

## Lessons & Content
- `GET /lessons` – List lessons with attached quizzes/coding tasks.
- `GET /lessons/:id` – Lesson detail.
- `POST /lessons` – (Professor/Admin) Create lesson.
- `PATCH /lessons/:id`, `DELETE /lessons/:id` – Manage lesson.

## Quizzes
- `POST /quizzes` – (Professor/Admin) Create quiz + questions for a lesson.
- `GET /quizzes/:id` – Retrieve quiz with questions.
- `POST /quizzes/:id/submit` – Submit answers `{ answers: [{ questionId, answer }] }`, returns score + XP gain.

## Coding Exercises & Sandbox
- `GET /coding` – List coding exercises.
- `GET /coding/:id` – Retrieve single exercise.
- `POST /coding` – (Professor/Admin) Create coding task.
- `POST /coding/:id/submit` – Execute code in sandbox `{ sourceCode, stdin? }`, returns stdout/stderr, score, XP.

## Submissions
- `GET /submissions/me` – History of quiz/coding submissions including explanations.

## Gamification
- `GET /leaderboard` – XP-ranked leaderboard (top 50 by default).

## Friendships & Challenges
- `GET /friends` – List accepted friends.
- `POST /friends/:friendId` – Add friend.
- `GET /challenges` – List challenges involving the user.
- `POST /challenges` – Create challenge `{ opponentId, codingExerciseId }`.
- `POST /challenges/:id/accept` – Opponent accepts challenge.
- `POST /challenges/:id/submit` – Submit challenge attempt (same payload as coding submit).

## Weekly Missions
- `GET /missions` – Active missions with participants.
- `POST /missions` – (Professor/Admin) Create mission.
- `POST /missions/:id/join` – Join mission.
- `POST /missions/:id/progress` – Update mission progress `{ progress }`.

## Professor Dashboard
- `GET /professor/dashboard` – Aggregate stats (students, submissions, leaderboard).
- `GET /professor/reports/export` – Export CSV; response `{ mime, data }`.

## Admin Panel
- `GET /admin/users` – List all users + roles.
- `PATCH /admin/users/:id/role` – Update role `{ role }`.

## Health
- `GET /health` – Basic readiness probe.



















