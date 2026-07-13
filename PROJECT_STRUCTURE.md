# SisuCare — project structure walkthrough

A folder-by-folder tour of the repo. Every file below is described by what it
actually does, so if an interviewer opens any one of them you have a real answer.

## Repo root

Two independent npm packages, no shared root package or monorepo tooling — you
`cd` into each separately.

- **`CLAUDE.md`** — guidance file for AI coding tools; documents stack, commands, and the working rules.
- **`README.md`** — the public portfolio readme (Anthropic Claude / React 19).
- **`ARCHITECTURE.md` / `ARCHITECTURE_CHEATSHEET.md`** — interview-prep docs.
- **`.claude/`** — `settings.json` + `hooks/guardrail.sh` (the bypass-mode guardrail), `skills/healthcare-content/` (the content-rules skill), `GUARDRAIL.md`, and `settings.local.json` (local tool permissions).

## backend/ — Express + Prisma API

### Config / meta

- **`package.json`** — scripts (`dev` = nodemon+tsx, `build` = tsc, `seed`, `test` = vitest) and deps (Express 5, Prisma, Anthropic SDK, bcryptjs, jsonwebtoken, multer, cors). `openai` is still listed — only `test-lang.ts` uses it.
- **`tsconfig.json`** — TypeScript compiler config; compiles `src/` → `dist/`.
- **`railway.toml`** — deploy config. Build: `npm install && npm run build && npx prisma generate`. Start: `npx prisma migrate deploy && npm run seed && node dist/index.js`.
- **`.env`** — secrets (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`); gitignored.
- **`createAdmin.js`** — a one-off standalone script to create an admin user (superseded by the seed script).

### prisma/ — the database layer

- **`schema.prisma`** — the data model. Three tables: `User` (id, email, hashed password, name, `role`, `language`, optional base64 `profileImage`), `Appointment` (belongs to a user; `doctorName`, `serviceType`, `datetime`, `status`, `aiRecommendation`), and `ChatMessage` (belongs to a user; `role` = user/assistant, `content`, `timestamp`). Datasource uses `DATABASE_URL` (pooled) + `DIRECT_URL` (direct, for migrations).
- **`migrations/`** — SQL migration history (`..._init`, `..._add_profile_image`). `prisma migrate deploy` replays these to build the schema on any fresh DB.
- **`seed.ts`** — upserts the two demo accounts (`demo@test.com`/`demo123`, `admin@healthcare.com`/`admin123`) with bcrypt-hashed passwords. Upsert = safe to run on every deploy.

### src/ — the application

- **`index.ts`** — entry point. Creates the Express app, enables `cors` and JSON body parsing, mounts a `/api/health` check and three routers (`/api/auth`, `/api/chat`, `/api/appointments`), and listens on port 3001.
- **`lib/prisma.ts`** — creates and exports one shared `PrismaClient`. Everything imports this rather than making its own — one connection pool.
- **`middleware/auth.ts`** — two Express middlewares. `authenticateToken` pulls the Bearer token, verifies the JWT, and attaches `{id,email,role}` to `req.user`. `isAdmin` rejects anyone whose role isn't `admin`. Also defines the `AuthRequest` type.
- **`routes/Auth.ts`** — auth endpoints: `POST /register` (hash password with bcrypt, create user, issue a 7-day JWT), `POST /login` (look up user, `bcrypt.compare`, issue JWT), `GET /me` (rehydrate current user from token), and `POST /avatar` (multer handles the upload, image stored inline as a base64 data URI). Note: `/me` and `/avatar` verify the token inline instead of using the middleware — a real inconsistency you can point out.
- **`routes/Chat.ts`** — the AI chat, and the most involved file. `detectLanguage()` is imported from `lib/`. `POST /` builds the triage system prompt (with resolved language + in-app-booking rule), loads the last 10 messages for context, calls Claude with streaming, and relays tokens to the browser via Server-Sent Events, persisting both messages after the stream ends. Also `GET /history` and `DELETE /history`.
- **`lib/detectLanguage.ts` + `detectLanguage.test.ts`** — the extracted language-detection function and its 6 Vitest tests (red→green piece #1).
- **`routes/Appointments.ts`** — booking logic. Doctors, service types, and 09:00–17:00 half-hour slots are hardcoded constants. `GET /available-slots` computes availability by subtracting booked (non-cancelled) appointments from generated slots; `POST /` books (with a double-booking guard); `GET /my-appointments`, `PATCH /:id/cancel` (ownership-checked); and admin-only `GET /all` + `PATCH /:id/status`.
- **`test-lang.ts`** — the standalone pre-Vitest script that prints language-detection PASS/FAIL and makes one live OpenAI call. The lone remaining OpenAI user.

## frontend/ — React 19 + Vite

### Config

- **`package.json`** — scripts (`dev`, `build` = `tsc -b && vite build`, `lint`, `test` = vitest) and deps (React 19, react-router-dom 7, axios; Tailwind, Vitest, Testing Library as dev).
- **`vite.config.ts`** — Vite + React + Tailwind plugins, and the Vitest config (jsdom environment, `setupTests.ts`).
- **`tsconfig*.json`, `eslint.config.js`, `tailwind.config.js`, `index.html`** — build/lint/style config and the HTML shell that loads `main.tsx`.
- **`.env` / `.env.production`** — hold `VITE_API_URL` pointing at the backend `/api`.

### src/

- **`main.tsx`** — React entry point. Mounts `<App/>` wrapped in `<TranslationProvider>` (so i18n is available everywhere) inside `StrictMode`.
- **`App.tsx`** — the router. Defines routes (`/login`, `/`, `/chat`, `/appointments`, `/admin`), wraps everything except login in `<AuthProvider>` and a `ProtectedRoute` that redirects to `/login` if there's no user (and shows a loader while auth is resolving).
- **`services/api.ts`** — a single Axios instance with `VITE_API_URL` as base URL and a request interceptor that attaches `Authorization: Bearer <token>` from `localStorage`. Every API call goes through this.
- **`context/AuthContext.tsx`** — global auth state. On mount, if a token exists it calls `/auth/me` to restore the user; exposes `login`, `register`, `logout`, `updateUser`, plus `user`/`loading`. `useAuth()` is the hook components use.
- **`i18n.tsx`** — custom internationalization with no library: a `translations` dict for `en`/`fi`/`sv`, a `t(key, vars)` function, and a provider with browser-language detection + `localStorage` persistence.
- **`pages/Login.tsx`** — login/register form (email, password, name); calls `login`/`register` from the auth context. Has its own inline language buttons.
- **`pages/Home.tsx`** — the post-login dashboard: greeting hero, feature cards (triage, appointments, admin), and the shared `LanguageSwitcher`.
- **`pages/Chat.tsx`** — the chat UI. Consumes the SSE stream token-by-token, renders symptom tags, and shows the Book Appointment CTA via `shouldShowBookingCTA` (red→green piece #2).
- **`pages/Appointments.tsx`** — the booking flow: pick doctor/service/date, fetch available slots, book, and view/cancel your appointments.
- **`pages/Admin.tsx`** — admin dashboard: lists all appointments with stats/search and status updates (backed by the `isAdmin` routes).
- **`components/LanguageSwitcher.tsx` + `.test.tsx`** — the FI/EN/SV dropdown (with the `aria-label` we added) and its tests.
- **`lib/bookingIntent.ts` + `.test.ts`** — extracted booking-keyword logic and its 7 tests.
- **`pages/Login.test.tsx`, `Home.test.tsx`, `setupTests.ts`** — the pre-existing UI tests we repaired, plus Testing Library setup.

## Two "I know the tradeoffs" details worth memorizing

- **Auth is stateless JWT** — no server sessions, which is simple, but you can't revoke a token before its 7-day expiry.
- **Appointment doctors/slots are hardcoded, and avatars are base64 in Postgres** — fine for a demo; the real-world version would make doctors DB rows and put images in object storage.
