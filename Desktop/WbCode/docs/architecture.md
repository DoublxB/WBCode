# WBCode Architecture

## Overview
WBCode is a modular learning platform that pairs structured CS lessons with gamification mechanics. The system is split into a NestJS backend, a React/Tailwind frontend, and a shared schema package to keep contracts aligned. Clean architecture principles guide the layering: transport/controllers → services → repositories/data, with cross-cutting domain services (gamification, challenges, scheduling) isolated for reuse.

## High-Level Components
- **Frontend (`frontend/`)** – Vite + React + TypeScript, TailwindCSS, React Router, React Query, Zustand, Vitest. Provides role-aware layouts, reusable UI modules (code editor, quiz runner, charts, leaderboards, missions) and consumes the REST API.
- **Backend (`backend/`)** – NestJS + TypeScript, Prisma ORM (MySQL), modularized features (auth, users, lessons, quizzes, coding exercises, submissions, gamification, friendships/challenges, missions, dashboards, admin). Uses JWT auth, bcrypt hashing, and integrates with a sandbox worker for compiling/running code.
- **Shared (`shared/`)** – Type-safe contracts (Zod schemas, Role enums, DTO helpers) imported by both frontend and backend to guarantee compatibility.
- **Docs (`docs/`)** – Architecture notes, API reference, deployment guidance.

## Backend Modules
| Module | Responsibilities |
| --- | --- |
| `auth` | Registration/login, JWT issuing, refresh tokens, password hashing. |
| `users` | Profiles, avatars, titles, role assignments (admin-managed). |
| `lessons` | CRUD for lessons, sections, attachments. Professor-only write. |
| `quizzes` | Quiz definitions, questions, answer keys, explanations. |
| `coding` | Coding exercises, starter code, I/O samples, sandbox runs, submissions. |
| `submissions` | Stores quiz + code attempts, grading feedback, explanations for mistakes. |
| `gamification` | XP, badge/tier logic, level curves, streak tracking, leaderboard aggregation. |
| `friendships` | Friend graph management, invitations. |
| `challenges` | Peer challenges, opponent status, XP bonuses. |
| `missions` | Weekly professor-defined missions plus scheduler awarding XP. |
| `dashboard` | Professor analytics, class stats, exportable CSV/PDF reports. |
| `admin` | User management, role assignment, platform status endpoints. |

### Data Layer
Prisma manages MySQL schema with tables for users, roles, lessons, quizzes, quiz_questions, coding_exercises, submissions, xp_ledger, badges, titles, leaderboard_entries, friendships, challenges, weekly_missions, mission_participants, dashboards/reports. Seeds provide representative data for all roles plus sample content.

### Code Sandbox
A lightweight worker service (Dockerized) exposes `/run` to execute C/C++/Python using `gcc`, `g++`, and `python3`. Backend dispatches execution jobs with timeouts, captures stdout/stderr/errors, and persists results via `submissions`.

### Scheduling
`@nestjs/schedule` cron job resets weekly missions, rolls streaks, and regenerates leaderboard snapshots every 24h to support analytics.

### Security
- JWT access + refresh tokens, stored httpOnly cookies on frontend.
- Role guards ensuring student/professor/admin scopes.
- Input validation via class-validator + Zod.
- Helmet, CORS, rate limiting, Prisma soft deletes for GDPR compliance.

## Frontend Modules
- **Auth** – Signup/login/reset flows, onboarding with role awareness.
- **Student Dashboard** – Progress charts (Recharts), streak widget, XP meter, weekly missions.
- **Lessons** – Content explorer with sections, embedded code snippets.
- **Code Lab** – Monaco editor with language toggle (C/C++/Python), auto-save, run via backend sandbox, inline results/explanations.
- **Quiz Runner** – Multiple question types, instant feedback/explanations.
- **Gamification** – XP, badge/titles carousel, leaderboard, friend challenges, streak indicator.
- **Profile** – Avatar picker, title selection, stats, history.
- **Professor Suite** – Content builder (lessons/quizzes/coding), weekly mission configurator, dashboard analytics, report export.
- **Admin Panel** – User search, role assignments, status view.

Responsive layout uses Tailwind design tokens inspired by Brilliant.org: vibrant gradients, cards, contrasty typography. Dark/light themes toggled via CSS variables.

## Shared Contracts
`shared/` exposes:
- `schemas/` – Zod schemas for Auth, Lesson, Quiz, CodingExercise, Submission, Gamification events, Mission definitions.
- `types.ts` – Role enums, XP thresholds, badge definitions.
- `api.ts` – REST endpoint constants and helper functions for consistent fetcher creation.

Frontend imports these via TypeScript path aliases; backend pipes Zod schemas into DTO validation for parity.

## Testing Strategy
- **Backend** – Jest unit tests for services (auth, gamification, challenges). Supertest integration suite for auth flows, submission grading, leaderboard updates, mission scheduling.
- **Frontend** – Vitest + React Testing Library for auth forms, dashboard widgets, quiz runner, code editor interactions (mocking sandbox). Cypress (optional stretch) for smoke user journeys.

## Deployment Notes
- `.env` holds DB credentials, JWT secrets, sandbox URL. `.env.example` documents required variables.
- Docker Compose spins up MySQL + sandbox worker locally. Backend uses Prisma migrations; `npm run seed` populates data.
- CI pipeline: lint → test backend → test frontend → build artifacts. Future extension: containerize backend/frontend for cloud deploy.

This document should be kept in sync with implementation. See `docs/api.md` for endpoint-level reference once generated.



