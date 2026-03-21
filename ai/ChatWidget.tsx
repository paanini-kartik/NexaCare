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

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

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
- When the user sends a photo, analyze it from a health perspective (rash, prescription label, food label, injury, etc.)
- Proactively mention when the user is overdue for a checkup
- Reference specific benefit balances when relevant
- Keep answers to 2–4 sentences unless asked for more
- Tone: friendly, direct, not clinical`;
}

// Convert our Message[] to the format Anthropic expects
function toAnthropicMessages(messages: Message[]) {
  return messages.map((m) => {
    if (m.imageBase64 && m.role === "user") {
      return {
        role: m.role as "user" | "assistant",
        content: [
          {
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: m.imageType ?? "image/jpeg",
              data: m.imageBase64,
            },
          },
          ...(m.content.trim()
            ? [{ type: "text" as const, text: m.content }]
            : []),
        ],
      };
    }
    return { role: m.role as "user" | "assistant", content: m.content };
  });
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
  thumbnail: {
    maxWidth: "200px",
    maxHeight: "160px",
    borderRadius: "10px",
    display: "block",
    marginBottom: "6px",
    objectFit: "cover" as const,
  },
  thinking: {
    alignSelf: "flex-start" as const,
    color: "#9CA3AF",
    fontSize: "13px",
    padding: "2px 4px",
    fontStyle: "italic" as const,
  },
  inputBar: {
    display: "flex",
    flexDirection: "column" as const,
    padding: "12px 16px",
    borderTop: "1px solid #E5E7EB",
    background: "#fff",
    gap: "8px",
  },
  imagePreviewBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  imagePreviewThumb: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    objectFit: "cover" as const,
    border: "1px solid #D1D5DB",
  },
  removeImageBtn: {
    background: "#EF4444",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    fontSize: "12px",
    cursor: "pointer",
    lineHeight: "20px",
    textAlign: "center" as const,
    padding: 0,
  },
  inputRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  cameraBtn: (disabled: boolean) => ({
    padding: "10px 12px",
    borderRadius: "22px",
    border: "1px solid #D1D5DB",
    background: "#F9FAFB",
    fontSize: "16px",
    cursor: disabled ? ("not-allowed" as const) : ("pointer" as const),
    opacity: disabled ? 0.45 : 1,
    lineHeight: 1,
  }),
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
  const [pendingImage, setPendingImage] = useState<{ base64: string; type: Message["imageType"]; previewUrl: string } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image too large — max 5 MB.");
      e.target.value = "";
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setImageError("Unsupported format — use JPEG, PNG, GIF, or WebP.");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:image/...;base64, prefix
      const base64 = result.split(",")[1];
      setPendingImage({ base64, type: file.type as Message["imageType"], previewUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function removePendingImage() {
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
    setImageError(null);
  }

  async function send() {
    const hasText = input.trim().length > 0;
    const hasImage = !!pendingImage;
    if ((!hasText && !hasImage) || !user || loading) return;

    const userMsg: Message = {
      role: "user",
      content: input.trim(),
      ...(pendingImage && { imageBase64: pendingImage.base64, imageType: pendingImage.type }),
    };

    const thread: Message[] = [...messages, userMsg];
    setMessages(thread);
    setInput("");
    setPendingImage(null);
    setImageError(null);
    setLoading(true);

    try {
      const client = new Anthropic({
        apiKey: resolveApiKey(),
        dangerouslyAllowBrowser: true,
      });

      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: hasImage ? 1024 : 512,
        system: buildSystemPrompt(user, appointments),
        messages: toAnthropicMessages(thread),
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

  const canSend = !loading && (input.trim().length > 0 || !!pendingImage);

  return (
    <div style={styles.root}>
      {/* Message list */}
      <div style={styles.messageList}>
        {messages.length === 0 && (
          <p style={styles.emptyState}>
            Hi {user.name}!<br />
            Ask me anything about your health benefits or appointments.<br />
            <span style={{ fontSize: "12px" }}>You can also send a photo 📷 for health analysis.</span>
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i} style={styles.bubble(m.role)}>
            {m.imageBase64 && (
              <img
                src={`data:${m.imageType ?? "image/jpeg"};base64,${m.imageBase64}`}
                alt="attached"
                style={styles.thumbnail}
              />
            )}
            {m.content && <span>{m.content}</span>}
          </div>
        ))}

        {loading && <div style={styles.thinking}>Thinking…</div>}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={styles.inputBar}>
        {/* Image preview */}
        {pendingImage && (
          <div style={styles.imagePreviewBar}>
            <img src={pendingImage.previewUrl} alt="preview" style={styles.imagePreviewThumb} />
            <button style={styles.removeImageBtn} onClick={removePendingImage} title="Remove image">
              ✕
            </button>
            <span style={{ fontSize: "12px", color: "#6B7280" }}>Image ready to send</span>
          </div>
        )}

        {/* Error */}
        {imageError && (
          <span style={{ fontSize: "12px", color: "#EF4444" }}>{imageError}</span>
        )}

        {/* Input row */}
        <div style={styles.inputRow}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <button
            style={styles.cameraBtn(loading)}
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title="Attach a photo"
          >
            📷
          </button>

          <input
            ref={inputRef}
            style={styles.input}
            placeholder={pendingImage ? "Add a caption (optional)…" : "Ask about your health…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          <button
            style={styles.sendBtn(!canSend)}
            onClick={send}
            disabled={!canSend}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
