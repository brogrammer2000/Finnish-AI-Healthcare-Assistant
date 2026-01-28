import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// Send message to AI
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { message, language = "en" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // System prompt for healthcare triage
    const systemPrompt = `You are a helpful healthcare triage assistant for a Finnish clinic.

Your role is to:
1. Listen to patient symptoms empathetically
2. Assess urgency level (Emergency, Urgent, Routine, or Self-care)
3. Recommend appropriate doctor type (General Practitioner, Nurse, or Specialist)
4. Provide brief self-care advice when appropriate
5. Always tell patients to call 112 for life-threatening emergencies

Respond in ${language === "fi" ? "Finnish" : language === "sv" ? "Swedish" : "English"}.

Be warm, professional, and clear. Keep responses concise (2-3 short paragraphs max).`;

    // Get recent conversation history for context
    const recentMessages = await prisma.chatMessage.findMany({
      where: { userId: req.user!.id },
      orderBy: { timestamp: "desc" },
      take: 6, // Last 3 exchanges
    });

    const conversationHistory = recentMessages.reverse().map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse =
      completion.choices[0].message.content ||
      "Sorry, I could not generate a response.";

    // Save both messages to database
    await prisma.chatMessage.createMany({
      data: [
        {
          userId: req.user!.id,
          role: "user",
          content: message,
        },
        {
          userId: req.user!.id,
          role: "assistant",
          content: aiResponse,
        },
      ],
    });

    res.json({
      response: aiResponse,
      usage: completion.usage,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process chat message" });
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
