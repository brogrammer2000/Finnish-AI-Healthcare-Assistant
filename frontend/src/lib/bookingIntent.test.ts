import { describe, it, expect } from "vitest";
import { hasBookingIntent, shouldShowBookingCTA } from "./bookingIntent";

// Spec: when a chat message is about booking/appointments, the in-app "Book
// Appointment" CTA should appear. The scan must cover BOTH the assistant's
// reply AND the patient's own message — the original bug only scanned assistant
// messages, so a patient asking to book saw nothing.
describe("hasBookingIntent", () => {
  it("matches English booking phrases", () => {
    expect(hasBookingIntent("I want to book an appointment")).toBe(true);
    expect(hasBookingIntent("Can I schedule a doctor visit?")).toBe(true);
  });

  it("matches via Finnish/Swedish keywords", () => {
    expect(hasBookingIntent("Haluan ajan lääkärille")).toBe(true); // lääkäri
    expect(hasBookingIntent("Jag vill boka en tid")).toBe(true); // boka / tid
  });

  it("returns false for plain symptom talk", () => {
    expect(hasBookingIntent("I have a headache and a fever")).toBe(false);
  });

  // Documents the known limitation, NOT a target to fix here: it's substring
  // keyword matching, so a Finnish user typing "ajanvaraus" (no listed keyword
  // as a substring) or a typo slips through undetected.
  it("(known limitation) misses 'ajanvaraus' and typos", () => {
    expect(hasBookingIntent("ajanvaraus")).toBe(false);
  });
});

describe("shouldShowBookingCTA", () => {
  it("shows the CTA when the PATIENT's own message asks to book (the bug fix)", () => {
    const messages = [{ role: "user", content: "I need an appointment please" }];
    expect(shouldShowBookingCTA(messages)).toBe(true);
  });

  it("shows the CTA when the assistant recommends booking", () => {
    const messages = [
      { role: "user", content: "My knee has hurt for a week" },
      { role: "assistant", content: "I recommend you book a doctor visit." },
    ];
    expect(shouldShowBookingCTA(messages)).toBe(true);
  });

  it("hides the CTA when neither latest message mentions booking", () => {
    const messages = [
      { role: "user", content: "I have a fever" },
      { role: "assistant", content: "Rest and drink fluids." },
    ];
    expect(shouldShowBookingCTA(messages)).toBe(false);
  });
});
