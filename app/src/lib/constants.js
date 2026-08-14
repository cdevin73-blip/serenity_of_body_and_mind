// ─── DATA ────────────────────────────────────────────────────────────────────

export const HABITS = [
  { id: "sleep",     label: "Sleep",     icon: "🌙", unit: "hrs",     target: 8,  color: "#7C6FA0" },
  { id: "water",     label: "Water",     icon: "💧", unit: "glasses", target: 8,  color: "#5BA4CF" },
  { id: "exercise",  label: "Exercise",  icon: "🏃", unit: "min",     target: 30, color: "#E8A838" },
  { id: "nutrition", label: "Nutrition", icon: "🥗", unit: "meals",   target: 3,  color: "#6BAE75" },
  { id: "mood",      label: "Mood",      icon: "☀️", unit: "/5",      target: 5,  color: "#E87D5B" },
];
export const MOODS = ["😞","😐","🙂","😊","🌟"];

// ─── ACCESS LEVELS ───────────────────────────────────────────────────────────
// active     = full app + messaging (during coaching program)
// grace      = full app + messaging winding down (4 weeks post-program)
// app_only   = subscription: app only, no messaging
// app_msg    = subscription: app + up to 5 messages/week
// expired    = locked out, sees upgrade screen

export const ACCESS_LEVELS = {
  active:    { label: "Active Client",     color: "#6BAE75", icon: "🟢", canMessage: true,  msgLimit: null, appAccess: true,  viewOnly: false },
  grace:     { label: "Grace Period",      color: "#E8A838", icon: "🟡", canMessage: true,  msgLimit: null, appAccess: true,  viewOnly: false },
  app_only:  { label: "App Only",          color: "#5BA4CF", icon: "🔵", canMessage: false, msgLimit: 0,    appAccess: true,  viewOnly: false },
  app_msg:   { label: "App + Messaging",   color: "#9478B8", icon: "🟣", canMessage: true,  msgLimit: 5,    appAccess: true,  viewOnly: false },
  view_only: { label: "View Only",         color: "#A0897C", icon: "👁️", canMessage: false, msgLimit: 0,    appAccess: true,  viewOnly: true  },
  expired:   { label: "Access Expired",    color: "#E87D5B", icon: "🔴", canMessage: false, msgLimit: 0,    appAccess: false, viewOnly: false },
};

export const SUBSCRIPTION_PLANS = [
  {
    id: "app_only",
    name: "App Only",
    price: "$12/mo",
    description: "Full habit tracking, daily journal, food diary, gratitude, AI insights - everything except messaging.",
    features: ["Daily habit tracking", "Full journal & food diary", "AI coaching insights", "Progress history & streaks", "Smart reminders"],
    excludes: ["Messaging with Caroline"],
    cta: "Subscribe - App Only",
    highlight: false,
  },
  {
    id: "app_msg",
    name: "App + Messaging",
    price: "$25/mo",
    description: "Everything in App Only, plus up to 5 messages per week to Caroline during business hours.",
    features: ["Everything in App Only", "Up to 5 messages per week", "Mon-Fri, 8am-6pm PST", "Responses within 24 hours"],
    excludes: [],
    cta: "Subscribe - App + Messaging",
    highlight: true,
  },
];

// Default values for real Supabase users
export const DEFAULT_GOALS = { primaryGoal:"", weeklyCheckIn:"Every Monday", targetWeight:"", sleepTarget:"8", waterTarget:"8", exerciseTarget:"30", notes:"" };
export const DEFAULT_REMINDERS = { email:true, sms:false, morningTime:"08:00", eveningTime:"20:00", habits:["sleep","water","exercise","nutrition","mood"] };
export const DEFAULT_PRIVACY = { coachAccessEnabled:true, shareHabits:true, shareJournal:true, shareFoodDiary:true, shareMedications:true, shareMood:true };
