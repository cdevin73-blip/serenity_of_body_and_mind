import { today } from "./dates";

export function emptyJournalDay() {
  return {
    sleepHours: 0,
    intention: "",
    morning: { food: "" },
    afternoon: { food: "" },
    evening: { food: "" },
    waterGlasses: 0,
    gratitude: ["", "", ""],
    medications: "",
    movementCardio: "",
    movementWeights: "",
    movementStretching: "",
    meditation: "",
    reflection: "",
  };
}

// Single source of truth for what counts as "logged" in a journal day —
// used by History's grids, the coach's per-client Overview, and streak/completion math.
export const JOURNAL_SECTIONS = [
  { id: "sleep",        label: "Sleep",        icon: "🌙", color: "#7C6FA0", check: e => (e.sleepHours || 0) > 0 },
  { id: "intention",    label: "Intention",    icon: "🎯", color: "#3D7D6B", check: e => !!e.intention },
  { id: "foodWater",    label: "Food & Water", icon: "🥗", color: "#5BA4CF", check: e => !!e.morning?.food || !!e.afternoon?.food || !!e.evening?.food || (e.waterGlasses || 0) > 0 },
  { id: "movement",     label: "Movement",     icon: "🏃", color: "#E8A838", check: e => !!e.movementCardio || !!e.movementWeights || !!e.movementStretching },
  { id: "medications",  label: "Medications",  icon: "💊", color: "#9478B8", check: e => !!e.medications },
  { id: "selfCare",     label: "Self-Care",    icon: "🧘", color: "#4A6E8A", check: e => !!e.meditation },
  { id: "gratitude",    label: "Gratitude",    icon: "🙏", color: "#D4A853", check: e => (e.gratitude || []).some(g => g) },
  { id: "reflection",   label: "Reflection",   icon: "✍️", color: "#6BAE75", check: e => !!e.reflection },
];

export function getJournalCompletion(entry) {
  if (!entry) return 0;
  const filled = JOURNAL_SECTIONS.filter(s => s.check(entry)).length;
  return Math.round((filled / JOURNAL_SECTIONS.length) * 100);
}

export function getJournalStreak(journalData) {
  let streak = 0;
  for (let d = 0; d < 60; d++) {
    const date = new Date(today); date.setDate(today.getDate() - d);
    const key = date.toISOString().split("T")[0];
    const entry = journalData[key];
    if (!entry || getJournalCompletion(entry) < 60) break;
    streak++;
  }
  return streak;
}

export function getJournalSectionRate(journalData, sectionId, days = 30) {
  const section = JOURNAL_SECTIONS.find(s => s.id === sectionId);
  if (!section) return 0;
  let logged = 0;
  for (let d = 0; d < days; d++) {
    const date = new Date(today); date.setDate(today.getDate() - d);
    const key = date.toISOString().split("T")[0];
    const entry = journalData[key];
    if (entry && section.check(entry)) logged++;
  }
  return Math.round((logged / days) * 100);
}

export function getJournalNumericAvg(journalData, field, days = 30) {
  const vals = [];
  for (let d = 0; d < days; d++) {
    const date = new Date(today); date.setDate(today.getDate() - d);
    const key = date.toISOString().split("T")[0];
    const val = journalData[key]?.[field];
    if (val) vals.push(val);
  }
  if (!vals.length) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}
