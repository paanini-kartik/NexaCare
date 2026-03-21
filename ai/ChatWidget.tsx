import React, { useState, useEffect, useRef } from "react";
import Anthropic from "@anthropic-ai/sdk";
import type { User, Message, Appointment } from "./types";

// ---------------------------------------------------------------------------
// Mock — used until /api/user/:id is live
// ---------------------------------------------------------------------------
const MOCK_USER: User = {
  id: "user_demo_01",
  name: "Alex Chen",
  age: 34,
  occupation: "Software Developer",
  benefits: {
    dental: { total: 1500, used: 400 },
    vision: { total: 600, used: 0 },
    physio: { total: 900, used: 200 },
  },
  location: { lat: 43.6532, lng: -79.3832 },
};

const MOCK_APPOINTMENTS: Appointment[] = [
  { id:"apt_01", type:"Annual Dental Checkup",  clinicName:"Smile Dental Studio",    date:"2026-04-02T10:00:00Z", duration:60, status:"upcoming" },
  { id:"apt_02", type:"Physiotherapy Session",  clinicName:"ActiveCare Physio",       date:"2026-04-10T14:30:00Z", duration:45, status:"upcoming" },
  { id:"apt_03", type:"General Checkup",        clinicName:"Bayview Family Medicine", date:"2026-04-18T09:00:00Z", duration:30, status:"upcoming" },
  { id:"apt_04", type:"Vision Test",            clinicName:"ClearView Optometry",     date:"2025-12-15T11:00:00Z", duration:45, status:"past"     },
  { id:"apt_05", type:"Dental Cleaning",        clinicName:"Smile Dental Studio",     date:"2025-10-03T10:00:00Z", duration:45, status:"past"     },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildSystemPrompt(user: User, appointments: Appointment[]): string {
  const { name, age, occupation, benefits: b } = user;
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
  const fmtList = (apts: Appointment[]) =>
    apts.length === 0 ? "None" : apts.map(a => `${a.type} at ${a.clinicName} on ${fmt(a.date)}`).join(", ");

  return `You are a personal health assistant for ${name}, a ${age}-year-old ${occupation}.

Their current benefits:
- Dental: $${b.dental.used} used of $${b.dental.total} ($${b.dental.total - b.dental.used} remaining)
- Vision: $${b.vision.used} used of $${b.vision.total} ($${b.vision.total - b.vision.used} remaining)
- Physiotherapy: $${b.physio.used} used of $${b.physio.total} ($${b.physio.total - b.physio.used} remaining)

Upcoming appointments: ${fmtList(appointments.filter(a => a.status === "upcoming"))}
Past appointments: ${fmtList(appointments.filter(a => a.status === "past"))}
Location: Toronto

Rules:
- Answer health and scheduling questions clearly and concisely
- Proactively mention when the user is overdue for a checkup
- Reference specific benefit balances when relevant
- Keep answers to 2–4 sentences unless asked for more
- Tone: friendly, direct, not clinical`;
}

// Resolve API key from Vite or CRA env conventions
function resolveApiKey(): string {
  const vite = (import.meta as { env?: Record<string, string> }).env;
  return (
    vite?.VITE_ANTHROPIC_API_KEY ??
    (typeof process !== "undefined"
      ? (process.env.REACT_APP_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? "")
      : "")
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = {
  root: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: "#fff",
  },
  messageList: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },
  emptyState: {
    margin: "auto",
    textAlign: "center" as const,
    color: "#9CA3AF",
    fontSize: "14px",
    lineHeight: 1.5,
    padding: "24px",
  },
  bubble: (role: "user" | "assistant") => ({
    alignSelf: role === "user" ? ("flex-end" as const) : ("flex-start" as const),
    maxWidth: "80%",
    padding: "10px 14px",
    borderRadius:
      role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
    background: role === "user" ? "#2563EB" : "#F3F4F6",
    color: role === "user" ? "#fff" : "#111827",
    fontSize: "14px",
    lineHeight: 1.55,
    wordBreak: "break-word" as const,
  }),
  thinking: {
    alignSelf: "flex-start" as const,
    color: "#9CA3AF",
    fontSize: "13px",
    padding: "2px 4px",
    fontStyle: "italic" as const,
  },
  inputBar: {
    display: "flex",
    gap: "8px",
    padding: "12px 16px",
    borderTop: "1px solid #E5E7EB",
    background: "#fff",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "22px",
    border: "1px solid #D1D5DB",
    fontSize: "14px",
    outline: "none",
    background: "#F9FAFB",
  },
  sendBtn: (disabled: boolean) => ({
    padding: "10px 18px",
    borderRadius: "22px",
    border: "none",
    background: "#2563EB",
    color: "#fff",
    fontWeight: 600 as const,
    fontSize: "14px",
    cursor: disabled ? ("not-allowed" as const) : ("pointer" as const),
    opacity: disabled ? 0.45 : 1,
    transition: "opacity 0.15s",
  }),
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface ChatWidgetProps {
  userId: string;
}

export default function ChatWidget({ userId }: ChatWidgetProps) {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/user/${userId}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`/api/appointments/${userId}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    ])
      .then(([userData, aptsData]) => {
        setUser(userData);
        setAppointments(aptsData);
      })
      .catch(() => {
        setUser(MOCK_USER);
        setAppointments(MOCK_APPOINTMENTS);
      });
  }, [userId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    if (!input.trim() || !user || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const thread: Message[] = [...messages, userMsg];
    setMessages(thread);
    setInput("");
    setLoading(true);

    try {
      const client = new Anthropic({
        apiKey: resolveApiKey(),
        dangerouslyAllowBrowser: true,
      });

      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        system: buildSystemPrompt(user, appointments),
        messages: thread,
      });

      const text =
        response.content[0]?.type === "text" ? response.content[0].text : "";
      setMessages([...thread, { role: "assistant", content: text }]);
    } catch {
      setMessages([
        ...thread,
        {
          role: "assistant",
          content: "Sorry, I couldn't connect right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  if (!user) {
    return (
      <div style={{ ...styles.root, alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#9CA3AF", fontSize: "14px" }}>Loading…</span>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Message list */}
      <div style={styles.messageList}>
        {messages.length === 0 && (
          <p style={styles.emptyState}>
            Hi {user.name}!<br />
            Ask me anything about your health benefits or appointments.
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i} style={styles.bubble(m.role)}>
            {m.content}
          </div>
        ))}

        {loading && <div style={styles.thinking}>Thinking…</div>}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={styles.inputBar}>
        <input
          ref={inputRef}
          style={styles.input}
          placeholder="Ask about your health…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          style={styles.sendBtn(loading || !input.trim())}
          onClick={send}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
