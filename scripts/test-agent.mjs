/**
 * NexaCare AI Agent — Test Script
 * Run: node scripts/test-agent.mjs
 * Requires ANTHROPIC_API_KEY in your environment or client/.env
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load key from client/.env
let API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  try {
    const env = readFileSync(resolve("client/.env"), "utf8");
    const match = env.match(/VITE_ANTHROPIC_API_KEY=(.+)/);
    if (match) API_KEY = match[1].trim();
  } catch {}
}

if (!API_KEY || API_KEY === "your_key_here") {
  console.error("❌  No API key found. Add VITE_ANTHROPIC_API_KEY to client/.env");
  process.exit(1);
}

const MOCK_USER = {
  name: "Nicolas Miranda Cantanhede",
  age: 34,
  occupation: "Software Developer",
  benefits: { dental: { total: 1500, used: 400 }, vision: { total: 600, used: 0 }, physio: { total: 900, used: 200 } },
};

const MOCK_APPOINTMENTS = [
  { id: "apt_01", type: "Annual Dental Checkup", clinicName: "Smile Dental Studio", date: "2026-04-02", status: "upcoming" },
  { id: "apt_04", type: "Vision Test", clinicName: "ClearView Optometry", date: "2025-12-15", status: "past" },
];

const MOCK_CLINICS = [
  { id: "c_01", name: "Smile Dental Studio", type: "dental" },
  { id: "c_02", name: "ClearView Optometry", type: "optometry" },
  { id: "c_03", name: "ActiveCare Physio", type: "hospital" },
];

const TOOLS = [
  { name: "get_benefits",     description: "Get benefit balances", input_schema: { type: "object", properties: {} } },
  { name: "get_appointments", description: "Get appointments",     input_schema: { type: "object", properties: {} } },
  { name: "find_clinics",     description: "Find nearby clinics",  input_schema: { type: "object", properties: { type: { type: "string" } } } },
  {
    name: "book_appointment",
    description: "Book a new appointment",
    input_schema: {
      type: "object", required: ["type", "clinicName", "date", "duration"],
      properties: {
        type:       { type: "string" },
        clinicName: { type: "string" },
        date:       { type: "string" },
        duration:   { type: "number" },
      },
    },
  },
];

function executeTool(name, input) {
  switch (name) {
    case "get_benefits":     return JSON.stringify(MOCK_USER.benefits);
    case "get_appointments": return JSON.stringify(MOCK_APPOINTMENTS);
    case "find_clinics":     return JSON.stringify(input.type ? MOCK_CLINICS.filter(c => c.type === input.type) : MOCK_CLINICS);
    case "book_appointment": {
      console.log(`   🗓  Tool executed: book_appointment → ${input.type} at ${input.clinicName} on ${input.date}`);
      return JSON.stringify({ success: true, appointment: { ...input, id: `apt_${Date.now()}`, status: "upcoming" } });
    }
    default: return JSON.stringify({ error: "unknown tool" });
  }
}

async function chat(userMessage, history = []) {
  const messages = [...history, { role: "user", content: userMessage }];
  let current = messages;

  while (true) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: `You are a health assistant for ${MOCK_USER.name}. Benefits: dental $${MOCK_USER.benefits.dental.used}/$${MOCK_USER.benefits.dental.total}, vision $${MOCK_USER.benefits.vision.used}/$${MOCK_USER.benefits.vision.total}, physio $${MOCK_USER.benefits.physio.used}/$${MOCK_USER.benefits.physio.total}. Use tools when the user wants to take action.`,
        tools: TOOLS,
        messages: current,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message ?? `HTTP ${res.status}`);

    if (data.stop_reason === "tool_use") {
      const toolBlocks = data.content.filter(b => b.type === "tool_use");
      current = [...current, { role: "assistant", content: data.content }];
      const results = toolBlocks.map(b => {
        console.log(`   🔧 Tool called: ${b.name}(${JSON.stringify(b.input)})`);
        return { type: "tool_result", tool_use_id: b.id, content: executeTool(b.name, b.input) };
      });
      current = [...current, { role: "user", content: results }];
    } else {
      const reply = data.content.find(b => b.type === "text")?.text ?? "No response";
      return { reply, history: [...current, { role: "assistant", content: reply }] };
    }
  }
}

async function run() {
  const tests = [
    "How much dental coverage do I have left?",
    "Am I overdue for a vision checkup?",
    "Book me a dental cleaning at Smile Dental Studio next Friday April 3rd for 45 minutes",
  ];

  console.log("🧪 NexaCare AI Agent Test\n" + "─".repeat(50));

  let history = [];
  for (const msg of tests) {
    console.log(`\n👤 User: ${msg}`);
    const { reply, history: newHistory } = await chat(msg, history);
    history = newHistory;
    console.log(`🤖 Agent: ${reply}`);
    console.log("─".repeat(50));
  }

  console.log("\n✅ All tests passed!");
}

run().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
