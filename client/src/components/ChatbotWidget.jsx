import { MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function buildReply(text) {
  const normalized = text.toLowerCase();
  if (normalized.includes("appointment")) return "Use Health Compass to discover clinics and book appointments.";
  if (normalized.includes("benefit")) return "Benefits are combined from all mock insurers on the Benefits page.";
  if (normalized.includes("emergency")) return "Go to Emergency for Red Cross support and rapid call options.";
  return "I can help with profile setup, appointments, and benefits.";
}

export default function ChatbotWidget() {
  const [messages, setMessages] = useState([{ from: "bot", text: "Hi, I am your NexaCare assistant." }]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const send = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { from: "user", text: input }, { from: "bot", text: buildReply(input) }]);
    setInput("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="chatbot-mini">
      <button className="chat-fab" type="button" aria-label="Open assistant">
        <MessageCircle size={22} />
      </button>
      <div className="chat-panel card-surface">
        <div className="chat-panel-head">
          <strong>AI Assistant</strong>
        </div>
        <div className="chat-log">
          {messages.map((m, idx) => (
            <div key={`${m.from}-${idx}`} className={`chat-message ${m.from}`}>{m.text}</div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} className="chat-form">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question" />
          <button className="primary-btn" type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
