# SisuCare — architecture walkthrough

A spoken-style overview for explaining the app end to end. Read top to bottom;
each section is roughly one thing you'd say out loud.

## What it is, in one sentence

SisuCare is a Finnish healthcare triage assistant: a patient describes symptoms
in a chat, an AI assistant streams back guidance and a suggested level of care,
and if a visit is warranted the patient books an appointment inside the same
app. It handles Finnish, Swedish, and English.

## The shape of the system

It's two independent packages with no shared root or workspace tooling — you
`cd` into each one separately.

The **frontend** is React 19 with Vite, deployed on Vercel. The **backend** is
an Express (v5) API on Node, using Prisma as the ORM over a PostgreSQL database,
deployed on Railway. The AI is Anthropic's Claude (the `claude-haiku-4-5` model)
called from the backend — worth flagging that the README and an older Prisma
field name still say OpenAI/GPT-4, but the running code uses the Anthropic SDK;
I trust the code.

The frontend never holds an API key and never talks to Anthropic directly.
Everything goes through the backend.

## How a request flows, and how auth works

The frontend talks to the backend through a single Axios instance
(`services/api.ts`). Its base URL is an env var, and a request interceptor
attaches `Authorization: Bearer <token>` from `localStorage` on every call, so
individual components never think about auth headers.

Auth itself is stateless JWT with a 7-day expiry — there are no server-side
sessions. On the backend, middleware verifies the token and populates
`req.user`; a second middleware gates admin-only routes by checking a plain
`role` string on the user (`patient` or `admin`). On the frontend, an auth
context rehydrates the logged-in user on page load by calling `/auth/me` with
the stored token, and a `ProtectedRoute` wrapper gates every route except login.

## The centerpiece: the streaming AI chat

This is the most interesting route. When the patient sends a message, the
frontend POSTs it to `/api/chat`. On the backend, three things happen before
the model is called: I detect the language of the message, I load the last 10
messages of that user's history from Postgres for context, and I build a system
prompt that pins the assistant to healthcare triage and injects the resolved
language so the reply comes back in the patient's language.

Then I call Claude with streaming turned on and relay it to the browser using
**Server-Sent Events**. Each token the model produces is written to the response
as `data: {"token":"..."}` and the stream ends with `data: [DONE]`. The frontend
reads the response body as a stream, parses those SSE lines, and appends each
token to the on-screen message so the answer types out live. Only after the
stream finishes do I persist both the user message and the full assistant reply
to the `ChatMessage` table — so a dropped connection doesn't save a half answer.

### Why SSE, specifically

SSE is one-directional, which is all I needed — the server pushes AI response
chunks to the client. It's simpler to implement than a full two-way websocket
connection, it works over plain HTTP so there's no special protocol handling,
and it reconnects automatically if the connection drops, which polling doesn't
give me for free and websockets require me to build.

## Two pieces of deterministic logic I pulled out and unit-tested

Most of the app's behavior is probabilistic (the model), but two decisions are
plain code, so I made them their own modules and put real tests around them.

**Language detection.** A small function looks at the message text and returns
`fi`, `sv`, or `en`, falling back to the UI language when there's no clear
signal. The letter `å` never appears in standard Finnish, so it's a strong
Swedish signal; `ä`/`ö` lean Finnish; beyond that it matches a short list of
common words. That resolved language gets injected into the system prompt so the
model answers in the right language.

**Booking-intent detection.** When a message is about booking, the UI surfaces
an in-app "Book Appointment" button. This is where I have a "something that
broke" story. My spec was: if the user asks about booking, they get directed to
the in-app booking system. I wrote the test first — if the prompt contains
"appointment" or "booking," the booking link should appear. The first version
failed: the assistant handed out a local clinic's phone number instead of using
my booking flow. I fixed it in two places — I tightened the backend system
prompt to say booking only ever happens in-app, and I fixed the frontend, which
was only scanning the assistant's messages for the keywords, not the user's own
message, so I made it scan both. With both fixes, the test passed.

I'm upfront that this intent detection is keyword substring matching, which is
brittle — it won't catch a Finnish user typing "ajanvaraus," typos, or intent
without the exact keyword. That's deliberate: keyword matching is the
deterministic, testable first layer. The natural next step is having the model
emit a structured action or tool call, but that shifts the testing story from
unit tests to evals, because you're then verifying probabilistic behavior
instead of a code path. I have a passing test that documents exactly what the
current version does *not* catch, so the limitation is visible, not hidden.

## The data layer

Prisma over Postgres, with three models: `User`, `Appointment`, and
`ChatMessage`. One detail I'd call out: the doctors, service types, and 30-minute
time slots for appointments aren't database rows — they're hardcoded constants,
and availability is computed by subtracting already-booked slots from the
generated ones. That was the simplest thing that worked for a fixed clinic
schedule; making them real data would be the change if the clinic set needed to
be dynamic.

Connection-wise there are two database URLs: a pooled one for the app and a
direct one for migrations, which matters when you're behind a connection pooler
like pgbouncer.

## Deployment

The backend runs on Railway; on every deploy it generates the Prisma client,
applies migrations, seeds demo users, and starts the server. The frontend is a
Vite build on Vercel that points at the backend's `/api` via an env var.

## How I built it (the workflow I'd want to talk about)

The parts that are plain code, I built spec-first and test-first: write down
what "done" means, encode it as a failing test, then implement against that test
as the guardrail, then review. The tests are the thing I trust, not the
generated code directly. For this repo that meant extracting the language and
booking logic into their own modules so they're importable and testable, writing
the tests red first, and only then wiring the production code to them — the
frontend and backend both import those exact modules, so the tests exercise the
real path, not a copy.
