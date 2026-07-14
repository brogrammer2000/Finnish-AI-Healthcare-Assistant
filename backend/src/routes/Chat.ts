import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";
import { detectLanguage } from "../lib/detectLanguage";

const router = Router();
let anthropic: Anthropic;

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
      resolvedLanguage === "fi"
        ? "Finnish"
        : resolvedLanguage === "sv"
          ? "Swedish"
          : "English";

    console.log(
      `[Chat] language param="${language}" detected="${resolvedLanguage}" message="${message.slice(0, 60)}"`,
    );

    // System prompt for healthcare triage
    const systemPrompt = `You are a helpful healthcare triage assistant for a Finnish clinic app.

Your role is to:
1. Listen to patient symptoms empathetically
2. Assess urgency level (Emergency, Urgent, Routine, or Self-care)
3. Recommend appropriate doctor type (General Practitioner, Nurse, or Specialist)
4. Provide brief self-care advice when appropriate
5. Always tell patients to call 112 for life-threatening emergencies

BOOKING APPOINTMENTS: This app has a fully built-in appointment booking system. Patients book directly here in the app — they do NOT call a clinic, visit in person, or use any external website. You must NEVER tell patients to call, visit, or use an outside system.

When a patient asks to book or you recommend a doctor visit, say exactly this kind of thing:
"You can book an appointment right here in the app! Click the **Book Appointment** button appearing below this message, or go to the Appointments section in the menu."

That is all they need to do. The app handles everything.

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

    // Lazy-init Anthropic client so ANTHROPIC_API_KEY is read after dotenv loads
    if (!anthropic) {
      anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }

    // Stream from Anthropic
    const stream = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      temperature: 0.7,
      system: systemPrompt,
      messages: [...conversationHistory, { role: "user", content: message }],
      stream: true,
    });

    let fullResponse = "";

    // Forward each text delta to the browser as it arrives (SSE) while also
    // accumulating the full text, so the user sees tokens live and we still
    // have the complete reply to persist once the stream ends.
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        const token = event.delta.text;
        if (token) {
          fullResponse += token;
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();

    // Persist only after the stream completes: the assistant row needs the
    // full text, and writing mid-stream would leave a partial reply if the
    // client disconnects.
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
