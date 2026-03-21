import { Maximize2, MessageCircle, Minimize2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

const MOCK_USER = {
  name: "Nicolas Miranda Cantanhede",
  age: 34,
  occupation: "Software Developer",
  location: { lat: 43.6532, lng: -79.3832, city: "Toronto" },
};

const TOOLS = [
  {
    name: "get_user_profile",
    description: "Get the current user's profile information",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_benefits",
    description: "Get the user's dental, vision, and physio benefit balances",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_appointments",
    description: "Get all upcoming and past appointments",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "book_appointment",
    description: "Book a new appointment and add it to the dashboard",
    input_schema: {
      type: "object",
      required: ["type", "clinicName", "date", "duration"],
      properties: {
        type:       { type: "string", description: "e.g. Annual Dental Checkup" },
        clinicName: { type: "string", description: "Name of the clinic" },
        date:       { type: "string", description: "ISO 8601 date string" },
        duration:   { type: "number", description: "Duration in minutes" },
      },
    },
  },
  {
    name: "find_clinics",
    description: "Find nearby clinics filtered by type",
    input_schema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["dental", "optometry", "hospital", "pharmacy"],
          description: "Type of clinic",
        },
      },
    },
  },
  {
    name: "update_benefit_usage",
    description: "Record an expense against a benefit balance",
    input_schema: {
      type: "object",
      required: ["benefitType", "amount"],
      properties: {
        benefitType: { type: "string", enum: ["dental", "vision", "physio"] },
        amount:      { type: "number", description: "Amount in dollars" },
      },
    },
  },
  {
    name: "show_notification",
    description: "Show a toast notification on the dashboard",
    input_schema: {
      type: "object",
      required: ["message", "type"],
      properties: {
        message: { type: "string" },
        type:    { type: "string", enum: ["info", "warning", "success"] },
      },
    },
  },
];

function buildSystemPrompt(user, benefits, appointments) {
  const upcoming = appointments.filter((a) => a.status === "upcoming");
  const past     = appointments.filter((a) => a.status === "past");
  return `You are a personal health assistant for ${user.name}, a ${user.age}-year-old ${user.occupation} based in ${user.location.city}.

Current benefits:
- Dental: $${benefits.dental.used} used of $${benefits.dental.total} ($${benefits.dental.total - benefits.dental.used} remaining)
- Vision: $${benefits.vision.used} used of $${benefits.vision.total} ($${benefits.vision.total - benefits.vision.used} remaining)
- Physiotherapy: $${benefits.physio.used} used of $${benefits.physio.total} ($${benefits.physio.total - benefits.physio.used} remaining)

Upcoming appointments: ${upcoming.length ? upcoming.map((a) => `${a.type} at ${a.clinicName} on ${a.date}`).join(", ") : "none"}
Past appointments: ${past.length ? past.map((a) => `${a.type} at ${a.clinicName} on ${a.date}`).join(", ") : "none"}

You have tools to read data, book appointments, update benefit usage, show notifications, and suggest_actions.

Use markdown tables when showing lists of appointments, clinics, or benefit summaries.
When you book an appointment, also call update_benefit_usage with a reasonable estimated cost and show_notification to confirm.

Rules:
- Be friendly, direct, not clinical
- Use **bold** for key numbers and dates
- Use tables for lists of 3+ items
- Always give a full text answer — never reply with just "Done!"
- Reference specific benefit balances when relevant
- Proactively mention overdue checkups`;
}

// Rich markdown components
const markdownComponents = {
  code({ inline, className, children }) {
    const language = /language-(\w+)/.exec(className || "")?.[1];
    return !inline && language ? (
      <SyntaxHighlighter style={oneLight} language={language} PreTag="div">
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    ) : (
      <code className="chat-inline-code">{children}</code>
    );
  },
  table({ children }) {
    return <div className="chat-table-wrap"><table className="chat-table">{children}</table></div>;
  },
  th({ children }) { return <th className="chat-th">{children}</th>; },
  td({ children }) { return <td className="chat-td">{children}</td>; },
  a({ href, children }) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="chat-link">{children}</a>;
  },
};

function getContextActions(reply, userMsg) {
  const r = reply.toLowerCase();
  const u = userMsg.toLowerCase();
  if (u.includes("book") || r.includes("booked") || r.includes("confirmed"))
    return [
      { label: "View all appointments", message: "Show all my appointments" },
      { label: "Check my benefits", message: "How much coverage do I have left?" },
    ];
  if (r.includes("dental") || u.includes("dental"))
    return [
      { label: "Book dental cleaning", message: "Book me a dental cleaning at Smile Dental Studio for April 5th, 45 minutes" },
      { label: "Find dental clinics", message: "Find a dental clinic nearby" },
      { label: "Check dental coverage", message: "How much dental coverage do I have left?" },
    ];
  if (r.includes("vision") || r.includes("eye") || u.includes("vision"))
    return [
      { label: "Book eye exam", message: "Book me a vision test at ClearView Optometry for April 10th, 45 minutes" },
      { label: "Find optometry clinics", message: "Find an optometry clinic nearby" },
      { label: "Check vision coverage", message: "How much vision coverage do I have?" },
    ];
  if (r.includes("physio") || u.includes("physio"))
    return [
      { label: "Book physio session", message: "Book me a physiotherapy session at ActiveCare Physio for April 12th, 45 minutes" },
      { label: "Check physio coverage", message: "How much physiotherapy coverage do I have?" },
    ];
  if (r.includes("appointment") || u.includes("appointment"))
    return [
      { label: "Book new appointment", message: "Book me a dental cleaning at Smile Dental Studio for April 5th, 45 minutes" },
      { label: "Check my benefits", message: "Show me all my benefit balances" },
    ];
  if (r.includes("benefit") || r.includes("coverage") || r.includes("remaining"))
    return [
      { label: "View appointments", message: "Show all my appointments" },
      { label: "Find a clinic", message: "Find a clinic nearby" },
      { label: "Book checkup", message: "Book me a general checkup" },
    ];
  return [
    { label: "View benefits", message: "Show me all my benefit balances" },
    { label: "View appointments", message: "Show all my appointments" },
  ];
}

const SUGGESTIONS = [
  "How much dental coverage do I have left?",
  "Am I overdue for any checkups?",
  "Find a dental clinic nearby",
  "Show all my appointments",
];

export default function ChatbotWidget({
  appointments: propAppointments,
  benefits: propBenefits,
  clinics: propClinics,
  onBookAppointment,
  onUpdateBenefit,
  onShowNotification,
}) {
  const appointments = propAppointments ?? [
    { id: "apt_01", type: "Annual Dental Checkup",  clinicName: "Smile Dental Studio",    date: "2026-04-02T10:00:00Z", duration: 60,  status: "upcoming" },
    { id: "apt_02", type: "Physiotherapy Session",  clinicName: "ActiveCare Physio",       date: "2026-04-10T14:30:00Z", duration: 45,  status: "upcoming" },
    { id: "apt_03", type: "General Checkup",        clinicName: "Bayview Family Medicine", date: "2026-04-18T09:00:00Z", duration: 30,  status: "upcoming" },
    { id: "apt_04", type: "Vision Test",            clinicName: "ClearView Optometry",     date: "2025-12-15T11:00:00Z", duration: 45,  status: "past"     },
    { id: "apt_05", type: "Dental Cleaning",        clinicName: "Smile Dental Studio",     date: "2025-10-03T10:00:00Z", duration: 45,  status: "past"     },
  ];

  const [benefits, setBenefits] = useState(propBenefits ?? {
    dental: { total: 1500, used: 400 },
    vision: { total: 600,  used: 0   },
    physio: { total: 900,  used: 200 },
  });

  const clinics = propClinics ?? [
    { id: "c_01", name: "Smile Dental Studio",   type: "dental",    lat: 43.6545, lng: -79.3801 },
    { id: "c_02", name: "ClearView Optometry",   type: "optometry", lat: 43.6510, lng: -79.3850 },
    { id: "c_03", name: "ActiveCare Physio",     type: "hospital",  lat: 43.6580, lng: -79.3900 },
    { id: "c_04", name: "Rexall Pharmacy",       type: "pharmacy",  lat: 43.6490, lng: -79.3820 },
    { id: "c_05", name: "Toronto General Hosp.", type: "hospital",  lat: 43.6590, lng: -79.3870 },
  ];

  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi Nicolas! I'm your NexaCare assistant. I can check your benefits, book appointments, and help you navigate your care. What do you need?" },
  ]);
  const [history,  setHistory]  = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [open,     setOpen]     = useState(false);
  const [expanded, setExpanded] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  function executeTool(name, toolInput) {
    switch (name) {
      case "get_user_profile":
        return JSON.stringify(MOCK_USER);

      case "get_benefits":
        return JSON.stringify(benefits);

      case "get_appointments":
        return JSON.stringify(appointments);

      case "find_clinics":
        return JSON.stringify(
          toolInput.type ? clinics.filter((c) => c.type === toolInput.type) : clinics
        );

      case "book_appointment": {
        const newAppt = {
          id: `apt_${Date.now()}`,
          type: toolInput.type,
          clinicName: toolInput.clinicName,
          date: toolInput.date,
          duration: toolInput.duration,
          status: "upcoming",
        };
        if (onBookAppointment) onBookAppointment(newAppt);
        return JSON.stringify({ success: true, appointment: newAppt });
      }

      case "update_benefit_usage": {
        const { benefitType, amount } = toolInput;
        setBenefits((prev) => {
          const updated = {
            ...prev,
            [benefitType]: {
              ...prev[benefitType],
              used: Math.min(prev[benefitType].used + amount, prev[benefitType].total),
            },
          };
          if (onUpdateBenefit) onUpdateBenefit(benefitType, amount);
          return updated;
        });
        return JSON.stringify({ success: true });
      }

      case "show_notification": {
        if (onShowNotification) onShowNotification(toolInput.message, toolInput.type);
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: `✅ ${toolInput.message}`, isNotification: true },
        ]);
        return JSON.stringify({ success: true });
      }

      default:
        return JSON.stringify({ error: "Unknown tool" });
    }
  }

  async function callAPI(msgs) {
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
        max_tokens: 1024,
        system: buildSystemPrompt(MOCK_USER, benefits, appointments),
        tools: TOOLS,
        messages: msgs,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `Error ${response.status}`);
    return data;
  }

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { from: "user", text }]);
    setLoading(true);

    let currentHistory = [...history, { role: "user", content: text }];

    try {
      let data = await callAPI(currentHistory);

      while (data.stop_reason === "tool_use") {
        const toolUseBlocks = data.content.filter((b) => b.type === "tool_use");
        currentHistory = [...currentHistory, { role: "assistant", content: data.content }];
        const toolResults = toolUseBlocks.map((block) => ({
          type: "tool_result",
          tool_use_id: block.id,
          content: executeTool(block.name, block.input),
        }));
        currentHistory = [...currentHistory, { role: "user", content: toolResults }];
        data = await callAPI(currentHistory);
      }

      const reply = data.content.find((b) => b.type === "text")?.text ?? "Done!";
      currentHistory = [...currentHistory, { role: "assistant", content: reply }];
      setHistory(currentHistory);

      // Auto-generate contextual action buttons based on reply content
      const actions = getContextActions(reply, text);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: reply },
        ...(actions.length ? [{ from: "actions", actions }] : []),
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [...prev, { from: "bot", text: `⚠️ ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => { e.preventDefault(); sendMessage(input.trim()); };

  return (
    <div className={`chatbot-mini${expanded ? " chatbot-expanded" : ""}`}>
      <button className="chat-fab" type="button" aria-label="Open assistant"
        onClick={() => setOpen((o) => !o)}>
        <MessageCircle size={22} strokeWidth={2} />
      </button>

      {open && (
        <div className="chat-panel" role="dialog" aria-label="AI Assistant">
          <div className="chat-panel-card">
            <header className="chat-panel-head">
              <strong>AI Assistant</strong>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="chat-panel-badge">NexaCare</span>
                <button type="button" aria-label={expanded ? "Minimize" : "Expand"}
                  onClick={() => setExpanded((e) => !e)}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "inherit" }}>
                  {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button type="button" aria-label="Close" onClick={() => setOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "inherit" }}>
                  <X size={16} />
                </button>
              </div>
            </header>

            <div className="chat-log">
              {messages.map((m, idx) => {
                if (m.from === "actions") {
                  return (
                    <div key={idx} className="chat-actions-row">
                      {m.actions.map((a) => (
                        <button key={a.label} className="chat-action-btn" type="button"
                          onClick={() => sendMessage(a.message)}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  );
                }
                return (
                  <div key={idx} className={`chat-message chat-message--${m.from}`}>
                    {m.from === "bot" ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {m.text}
                      </ReactMarkdown>
                    ) : m.text}
                  </div>
                );
              })}

              {loading && (
                <div className="chat-message chat-message--bot chat-thinking">
                  <span /><span /><span />
                </div>
              )}

              {!loading && messages.length <= 1 && (
                <div className="chat-suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="chat-suggestion-chip" type="button"
                      onClick={() => sendMessage(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={onSubmit} className="chat-form">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…" aria-label="Message" disabled={loading} />
              <button className="chat-send-btn" type="submit" disabled={loading || !input.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
