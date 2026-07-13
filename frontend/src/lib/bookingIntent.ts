// Booking-intent detection for the chat page.
//
// Deterministic, case-insensitive substring keyword matching — the first,
// testable layer that decides whether to surface the in-app "Book Appointment"
// CTA. It is intentionally simple: it will not catch words that don't contain a
// listed keyword as a substring (e.g. Finnish "ajanvaraus"), typos, or implied
// intent. Moving to a model-emitted structured action is the natural next step.
//
// Extracted verbatim from Chat.tsx so it can be unit-tested; behaviour matches
// the previous inline logic exactly.
export const BOOKING_KEYWORDS = [
  "book", "appointment", "varaa", "aika", "boka", "tid",
  "doctor", "lääkäri", "läkare", "schedule",
];

export function hasBookingIntent(content: string): boolean {
  const lower = content.toLowerCase();
  return BOOKING_KEYWORDS.some((kw) => lower.includes(kw));
}

type ChatRole = "user" | "assistant" | string;

// Show the CTA if EITHER the latest assistant reply OR the latest patient
// message shows booking intent. Scanning the patient's own message is the fix
// for the original bug (only assistant messages were scanned before).
export function shouldShowBookingCTA(
  messages: { role: ChatRole; content: string }[]
): boolean {
  const reversed = [...messages].reverse();
  const lastAI = reversed.find((m) => m.role === "assistant");
  const lastUser = reversed.find((m) => m.role === "user");
  return (
    (lastAI?.content ? hasBookingIntent(lastAI.content) : false) ||
    (lastUser?.content ? hasBookingIntent(lastUser.content) : false)
  );
}
