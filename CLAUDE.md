# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Full-stack AI healthcare triage + appointment booking app ("SisuCare"). Two independent npm packages — `backend/` (Express + Prisma + PostgreSQL) and `frontend/` (React 19 + Vite) — with no shared root package or workspace tooling. Always `cd` into the relevant package before running commands.

> Note: `README.md` and the Prisma `aiRecommendation` naming refer to OpenAI/GPT-4, but the chat implementation actually uses the **Anthropic SDK** (`claude-haiku-4-5-20251001`). Trust the code, not the README, for the AI provider.

## Working rules

- **Never modify existing test files without explicitly flagging it first.** Tests are the guardrail — if a test needs to change, stop and say so before touching it.
- **Prefer the simplest solution** that satisfies the spec. Don't add layers, abstractions, or cleverness that aren't required.
- **Ask before adding a new dependency or a new abstraction.** No new npm packages, frameworks, or architectural patterns without confirming first.

## Commands

### Backend (`cd backend`)
- `npm run dev` — dev server with hot reload (nodemon + tsx) on port 3001
- `npm run build` — compile TypeScript to `dist/`
- `npm run seed` — upsert demo users (`demo@test.com`/`demo123`, `admin@healthcare.com`/`admin123`)
- `npx prisma migrate dev` — create/apply migration locally; `npx prisma generate` regenerates the client (also runs on `postinstall`)
- No test suite (the `test` script is a placeholder that exits 1).

### Frontend (`cd frontend`)
- `npm run dev` — Vite dev server on port 5173
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — ESLint over the whole package
- `npm test` — Vitest (jsdom); `npm run test:ui` for the UI runner
- Run a single test: `npx vitest run src/pages/Login.test.tsx` (or `npx vitest -t "<name>"`)

## Architecture

### Request/auth flow
- Frontend talks to the backend only through [frontend/src/services/api.ts](frontend/src/services/api.ts) — a single Axios instance whose base URL is `VITE_API_URL` and whose request interceptor attaches `Authorization: Bearer <token>` from `localStorage`.
- Auth state lives in [frontend/src/context/AuthContext.tsx](frontend/src/context/AuthContext.tsx). On mount it calls `/auth/me` to rehydrate the user from a stored token; `ProtectedRoute` in [frontend/src/App.tsx](frontend/src/App.tsx) gates every route except `/login`.
- Backend auth is stateless JWT (7-day expiry). [backend/src/middleware/auth.ts](backend/src/middleware/auth.ts) exports `authenticateToken` (populates `req.user`) and `isAdmin` (role gate). Note: `Auth.ts` verifies tokens inline in `/me` and `/avatar` rather than using the middleware — keep that in mind when changing token logic.
- Roles are a plain `role` string on `User` (`"patient"` | `"admin"`); the admin dashboard and `/appointments/all` require `isAdmin`.

### Backend structure
- [backend/src/index.ts](backend/src/index.ts) mounts three routers under `/api`: `auth`, `chat`, `appointments`, plus `/api/health`.
- A single shared `PrismaClient` is exported from [backend/src/lib/prisma.ts](backend/src/lib/prisma.ts) — import it, don't instantiate new clients.
- Prisma schema ([backend/prisma/schema.prisma](backend/prisma/schema.prisma)): `User`, `Appointment`, `ChatMessage`. Uses `DATABASE_URL` (pooled, e.g. pgbouncer) and `DIRECT_URL` (direct connection for migrations). Avatars are stored inline as base64 data URIs in `User.profileImage` (`@db.Text`).
- Appointments ([backend/src/routes/Appointments.ts](backend/src/routes/Appointments.ts)): doctors, service types, and 30-min time slots (09:00–17:00) are **hardcoded constants**, not DB rows. Availability is computed by subtracting booked (non-cancelled) appointments from generated slots.

### AI chat (streaming)
- [backend/src/routes/Chat.ts](backend/src/routes/Chat.ts) is the most involved route:
  - `POST /api/chat` streams the model response to the browser via **Server-Sent Events** — each token is written as `data: {"token":"..."}\n\n`, terminated by `data: [DONE]`. The Anthropic client is lazy-initialized so `ANTHROPIC_API_KEY` is read after dotenv loads.
  - The last 10 messages are loaded from `ChatMessage` for context; user + assistant messages are persisted **after** the stream completes.
  - `detectLanguage()` heuristically picks Finnish/Swedish/English from message content (å ⇒ Swedish, keyword lists, ä/ö ⇒ Finnish-leaning) and injects the resolved language into the system prompt so replies match the patient's language. The system prompt also hard-codes that booking happens in-app (never tell users to call/visit externally).
- The frontend chat page consumes the SSE stream and shows a "Book Appointment" affordance inline.

### Internationalization
- Custom i18n with **no third-party library**: [frontend/src/i18n.tsx](frontend/src/i18n.tsx) holds a `translations` dict for `en`/`fi`/`sv`, a `t(key, vars)` function, and a context provider with `localStorage` persistence + browser-language detection. When adding UI strings, add the key to all three language dicts.

## Deployment
- Backend deploys on Railway ([backend/railway.toml](backend/railway.toml)): build runs `prisma generate`; startup runs `prisma migrate deploy && npm run seed && node dist/index.js` — i.e. migrations and seeding run on every deploy.
- Frontend deploys on Vercel (root dir `frontend`, Vite). Requires `VITE_API_URL` pointing at the backend `/api`.
- Backend env vars: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, `PORT` (optional, defaults 3001). `RESEND_API_KEY` if email is wired up (`resend` is a dependency).
