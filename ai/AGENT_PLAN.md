# NexaCare AI Agent — Implementation Plan

## What we're building

Transform the chatbot from a passive Q&A widget into an **active agent** that can read and mutate the dashboard — book appointments, update benefit usage, find clinics, and execute health workflows on behalf of the user.

This uses Claude's **tool use** (function calling) feature. Claude decides when to call a tool, the frontend executes it, and the result flows back into the conversation.

---

## How Claude tool use works (the loop)

```
User sends message
      ↓
ChatWidget sends message + tool definitions to Anthropic API
      ↓
Claude responds with EITHER:
  (a) text reply  →  show it, done
  (b) tool_use    →  execute the tool locally, send result back to Claude
                      Claude then replies with text → show it, done
```

This loop can chain multiple tool calls before producing a final text reply.

---

## Tools to define

### 1. `get_user_profile`
Read the current user's name, age, occupation, location.
```json
{ "name": "get_user_profile", "description": "Get the current user's profile", "input_schema": { "type": "object", "properties": {} } }
```

### 2. `get_benefits`
Read current benefit balances.
```json
{ "name": "get_benefits", "description": "Get dental, vision, and physio benefit balances", "input_schema": { "type": "object", "properties": {} } }
```

### 3. `get_appointments`
Read upcoming and past appointments.
```json
{ "name": "get_appointments", "description": "Get all upcoming and past appointments", "input_schema": { "type": "object", "properties": {} } }
```

### 4. `book_appointment`
Create a new appointment and add it to the dashboard.
```json
{
  "name": "book_appointment",
  "description": "Book a new appointment for the user",
  "input_schema": {
    "type": "object",
    "required": ["type", "clinicName", "date", "duration"],
    "properties": {
      "type":       { "type": "string", "description": "e.g. Annual Dental Checkup" },
      "clinicName": { "type": "string", "description": "Name of the clinic" },
      "date":       { "type": "string", "description": "ISO 8601 date string" },
      "duration":   { "type": "number", "description": "Duration in minutes" }
    }
  }
}
```

### 5. `find_clinics`
Search nearby clinics by type.
```json
{
  "name": "find_clinics",
  "description": "Find nearby clinics filtered by type",
  "input_schema": {
    "type": "object",
    "properties": {
      "type": { "type": "string", "enum": ["dental", "vision", "physio", "hospital", "pharmacy"], "description": "Type of clinic to search" }
    }
  }
}
```

### 6. `update_benefit_usage`
Record a new expense against a benefit.
```json
{
  "name": "update_benefit_usage",
  "description": "Record a benefit expense (e.g. after booking an appointment)",
  "input_schema": {
    "type": "object",
    "required": ["benefitType", "amount"],
    "properties": {
      "benefitType": { "type": "string", "enum": ["dental", "vision", "physio"] },
      "amount":      { "type": "number", "description": "Amount spent in dollars" }
    }
  }
}
```

### 7. `show_notification`
Push a visible toast/banner to the dashboard UI.
```json
{
  "name": "show_notification",
  "description": "Show a notification or alert on the dashboard",
  "input_schema": {
    "type": "object",
    "required": ["message", "type"],
    "properties": {
      "message": { "type": "string" },
      "type":    { "type": "string", "enum": ["info", "warning", "success"] }
    }
  }
}
```

---

## What changes in `ChatbotWidget.jsx`

### 1. Accept callbacks as props (P1 wires these in)
```jsx
<ChatbotWidget
  user={user}
  appointments={appointments}
  clinics={clinics}
  onBookAppointment={(appt) => setAppointments(prev => [...prev, appt])}
  onUpdateBenefit={(type, amount) => { /* update benefit state */ }}
  onShowNotification={(msg, type) => { /* show toast */ }}
/>
```

### 2. Define tools array (passed to Anthropic on every request)
All 7 tools above, formatted as Anthropic tool definitions.

### 3. Handle `stop_reason: "tool_use"` in the API response
```js
if (response.stop_reason === "tool_use") {
  const toolUse = response.content.find(b => b.type === "tool_use");
  const result = await executeTool(toolUse.name, toolUse.input);
  // append tool_use block + tool_result block to history
  // call API again to get Claude's final text reply
}
```

### 4. `executeTool(name, input)` dispatcher
```js
async function executeTool(name, input) {
  switch (name) {
    case "get_benefits":       return props.benefits;
    case "get_appointments":   return props.appointments;
    case "book_appointment":   props.onBookAppointment({ ...input, id: uuid(), status: "upcoming" }); return "Appointment booked.";
    case "update_benefit_usage": props.onUpdateBenefit(input.benefitType, input.amount); return "Benefit updated.";
    case "find_clinics":       return props.clinics.filter(c => c.type === input.type);
    case "show_notification":  props.onShowNotification(input.message, input.type); return "Notification shown.";
    case "get_user_profile":   return props.user;
  }
}
```

---

## Example agent flows

### "Book me a dental appointment next week"
1. Claude calls `get_appointments` → sees no dental upcoming
2. Claude calls `find_clinics({ type: "dental" })` → gets list
3. Claude calls `book_appointment({ type: "Dental Checkup", clinicName: "Smile Dental Studio", date: "2026-03-28T10:00:00Z", duration: 60 })`
4. Claude calls `show_notification({ message: "Dental appointment booked for March 28!", type: "success" })`
5. Claude replies: "Done! I've booked your dental checkup at Smile Dental Studio for March 28 at 10am."

### "How much dental coverage do I have left?"
1. Claude calls `get_benefits`
2. Claude replies: "You have $1,100 remaining in dental coverage ($400 used of $1,500)."

### "Am I overdue for anything?"
1. Claude calls `get_appointments` + `get_benefits`
2. Claude replies with recommendations based on last visits + remaining balances

---

## Files to change

| File | Change |
|------|--------|
| `client/src/components/ChatbotWidget.jsx` | Add tools, tool loop, executeTool, accept props |
| `client/src/pages/DashboardPage.jsx` (P1) | Pass user/appointments/callbacks as props to ChatbotWidget |
| `ai/types.ts` | Add `Tool`, `ToolResult` types |

---

## What NOT to build for the hackathon

- No persistent tool execution (everything lives in React state)
- No multi-step planning beyond what Claude does natively
- No backend tool calls — all tools execute on the frontend against local state
- No streaming (keep it simple, one response at a time)

---

## Priority order

1. `get_benefits` + `get_appointments` — read-only, lowest risk, highest demo value
2. `book_appointment` → updates dashboard live — best demo moment
3. `show_notification` — makes it feel real
4. `update_benefit_usage` — auto-deducts after booking
5. `find_clinics` — nice to have

---

## Estimated effort

- `ChatbotWidget.jsx` rewrite: ~100 lines added
- P1 wiring in `DashboardPage`: ~15 lines
- Total: achievable in 2–3 hours
