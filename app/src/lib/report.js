import { todayKey } from "./dates";
import { getStreak, getCompletion } from "./dates";

export function generateClientReport(client, history, journalData) {
  const lines = [];
  const today = new Date();
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  lines.push("SERENITY OF BODY AND MIND");
  lines.push("Wellness Journey Report");
  lines.push("Generated: " + today.toLocaleDateString());
  lines.push("Client: " + client.name);
  lines.push("Program: " + (client.program || "-"));
  lines.push("Goal: " + (client.goal || "-"));
  lines.push("\n" + "=".repeat(50));
  lines.push("\n30-DAY HABIT SUMMARY\n");

  const HABITS_LOCAL = [
    { id:"sleep", label:"Sleep", unit:"hrs", target:8 },
    { id:"water", label:"Water", unit:"glasses", target:8 },
    { id:"exercise", label:"Exercise", unit:"min", target:30 },
    { id:"nutrition", label:"Nutrition", unit:"meals", target:3 },
    { id:"mood", label:"Mood", unit:"/5", target:5 },
  ];

  HABITS_LOCAL.forEach(h => {
    const vals = Object.values(history).map(d => d[h.id] || 0).filter(v => v > 0);
    if (vals.length === 0) return;
    const avg = (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1);
    const pct = Math.round((parseFloat(avg)/h.target)*100);
    lines.push(`${h.label}: avg ${avg} ${h.unit} (${pct}% of goal)`);
  });

  lines.push("\n" + "=".repeat(50));
  lines.push("\nDAILY LOG (last 30 days)\n");

  const sortedDays = Object.keys(history).sort().reverse().slice(0, 30);
  sortedDays.forEach(dateKey => {
    const d = new Date(dateKey);
    const label = `${dayNames[d.getDay()]} ${monthNames[d.getMonth()]} ${d.getDate()}`;
    lines.push("\n" + label);
    lines.push("-".repeat(20));
    const dayData = history[dateKey] || {};
    HABITS_LOCAL.forEach(h => {
      if (dayData[h.id] !== undefined) {
        lines.push(`  ${h.label}: ${dayData[h.id]} ${h.unit}`);
      }
    });
    const journal = journalData[dateKey];
    if (journal) {
      if (journal.intention) lines.push(`  Intention: ${journal.intention}`);
      if (journal.reflection) lines.push(`  Reflection: ${journal.reflection}`);
      if (journal.gratitude?.some(g=>g)) {
        lines.push("  Gratitude:");
        journal.gratitude.filter(g=>g).forEach((g,i) => lines.push(`    ${i+1}. ${g}`));
      }
      const totalWater = ((journal.morning?.water||0)+(journal.afternoon?.water||0)+(journal.evening?.water||0))*8;
      if (totalWater > 0) lines.push(`  Water logged: ${totalWater} oz`);
      const foods = [
        journal.morning?.food && `Morning: ${journal.morning.food}`,
        journal.afternoon?.food && `Afternoon: ${journal.afternoon.food}`,
        journal.evening?.food && `Evening: ${journal.evening.food}`,
      ].filter(Boolean);
      if (foods.length) { lines.push("  Food diary:"); foods.forEach(f => lines.push(`    ${f}`)); }
      if (journal.medications) lines.push(`  Medications: ${journal.medications}`);
      if (journal.exercise) lines.push(`  Exercise: ${journal.exercise}`);
      if (journal.meditation) lines.push(`  Self-care: ${journal.meditation}`);
    }
  });

  lines.push("\n" + "=".repeat(50));
  lines.push("\nThank you for your wellness journey with Serenity of Body and Mind.");
  lines.push("serenityofbodyandmind.com . (503) 354-7298");

  return lines.join("\n");
}

export function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// Was previously called from the coach Reports tab but never defined
// anywhere in the codebase, so Reports crashed with a ReferenceError as
// soon as it was opened. Built here from the same `allClientData` source
// the client-list pills use (currently always {} - see the allClientData
// dead-state note tracked for Phase 5), so avg/streak read 0 today and
// will start reflecting real numbers once that gets fixed.
export function getAggregate(clients, allClientData) {
  return clients.map(c => {
    const h = allClientData[c.id] || {};
    return {
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      streak: getStreak(h),
      avg: getCompletion(h[todayKey]),
    };
  });
}
