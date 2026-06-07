import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { useTranslation } from "../i18n";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

const BOOKING_KEYWORDS = ["book", "appointment", "varaa", "aika", "boka", "tid", "doctor", "lääkäri", "läkare", "schedule"];
const SYMPTOM_RE = /\b(fever|feber|kuume|headache|päänsärky|huvudvärk|cough|hosta|yskä|pain|kipua|värk|nausea|dizziness|fatigue|väsymys)\b/gi;

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (!loading) inputRef.current?.focus(); }, [loading]);

  const loadHistory = async () => {
    try {
      const { data } = await api.get("/chat/history");
      setMessages(data.messages);
    } catch (error) {
      console.error("Failed to load chat history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const symptomTags = useMemo(() => {
    const tags = new Set<string>();
    messages.filter(m => m.role === "user").forEach(m => {
      const found = m.content.match(SYMPTOM_RE);
      if (found) found.forEach(tag => tags.add(tag.toLowerCase()));
    });
    return Array.from(tags).slice(0, 6);
  }, [messages]);

  const showBookingCTA = useMemo(() => {
    const reversed = [...messages].reverse();
    const lastAI = reversed.find(m => m.role === "assistant");
    const lastUser = reversed.find(m => m.role === "user");
    const checkContent = (content: string) =>
      BOOKING_KEYWORDS.some(kw => content.toLowerCase().includes(kw));
    return (lastAI?.content ? checkContent(lastAI.content) : false) ||
           (lastUser?.content ? checkContent(lastUser.content) : false);
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text ?? input;
    if (!messageText.trim() || loading) return;

    setMessages(prev => [...prev, { role: "user", content: messageText }]);
    setInput("");
    setLoading(true);
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const authToken = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ message: messageText, language }),
      });
      if (!response.ok) throw new Error("Request failed");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const { token } = JSON.parse(payload);
            if (token) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = { ...last, content: last.content + token };
                return updated;
              });
            }
          } catch { /* ignore malformed SSE */ }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: t("common.error") };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm("Clear all chat history?")) return;
    try {
      await api.delete("/chat/history");
      setMessages([]);
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  const quickReplies = [
    t("chat.prompt.1"),
    t("chat.prompt.2"),
    t("chat.prompt.3"),
    t("chat.prompt.4"),
  ];

  const sessionStart = useMemo(() => {
    const first = messages[0];
    const d = first?.timestamp ? new Date(first.timestamp) : new Date();
    return d.toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" });
  }, [messages]);

  if (loadingHistory) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#D1D5DB] border-t-[#006B6B] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-[#6B7280]">{t("chat.loadingHistory")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F7F8FA] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[260px] flex-shrink-0 bg-white border-r border-[#E4E7EC]">
        {/* Back / brand */}
        <div className="px-5 py-4 border-b border-[#E4E7EC]">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[#006B6B] hover:text-[#005555] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-[13px] font-semibold">{t("login.appName")}</span>
          </button>
        </div>

        {/* Patient card */}
        <div className="px-5 py-4 border-b border-[#E4E7EC]">
          <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold mb-2.5">Patient</p>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#006B6B] rounded flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#111827] truncate">{user?.name}</p>
              <p className="text-[11px] text-[#9CA3AF] truncate">{user?.email}</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-[#9CA3AF]">Session started · {sessionStart}</p>
        </div>

        {/* Symptom tags */}
        {symptomTags.length > 0 && (
          <div className="px-5 py-4 border-b border-[#E4E7EC]">
            <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold mb-2.5">Symptoms noted</p>
            <div className="flex flex-wrap gap-1.5">
              {symptomTags.map(tag => (
                <span key={tag} className="symptom-tag">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar actions */}
        <div className="mt-auto border-t border-[#E4E7EC] px-4 py-3 space-y-0.5">
          <button
            onClick={clearHistory}
            className="hds-btn-ghost w-full justify-start text-[13px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t("chat.clear")}
          </button>
          <button
            onClick={logout}
            className="hds-btn-ghost w-full justify-start text-[13px] text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t("common.logout")}
          </button>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-[#E4E7EC] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="lg:hidden p-1.5 hover:bg-[#F3F4F6] rounded transition-colors"
            >
              <svg className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-[15px] font-semibold text-[#111827]">{t("chat.title")}</h1>
              <p className="text-[11px] text-[#9CA3AF] leading-none mt-0.5">{t("chat.subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={clearHistory}
              className="lg:hidden hds-btn-ghost py-1.5 px-2"
              title={t("chat.clear")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={logout}
              className="lg:hidden hds-btn-ghost py-1.5 px-2 text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Messages feed */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          <div className="max-w-2xl mx-auto space-y-5">

            {/* Empty state */}
            {messages.length === 0 && (
              <div className="text-center py-16 animate-fadeIn">
                <div className="w-11 h-11 bg-[#006B6B] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-[18px] font-bold text-[#111827] mb-1">{t("chat.empty.title")}</h2>
                <p className="text-sm text-[#6B7280] mb-8 max-w-sm mx-auto leading-relaxed">
                  {t("chat.empty.description")}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold mb-3">
                  {t("chat.empty.tryAsking")}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickReplies.map((prompt, i) => (
                    <button key={i} onClick={() => sendMessage(prompt)} className="quick-reply">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message timeline */}
            {messages.map((msg, idx) => (
              <div key={idx}>
                {msg.role === "user" ? (
                  <div className="msg-user">
                    <p className="text-[10px] font-semibold text-[#006B6B] uppercase tracking-wider mb-1">
                      {user?.name}
                    </p>
                    <p className="text-sm text-[#111827] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                ) : (
                  <div className="msg-assistant">
                    <p className="text-[10px] font-semibold text-[#006B6B] uppercase tracking-wider mb-2">
                      Healthcare Assistant
                    </p>
                    <div className="text-sm text-[#111827] leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                      {loading && idx === messages.length - 1 && (
                        <span className={msg.content ? "streaming-cursor" : "streaming-cursor text-[#9CA3AF]"}></span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Book appointment CTA */}
            {showBookingCTA && !loading && (
              <div className="hds-card border-[#99D0D0] bg-[#F0F9F9] animate-fadeIn">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-semibold text-[#006B6B] mb-0.5">Ready to book an appointment?</p>
                    <p className="text-[12px] text-[#6B7280]">The assistant recommends scheduling a visit.</p>
                  </div>
                  <button
                    onClick={() => navigate("/appointments")}
                    className="hds-btn-primary flex-shrink-0 text-[13px] py-2 px-4"
                  >
                    Book now
                  </button>
                </div>
              </div>
            )}

            {/* Quick replies after AI response */}
            {!loading && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && (
              <div className="flex flex-wrap gap-2 animate-fadeIn">
                {quickReplies.map((prompt, i) => (
                  <button key={i} onClick={() => sendMessage(prompt)} className="quick-reply">
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-[#E4E7EC] px-5 py-4 flex-shrink-0">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey && !loading) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={t("chat.input.placeholder")}
                className="flex-1 resize-none hds-input-bordered py-2.5 text-sm"
                disabled={loading}
                rows={1}
                style={{ minHeight: "42px", maxHeight: "120px" }}
                autoFocus
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="hds-btn-primary flex-shrink-0 px-5 py-2.5 text-sm"
              >
                {loading ? t("login.button.processing") : "Send"}
              </button>
            </div>
            <p className="text-[11px] text-[#9CA3AF] mt-2.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#DC2626] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {t("chat.emergencyNotice")} <strong>112</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
