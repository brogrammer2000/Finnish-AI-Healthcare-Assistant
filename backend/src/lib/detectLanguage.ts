// Detect the response language from a patient's message, falling back to the UI
// language setting when the message carries no strong signal.
//
//   - `å` never appears in standard Finnish  => strong Swedish signal.
//   - `ä`/`ö` appear in both languages but are weighted toward Finnish here.
//   - otherwise match against a small keyword list, else fall back.
//
// Extracted verbatim from the /api/chat handler so it can be unit-tested in
// isolation. Behaviour is unchanged — Chat.ts imports this function.
export function detectLanguage(message: string, fallback: string): string {
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
