/**
 * Language detection + AI response test.
 * Run with: npx tsx src/test-lang.ts
 */
import "dotenv/config";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function detectLanguage(message: string, fallback = "en"): string {
  const lower = message.toLowerCase();

  if (/å/.test(lower)) return "sv";

  const swedishWords =
    /\b(jag|och|inte|är|har|för|med|kan|men|att|det|den|ett|var|som|vi|om|sjuk|feber|hosta|hjälp|läkare|värk|huvud)\b/;
  const finnishWords =
    /\b(minulla|olen|mutta|että|sitten|vain|myös|kipua|särkee|kuumetta|päänsärky|selkä|vatsa|lääkäri|flunssa|nuha|kuume|yskää|oireita|tarvitsen|tarkastus)\b/;

  const likelySwedish = swedishWords.test(lower);
  const likelyFinnish = finnishWords.test(lower) || /[äö]/.test(lower);

  if (likelySwedish && !likelyFinnish) return "sv";
  if (likelyFinnish) return "fi";

  return fallback;
}

// --- Detection unit checks ---
const detectionCases = [
  { msg: "Minulla on päänsärky ja kuumetta",     expected: "fi" },
  { msg: "Olen yskänyt kolme päivää",            expected: "fi" },
  { msg: "Jag har feber och hosta sedan igår",   expected: "sv" },
  { msg: "Jag mår inte bra, kan du hjälpa mig?", expected: "sv" },
  { msg: "I have a sore throat and headache",    expected: "en" },
  { msg: "My back hurts when I sit down",        expected: "en" },
];

console.log("=== Language detection ===");
let allPassed = true;
for (const { msg, expected } of detectionCases) {
  const got = detectLanguage(msg);
  const pass = got === expected;
  if (!pass) allPassed = false;
  console.log(`  ${pass ? "PASS" : "FAIL"}  "${msg}"`);
  console.log(`         expected=${expected}  got=${got}`);
}
console.log(allPassed ? "\nAll checks passed.\n" : "\nSome checks FAILED.\n");

// --- Live AI call with a hardcoded Finnish message ---
const TEST_MESSAGE = "Minulla on päänsärky ja kuumetta. Pitääkö minun mennä lääkäriin?";
const resolvedLanguage = detectLanguage(TEST_MESSAGE);
const languageName =
  resolvedLanguage === "fi" ? "Finnish"
  : resolvedLanguage === "sv" ? "Swedish"
  : "English";

const systemPrompt = `You are a helpful healthcare triage assistant for a Finnish clinic.

Your role is to:
1. Listen to patient symptoms empathetically
2. Assess urgency level (Emergency, Urgent, Routine, or Self-care)
3. Recommend appropriate doctor type (General Practitioner, Nurse, or Specialist)
4. Provide brief self-care advice when appropriate
5. Always tell patients to call 112 for life-threatening emergencies

IMPORTANT: You MUST respond entirely in ${languageName}. The patient has written in ${languageName} — match their language exactly. Do not switch languages or mix languages mid-response.

Be warm, professional, and clear. Keep responses concise (2-3 short paragraphs max).`;

console.log("=== Live AI call ===");
console.log(`Message : "${TEST_MESSAGE}"`);
console.log(`Detected: ${resolvedLanguage} (${languageName})\n`);

async function runAITest() {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: TEST_MESSAGE },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  const response = completion.choices[0].message.content ?? "";
  console.log("AI response:\n");
  console.log(response);
  console.log(`\nTokens used: ${JSON.stringify(completion.usage)}`);
}

runAITest().catch(console.error);
