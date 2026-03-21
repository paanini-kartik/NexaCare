import React, { useState, useEffect, useRef } from "react";
import Anthropic from "@anthropic-ai/sdk";
import type { User, Message } from "./types";

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildSystemPrompt(user: User): string {
  const { name, age, occupation, benefits: b } = user;
  const dental = b.dental.total - b.dental.used;
  const vision = b.vision.total - b.vision.used;
  const physio = b.physio.total - b.physio.used;
  return (
    `You are a personal health assistant for ${name}, a ${age}-year-old ${occupation}.\n` +
    `Benefits: dental $${b.dental.used}/$${b.dental.total} ($${dental} left), ` +
    `vision $${b.vision.used}/$${b.vision.total} ($${vision} left), ` +
    `physio $${b.physio.used}/$${b.physio.total} ($${physio} left).\n` +
    `Keep answers 2-4 sentences. Friendly, not clinical.`
  );
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch user — fall back to mock if route isn't live yet
  useEffect(() => {
    fetch(`/api/user/${userId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not ready");
        return r.json();
      })
      .then((data: User) => setUser(data))
      .catch(() => setUser(MOCK_USER));
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
        system: buildSystemPrompt(user),
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
