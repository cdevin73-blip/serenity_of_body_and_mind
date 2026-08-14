export function emptyJournalDay() {
  return {
    intention: "",
    morning: { food: "", water: 0 },
    afternoon: { food: "", water: 0 },
    evening: { food: "", water: 0 },
    gratitude: ["","",""],
    medications: "",
    exercise: "",
    meditation: "",
    reflection: "",
  };
}
