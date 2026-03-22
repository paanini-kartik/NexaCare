import { Maximize2, MessageCircle, Minimize2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

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
        type: { type: "string", description: "e.g. Annual Dental Checkup" },
        clinicName: { type: "string", description: "Name of the clinic" },
        date: { type: "string", description: "ISO 8601 date string" },
        duration: { type: "number", description: "Duration in minutes" },
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
        amount: { type: "number", description: "Amount in dollars" },
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
        type: { type: "string", enum: ["info", "warning", "success"] },
      },
    },
  },
  {
    name: "cancel_appointment",
    description: "Cancel an existing appointment by ID",
    input_schema: {
      type: "object",
      required: ["appointmentId"],
      properties: {
        appointmentId: { type: "string", description: "The ID of the appointment to cancel" },
      },
    },
  },
  {
    name: "get_health_profile",
    description: "Get the user's full health profile: age, occupation, allergies, medical history, favorite clinics, checkup dates",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "update_profile",
    description: "Update the user's health profile fields like age or occupation",
    input_schema: {
      type: "object",
      properties: {
        age: { type: "number", description: "User's age" },
        occupation: { type: "string", description: "User's occupation" },
      },
    },
  },
  {
    name: "add_medical_event",
    description: "Add a medical history event (surgery, diagnosis, procedure, etc.)",
    input_schema: {
      type: "object",
      required: ["title", "date"],
      properties: {
        title: { type: "string", description: "Title of the medical event e.g. 'Knee Surgery'" },
        date: { type: "string", description: "Date of the event (YYYY-MM-DD)" },
        notes: { type: "string", description: "Optional notes about the event" },
      },
    },
  },
  {
    name: "add_allergy",
    description: "Add an allergy to the user's health profile",
    input_schema: {
      type: "object",
      required: ["name", "severity"],
      properties: {
        name: { type: "string", description: "Name of the allergen e.g. 'Penicillin'" },
        severity: { type: "string", enum: ["Low", "Moderate", "High"], description: "Severity level" },
      },
    },
  },
  {
    name: "set_checkup_date",
    description: "Record the date of the user's last dental, vision/optometry, or physical checkup",
    input_schema: {
      type: "object",
      required: ["type", "date"],
      properties: {
        type: { type: "string", enum: ["dental", "optometry", "physical"], description: "Type of checkup" },
        date: { type: "string", description: "Date of last checkup (YYYY-MM-DD)" },
      },
    },
  },
  {
    name: "add_benefit_provider",
    description: "Add a personal benefit provider (insurance plan) with categories and annual limits",
    input_schema: {
      type: "object",
      required: ["providerName", "planName", "categories"],
      properties: {
        providerName: { type: "string", description: "e.g. 'Sun Life', 'Manulife', 'Green Shield'" },
        planName: { type: "string", description: "e.g. 'Basic', 'Premium'" },
        categories: {
          type: "array",
          description: "List of benefit categories",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "e.g. 'Dental', 'Vision', 'Physical'" },
              annualLimit: { type: "number", description: "Annual limit in dollars" },
              coverage: { type: "number", description: "Coverage fraction 0-1, e.g. 0.8 for 80%" },
            },
          },
        },
      },
    },
  },
  {
    name: "remove_benefit_provider",
    description: "Remove a personal benefit provider by name. Use 'all' to remove all providers.",
    input_schema: {
      type: "object",
      required: ["providerName"],
      properties: {
        providerName: { type: "string", description: "Provider name to remove, or 'all' to remove everything" },
      },
    },
  },
  {
    name: "remove_medical_event",
    description: "Remove a medical history event by title",
    input_schema: {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string", description: "Title of the medical event to remove" },
      },
    },
  },
  {
    name: "remove_favorite_clinic",
    description: "Remove a clinic from the user's favorites by name",
    input_schema: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", description: "Name of the clinic to remove" },
      },
    },
  },
  {
    name: "add_favorite_clinic",
    description: "Add a clinic to the user's favorite clinics list in their health profile",
    input_schema: {
      type: "object",
      required: ["name", "type"],
      properties: {
        name: { type: "string", description: "Clinic name e.g. 'Toronto General Hospital'" },
        type: { type: "string", enum: ["Clinic", "Hospital", "Pharmacy", "Specialist"], description: "Type of clinic" },
      },
    },
  },
  {
    name: "remove_allergy",
    description: "Remove an allergy from the user's health profile by name",
    input_schema: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", description: "Name of the allergy to remove" },
      },
    },
  },
  {
    name: "apply_employer_key",
    description: "Apply an employer invite key (format: EMP-XXXXX) to link the user's work benefits",
    input_schema: {
      type: "object",
      required: ["key"],
      properties: {
        key: { type: "string", description: "Employer invite key e.g. 'EMP-A1B2C'" },
      },
    },
  },
  {
    name: "restore_last_action",
    description: "Undo / restore the last destructive action (removes a provider, allergy, medical event, or favorite clinic). Call this when the user says 'undo', 'restore', 'bring back', or 'I made a mistake'.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "navigate_to",
    description: "Navigate the user to a specific page in the app",
    input_schema: {
      type: "object",
      required: ["page"],
      properties: {
        page: {
          type: "string",
          enum: ["dashboard", "health-profile", "health-compass", "benefits", "settings", "emergency"],
          description: "Page to navigate to",
        },
      },
    },
  },
];

function buildSystemPrompt(user, benefits, appointments) {
  const upcoming = appointments.filter((a) => a.status === "upcoming");
  const past     = appointments.filter((a) => a.status === "past");

  const benefitText = (benefits && benefits.hasAny)
    ? `Current benefits:
- Dental: $${benefits.dental.used} used of $${benefits.dental.total} ($${benefits.dental.total - benefits.dental.used} remaining)
- Vision/Optometry: $${benefits.vision.used} used of $${benefits.vision.total} ($${benefits.vision.total - benefits.vision.used} remaining)
- Physiotherapy/Physical: $${benefits.physio.used} used of $${benefits.physio.total} ($${benefits.physio.total - benefits.physio.used} remaining)`
    : "Benefits: This user has not configured any benefit plans yet. Direct them to Settings > Benefits to add their coverage.";

  return `You are a personal health assistant for ${user.name}${user.age ? `, a ${user.age}-year-old` : ""}${user.occupation && user.occupation !== "patient" ? ` ${user.occupation}` : ""} based in ${user.location.city}.

${benefitText}

Upcoming appointments: ${upcoming.length ? upcoming.map((a) => `${a.type} at ${a.clinicName} on ${a.date}`).join(", ") : "none — user has no upcoming appointments"}
Past appointments: ${past.length ? past.map((a) => `${a.type} at ${a.clinicName} on ${a.date}`).join(", ") : "none"}

You are a fully capable health agent. You can control the entire dashboard through tools.

Tools available:
- READ: get_user_profile, get_benefits, get_appointments, get_health_profile, find_clinics
- BOOK/CANCEL: book_appointment, cancel_appointment
- UPDATE PROFILE: update_profile, add_medical_event, remove_medical_event, add_allergy, remove_allergy, set_checkup_date, add_favorite_clinic, remove_favorite_clinic
- BENEFITS: add_benefit_provider, remove_benefit_provider (use "all" to wipe everything), update_benefit_usage, apply_employer_key
- NAVIGATE: navigate_to (dashboard, health-profile, health-compass, benefits, settings, emergency)
- UI: show_notification

Use markdown tables when showing 3+ items. When booking, call update_benefit_usage + show_notification too.

Rules:
- Keep answers to 2-3 sentences max
- Be friendly and direct — not clinical
- Use **bold** for key numbers and dates only
- Never reply with just "Done!" — always confirm in 1 sentence
- Use tools proactively — if user says "update my age to 30", call update_profile immediately
- After navigating, confirm where you sent them`;
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
  const {
    user: authUser,
    benefitDashboardSummary,
    healthProfile,
    updateProfile,
    updatePersonalManualProviders,
    applyEmployerInviteKey,
  } = useAuth();
  const navigate = useNavigate();

  // Build real user object from auth context
  const realUser = {
    name: authUser?.fullName || authUser?.name || authUser?.displayName || "there",
    age: authUser?.age ?? null,
    occupation: authUser?.occupation ?? "patient",
    email: authUser?.email ?? "",
    location: { city: "Toronto" },
  };

  // Stable benefit key to detect real changes (avoids infinite re-render)
  const benefitKey = JSON.stringify(propBenefits ?? benefitDashboardSummary ?? null);

  const appointments = propAppointments ?? [];

  const [benefits, setBenefits] = useState(propBenefits ?? null);

  // Sync benefits when props change (user updates coverage in Settings)
  useEffect(() => {
    if (propBenefits) setBenefits(propBenefits);
  }, [benefitKey]);

  // Undo stack — each entry: { label: string, restore: () => void }
  const undoStackRef = useRef([]);


  // Rebuild system prompt ref whenever data changes
  const systemPromptRef = useRef("");
  useEffect(() => {
    systemPromptRef.current = buildSystemPrompt(realUser, benefits, appointments);
  }, [benefits, appointments, realUser.name, realUser.email]);

  const clinics = propClinics ?? [
    { id: "c_01", name: "Smile Dental Studio", type: "dental", lat: 43.6545, lng: -79.3801 },
    { id: "c_02", name: "ClearView Optometry", type: "optometry", lat: 43.651, lng: -79.385 },
    { id: "c_03", name: "ActiveCare Physio", type: "hospital", lat: 43.658, lng: -79.39 },
    { id: "c_04", name: "Rexall Pharmacy", type: "pharmacy", lat: 43.649, lng: -79.382 },
    { id: "c_05", name: "Toronto General Hosp.", type: "hospital", lat: 43.659, lng: -79.387 },
  ];

  const firstName = realUser.name.split(" ")[0];
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: `Hi ${firstName}! I'm your NexaCare assistant. I can check your benefits, book appointments, and help you navigate your care. What do you need?`,
    },
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

  async function executeTool(name, toolInput) {
    switch (name) {
      case "get_user_profile":
        return JSON.stringify(realUser);

      case "get_benefits":
        return benefits
          ? JSON.stringify(benefits)
          : JSON.stringify({ error: "No benefit plans configured. User should visit Settings to add coverage." });

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
          userId: authUser?.id ?? authUser?.email ?? "user_demo_01",
          userName: realUser.name,
          userEmail: realUser.email,
        };

        // Hit real backend — saves to Firebase + fires Resend emails
        try {
          const res = await fetch("http://localhost:8000/api/appointments/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newAppt),
          });
          const data = await res.json();
          if (data.id) newAppt.id = data.id;
          console.log("✅ Appointment saved to Firebase:", data.id);
        } catch (err) {
          console.warn("⚠️ Backend unavailable, saving locally only:", err.message);
        }

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

      case "cancel_appointment": {
        const { appointmentId } = toolInput;
        try {
          await fetch(`http://localhost:8000/api/appointments/${appointmentId}`, {
            method: "DELETE",
          });
        } catch (err) {
          console.warn("⚠️ Cancel backend unavailable:", err.message);
        }
        if (onBookAppointment) onBookAppointment({ id: appointmentId, _cancelled: true });
        return JSON.stringify({ success: true, cancelled: appointmentId });
      }

      // ── NEW HIGH-PRIORITY TOOLS ─────────────────────────────────────

      case "get_health_profile":
        return JSON.stringify(healthProfile ?? { error: "No health profile found" });

      case "update_profile": {
        const patch = {};
        if (toolInput.age !== undefined) patch.age = toolInput.age;
        if (toolInput.occupation !== undefined) patch.occupation = toolInput.occupation;
        if (Object.keys(patch).length === 0)
          return JSON.stringify({ error: "No fields provided to update" });
        updateProfile(patch);
        return JSON.stringify({ success: true, updated: patch });
      }

      case "add_medical_event": {
        const { title, date, notes } = toolInput;
        const newEvent = {
          id: `evt-${Date.now()}`,
          date,
          title,
          notes: notes ?? "",
        };
        const existing = healthProfile?.medicalHistory ?? [];
        updateProfile({ medicalHistory: [...existing, newEvent] });
        return JSON.stringify({ success: true, event: newEvent });
      }

      case "add_allergy": {
        const { name, severity } = toolInput;
        const newAllergy = { id: `alg-${Date.now()}`, name, severity };
        const existing = healthProfile?.allergies ?? [];
        updateProfile({ allergies: [...existing, newAllergy] });
        return JSON.stringify({ success: true, allergy: newAllergy });
      }

      case "set_checkup_date": {
        const { type, date } = toolInput;
        const existing = healthProfile?.coreCheckups ?? {};
        const updated = { ...existing, [type]: { ...existing[type], lastVisit: date } };
        updateProfile({ coreCheckups: updated });
        return JSON.stringify({ success: true, type, date });
      }

      case "add_benefit_provider": {
        const { providerName, planName, categories } = toolInput;
        const normalizedCats = (categories ?? []).map((c, i) => ({
          rowKey: `cat-${Date.now()}-${i}`,
          name: c.name,
          annualLimit: c.annualLimit ?? 0,
          coverage: c.coverage ?? 0.8,
          used: 0,
        }));
        const newProvider = {
          id: `mp-${Date.now()}`,
          name: providerName,
          planName,
          categories: normalizedCats,
        };
        const existing = authUser?.manualBenefitProviders ?? [];
        updatePersonalManualProviders([...existing, newProvider]);
        return JSON.stringify({ success: true, provider: newProvider });
      }

      case "remove_benefit_provider": {
        const { providerName } = toolInput;
        const existing = authUser?.manualBenefitProviders ?? [];
        const filtered = providerName.toLowerCase() === "all"
          ? []
          : existing.filter(
              (p) => !String(p.name ?? "").toLowerCase().includes(providerName.toLowerCase())
            );
        // snapshot before destroy
        const snapshot_providers = [...existing];
        undoStackRef.current.push({
          label: `Remove provider "${providerName}"`,
          restore: () => updatePersonalManualProviders(snapshot_providers),
        });
        updatePersonalManualProviders(filtered);
        const removed = existing.length - filtered.length;
        return JSON.stringify({ success: true, removed, remaining: filtered.length });
      }

      case "remove_medical_event": {
        const { title } = toolInput;
        const existing = healthProfile?.medicalHistory ?? [];
        const filtered = existing.filter(
          (e) => !String(e.title ?? "").toLowerCase().includes(title.toLowerCase())
        );
        // snapshot before destroy
        const snapshot_medical = [...existing];
        undoStackRef.current.push({
          label: `Remove medical event "${title}"`,
          restore: () => updateProfile({ medicalHistory: snapshot_medical }),
        });
        updateProfile({ medicalHistory: filtered });
        return JSON.stringify({ success: true, removed: title });
      }

      case "remove_favorite_clinic": {
        const { name } = toolInput;
        const existing = healthProfile?.favoriteClinics ?? [];
        const filtered = existing.filter(
          (c) => !String(c.name ?? "").toLowerCase().includes(name.toLowerCase())
        );
        // snapshot before destroy
        const snapshot_clinics = [...existing];
        undoStackRef.current.push({
          label: `Remove favorite clinic "${name}"`,
          restore: () => updateProfile({ favoriteClinics: snapshot_clinics }),
        });
        updateProfile({ favoriteClinics: filtered });
        return JSON.stringify({ success: true, removed: name });
      }

      case "add_favorite_clinic": {
        const { name, type } = toolInput;
        const newClinic = { id: `fc-${Date.now()}`, name, type };
        const existing = healthProfile?.favoriteClinics ?? [];
        updateProfile({ favoriteClinics: [...existing, newClinic] });
        return JSON.stringify({ success: true, clinic: newClinic });
      }

      case "remove_allergy": {
        const { name } = toolInput;
        const existing = healthProfile?.allergies ?? [];
        const filtered = existing.filter(
          (a) => !String(a.name ?? "").toLowerCase().includes(name.toLowerCase())
        );
        // snapshot before destroy
        const snapshot_allergies = [...existing];
        undoStackRef.current.push({
          label: `Remove allergy "${name}"`,
          restore: () => updateProfile({ allergies: snapshot_allergies }),
        });
        updateProfile({ allergies: filtered });
        return JSON.stringify({ success: true, removed: name });
      }

      case "restore_last_action": {
        const last = undoStackRef.current.pop();
        if (!last) return JSON.stringify({ success: false, message: "Nothing to restore — no recent changes found." });
        last.restore();
        return JSON.stringify({ success: true, restored: last.label });
      }

      case "apply_employer_key": {
        const { key } = toolInput;
        try {
          const result = await applyEmployerInviteKey(key);
          return JSON.stringify(result);
        } catch (err) {
          return JSON.stringify({ ok: false, error: err.message });
        }
      }

      case "navigate_to": {
        const { page } = toolInput;
        navigate(`/${page}`);
        return JSON.stringify({ success: true, navigatedTo: page });
      }

      default:
        return JSON.stringify({ error: "Unknown tool" });
    }
  }

  async function callAPI(apiMessages) {
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
        system: systemPromptRef.current || buildSystemPrompt(realUser, benefits, appointments),
        tools: TOOLS,
        messages: apiMessages,
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
        const toolResults = await Promise.all(
          toolUseBlocks.map(async (block) => ({
            type: "tool_result",
            tool_use_id: block.id,
            content: await executeTool(block.name, block.input),
          }))
        );
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
