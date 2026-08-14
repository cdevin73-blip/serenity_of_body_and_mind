import { JOURNAL_SECTIONS, getJournalNumericAvg, getJournalSectionRate } from "./journal";
import { todayKey, getStreak, getCompletion } from "./dates";

export function generateClientReport(client, journalData) {
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
  lines.push("\n30-DAY SUMMARY\n");

  const sleepAvg = getJournalNumericAvg(journalData, "sleepHours", 30);
  if (sleepAvg > 0) lines.push(`Sleep: avg ${sleepAvg} hrs (${Math.min(100,Math.round(sleepAvg/8*100))}% of goal)`);
  const waterAvg = getJournalNumericAvg(journalData, "waterGlasses", 30);
  if (waterAvg > 0) lines.push(`Water: avg ${waterAvg} glasses (${Math.min(100,Math.round(waterAvg/8*100))}% of goal)`);

  JOURNAL_SECTIONS.forEach(s => {
    const rate = getJournalSectionRate(journalData, s.id, 30);
    lines.push(`${s.label}: logged ${rate}% of the last 30 days`);
  });

  lines.push("\n" + "=".repeat(50));
  lines.push("\nDAILY LOG (last 30 days)\n");

  const sortedDays = Object.keys(journalData).sort().reverse().slice(0, 30);
  sortedDays.forEach(dateKey => {
    const d = new Date(dateKey);
    const label = `${dayNames[d.getDay()]} ${monthNames[d.getMonth()]} ${d.getDate()}`;
    lines.push("\n" + label);
    lines.push("-".repeat(20));
    const journal = journalData[dateKey];
    if (!journal) return;
    if (journal.sleepHours) lines.push(`  Sleep: ${journal.sleepHours} hrs`);
    if (journal.waterGlasses) lines.push(`  Water: ${journal.waterGlasses * 8} oz`);
    if (journal.intention) lines.push(`  Intention: ${journal.intention}`);
    if (journal.reflection) lines.push(`  Reflection: ${journal.reflection}`);
    if (journal.gratitude?.some(g=>g)) {
      lines.push("  Gratitude:");
      journal.gratitude.filter(g=>g).forEach((g,i) => lines.push(`    ${i+1}. ${g}`));
    }
    const foods = [
      journal.morning?.food && `Morning: ${journal.morning.food}`,
      journal.afternoon?.food && `Afternoon: ${journal.afternoon.food}`,
      journal.evening?.food && `Evening: ${journal.evening.food}`,
    ].filter(Boolean);
    if (foods.length) { lines.push("  Food diary:"); foods.forEach(f => lines.push(`    ${f}`)); }
    if (journal.medications) lines.push(`  Medications: ${journal.medications}`);
    const movement = [
      journal.movementCardio && `Cardio: ${journal.movementCardio}`,
      journal.movementWeights && `Weight training: ${journal.movementWeights}`,
      journal.movementStretching && `Stretching/Yoga: ${journal.movementStretching}`,
    ].filter(Boolean);
    if (movement.length) { lines.push("  Movement:"); movement.forEach(m => lines.push(`    ${m}`)); }
    if (journal.meditation) lines.push(`  Self-care: ${journal.meditation}`);
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
