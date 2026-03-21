import { MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MOCK_USER = {
  name: "Alex Chen",
  age: 34,
  occupation: "Software Developer",
  benefits: {
    dental: { total: 1500, used: 400 },
    vision: { total: 600, used: 0 },
    physio: { total: 900, used: 200 },
  },
};

function buildSystemPrompt(user) {
  const { name, age, occupation, benefits } = user;
  return `You are a personal health assistant for ${name}, a ${age}-year-old ${occupation}.

Their current benefits:
- Dental: $${benefits.dental.used} used of $${benefits.dental.total} ($${benefits.dental.total - benefits.dental.used} remaining)
- Vision: $${benefits.vision.used} used of $${benefits.vision.total} ($${benefits.vision.total - benefits.vision.used} remaining)
- Physiotherapy: $${benefits.physio.used} used of $${benefits.physio.total} ($${benefits.physio.total - benefits.physio.used} remaining)

Rules:
- Answer health and scheduling questions clearly and concisely
- Proactively mention when the user is overdue for a checkup
- Reference specific benefit balances when relevant
- Keep answers to 2–4 sentences unless asked for more
- Tone: friendly, direct, not clinical`;
}

export default function ChatbotWidget() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi, I am your NexaCare assistant. How can I help you today?" },
  ]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { from: "user", text: userText }]);

    const newHistory = [...history, { role: "user", content: userText }];
    setHistory(newHistory);
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 512,
          system: buildSystemPrompt(MOCK_USER),
          messages: newHistory,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Anthropic API error:", data);
        setMessages((prev) => [...prev, { from: "bot", text: `Error ${response.status}: ${data.error?.message ?? "Unknown error"}` }]);
        return;
      }
      const reply = data.content?.[0]?.text ?? "Sorry, I couldn't get a response.";

      setHistory((prev) => [...prev, { role: "assistant", content: reply }]);
      setMessages((prev) => [...prev, { from: "bot", text: reply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [...prev, { from: "bot", text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-mini">
      <button className="chat-fab" type="button" aria-label="Open assistant">
        <MessageCircle size={22} strokeWidth={2} />
      </button>
      <div className="chat-panel" role="dialog" aria-label="AI Assistant">
        <div className="chat-panel-card">
          <header className="chat-panel-head">
            <strong>AI Assistant</strong>
            <span className="chat-panel-badge">NexaCare</span>
          </header>
          <div className="chat-log">
            {messages.map((m, idx) => (
              <div key={`${m.from}-${idx}`} className={`chat-message chat-message--${m.from}`}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="chat-message chat-message--bot">Thinking…</div>
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={send} className="chat-form">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question"
              aria-label="Message"
              disabled={loading}
            />
            <button className="chat-send-btn" type="submit" disabled={loading}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
