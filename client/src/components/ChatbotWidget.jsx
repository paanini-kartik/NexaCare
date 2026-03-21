import { MessageCircle } from "lucide-react";
import { useState } from "react";

function buildReply(text) {
  const normalized = text.toLowerCase();
  if (normalized.includes("appointment")) return "Use Health Compass to discover clinics and book appointments.";
  if (normalized.includes("benefit")) return "Benefits are combined from all mock insurers on the Benefits page.";
  if (normalized.includes("emergency")) return "Go to Emergency for Red Cross support and rapid call options.";
  return "I can help with profile setup, appointments, and benefits.";
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ from: "bot", text: "Hi, I am your NexaCare assistant." }]);
  const [input, setInput] = useState("");

  const send = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { from: "user", text: input }, { from: "bot", text: buildReply(input) }]);
    setInput("");
  };

  return (
    <div className="chatbot-mini" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {!open ? (
        <button className="chat-fab" type="button" onClick={() => setOpen(true)} aria-label="Open assistant">
          <MessageCircle size={22} />
        </button>
      ) : (
        <div className="chat-panel card-surface">
          <strong>AI Assistant</strong>
          <div className="chat-log">
            {messages.map((m, idx) => (
              <div key={`${m.from}-${idx}`} className={`chat-message ${m.from}`}>{m.text}</div>
            ))}
          </div>
          <form onSubmit={send} className="chat-form">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question" />
            <button className="primary-btn" type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}
