import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Detect language from message content, falling back to the UI language setting.
// å never appears in standard Finnish — strong Swedish signal.
// ä/ö alone are ambiguous (both languages), so we also check common words.
function detectLanguage(message: string, fallback: string): string {
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

// Get chat history
router.get("/history", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { userId: req.user!.id },
      orderBy: { timestamp: "asc" },
      take: 50, // Last 50 messages
    });

    res.json({ messages });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

// Send message to AI (streaming SSE)
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { message, language = "en" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Detect language from message content; fall back to the UI language setting
    const resolvedLanguage = detectLanguage(message, language);
    const languageName =
      resolvedLanguage === "fi" ? "Finnish"
      : resolvedLanguage === "sv" ? "Swedish"
      : "English";

    console.log(
      `[Chat] language param="${language}" detected="${resolvedLanguage}" message="${message.slice(0, 60)}"`
    );

    // System prompt for healthcare triage
    const systemPrompt = `You are a helpful healthcare triage assistant for a Finnish clinic.

Your role is to:
1. Listen to patient symptoms empathetically
2. Assess urgency level (Emergency, Urgent, Routine, or Self-care)
3. Recommend appropriate doctor type (General Practitioner, Nurse, or Specialist)
4. Provide brief self-care advice when appropriate
5. Always tell patients to call 112 for life-threatening emergencies

IMPORTANT: You MUST respond entirely in ${languageName}. The patient has written in ${languageName} — match their language exactly. Do not switch languages or mix languages mid-response.

Be warm, professional, and clear. Keep responses concise (2-3 short paragraphs max).`;

    // Get recent conversation history for context
    const recentMessages = await prisma.chatMessage.findMany({
      where: { userId: req.user!.id },
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    const conversationHistory = recentMessages.reverse().map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Stream from OpenAI
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content ?? "";
      if (token) {
        fullResponse += token;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();

    // Persist both messages after stream completes
    await prisma.chatMessage.createMany({
      data: [
        { userId: req.user!.id, role: "user", content: message },
        { userId: req.user!.id, role: "assistant", content: fullResponse },
      ],
    });
  } catch (error) {
    console.error("Chat error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process chat message" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
      res.end();
    }
  }
});

// Clear chat history
router.delete("/history", authenticateToken, async (req: AuthRequest, res) => {
  try {
    await prisma.chatMessage.deleteMany({
      where: { userId: req.user!.id },
    });

    res.json({ message: "Chat history cleared" });
  } catch (error) {
    console.error("Error clearing chat history:", error);
    res.status(500).json({ error: "Failed to clear chat history" });
  }
});

export default router;
