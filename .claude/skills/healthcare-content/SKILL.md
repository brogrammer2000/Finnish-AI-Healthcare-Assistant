---
name: healthcare-content
description: >-
  Content and tone rules for SisuCare's patient-facing healthcare assistant.
  Use this whenever writing, editing, or reviewing text the patient reads —
  the AI triage system prompt (backend/src/routes/Chat.ts), quick-reply
  prompts, empty-state copy, error messages, or any new patient-facing string.
  Enforces four things: stay informational (no diagnosis), recommend care
  levels without naming conditions, always include a "not a substitute for
  professional medical advice" disclaimer, and keep Finnish / English / Swedish
  output consistent. Trigger on any change to assistant replies or triage copy.
---

# Healthcare content rules (SisuCare)

SisuCare is a triage + booking assistant for a Finnish clinic. The assistant
helps a patient describe symptoms, points them to the right level of care, and
directs them to the in-app booking flow. It is **not** a diagnostic tool. Apply
these rules to any patient-facing text.

## 1. Informational, never diagnostic

The assistant provides information and triage guidance. It does not diagnose.

- **Do not name a specific condition as the patient's** ("you have strep
  throat", "this is migraine", "sounds like appendicitis"). Naming a diagnosis
  is the boundary — stay on the safe side of it.
- Describe **urgency and care level** instead, using the app's existing scale:
  Emergency, Urgent, Routine, or Self-care; and the doctor type: General
  Practitioner, Nurse, or Specialist.
- General educational information is fine ("fever is the body's common response
  to infection") as long as it isn't framed as *the patient's* diagnosis.
- Avoid prescriptive dosing or specific medication instructions. General
  self-care advice (rest, fluids, when to seek care) is fine.
- Always keep the emergency instruction: tell patients to call **112** for
  life-threatening emergencies.

Prefer verbs like *may suggest, can be associated with, it would be worth
having a clinician check* over *you have / this is / you are suffering from*.

## 2. Route to care, not to a condition

When symptoms warrant a visit, recommend a care level and the in-app booking
flow — never external contact.

- Booking happens **in the app only**. Never tell a patient to call a clinic,
  visit in person, or use an outside website/phone number. Point them to the
  in-app **Book Appointment** action.
- This mirrors the backend system prompt; keep the two consistent if either
  changes.

## 3. Always include the disclaimer

Every substantive triage or symptom response must make clear the assistant does
**not replace professional medical advice**. Keep it short, in the patient's
language, e.g.:

- EN: "This is general guidance and doesn't replace professional medical
  advice. For anything urgent, call 112."
- FI: "Tämä on yleistä ohjeistusta eikä korvaa ammattilaisen arviota.
  Kiireellisissä tapauksissa soita 112."
- SV: "Detta är allmän vägledning och ersätter inte professionell medicinsk
  bedömning. Ring 112 vid akuta fall."

## 4. Consistent Finnish / English / Swedish handling

The app detects the patient's language (detectLanguage in
backend/src/lib/detectLanguage.ts) and replies in it: fi, sv, or en.

- **Reply entirely in the patient's language.** Do not mix languages
  mid-response.
- The disclaimer, the emergency (112) note, and the booking direction must all
  appear **in that same language** — don't drop them just because a phrase is
  easier in English.
- If you add or change a patient-facing UI string, add it to **all three**
  language dictionaries in frontend/src/i18n.tsx (en, fi, sv).

## Quick self-check before shipping copy

1. Did I avoid naming the patient's condition? (information & care level only)
2. Did I route to the **in-app** booking flow, not external contact?
3. Is the "doesn't replace professional medical advice" disclaimer present?
4. Is the 112 emergency note present?
5. Is everything — including 3 and 4 — in the patient's detected language?
