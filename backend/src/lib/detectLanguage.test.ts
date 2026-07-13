import { describe, it, expect } from "vitest";
import { detectLanguage } from "./detectLanguage";

// Spec: pick the response language from the patient's message content, so the
// AI replies in the language they wrote in. Falls back to the UI language when
// the message carries no strong signal.
//   - `å` never appears in standard Finnish  => strong Swedish signal
//   - `ä`/`ö` lean Finnish (used in both, but weighted to Finnish here)
//   - otherwise match on a small keyword list, else fall back.
describe("detectLanguage", () => {
  it("detects Finnish from keywords", () => {
    expect(detectLanguage("Minulla on päänsärky ja kuumetta", "en")).toBe("fi");
    expect(detectLanguage("Olen yskänyt kolme päivää", "en")).toBe("fi");
  });

  it("detects Swedish from the å character", () => {
    expect(detectLanguage("Jag har ont i ryggen på morgonen", "en")).toBe("sv");
  });

  it("detects Swedish from keywords when no Finnish signal is present", () => {
    expect(detectLanguage("Jag har feber och hosta sedan igår", "en")).toBe("sv");
  });

  it("returns English (via fallback) for plain English input", () => {
    expect(detectLanguage("I have a sore throat and headache", "en")).toBe("en");
    expect(detectLanguage("My back hurts when I sit down", "en")).toBe("en");
  });

  it("uses the fallback when the message has no language signal", () => {
    expect(detectLanguage("12345 ...", "fi")).toBe("fi");
    expect(detectLanguage("12345 ...", "en")).toBe("en");
  });

  // Documents a known limitation, not a target to "fix": ä/ö are weighted to
  // Finnish, so a Swedish sentence containing ä/ö is classified as Finnish.
  it("(known limitation) weights ä/ö to Finnish even in Swedish text", () => {
    expect(detectLanguage("Jag känner mig sjuk", "en")).toBe("fi");
  });
});
