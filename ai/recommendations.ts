import Anthropic from "@anthropic-ai/sdk";
import type { User, Recommendation, Appointment } from "./types";

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

function lastVisitOf(appointments: Appointment[], ...keywords: string[]): string {
  const match = appointments
    .filter((a) => a.status === "past")
    .find((a) => keywords.some((kw) => a.type.toLowerCase().includes(kw)));
  return match ? new Date(match.date).toLocaleDateString() : "never recorded";
}

/**
 * Returns 2–3 health checkup recommendations for the given user.
 * Pass `appointments` (ideally the full list from /api/appointments/:userId)
 * so the prompt can reference real visit history. Falls back to "never recorded"
 * if appointments are not provided.
 *
 * @example
 *   const recs = await getRecommendations(user, appointments);
 *   // [{ type: "Eye exam", reason: "...", urgency: "high" }, ...]
 */
export async function getRecommendations(
  user: User,
  appointments: Appointment[] = []
): Promise<Recommendation[]> {
  const client = new Anthropic({
    apiKey: resolveApiKey(),
    dangerouslyAllowBrowser: true,
  });

  const lastDental = lastVisitOf(appointments, "dental", "cleaning");
  const lastEye = lastVisitOf(appointments, "vision", "eye", "optometry");
  const lastCheckup = lastVisitOf(appointments, "checkup", "general", "physical");

  const unusedDental = user.benefits.dental.total - user.benefits.dental.used;
  const unusedVision = user.benefits.vision.total - user.benefits.vision.used;

  const prompt =
    `User is ${user.age}, ${user.occupation}. ` +
    `Last dental ${lastDental}, last eye exam ${lastEye}, last general checkup ${lastCheckup}. ` +
    `Unused dental $${unusedDental}, unused vision $${unusedVision}.\n\n` +
    `Return ONLY a JSON array, 2-3 items: ` +
    `[{"type": string, "reason": string, "urgency": "low"|"medium"|"high"}]`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const raw =
    response.content[0]?.type === "text" ? response.content[0].text : "[]";

  // Strip markdown code fences if the model wraps the JSON
  const clean = raw.replace(/```(?:json)?\n?/g, "").trim();

  try {
    return JSON.parse(clean) as Recommendation[];
  } catch {
    return [];
  }
}
