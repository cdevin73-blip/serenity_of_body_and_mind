// NOTE: this fetch has no Anthropic API key/headers and always fails (401 +
// likely CORS). Both call sites catch the failure and fall back to a
// hardcoded message. Kept as-is for Phase 1 (no behavior changes); slated
// for removal in Phase 6 once the Insights tabs that use it are dropped.
import { HABITS } from "./constants";
import { getWeekDays } from "./dates";

export async function fetchInsights(clientName, history, goals) {
  const weekDays = getWeekDays(7);
  const summary = HABITS.map(h=>{
    const vals = weekDays.map(d=>history[d.key]?.[h.id]||0);
    const avg = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10;
    return `${h.label}: avg ${avg} ${h.unit} (goal: ${h.target})`;
  }).join(", ");

  const prompt = `You are a warm, encouraging health coach AI. Analyze this client's week and give 3 personalized insights.

Client: ${clientName}
Goal: ${goals?.primaryGoal || "General wellness"}
This week's habits: ${summary}

Return ONLY a JSON array with exactly 3 objects, each with:
- "type": one of "positive", "warning", or "tip"
- "emoji": one relevant emoji
- "label": short label (2-3 words)
- "text": 1-2 sentence personalized insight (warm, specific, actionable)

No markdown, no explanation, just the JSON array.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model:"claude-sonnet-4-20250514",
      max_tokens:1000,
      messages:[{role:"user",content:prompt}]
    })
  });
  const data = await res.json();
  const text = data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
  return JSON.parse(text);
}
