import { useState, useEffect, useRef } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const HABITS = [
  { id: "sleep",     label: "Sleep",     icon: "🌙", unit: "hrs",     target: 8,  color: "#7C6FA0" },
  { id: "water",     label: "Water",     icon: "💧", unit: "glasses", target: 8,  color: "#5BA4CF" },
  { id: "exercise",  label: "Exercise",  icon: "🏃", unit: "min",     target: 30, color: "#E8A838" },
  { id: "nutrition", label: "Nutrition", icon: "🥗", unit: "meals",   target: 3,  color: "#6BAE75" },
  { id: "mood",      label: "Mood",      icon: "☀️", unit: "/5",      target: 5,  color: "#E87D5B" },
];
const MOODS = ["😞","😐","🙂","😊","🌟"];

// ─── ACCESS LEVELS ───────────────────────────────────────────────────────────
// active     = full app + messaging (during coaching program)
// grace      = full app + messaging winding down (4 weeks post-program)
// app_only   = subscription: app only, no messaging
// app_msg    = subscription: app + up to 5 messages/week
// expired    = locked out, sees upgrade screen

const ACCESS_LEVELS = {
  active:    { label: "Active Client",     color: "#6BAE75", icon: "🟢", canMessage: true,  msgLimit: null, appAccess: true,  viewOnly: false },
  grace:     { label: "Grace Period",      color: "#E8A838", icon: "🟡", canMessage: true,  msgLimit: null, appAccess: true,  viewOnly: false },
  app_only:  { label: "App Only",          color: "#5BA4CF", icon: "🔵", canMessage: false, msgLimit: 0,    appAccess: true,  viewOnly: false },
  app_msg:   { label: "App + Messaging",   color: "#9478B8", icon: "🟣", canMessage: true,  msgLimit: 5,    appAccess: true,  viewOnly: false },
  view_only: { label: "View Only",         color: "#A0897C", icon: "👁️", canMessage: false, msgLimit: 0,    appAccess: true,  viewOnly: true  },
  expired:   { label: "Access Expired",    color: "#E87D5B", icon: "🔴", canMessage: false, msgLimit: 0,    appAccess: false, viewOnly: false },
};

const SUBSCRIPTION_PLANS = [
  {
    id: "app_only",
    name: "App Only",
    price: "$12/mo",
    description: "Full habit tracking, daily journal, food diary, gratitude, AI insights — everything except messaging.",
    features: ["Daily habit tracking", "Full journal & food diary", "AI coaching insights", "Progress history & streaks", "Smart reminders"],
    excludes: ["Messaging with Caroline"],
    cta: "Subscribe — App Only",
    highlight: false,
  },
  {
    id: "app_msg",
    name: "App + Messaging",
    price: "$25/mo",
    description: "Everything in App Only, plus up to 5 messages per week to Caroline during business hours.",
    features: ["Everything in App Only", "Up to 5 messages per week", "Mon–Fri, 8am–6pm PST", "Responses within 24 hours"],
    excludes: [],
    cta: "Subscribe — App + Messaging",
    highlight: true,
  },
];

const CLIENTS = [
  {
    id:"c1", name:"Sarah M.",  avatar:"SM", joined:"Jan 2025", goal:"Build energy & reduce stress",
    email:"sarah@email.com",  phone:"555-0101",
    program: "Gold", programEndDate: "2026-04-13",
    accessLevel: "active", graceEndDate: "2026-05-11",
    subscriptionPlan: null, messagesThisWeek: 2,
  },
  {
    id:"c2", name:"James T.",  avatar:"JT", joined:"Feb 2025", goal:"Lose weight & sleep better",
    email:"james@email.com",  phone:"555-0102",
    program: "Silver", programEndDate: "2026-03-20",
    accessLevel: "grace", graceEndDate: "2026-04-17",
    subscriptionPlan: null, messagesThisWeek: 0,
  },
  {
    id:"c3", name:"Priya K.",  avatar:"PK", joined:"Mar 2025", goal:"Improve nutrition habits",
    email:"priya@email.com",  phone:"555-0103",
    program: "Platinum", programEndDate: "2026-02-23",
    accessLevel: "app_msg", graceEndDate: "2026-03-23",
    subscriptionPlan: "app_msg", messagesThisWeek: 3,
  },
];

function genHistory(clientId) {
  const seed = clientId.charCodeAt(1);
  const today = new Date();
  const h = {};
  for (let d = 29; d >= 0; d--) {
    const date = new Date(today); date.setDate(today.getDate() - d);
    const key = date.toISOString().split("T")[0];
    h[key] = {};
    HABITS.forEach((hab, i) => {
      const base = ((seed + i + d) % 5) + 1;
      h[key][hab.id] = Math.min(hab.target, Math.round((base / 5) * hab.target * (0.6 + (seed * i * d % 40) / 100)));
    });
  }
  return h;
}

const initGoals = Object.fromEntries(CLIENTS.map(c => [c.id, {
  primaryGoal: c.goal,
  weeklyCheckIn: "Every Monday",
  targetWeight: "",
  sleepTarget: "8",
  waterTarget: "8",
  exerciseTarget: "30",
  notes: ""
}]));

const initMessages = Object.fromEntries(CLIENTS.map(c => [c.id, [
  { from:"coach", text:"Welcome to Serenity of Body and Mind! I'm so excited to be on this wellness journey with you. 🌿", time:"9:00 AM", date:"Mon" },
  { from:"client", text:"Thank you! I'm ready to start building better habits.", time:"9:15 AM", date:"Mon" },
]]));

const initReminders = Object.fromEntries(CLIENTS.map(c => [c.id, {
  email: true, sms: false,
  morningTime: "08:00", eveningTime: "20:00",
  habits: ["sleep","water","exercise","nutrition","mood"]
}]));

// ─── PRIVACY DEFAULTS ─────────────────────────────────────────────────────────
// All on by default during active coaching. Client can turn off at any time.
const initPrivacy = Object.fromEntries(CLIENTS.map(c => [c.id, {
  coachAccessEnabled: true,   // master toggle
  shareHabits:        true,   // habit tracking & streaks
  shareJournal:       true,   // daily journal, intention, reflection
  shareFoodDiary:     true,   // morning/afternoon/evening food logs
  shareMedications:   true,   // medications & supplements
  shareMood:          true,   // mood ratings
}]));

// ─── STYLES ──────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --cream:#F2F7F5; --warm:#F8FCFA;
  --terra:#3D7D6B; --terra-l:#56A18D; --terra-d:#2C6357;
  --sage:#7A9E7E; --sage-l:#A8C5AC;
  --plum:#4A6E8A; --plum-l:#7A9EB0;
  --gold:#D4A853;
  --navy:#1E2A38;
  --dark:#1A2E28; --mid:#3D5C52; --light:#7A9E94;
  --card:rgba(248,252,250,0.96);
  --sh:0 4px 24px rgba(30,80,65,.09);
  --sh-lg:0 12px 48px rgba(30,80,65,.14);
  --border:rgba(61,125,107,0.13);
}
body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--dark);min-height:100vh;}
.app{min-height:100vh;position:relative;overflow-x:hidden;}
.app::before{content:'';position:fixed;inset:0;
  background:radial-gradient(ellipse at 15% 15%,rgba(61,125,107,.08) 0,transparent 55%),
             radial-gradient(ellipse at 85% 85%,rgba(74,110,138,.07) 0,transparent 55%),
             radial-gradient(ellipse at 70% 5%,rgba(122,158,126,.06) 0,transparent 40%);
  pointer-events:none;z-index:0;}

/* ── LOGIN ── */
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;position:relative;z-index:1;}
.login-card{background:var(--card);border-radius:32px;padding:52px 44px;max-width:420px;width:100%;box-shadow:var(--sh-lg);border:1px solid var(--border);text-align:center;animation:fadeUp .6s ease;}
.login-logo{font-family:'Fraunces',serif;font-size:48px;color:var(--terra);font-style:italic;font-weight:300;line-height:1;}
.login-tagline{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--light);margin-bottom:40px;margin-top:4px;}
.role-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px;}
.role-btn{padding:20px 12px;border-radius:18px;border:2px solid var(--border);background:transparent;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif;text-align:center;}
.role-btn:hover{border-color:var(--terra);background:rgba(61,125,107,.05);}
.role-btn.active{border-color:var(--terra);background:rgba(61,125,107,.08);box-shadow:0 0 0 3px rgba(61,125,107,.1);}
.role-btn .rb-icon{font-size:30px;margin-bottom:8px;display:block;}
.role-btn .rb-name{font-size:14px;font-weight:600;color:var(--dark);}
.role-btn .rb-desc{font-size:11px;color:var(--light);margin-top:2px;}
.select-field{width:100%;padding:13px 16px;border-radius:12px;border:1.5px solid var(--border);background:var(--warm);font-family:'DM Sans',sans-serif;font-size:14px;color:var(--dark);margin-bottom:20px;appearance:none;cursor:pointer;}
.select-field:focus{outline:none;border-color:var(--terra);}
.btn-primary{width:100%;padding:15px;border-radius:14px;border:none;background:linear-gradient(135deg,var(--terra),var(--terra-l));color:#fff;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:all .2s;letter-spacing:.02em;}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(61,125,107,.35);}
.btn-primary:disabled{opacity:.45;cursor:not-allowed;transform:none;}

/* ── NAV ── */
.nav{position:sticky;top:0;z-index:200;background:rgba(253,246,238,.92);backdrop-filter:blur(14px);border-bottom:1px solid var(--border);}
.nav-inner{max-width:1040px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:62px;padding:0 24px;}
.nav-logo{font-family:'Fraunces',serif;font-size:24px;color:var(--terra);font-style:italic;font-weight:300;}
.nav-tabs{display:flex;gap:2px;}
.nav-tab{padding:7px 14px;border-radius:10px;border:none;background:transparent;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:var(--light);cursor:pointer;transition:all .2s;white-space:nowrap;}
.nav-tab:hover{color:var(--dark);}
.nav-tab.active{background:rgba(61,125,107,.1);color:var(--terra);}
.nav-right{display:flex;align-items:center;gap:12px;}
.nav-badge{font-size:12px;background:rgba(61,125,107,.1);color:var(--terra);padding:4px 12px;border-radius:20px;font-weight:600;}
.nav-logout{font-size:13px;color:var(--light);cursor:pointer;background:none;border:none;font-family:'DM Sans',sans-serif;}
.nav-logout:hover{color:var(--terra);}

/* ── LAYOUT ── */
.main{max-width:1040px;margin:0 auto;padding:32px 24px;position:relative;z-index:1;}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.three-col{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
@media(max-width:720px){.two-col,.three-col{grid-template-columns:1fr;}}

/* ── CARDS ── */
.card{background:var(--card);border-radius:20px;padding:24px;box-shadow:var(--sh);border:1px solid var(--border);animation:fadeUp .5s ease both;}
.card-sm{background:var(--card);border-radius:16px;padding:18px 20px;box-shadow:var(--sh);border:1px solid var(--border);}
.section-label{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--light);margin-bottom:14px;}
.section-title{font-family:'Fraunces',serif;font-size:22px;font-weight:400;color:var(--dark);margin-bottom:4px;}

/* ── GREETING ── */
.greeting{margin-bottom:28px;animation:fadeUp .5s ease;}
.greeting-date{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--light);margin-bottom:6px;}
.greeting-title{font-family:'Fraunces',serif;font-size:38px;font-weight:300;color:var(--dark);line-height:1.15;}
.greeting-title em{color:var(--terra);font-style:italic;}

/* ── HABITS ── */
.habits-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin-bottom:28px;}
.habit-card{background:var(--card);border-radius:18px;padding:20px;box-shadow:var(--sh);border:1px solid var(--border);transition:all .25s;animation:fadeUp .5s ease both;}
.habit-card:hover{transform:translateY(-2px);box-shadow:var(--sh-lg);}
.habit-header{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
.habit-icon{font-size:22px;}
.habit-name{font-size:14px;font-weight:600;color:var(--dark);}
.habit-target{font-size:11px;color:var(--light);}
.habit-stepper{display:flex;align-items:center;gap:6px;background:rgba(61,125,107,.06);border-radius:12px;padding:4px;width:fit-content;}
.step-btn{width:30px;height:30px;border-radius:8px;border:none;background:#fff;color:var(--terra);font-size:16px;font-weight:700;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.08);}
.step-btn:hover{background:var(--terra);color:#fff;}
.step-val{font-size:17px;font-weight:600;min-width:34px;text-align:center;color:var(--dark);}
.habit-unit{font-size:11px;color:var(--light);margin-left:4px;}
.progress-bar{height:4px;background:rgba(61,125,107,.1);border-radius:4px;margin-top:12px;overflow:hidden;}
.progress-fill{height:100%;border-radius:4px;transition:width .4s ease;}
.mood-row{display:flex;gap:7px;}
.mood-btn{width:38px;height:38px;border-radius:50%;border:2px solid transparent;background:rgba(61,125,107,.06);font-size:17px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;}
.mood-btn:hover,.mood-btn.sel{border-color:var(--terra);background:rgba(61,125,107,.12);transform:scale(1.12);}

/* ── STREAK ── */
.streak-banner{background:linear-gradient(135deg,var(--terra),#2C6357);border-radius:18px;padding:22px 26px;color:#fff;display:flex;align-items:center;justify-content:space-between;box-shadow:0 8px 32px rgba(61,125,107,.28);margin-bottom:22px;animation:fadeUp .4s ease;}
.streak-num{font-family:'Fraunces',serif;font-size:54px;font-weight:300;opacity:.9;line-height:1;}

/* ── TABS ── */
.tabs{display:flex;gap:4px;background:rgba(61,125,107,.07);border-radius:14px;padding:4px;margin-bottom:28px;}
.tab{flex:1;padding:9px;border-radius:10px;border:none;background:transparent;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:var(--light);cursor:pointer;transition:all .2s;}
.tab.active{background:#fff;color:var(--terra);box-shadow:0 2px 8px rgba(61,125,107,.12);}

/* ── HISTORY ── */
.history-grid7{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:24px;}
.hday{text-align:center;}
.hday-lbl{font-size:9px;color:var(--light);margin-bottom:3px;text-transform:uppercase;letter-spacing:.04em;}
.hday-dot{border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;padding:6px 2px;}
.week-row{display:flex;align-items:center;gap:10px;margin-bottom:9px;}
.week-habit-label{font-size:12px;color:var(--mid);width:88px;flex-shrink:0;}
.week-dots{display:flex;gap:4px;flex:1;}
.wdot{flex:1;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;color:#fff;}

/* ── ONBOARDING ── */
.ob-step{background:var(--card);border-radius:24px;padding:36px;box-shadow:var(--sh-lg);border:1px solid var(--border);max-width:560px;margin:0 auto;animation:fadeUp .5s ease;}
.ob-progress{display:flex;gap:6px;margin-bottom:32px;}
.ob-dot{height:4px;flex:1;border-radius:4px;background:rgba(61,125,107,.15);transition:background .3s;}
.ob-dot.done{background:var(--terra);}
.ob-title{font-family:'Fraunces',serif;font-size:28px;font-weight:400;color:var(--dark);margin-bottom:6px;}
.ob-sub{font-size:14px;color:var(--mid);margin-bottom:28px;line-height:1.6;}
.field-group{margin-bottom:18px;}
.field-label{font-size:12px;font-weight:600;color:var(--mid);margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em;}
.text-input{width:100%;padding:12px 16px;border-radius:12px;border:1.5px solid var(--border);background:var(--warm);font-family:'DM Sans',sans-serif;font-size:14px;color:var(--dark);}
.text-input:focus{outline:none;border-color:var(--terra);}
.textarea{width:100%;padding:13px 16px;border-radius:14px;border:1.5px solid var(--border);background:var(--warm);font-family:'DM Sans',sans-serif;font-size:14px;color:var(--dark);resize:vertical;min-height:80px;}
.textarea:focus{outline:none;border-color:var(--sage);}
.ob-actions{display:flex;gap:12px;margin-top:24px;}
.btn-back{flex:1;padding:13px;border-radius:12px;border:1.5px solid var(--border);background:transparent;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--mid);cursor:pointer;}
.btn-back:hover{border-color:var(--terra);color:var(--terra);}
.btn-next{flex:2;padding:13px;border-radius:12px;border:none;background:linear-gradient(135deg,var(--terra),var(--terra-l));color:#fff;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;}
.btn-next:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(61,125,107,.3);}
.checkbox-group{display:flex;flex-wrap:wrap;gap:8px;}
.checkbox-tag{padding:8px 16px;border-radius:20px;border:1.5px solid var(--border);background:transparent;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--mid);cursor:pointer;transition:all .2s;}
.checkbox-tag.sel{border-color:var(--terra);background:rgba(61,125,107,.08);color:var(--terra);font-weight:600;}

/* ── GOALS ── */
.goal-card{background:linear-gradient(135deg,rgba(122,158,126,.12),rgba(107,76,110,.08));border:1px solid rgba(122,158,126,.25);border-radius:18px;padding:22px;margin-bottom:16px;}
.goal-item{display:flex;align-items:center;gap:14px;padding:13px 0;border-bottom:1px solid var(--border);}
.goal-item:last-child{border-bottom:none;padding-bottom:0;}
.goal-icon{font-size:20px;width:36px;text-align:center;}
.goal-label{font-size:12px;color:var(--light);margin-bottom:2px;}
.goal-val{font-size:15px;font-weight:600;color:var(--dark);}
.goal-edit-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);}
.goal-edit-row:last-child{border-bottom:none;}
.goal-edit-label{font-size:13px;color:var(--mid);min-width:120px;}
.goal-input-sm{flex:1;padding:8px 12px;border-radius:10px;border:1.5px solid var(--border);background:var(--warm);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--dark);}
.goal-input-sm:focus{outline:none;border-color:var(--terra);}
.btn-sm{padding:9px 18px;border-radius:10px;border:none;background:var(--terra);color:#fff;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;}
.btn-sm:hover{background:var(--terra-d);}
.btn-sm-outline{padding:9px 18px;border-radius:10px;border:1.5px solid var(--terra);background:transparent;color:var(--terra);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;}
.btn-sm-outline:hover{background:rgba(61,125,107,.08);}

/* ── CHAT ── */
.chat-wrap{display:flex;flex-direction:column;height:480px;}
.chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;}
.chat-messages::-webkit-scrollbar{width:4px;}
.chat-messages::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;}
.msg{max-width:75%;display:flex;flex-direction:column;}
.msg.coach{align-self:flex-start;}
.msg.client{align-self:flex-end;}
.msg-bubble{padding:11px 16px;border-radius:18px;font-size:14px;line-height:1.5;}
.msg.coach .msg-bubble{background:rgba(61,125,107,.1);color:var(--dark);border-radius:4px 18px 18px 18px;}
.msg.client .msg-bubble{background:var(--terra);color:#fff;border-radius:18px 4px 18px 18px;}
.msg-meta{font-size:10px;color:var(--light);margin-top:4px;padding:0 4px;}
.msg.client .msg-meta{text-align:right;}
.chat-input-row{display:flex;gap:10px;padding:16px;border-top:1px solid var(--border);}
.chat-input{flex:1;padding:11px 16px;border-radius:14px;border:1.5px solid var(--border);background:var(--warm);font-family:'DM Sans',sans-serif;font-size:14px;color:var(--dark);}
.chat-input:focus{outline:none;border-color:var(--terra);}
.chat-send{padding:11px 20px;border-radius:14px;border:none;background:var(--terra);color:#fff;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;}
.chat-send:hover{background:var(--terra-d);}

/* ── AI INSIGHTS ── */
.insight-card{border-radius:18px;padding:22px;margin-bottom:14px;border:1px solid transparent;position:relative;overflow:hidden;}
.insight-card.positive{background:linear-gradient(135deg,rgba(107,174,117,.1),rgba(107,174,117,.05));border-color:rgba(107,174,117,.25);}
.insight-card.warning{background:linear-gradient(135deg,rgba(232,168,56,.1),rgba(232,168,56,.05));border-color:rgba(232,168,56,.25);}
.insight-card.tip{background:linear-gradient(135deg,rgba(91,164,207,.1),rgba(91,164,207,.05));border-color:rgba(91,164,207,.25);}
.insight-type{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;}
.insight-card.positive .insight-type{color:#4A9E5A;}
.insight-card.warning .insight-type{color:#C07A10;}
.insight-card.tip .insight-type{color:#2A7AAF;}
.insight-text{font-size:14px;color:var(--dark);line-height:1.6;}
.ai-loading{display:flex;align-items:center;gap:10px;padding:24px;color:var(--light);font-size:14px;}
.dot-pulse{display:flex;gap:5px;}
.dot-pulse span{width:7px;height:7px;border-radius:50%;background:var(--terra);animation:pulse 1.2s ease infinite;}
.dot-pulse span:nth-child(2){animation-delay:.2s;}
.dot-pulse span:nth-child(3){animation-delay:.4s;}
@keyframes pulse{0%,80%,100%{transform:scale(.8);opacity:.5;}40%{transform:scale(1.1);opacity:1;}}

/* ── REMINDERS ── */
.toggle-row{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--border);}
.toggle-row:last-child{border-bottom:none;}
.toggle-label{font-size:14px;color:var(--dark);}
.toggle-sub{font-size:11px;color:var(--light);margin-top:2px;}
.toggle{position:relative;width:44px;height:24px;flex-shrink:0;}
.toggle input{opacity:0;width:0;height:0;position:absolute;}
.toggle-slider{position:absolute;inset:0;background:rgba(61,125,107,.15);border-radius:24px;cursor:pointer;transition:.3s;}
.toggle-slider:before{content:'';position:absolute;width:18px;height:18px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.3s;box-shadow:0 1px 4px rgba(0,0,0,.2);}
.toggle input:checked+.toggle-slider{background:var(--terra);}
.toggle input:checked+.toggle-slider:before{transform:translateX(20px);}
.time-input{padding:8px 12px;border-radius:10px;border:1.5px solid var(--border);background:var(--warm);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--dark);}
.time-input:focus{outline:none;border-color:var(--terra);}

/* ── REPORTS ── */
.report-header{background:linear-gradient(135deg,var(--terra),var(--terra-d));border-radius:20px;padding:28px;color:#fff;margin-bottom:20px;}
.report-title{font-family:'Fraunces',serif;font-size:26px;font-weight:400;margin-bottom:4px;}
.report-sub{font-size:13px;opacity:.8;}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:20px;}
.stat-card{background:var(--card);border-radius:14px;padding:16px;box-shadow:var(--sh);border:1px solid var(--border);text-align:center;}
.stat-val{font-family:'Fraunces',serif;font-size:32px;font-weight:400;color:var(--terra);line-height:1;}
.stat-label{font-size:11px;color:var(--light);margin-top:4px;}
.report-bar-row{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
.report-bar-label{font-size:13px;color:var(--mid);width:80px;flex-shrink:0;}
.report-bar-bg{flex:1;height:10px;background:rgba(61,125,107,.1);border-radius:10px;overflow:hidden;}
.report-bar-fill{height:100%;border-radius:10px;transition:width .6s ease;}
.report-pct{font-size:12px;font-weight:600;color:var(--mid);width:36px;text-align:right;}

/* ── COACH CLIENTS ── */
.client-list-card{background:var(--card);border-radius:18px;padding:20px 22px;box-shadow:var(--sh);border:1px solid var(--border);cursor:pointer;transition:all .25s;animation:fadeUp .5s ease both;display:flex;align-items:center;gap:16px;margin-bottom:12px;}
.client-list-card:hover{transform:translateX(4px);box-shadow:var(--sh-lg);border-color:rgba(61,125,107,.28);}
.client-list-card.sel{border-color:var(--terra);background:rgba(61,125,107,.03);}
.cl-avatar{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--terra),var(--plum-l));display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#fff;flex-shrink:0;}
.cl-name{font-size:15px;font-weight:600;color:var(--dark);}
.cl-goal{font-size:12px;color:var(--light);margin-top:2px;}
.cl-stats{margin-left:auto;text-align:right;flex-shrink:0;}
.cl-streak{font-size:13px;font-weight:600;color:var(--terra);}
.cl-pct{font-size:11px;color:var(--light);}

/* ── NOTES ── */
.note-item{border-left:3px solid var(--sage-l);padding:10px 14px;margin-bottom:10px;background:rgba(107,158,126,.05);border-radius:0 10px 10px 0;}
.note-text{font-size:14px;color:var(--dark);line-height:1.5;}
.note-date{font-size:11px;color:var(--light);margin-top:4px;}

/* ── JOURNAL ── */
.journal-wrap{display:flex;flex-direction:column;gap:18px;}
.journal-section{background:var(--card);border-radius:20px;padding:24px;box-shadow:var(--sh);border:1px solid var(--border);animation:fadeUp .5s ease both;}
.journal-section-header{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
.journal-section-icon{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.journal-section-title{font-size:15px;font-weight:600;color:var(--dark);}
.journal-section-sub{font-size:11px;color:var(--light);margin-top:1px;}
.journal-textarea{width:100%;padding:14px 16px;border-radius:14px;border:1.5px solid var(--border);background:var(--warm);font-family:'DM Sans',sans-serif;font-size:14px;color:var(--dark);resize:vertical;line-height:1.6;transition:border-color .2s;}
.journal-textarea:focus{outline:none;border-color:var(--terra);}
.journal-textarea.sm{min-height:60px;}
.journal-textarea.md{min-height:90px;}
.journal-textarea.lg{min-height:120px;}
.food-period{margin-bottom:14px;}
.food-period:last-child{margin-bottom:0;}
.food-period-label{font-size:12px;font-weight:600;color:var(--mid);margin-bottom:6px;display:flex;align-items:center;gap:6px;}
.food-period-label span{font-size:14px;}
.water-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}
.water-check{width:36px;height:36px;border-radius:50%;border:2px solid rgba(91,164,207,.3);background:transparent;font-size:16px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;}
.water-check.checked{background:rgba(91,164,207,.15);border-color:#5BA4CF;}
.water-label{font-size:11px;color:var(--light);margin-top:6px;}
.gratitude-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;}
.gratitude-num{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--terra),var(--terra-l));color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:8px;}
.intention-banner{background:linear-gradient(135deg,rgba(61,125,107,.1),rgba(122,158,126,.08));border:1px solid rgba(122,158,126,.25);border-radius:20px;padding:22px 24px;margin-bottom:18px;}
.intention-prompt{font-family:'Fraunces',serif;font-size:17px;font-style:italic;color:var(--mid);margin-bottom:12px;}
.med-row{display:flex;gap:10px;align-items:flex-start;}
.saved-badge{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--sage);font-weight:600;padding:4px 10px;background:rgba(122,158,126,.1);border-radius:20px;margin-top:8px;opacity:0;transition:opacity .4s;}
.saved-badge.show{opacity:1;}
.journal-date-nav{display:flex;align-items:center;gap:12px;margin-bottom:24px;}
.date-nav-btn{width:34px;height:34px;border-radius:10px;border:1.5px solid var(--border);background:var(--card);color:var(--mid);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.date-nav-btn:hover{border-color:var(--terra);color:var(--terra);}
.date-nav-label{font-family:'Fraunces',serif;font-size:18px;font-weight:400;color:var(--dark);flex:1;text-align:center;}

/* ── UTILS ── */
.back-btn{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--light);cursor:pointer;background:none;border:none;font-family:'DM Sans',sans-serif;margin-bottom:22px;padding:0;}
.back-btn:hover{color:var(--terra);}
.divider{height:1px;background:var(--border);margin:18px 0;}
.empty{font-size:13px;color:var(--light);font-style:italic;padding:12px 0;}
.pill{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;}
.pill-green{background:rgba(107,174,117,.15);color:#4A9E5A;}
.pill-orange{background:rgba(232,168,56,.15);color:#C07A10;}
.pill-red{background:rgba(232,90,74,.15);color:#B03020;}

/* ── ACCESS CONTROL ── */
.access-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--cream);position:relative;z-index:1;}
.access-card{background:var(--card);border-radius:28px;padding:48px 40px;max-width:480px;width:100%;box-shadow:var(--sh-lg);border:1px solid var(--border);text-align:center;animation:fadeUp .6s ease;}
.access-icon{font-size:52px;margin-bottom:18px;display:block;}
.access-title{font-family:'Fraunces',serif;font-size:30px;font-weight:300;color:var(--dark);margin-bottom:8px;}
.access-sub{font-size:14px;color:var(--light);margin-bottom:32px;line-height:1.7;}
.plan-cards{display:flex;flex-direction:column;gap:14px;margin-bottom:24px;text-align:left;}
.plan-card{border-radius:16px;padding:20px;border:2px solid var(--border);background:var(--warm);cursor:pointer;transition:all .2s;}
.plan-card:hover{border-color:var(--terra);}
.plan-card.highlight{border-color:var(--terra);background:rgba(61,125,107,.04);}
.plan-card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.plan-name{font-size:15px;font-weight:600;color:var(--dark);}
.plan-price{font-family:'Fraunces',serif;font-size:20px;font-weight:400;color:var(--terra);}
.plan-desc{font-size:13px;color:var(--mid);margin-bottom:10px;line-height:1.55;}
.plan-features{list-style:none;display:flex;flex-direction:column;gap:4px;}
.plan-features li{font-size:12px;color:var(--mid);display:flex;align-items:center;gap:6px;}
.plan-features li::before{content:'✓';color:var(--sage);font-weight:700;font-size:11px;}
.plan-features li.excluded{color:var(--light);}
.plan-features li.excluded::before{content:'✕';color:var(--light);}
.plan-badge{font-size:10px;font-weight:600;background:var(--terra);color:#fff;padding:3px 10px;border-radius:20px;margin-left:8px;}
.grace-banner{background:linear-gradient(135deg,rgba(232,168,56,.12),rgba(232,168,56,.06));border:1px solid rgba(232,168,56,.3);border-radius:14px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:flex-start;gap:12px;text-align:left;}
.grace-banner-icon{font-size:20px;flex-shrink:0;}
.grace-banner-text{font-size:13px;color:var(--mid);line-height:1.6;}
.grace-banner-text strong{color:var(--dark);}
.msg-limit-bar{background:rgba(61,125,107,.08);border-radius:10px;padding:10px 14px;margin-top:8px;display:flex;align-items:center;justify-content:space-between;}
.msg-limit-label{font-size:12px;color:var(--mid);}
.msg-limit-dots{display:flex;gap:4px;}
.msg-dot{width:10px;height:10px;border-radius:50%;background:rgba(61,125,107,.2);}
.msg-dot.used{background:var(--terra);}
/* Access badge in coach */
.access-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;}
/* Access toggle in coach dashboard */
.access-control-row{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--border);}
.access-control-row:last-child{border-bottom:none;}
.access-select{padding:7px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--warm);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--dark);cursor:pointer;}
.access-select:focus{outline:none;border-color:var(--terra);}

/* ── VIEW ONLY & DOWNLOAD ── */
.view-only-banner{background:linear-gradient(135deg,rgba(160,137,124,.1),rgba(160,137,124,.05));border:1px solid rgba(160,137,124,.25);border-radius:14px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px;flex-wrap:wrap;}
.view-only-left{display:flex;align-items:center;gap:10px;}
.view-only-icon{font-size:18px;}
.view-only-text{font-size:13px;color:var(--mid);line-height:1.5;}
.view-only-text strong{color:var(--dark);}
.btn-download{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;border:1.5px solid var(--terra);background:transparent;color:var(--terra);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap;}
.btn-download:hover{background:var(--terra);color:#fff;}
.view-only-overlay{position:relative;}
.view-only-overlay::after{content:'👁️ View only';position:absolute;top:10px;right:10px;background:rgba(160,137,124,.15);color:var(--mid);font-size:10px;font-weight:600;padding:3px 10px;border-radius:20px;letter-spacing:.06em;pointer-events:none;}
/* ── MESSAGE CHAR COUNTER ── */
.chat-input-wrap{position:relative;flex:1;}
.char-counter{position:absolute;bottom:8px;right:12px;font-size:10px;font-weight:500;color:var(--light);pointer-events:none;transition:color .2s;}
.char-counter.warning{color:#E8A838;}
.char-counter.danger{color:#E87D5B;}
.chat-pinned{background:rgba(61,125,107,.07);border-bottom:1px solid var(--border);padding:8px 16px;display:flex;align-items:center;gap:8px;font-size:11px;color:var(--mid);}
.chat-pinned-icon{font-size:13px;flex-shrink:0;}
/* Download modal */
.download-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:500;display:flex;align-items:center;justify-content:center;padding:24px;}
.download-modal{background:var(--card);border-radius:24px;padding:36px;max-width:420px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,.2);animation:fadeUp .4s ease;}
.download-modal h3{font-family:'Fraunces',serif;font-size:24px;font-weight:300;margin-bottom:8px;}
.download-modal p{font-size:13px;color:var(--light);margin-bottom:24px;line-height:1.6;}
.download-options{display:flex;flex-direction:column;gap:10px;margin-bottom:24px;}
.download-option{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;border:1.5px solid var(--border);background:var(--warm);cursor:pointer;transition:all .2s;}
.download-option:hover{border-color:var(--terra);background:rgba(61,125,107,.04);}
.download-option-icon{font-size:22px;}
.download-option-name{font-size:14px;font-weight:600;color:var(--dark);}
.download-option-desc{font-size:11px;color:var(--light);margin-top:1px;}
.download-close{width:100%;padding:11px;border-radius:12px;border:1.5px solid var(--border);background:transparent;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--mid);cursor:pointer;}
.download-close:hover{border-color:var(--terra);color:var(--terra);}

/* ── PRIVACY CONTROLS ── */
.privacy-section{margin-bottom:20px;}
.privacy-master{background:linear-gradient(135deg,rgba(61,125,107,.08),rgba(61,125,107,.04));border:1.5px solid rgba(61,125,107,.25);border-radius:16px;padding:20px 22px;margin-bottom:16px;}
.privacy-master-top{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.privacy-master-icon{font-size:24px;flex-shrink:0;}
.privacy-master-title{font-size:15px;font-weight:600;color:var(--dark);}
.privacy-master-sub{font-size:12px;color:var(--mid);margin-top:3px;line-height:1.5;}
.privacy-master-off{background:linear-gradient(135deg,rgba(232,168,56,.1),rgba(232,168,56,.05));border-color:rgba(232,168,56,.4);}
.privacy-granular{background:var(--warm);border-radius:14px;border:1px solid var(--border);overflow:hidden;margin-bottom:16px;}
.privacy-granular-header{padding:12px 18px;background:rgba(0,0,0,.02);border-bottom:1px solid var(--border);font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--light);}
.privacy-row{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid var(--border);gap:12px;}
.privacy-row:last-child{border-bottom:none;}
.privacy-row-left{display:flex;align-items:center;gap:10px;}
.privacy-row-icon{font-size:16px;width:24px;text-align:center;}
.privacy-row-title{font-size:13px;font-weight:500;color:var(--dark);}
.privacy-row-sub{font-size:11px;color:var(--light);margin-top:1px;}
.privacy-row.disabled{opacity:.45;pointer-events:none;}
.privacy-notice{background:var(--lavender-bg,rgba(240,234,248,.5));border-radius:12px;padding:14px 16px;display:flex;align-items:flex-start;gap:10px;}
.privacy-notice-icon{font-size:16px;flex-shrink:0;margin-top:1px;}
.privacy-notice-text{font-size:12px;color:var(--mid);line-height:1.65;}
.privacy-notice-text strong{color:var(--dark);}
/* Coach locked view */
.coach-locked{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;text-align:center;background:var(--warm);border-radius:16px;border:1.5px dashed var(--border);}
.coach-locked-icon{font-size:40px;margin-bottom:14px;opacity:.5;}
.coach-locked-title{font-size:16px;font-weight:600;color:var(--mid);margin-bottom:6px;}
.coach-locked-sub{font-size:13px;color:var(--light);line-height:1.6;max-width:320px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const today = new Date();
const todayKey = today.toISOString().split("T")[0];
const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getWeekDays(n=7) {
  return Array.from({length:n},(_,i)=>{
    const d=new Date(today); d.setDate(today.getDate()-n+1+i);
    return {key:d.toISOString().split("T")[0], label:dayNames[d.getDay()]};
  });
}

function getCompletion(dayData) {
  if(!dayData) return 0;
  const total=HABITS.reduce((s,h)=>s+Math.min(1,(dayData[h.id]||0)/h.target),0);
  return Math.round((total/HABITS.length)*100);
}

function getStreak(history) {
  let streak=0;
  for(let d=0;d<60;d++){
    const date=new Date(today); date.setDate(today.getDate()-d);
    const key=date.toISOString().split("T")[0];
    const dd=history[key];
    if(!dd) break;
    const ok=HABITS.filter(h=>(dd[h.id]||0)>=h.target*0.6).length;
    if(ok>=3) streak++; else break;
  }
  return streak;
}

function getMonthAvg(history, habitId) {
  const vals=[]; const h=HABITS.find(x=>x.id===habitId);
  for(let d=0;d<30;d++){
    const date=new Date(today); date.setDate(today.getDate()-d);
    const key=date.toISOString().split("T")[0];
    if(history[key]?.[habitId]!==undefined) vals.push(history[key][habitId]);
  }
  if(!vals.length) return 0;
  return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10;
}

// ─── AI INSIGHTS ─────────────────────────────────────────────────────────────

async function fetchInsights(clientName, history, goals) {
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

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Toggle({checked, onChange}) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/>
      <span className="toggle-slider"/>
    </label>
  );
}

function HabitCard({habit, value, onChange, idx, readOnly=false}) {
  const pct = Math.min(100, Math.round((value/habit.target)*100));
  return (
    <div className="habit-card" style={{animationDelay:`${idx*0.07}s`}}>
      <div className="habit-header">
        <span className="habit-icon">{habit.icon}</span>
        <div>
          <div className="habit-name">{habit.label}</div>
          <div className="habit-target">Goal: {habit.target} {habit.unit}</div>
        </div>
        {pct>=100 && <span style={{marginLeft:"auto",fontSize:16}}>✅</span>}
      </div>
      {habit.id==="mood" ? (
        <div className="mood-row">
          {MOODS.map((m,mi)=>(
            <button key={mi} className={`mood-btn${value===mi+1?" sel":""}`} onClick={()=>onChange(mi+1)}>{m}</button>
          ))}
        </div>
      ):(
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div className="habit-stepper">
            <button className="step-btn" onClick={()=>onChange(Math.max(0,value-1))} disabled={readOnly} style={{opacity:readOnly?.5:1}}>−</button>
            <span className="step-val">{value}</span>
            <button className="step-btn" onClick={()=>onChange(Math.min(habit.target*2,value+1))} disabled={readOnly} style={{opacity:readOnly?.5:1}}>+</button>
          </div>
          <span className="habit-unit">{habit.unit}</span>
        </div>
      )}
      <div className="progress-bar">
        <div className="progress-fill" style={{width:`${pct}%`,background:habit.color}}/>
      </div>
    </div>
  );
}

// ─── ONBOARDING ──────────────────────────────────────────────────────────────

function Onboarding({onComplete}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name:"", email:"", phone:"",
    goal:"", motivation:"",
    habits:["sleep","water","exercise","nutrition","mood"],
    remEmail:true, remSMS:false,
    morningTime:"08:00"
  });
  const steps = ["Your Info","Your Goals","Habits","Reminders","All Set!"];
  const upd = patch => setForm(f=>({...f,...patch}));
  const toggleHabit = id => upd({habits: form.habits.includes(id)?form.habits.filter(h=>h!==id):[...form.habits,id]});

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative",zIndex:1}}>
      <div className="ob-step">
        <div className="ob-progress">
          {steps.map((_,i)=><div key={i} className={`ob-dot${i<=step?" done":""}`}/>)}
        </div>
        <div className="section-label">Step {step+1} of {steps.length}</div>

        {step===0 && <>
          <div className="ob-title">Welcome to Serenity 🌿</div>
          <div className="ob-sub">Let's get you set up. Tell us a little about yourself so your coach can support you best.</div>
          <div className="field-group"><div className="field-label">Full Name</div><input className="text-input" placeholder="Your name" value={form.name} onChange={e=>upd({name:e.target.value})}/></div>
          <div className="field-group"><div className="field-label">Email</div><input className="text-input" type="email" placeholder="your@email.com" value={form.email} onChange={e=>upd({email:e.target.value})}/></div>
          <div className="field-group"><div className="field-label">Phone (optional)</div><input className="text-input" type="tel" placeholder="555-0100" value={form.phone} onChange={e=>upd({phone:e.target.value})}/></div>
        </>}

        {step===1 && <>
          <div className="ob-title">What's your goal? 🎯</div>
          <div className="ob-sub">Your coach will use this to tailor your habit plan and check-ins to you.</div>
          <div className="field-group"><div className="field-label">Primary Goal</div><input className="text-input" placeholder="e.g. Lose weight, sleep better, reduce stress…" value={form.goal} onChange={e=>upd({goal:e.target.value})}/></div>
          <div className="field-group"><div className="field-label">What motivates you?</div><textarea className="textarea" placeholder="e.g. I want to have more energy for my kids…" value={form.motivation} onChange={e=>upd({motivation:e.target.value})}/></div>
        </>}

        {step===2 && <>
          <div className="ob-title">Choose your habits 🏆</div>
          <div className="ob-sub">Select the habits you want to track daily. You can always add more later.</div>
          <div className="checkbox-group">
            {HABITS.map(h=>(
              <button key={h.id} className={`checkbox-tag${form.habits.includes(h.id)?" sel":""}`} onClick={()=>toggleHabit(h.id)}>
                {h.icon} {h.label}
              </button>
            ))}
            <button className={`checkbox-tag${form.habits.includes("custom")?" sel":""}`} onClick={()=>toggleHabit("custom")}>⭐ Custom Habits</button>
          </div>
        </>}

        {step===3 && <>
          <div className="ob-title">Set up reminders 🔔</div>
          <div className="ob-sub">We'll send you gentle nudges to log your habits. You control when and how.</div>
          <div className="toggle-row">
            <div><div className="toggle-label">Email reminders</div><div className="toggle-sub">Daily check-in emails</div></div>
            <Toggle checked={form.remEmail} onChange={v=>upd({remEmail:v})}/>
          </div>
          <div className="toggle-row">
            <div><div className="toggle-label">SMS reminders</div><div className="toggle-sub">Text message nudges</div></div>
            <Toggle checked={form.remSMS} onChange={v=>upd({remSMS:v})}/>
          </div>
          <div className="toggle-row">
            <div><div className="toggle-label">Morning reminder time</div></div>
            <input className="time-input" type="time" value={form.morningTime} onChange={e=>upd({morningTime:e.target.value})}/>
          </div>
        </>}

        {step===4 && <>
          <div style={{textAlign:"center",padding:"12px 0"}}>
            <div style={{fontSize:64,marginBottom:16}}>🌿</div>
            <div className="ob-title" style={{textAlign:"center"}}>You're all set, {form.name||"friend"}!</div>
            <div className="ob-sub" style={{textAlign:"center"}}>Your coach has been notified and will reach out soon. Your habit journey starts today.</div>
          </div>
        </>}

        <div className="ob-actions">
          {step>0 && step<4 && <button className="btn-back" onClick={()=>setStep(s=>s-1)}>← Back</button>}
          {step<4 && <button className="btn-next" onClick={()=>setStep(s=>s+1)} disabled={step===0&&!form.name}>
            {step===3?"Finish Setup →":"Continue →"}
          </button>}
          {step===4 && <button className="btn-next" onClick={()=>onComplete(form)}>Start Tracking →</button>}
        </div>
      </div>
    </div>
  );
}



// ─── ACCESS CONTROL HELPERS ───────────────────────────────────────────────────

function getDaysRemaining(dateStr) {
  if (!dateStr) return 0;
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getAccessInfo(client) {
  const level = ACCESS_LEVELS[client.accessLevel] || ACCESS_LEVELS.expired;
  const daysLeft = client.accessLevel === 'grace'
    ? getDaysRemaining(client.graceEndDate)
    : client.accessLevel === 'active'
    ? getDaysRemaining(client.programEndDate)
    : null;
  return { ...level, daysLeft };
}

// ─── EXPIRED / SUBSCRIPTION SCREEN ───────────────────────────────────────────

function AccessExpiredScreen({ client, onSubscribe }) {
  const [selected, setSelected] = useState(null);
  return (
    <div className="access-screen">
      <div className="access-card">
        <span className="access-icon">🌿</span>
        <div className="access-title">Your program has ended</div>
        <p className="access-sub">
          Thank you for your wellness journey with Serenity of Body and Mind.
          Keep your momentum going — subscribe to continue using the app.
        </p>
        <div className="plan-cards">
          {SUBSCRIPTION_PLANS.map(plan => (
            <div
              key={plan.id}
              className={`plan-card${plan.highlight ? " highlight" : ""}${selected === plan.id ? " highlight" : ""}`}
              onClick={() => setSelected(plan.id)}
            >
              <div className="plan-card-top">
                <div>
                  <span className="plan-name">{plan.name}</span>
                  {plan.highlight && <span className="plan-badge">Recommended</span>}
                </div>
                <span className="plan-price">{plan.price}</span>
              </div>
              <p className="plan-desc">{plan.description}</p>
              <ul className="plan-features">
                {plan.features.map((f,i) => <li key={i}>{f}</li>)}
                {plan.excludes.map((f,i) => <li key={i} className="excluded">{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <button
          className="btn-primary"
          disabled={!selected}
          onClick={() => onSubscribe(selected)}
          style={{fontSize:13,padding:"13px 0"}}
        >
          {selected
            ? `Continue with ${SUBSCRIPTION_PLANS.find(p=>p.id===selected)?.name} →`
            : "Select a plan to continue"}
        </button>
        <p style={{fontSize:11,color:"var(--light)",marginTop:12}}>
          Payments handled securely. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

// ─── GRACE PERIOD BANNER ──────────────────────────────────────────────────────

function GraceBanner({ daysLeft }) {
  return (
    <div className="grace-banner">
      <span className="grace-banner-icon">⏳</span>
      <div className="grace-banner-text">
        <strong>Grace period — {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining.</strong>
        {" "}Your coaching program has ended but you still have full access.
        Subscribe before your grace period ends to keep your data and continue tracking.
      </div>
    </div>
  );
}

// ─── MESSAGING LIMIT INDICATOR ────────────────────────────────────────────────

function MessageLimitBar({ used, limit }) {
  if (limit === null) return null; // unlimited (active clients)
  if (limit === 0) return (
    <div className="msg-limit-bar">
      <span className="msg-limit-label">💬 Messaging not included in your current plan</span>
      <span style={{fontSize:11,color:"var(--terra)",fontWeight:600,cursor:"pointer"}}>Upgrade →</span>
    </div>
  );
  return (
    <div className="msg-limit-bar">
      <span className="msg-limit-label">💬 {used} of {limit} messages used this week</span>
      <div className="msg-limit-dots">
        {Array.from({length: limit}, (_,i) => (
          <div key={i} className={`msg-dot${i < used ? " used" : ""}`}/>
        ))}
      </div>
    </div>
  );
}


// ─── DATA EXPORT ─────────────────────────────────────────────────────────────

function generateClientReport(client, history, journalData) {
  const lines = [];
  const today = new Date();
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  lines.push("SERENITY OF BODY AND MIND");
  lines.push("Wellness Journey Report");
  lines.push("Generated: " + today.toLocaleDateString());
  lines.push("Client: " + client.name);
  lines.push("Program: " + (client.program || "—"));
  lines.push("Goal: " + (client.goal || "—"));
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
  lines.push("serenityofbodyandmind.com · (503) 354-7298");

  return lines.join("\n");
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── DOWNLOAD MODAL ───────────────────────────────────────────────────────────

function DownloadModal({ client, history, journalData, onClose }) {
  const [downloading, setDownloading] = useState(false);

  function handleDownload(type) {
    setDownloading(true);
    setTimeout(() => {
      if (type === "full") {
        const report = generateClientReport(client, history, journalData);
        downloadTextFile(`serenity-wellness-report-${client.name.replace(/\s/g,"-").toLowerCase()}.txt`, report);
      } else if (type === "journal") {
        const entries = Object.entries(journalData).sort(([a],[b])=>b.localeCompare(a));
        const lines = ["SERENITY OF BODY AND MIND — Journal Export", `Client: ${client.name}`, ""];
        entries.forEach(([date, entry]) => {
          lines.push(`
${date}`);
          lines.push("─".repeat(30));
          if (entry.intention) lines.push(`Intention: ${entry.intention}`);
          if (entry.reflection) lines.push(`Reflection: ${entry.reflection}`);
          if (entry.gratitude?.some(g=>g)) {
            lines.push("Gratitude:");
            entry.gratitude.filter(g=>g).forEach((g,i) => lines.push(`  ${i+1}. ${g}`));
          }
        });
        downloadTextFile(`serenity-journal-${client.name.replace(/\s/g,"-").toLowerCase()}.txt`, lines.join("
"));
      } else if (type === "habits") {
        const lines = ["SERENITY OF BODY AND MIND — Habit History", `Client: ${client.name}`, "", "Date,Sleep (hrs),Water (glasses),Exercise (min),Nutrition (meals),Mood (/5)"];
        Object.entries(history).sort(([a],[b])=>a.localeCompare(b)).forEach(([date, d]) => {
          lines.push(`${date},${d.sleep||0},${d.water||0},${d.exercise||0},${d.nutrition||0},${d.mood||0}`);
        });
        downloadTextFile(`serenity-habits-${client.name.replace(/\s/g,"-").toLowerCase()}.csv`, lines.join("
"));
      }
      setDownloading(false);
      onClose();
    }, 600);
  }

  return (
    <div className="download-modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="download-modal">
        <h3>Download Your Data 📥</h3>
        <p>Your wellness data belongs to you. Choose what you'd like to download — you can come back and do this anytime.</p>
        <div className="download-options">
          <div className="download-option" onClick={()=>handleDownload("full")}>
            <span className="download-option-icon">📋</span>
            <div>
              <div className="download-option-name">Full Wellness Report</div>
              <div className="download-option-desc">Everything — habits, journal, food diary, gratitude, and reflections</div>
            </div>
          </div>
          <div className="download-option" onClick={()=>handleDownload("journal")}>
            <span className="download-option-icon">📓</span>
            <div>
              <div className="download-option-name">Journal & Reflections Only</div>
              <div className="download-option-desc">All daily intentions, reflections, and gratitude entries</div>
            </div>
          </div>
          <div className="download-option" onClick={()=>handleDownload("habits")}>
            <span className="download-option-icon">📊</span>
            <div>
              <div className="download-option-name">Habit Data (CSV)</div>
              <div className="download-option-desc">Spreadsheet-ready habit log — import into Excel or Google Sheets</div>
            </div>
          </div>
        </div>
        {downloading && <p style={{textAlign:"center",fontSize:13,color:"var(--terra)",marginBottom:14}}>Preparing your download…</p>}
        <button className="download-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ─── VIEW ONLY BANNER ─────────────────────────────────────────────────────────

function ViewOnlyBanner({ onDownload }) {
  return (
    <div className="view-only-banner">
      <div className="view-only-left">
        <span className="view-only-icon">👁️</span>
        <div className="view-only-text">
          <strong>View-only mode.</strong> Your wellness history is preserved and always accessible.
          To track new habits or message your coach, reactivate your subscription.
        </div>
      </div>
      <div style={{display:"flex",gap:8,flexShrink:0}}>
        <button className="btn-download" onClick={onDownload}>📥 Download data</button>
        <button className="btn-secondary" style={{fontSize:12,padding:"9px 16px"}}>Reactivate</button>
      </div>
    </div>
  );
}


// ─── PRIVACY SETTINGS COMPONENT ──────────────────────────────────────────────

function PrivacySettings({ privacy, onChange }) {
  const master = privacy.coachAccessEnabled;

  function toggle(field) {
    onChange({ ...privacy, [field]: !privacy[field] });
  }

  const granularItems = [
    { key: "shareHabits",      icon: "📊", title: "Habit tracking & streaks",       sub: "Daily logs, progress history, completion %" },
    { key: "shareJournal",     icon: "📓", title: "Journal & reflections",           sub: "Daily intentions, end-of-day reflections" },
    { key: "shareFoodDiary",   icon: "🥗", title: "Food diary",                     sub: "Morning, afternoon, and evening meal logs" },
    { key: "shareMedications", icon: "💊", title: "Medications & supplements",       sub: "Daily medication logs" },
    { key: "shareMood",        icon: "☀️", title: "Mood ratings",                   sub: "Daily mood check-ins" },
  ];

  return (
    <div className="privacy-section">

      {/* Master toggle */}
      <div className={`privacy-master${!master ? " privacy-master-off" : ""}`}>
        <div className="privacy-master-top">
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span className="privacy-master-icon">{master ? "🔓" : "🔒"}</span>
            <div>
              <div className="privacy-master-title">
                {master ? "Coach can view your data" : "Coach visibility is off"}
              </div>
              <div className="privacy-master-sub">
                {master
                  ? "Your coach can see the data types you've enabled below."
                  : "Your coach cannot see any of your data. You can still use the app normally."}
              </div>
            </div>
          </div>
          <Toggle checked={master} onChange={() => toggle("coachAccessEnabled")} />
        </div>
      </div>

      {/* Granular controls */}
      <div className="privacy-granular">
        <div className="privacy-granular-header">What your coach can see</div>
        {granularItems.map(item => (
          <div key={item.key} className={`privacy-row${!master ? " disabled" : ""}`}>
            <div className="privacy-row-left">
              <span className="privacy-row-icon">{item.icon}</span>
              <div>
                <div className="privacy-row-title">{item.title}</div>
                <div className="privacy-row-sub">{item.sub}</div>
              </div>
            </div>
            <Toggle
              checked={master && privacy[item.key]}
              onChange={() => master && toggle(item.key)}
            />
          </div>
        ))}
      </div>

      {/* Note about messaging */}
      <div className="privacy-notice">
        <span className="privacy-notice-icon">💬</span>
        <div className="privacy-notice-text">
          <strong>Messaging is not affected by these settings.</strong> Your coach can always
          see messages you send them, regardless of your privacy settings. To stop messaging,
          switch to an App Only subscription.
        </div>
      </div>

      {/* Note about active programs */}
      <div className="privacy-notice" style={{marginTop:10}}>
        <span className="privacy-notice-icon">ℹ️</span>
        <div className="privacy-notice-text">
          Turning off coach visibility during an active coaching program may limit
          the effectiveness of your sessions. You can change these settings at any time.
        </div>
      </div>
    </div>
  );
}

// ─── JOURNAL COMPONENT ───────────────────────────────────────────────────────

function emptyJournalDay() {
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

function JournalView({ journalData, onUpdate, readOnly = false }) {
  const [offset, setOffset] = useState(0);
  const [saved, setSaved] = useState(false);

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - offset);
  const dateKey = targetDate.toISOString().split("T")[0];
  const dayLabel = offset === 0 ? "Today" : offset === 1 ? "Yesterday" : `${dayNames[targetDate.getDay()]}, ${monthNames[targetDate.getMonth()]} ${targetDate.getDate()}`;

  const entry = journalData[dateKey] || emptyJournalDay();

  function upd(patch) {
    if (readOnly) return;
    onUpdate(dateKey, { ...entry, ...patch });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }
  function updNested(section, field, val) {
    upd({ [section]: { ...entry[section], [field]: val } });
  }
  function updGratitude(i, val) {
    const g = [...(entry.gratitude || ["","",""])];
    g[i] = val;
    upd({ gratitude: g });
  }

  const totalWater = (entry.morning?.water||0) + (entry.afternoon?.water||0) + (entry.evening?.water||0);

  return (
    <div>
      <div className="journal-date-nav">
        <button className="date-nav-btn" onClick={() => setOffset(o => o + 1)}>&#8592;</button>
        <div className="date-nav-label">{dayLabel}</div>
        <button className="date-nav-btn" onClick={() => setOffset(o => Math.max(0, o - 1))} disabled={offset === 0} style={{ opacity: offset === 0 ? 0.3 : 1 }}>&#8594;</button>
      </div>

      <div className="journal-wrap">
        <div className="intention-banner">
          <div className="intention-prompt">"Set your intention for the day…"</div>
          <textarea className="journal-textarea sm" placeholder={readOnly ? (entry.intention || "No intention set.") : "What do you want to focus on today?"}
            value={entry.intention} readOnly={readOnly} onChange={e => upd({ intention: e.target.value })} />
        </div>

        <div className="journal-section" style={{ animationDelay: "0.05s" }}>
          <div className="journal-section-header">
            <div className="journal-section-icon" style={{ background: "rgba(107,174,117,.12)" }}>🥗</div>
            <div>
              <div className="journal-section-title">Food & Water Diary</div>
              <div className="journal-section-sub">{totalWater * 8} oz of water logged today · Goal: 80 oz</div>
            </div>
          </div>
          {[
            { key: "morning",   label: "Morning",   icon: "🌅", sub: "Wake-up to noon",  waterGoal: 5 },
            { key: "afternoon", label: "Afternoon", icon: "☀️", sub: "Noon to 5pm",       waterGoal: 2 },
            { key: "evening",   label: "Evening",   icon: "🌙", sub: "5pm to bedtime",    waterGoal: 3 },
          ].map(period => (
            <div className="food-period" key={period.key}>
              <div className="food-period-label">
                <span>{period.icon}</span> {period.label}
                <span style={{ color: "var(--light)", fontWeight: 400 }}>· {period.sub}</span>
              </div>
              <textarea className="journal-textarea sm"
                placeholder={readOnly ? (entry[period.key]?.food || "Nothing logged.") : "What did you eat or drink?"}
                value={entry[period.key]?.food || ""} readOnly={readOnly}
                onChange={e => updNested(period.key, "food", e.target.value)} />
              <div className="water-row">
                {Array.from({ length: period.waterGoal }, (_, i) => (
                  <button key={i} className={`water-check${(entry[period.key]?.water || 0) > i ? " checked" : ""}`}
                    onClick={() => !readOnly && updNested(period.key, "water", (entry[period.key]?.water || 0) > i ? i : i + 1)}
                    title={`${(i + 1) * 8} oz`}>💧</button>
                ))}
                <span className="water-label" style={{ alignSelf: "center", marginLeft: 4 }}>{(entry[period.key]?.water || 0) * 8} oz</span>
              </div>
            </div>
          ))}
        </div>

        <div className="journal-section" style={{ animationDelay: "0.1s" }}>
          <div className="journal-section-header">
            <div className="journal-section-icon" style={{ background: "rgba(212,168,83,.12)" }}>🙏</div>
            <div><div className="journal-section-title">Gratitude</div><div className="journal-section-sub">3 things you are grateful for today</div></div>
          </div>
          {[0, 1, 2].map(i => (
            <div className="gratitude-row" key={i}>
              <div className="gratitude-num">{i + 1}</div>
              <textarea className="journal-textarea sm" style={{ flex: 1, minHeight: 44 }}
                placeholder={readOnly ? (entry.gratitude?.[i] || "—") : "I am grateful for…"}
                value={entry.gratitude?.[i] || ""} readOnly={readOnly}
                onChange={e => updGratitude(i, e.target.value)} />
            </div>
          ))}
        </div>

        <div className="journal-section" style={{ animationDelay: "0.14s" }}>
          <div className="journal-section-header">
            <div className="journal-section-icon" style={{ background: "rgba(107,76,110,.1)" }}>💊</div>
            <div><div className="journal-section-title">Medications & Supplements</div><div className="journal-section-sub">Record what you took today</div></div>
          </div>
          <textarea className="journal-textarea sm"
            placeholder={readOnly ? (entry.medications || "None logged.") : "e.g. Vitamin D, Magnesium, Metformin…"}
            value={entry.medications || ""} readOnly={readOnly} onChange={e => upd({ medications: e.target.value })} />
        </div>

        <div className="journal-section" style={{ animationDelay: "0.17s" }}>
          <div className="journal-section-header">
            <div className="journal-section-icon" style={{ background: "rgba(232,168,56,.12)" }}>🏃</div>
            <div><div className="journal-section-title">Exercise & Stretching</div><div className="journal-section-sub">What movement did you do today?</div></div>
          </div>
          <textarea className="journal-textarea sm"
            placeholder={readOnly ? (entry.exercise || "None logged.") : "e.g. 30 min walk, 10 min yoga, stretching…"}
            value={entry.exercise || ""} readOnly={readOnly} onChange={e => upd({ exercise: e.target.value })} />
        </div>

        <div className="journal-section" style={{ animationDelay: "0.19s" }}>
          <div className="journal-section-header">
            <div className="journal-section-icon" style={{ background: "rgba(91,164,207,.1)" }}>🧘</div>
            <div><div className="journal-section-title">Meditation & Self-Care</div><div className="journal-section-sub">Relaxation or mindfulness practices</div></div>
          </div>
          <textarea className="journal-textarea sm"
            placeholder={readOnly ? (entry.meditation || "None logged.") : "e.g. 10 min meditation, breathing exercises, bath…"}
            value={entry.meditation || ""} readOnly={readOnly} onChange={e => upd({ meditation: e.target.value })} />
        </div>

        <div className="journal-section" style={{ animationDelay: "0.21s" }}>
          <div className="journal-section-header">
            <div className="journal-section-icon" style={{ background: "rgba(61,125,107,.1)" }}>✍️</div>
            <div><div className="journal-section-title">Reflect on Your Day</div><div className="journal-section-sub">How did today go? What do you want to remember?</div></div>
          </div>
          <textarea className="journal-textarea lg"
            placeholder={readOnly ? (entry.reflection || "No reflection written.") : "Write freely — how are you feeling? What went well? What would you do differently?"}
            value={entry.reflection || ""} readOnly={readOnly} onChange={e => upd({ reflection: e.target.value })} />
          {!readOnly && <div className={`saved-badge${saved ? " show" : ""}`}>✓ Saved</div>}
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT APP ──────────────────────────────────────────────────────────────

function ClientApp({clientId, onLogout}) {
  const [clientData, setClientData] = useState(() => CLIENTS.find(c=>c.id===clientId)||CLIENTS[0]);
  const client = clientData;
  const access = getAccessInfo(client);
  const [tab, setTab] = useState("today");
  const [history, setHistory] = useState(()=>genHistory(clientId));
  const [todayLog, setTodayLog] = useState(history[todayKey]||{});
  const [customHabits, setCustomHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [journalData, setJournalData] = useState({});
  const [messages, setMessages] = useState(initMessages[clientId]||[]);
  const [msgInput, setMsgInput] = useState("");
  const [msgChars, setMsgChars] = useState(0);
  const [goals] = useState(initGoals[clientId]);
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [privacy, setPrivacy] = useState(() => initPrivacy[clientId] || initPrivacy["c1"]);
  const chatRef = useRef(null);
  const MSG_LIMIT = 500;
  const isViewOnly = access.viewOnly;

  const weekDays = getWeekDays(7);
  const streak = getStreak(history);
  const allHabits = [...HABITS, ...customHabits];

  // Access gate: show subscription screen if expired
  if (!access.appAccess) {
    return <AccessExpiredScreen client={client} onSubscribe={(plan) => {
      setClientData(c => ({...c, accessLevel: plan, subscriptionPlan: plan}));
    }}/>;
  }

  const msgLimit = access.msgLimit;
  const msgsUsed = client.messagesThisWeek || 0;
  const canSendMsg = access.canMessage && (msgLimit === null || msgsUsed < msgLimit);

  function logHabit(id, val) {
    const newLog = {...todayLog,[id]:val};
    setTodayLog(newLog);
    setHistory(h=>({...h,[todayKey]:{...(h[todayKey]||{}),[id]:val}}));
  }

  function sendMsg() {
    if(!msgInput.trim() || !canSendMsg || msgInput.length > MSG_LIMIT) return;
    setMessages(m=>[...m,{from:"client",text:msgInput.trim(),time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),date:"Today"}]);
    setClientData(c => ({...c, messagesThisWeek: (c.messagesThisWeek||0) + 1}));
    setMsgInput(""); setMsgChars(0);
    setTimeout(()=>{if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight;},50);
  }

  async function loadInsights() {
    setLoadingInsights(true); setTab("insights");
    try { const ins=await fetchInsights(client.name,history,goals); setInsights(ins); }
    catch { setInsights([{type:"tip",emoji:"💡",label:"Keep Going",text:"You're building great habits! Stay consistent and your coach will share personalized feedback soon."}]); }
    setLoadingInsights(false);
  }

  useEffect(()=>{if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight;},[messages]);

  const tabs = [
    {id:"today",label:"Today"},
    {id:"journal",label:"📓 Journal"},
    {id:"history",label:"History"},
    {id:"insights",label:"✨ Insights"},
    {id:"goals",label:"My Goals"},
    {id:"chat",label:"Messages"},
    {id:"custom",label:"My Habits"},
    {id:"privacy",label:"🔒 Privacy"},
  ];

  return (
    <>
      {showDownload && (
        <DownloadModal
          client={client}
          history={history}
          journalData={journalData}
          onClose={()=>setShowDownload(false)}
        />
      )}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo">serenity</div>
          <div className="nav-tabs" style={{display:"flex",gap:2,overflowX:"auto"}}>
            {tabs.map(t=>(
              <button key={t.id} className={`nav-tab${tab===t.id?" active":""}`}
                onClick={()=>{ if(t.id==="insights"&&!insights) loadInsights(); else setTab(t.id); }}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="nav-right">
            <span className="nav-badge">{isViewOnly ? "👁️ View Only" : "🌱 " + client.name.split(" ")[0]}</span>
            <button className="nav-logout" onClick={onLogout}>Sign out</button>
          </div>
        </div>
      </nav>
      <div className="main">
        {tab==="today" && <>
          <div className="greeting">
            <div className="greeting-date">{dayNames[today.getDay()]}, {monthNames[today.getMonth()]} {today.getDate()}</div>
            <div className="greeting-title">Good day, <em>{client.name.split(" ")[0]}</em> ✨</div>
          </div>
          {client.accessLevel === "grace" && <GraceBanner daysLeft={access.daysLeft} />}
          {isViewOnly && <ViewOnlyBanner onDownload={()=>setShowDownload(true)}/>}
          <div className="streak-banner">
            <div>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:400}}>🔥 Current Streak</div>
              <div style={{fontSize:13,opacity:.8,marginTop:2}}>You're on a roll — keep it up!</div>
            </div>
            <div className="streak-num">{streak} <span style={{fontSize:18}}>days</span></div>
          </div>
          <div className="habits-grid">
            {allHabits.map((h,i)=>(
              <HabitCard key={h.id} habit={h} value={todayLog[h.id]||0} onChange={isViewOnly ? ()=>{} : v=>logHabit(h.id,v)} idx={i} readOnly={isViewOnly}/>
            ))}
          </div>
        </>}

        {tab==="history" && <>
          <div className="section-title" style={{marginBottom:22}}>Your Progress</div>
          <div className="card" style={{marginBottom:18}}>
            <div className="section-label">7-Day Completion</div>
            <div className="history-grid7">
              {weekDays.map(({key,label})=>{
                const pct=getCompletion(history[key]);
                const bg=pct>=80?"#6BAE75":pct>=50?"#E8A838":pct>0?"#E87D5B":"rgba(61,125,107,.1)";
                return (
                  <div className="hday" key={key}>
                    <div className="hday-lbl">{label}</div>
                    <div className="hday-dot" style={{background:bg,color:pct>0?"#fff":"var(--light)"}}>{pct>0?`${pct}%`:"—"}</div>
                  </div>
                );
              })}
            </div>
            <div className="section-label" style={{marginTop:8}}>Per Habit</div>
            {HABITS.map(h=>(
              <div className="week-row" key={h.id}>
                <div className="week-habit-label">{h.icon} {h.label}</div>
                <div className="week-dots">
                  {weekDays.map(({key,label})=>{
                    const val=history[key]?.[h.id]||0;
                    const pct=Math.min(100,Math.round((val/h.target)*100));
                    return <div key={key} className="wdot" style={{background:pct>=80?h.color:pct>=40?h.color+"99":"rgba(61,125,107,.08)",color:pct>=40?"#fff":"var(--light)"}}>{label[0]}</div>;
                  })}
                </div>
              </div>
            ))}
          </div>
          {/* Monthly report preview */}
          <div className="card">
            <div className="section-label">30-Day Averages</div>
            {HABITS.map(h=>{
              const avg=getMonthAvg(history,h.id);
              const pct=Math.min(100,Math.round((avg/h.target)*100));
              return (
                <div className="report-bar-row" key={h.id}>
                  <div className="report-bar-label">{h.icon} {h.label}</div>
                  <div className="report-bar-bg"><div className="report-bar-fill" style={{width:`${pct}%`,background:h.color}}/></div>
                  <div className="report-pct">{pct}%</div>
                </div>
              );
            })}
          </div>
        </>}

        {tab==="insights" && <>
          <div className="section-title" style={{marginBottom:6}}>AI Coaching Insights ✨</div>
          <div style={{fontSize:13,color:"var(--light)",marginBottom:22}}>Personalized analysis of your habits this week</div>
          {loadingInsights && (
            <div className="ai-loading">
              <div className="dot-pulse"><span/><span/><span/></div>
              Analyzing your habits…
            </div>
          )}
          {insights && insights.map((ins,i)=>(
            <div key={i} className={`insight-card ${ins.type}`} style={{animationDelay:`${i*0.1}s`}}>
              <div className="insight-type">{ins.emoji} {ins.label}</div>
              <div className="insight-text">{ins.text}</div>
            </div>
          ))}
          {!loadingInsights && insights && (
            <button className="btn-sm-outline" style={{marginTop:8}} onClick={loadInsights}>Refresh insights ↺</button>
          )}
        </>}

        {tab==="goals" && <>
          <div className="section-title" style={{marginBottom:22}}>My Goals</div>
          <div className="goal-card">
            <div style={{fontSize:13,color:"var(--sage)",fontWeight:600,marginBottom:12}}>🎯 Current Goal</div>
            <div style={{fontSize:17,color:"var(--dark)",fontWeight:500,lineHeight:1.5}}>{goals.primaryGoal}</div>
          </div>
          <div className="card">
            <div className="section-label">Daily Targets</div>
            {HABITS.map(h=>(
              <div className="goal-item" key={h.id}>
                <span className="goal-icon">{h.icon}</span>
                <div>
                  <div className="goal-label">{h.label}</div>
                  <div className="goal-val">{h.target} {h.unit} per day</div>
                </div>
                <span style={{marginLeft:"auto"}}>{getCompletion({[h.id]:todayLog[h.id]||0})>=60?<span className="pill pill-green">On track</span>:<span className="pill pill-orange">Keep going</span>}</span>
              </div>
            ))}
          </div>
        </>}

        {tab==="chat" && <>
          <div className="section-title" style={{marginBottom:18}}>Messages with your Coach</div>
          <div className="card" style={{padding:0}}>
            <div className="chat-wrap">
              <div className="chat-pinned">
                <span className="chat-pinned-icon">📌</span>
                <span>This chat is for quick questions &amp; check-ins. For in-depth conversations, book a session. (500 character limit)</span>
              </div>
              <div className="chat-messages" ref={chatRef}>
                {messages.map((m,i)=>(
                  <div key={i} className={`msg ${m.from}`}>
                    <div className="msg-bubble">{m.text}</div>
                    <div className="msg-meta">{m.from==="coach"?"Coach · ":""}{m.time} · {m.date}</div>
                  </div>
                ))}
              </div>
              <div style={{padding:"0 16px 8px"}}>
                <MessageLimitBar used={msgsUsed} limit={msgLimit}/>
                {access.canMessage && <p style={{fontSize:10,color:"var(--light)",marginTop:6,textAlign:"center"}}>Mon–Fri, 8am–6pm PST · Responses within 24 hours</p>}
              </div>
              <div className="chat-input-row">
                <div className="chat-input-wrap">
                  <input className="chat-input"
                    style={{opacity:canSendMsg?1:0.5,paddingRight:50}}
                    placeholder={canSendMsg?"Message your coach…":msgLimit===0?"Messaging not included in your plan":"Weekly message limit reached"}
                    value={msgInput}
                    disabled={!canSendMsg}
                    maxLength={MSG_LIMIT}
                    onChange={e=>{setMsgInput(e.target.value);setMsgChars(e.target.value.length);}}
                    onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
                  {canSendMsg && msgChars>0 && (
                    <span className={`char-counter${msgChars>450?" warning":""}${msgChars>=500?" danger":""}`}>
                      {MSG_LIMIT-msgChars}
                    </span>
                  )}
                </div>
                <button className="chat-send" onClick={sendMsg} disabled={!canSendMsg||msgChars>MSG_LIMIT} style={{opacity:canSendMsg&&msgChars<=MSG_LIMIT?1:0.5}}>Send</button>
              </div>
            </div>
          </div>
        </>}

        {tab==="custom" && <>
          <div className="section-title" style={{marginBottom:18}}>Custom Habits</div>
          <div className="card" style={{marginBottom:18}}>
            <div className="section-label">Add a New Habit</div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <input className="text-input" placeholder="Habit name (e.g. Journaling)" value={newHabitName} onChange={e=>setNewHabitName(e.target.value)} style={{flex:1}}/>
              <button className="btn-sm" onClick={()=>{
                if(!newHabitName.trim()) return;
                setCustomHabits(h=>[...h,{id:`c_${Date.now()}`,label:newHabitName.trim(),icon:"⭐",unit:"times",target:1,color:"#D4A853"}]);
                setNewHabitName("");
              }}>+ Add</button>
            </div>
          </div>
          {customHabits.length===0 && <div className="empty">No custom habits yet. Add one above!</div>}
          {customHabits.map(h=>(
            <div key={h.id} className="card-sm" style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              <span style={{fontSize:20}}>{h.icon}</span>
              <span style={{fontSize:14,fontWeight:500}}>{h.label}</span>
              <span style={{fontSize:12,color:"var(--light)",marginLeft:"auto"}}>{h.unit} / day</span>
            </div>
          ))}
        </>}

        {tab==="privacy" && <>
          <div className="greeting" style={{marginBottom:20}}>
            <div className="greeting-title">Privacy <em>Settings</em> 🔒</div>
            <div style={{fontSize:13,color:"var(--light)",marginTop:4}}>Control what your coach can see — you're always in charge of your data</div>
          </div>
          <PrivacySettings privacy={privacy} onChange={setPrivacy} />
        </>}

        {tab==="journal" && <>
          <div className="greeting" style={{marginBottom:20}}>
            <div className="greeting-title">Daily <em>Journal</em> 📓</div>
            <div style={{fontSize:13,color:"var(--light)",marginTop:4}}>Your private self-care log — food, water, gratitude & reflection</div>
          </div>
          <JournalView
            journalData={journalData}
            onUpdate={(dateKey, entry) => setJournalData(d => ({...d, [dateKey]: entry}))}
            readOnly={false}
          />
        </>}
      </div>
    </>
  );
}

// ─── COACH APP ───────────────────────────────────────────────────────────────

function CoachApp({onLogout}) {
  const [tab, setTab] = useState("clients");
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientTab, setClientTab] = useState("overview");
  const [allClientData] = useState(()=>Object.fromEntries(CLIENTS.map(c=>[c.id,genHistory(c.id)])));
  const [coachNotes, setCoachNotes] = useState(()=>Object.fromEntries(CLIENTS.map(c=>[c.id,[]])));
  const [clientAccessLevels, setClientAccessLevels] = useState(
    ()=>Object.fromEntries(CLIENTS.map(c=>[c.id, {
      accessLevel: c.accessLevel,
      messagesThisWeek: c.messagesThisWeek || 0,
      programEndDate: c.programEndDate,
      graceEndDate: c.graceEndDate,
      subscriptionPlan: c.subscriptionPlan,
    }]))
  );
  const [clientJournals, setClientJournals] = useState(()=>Object.fromEntries(CLIENTS.map(c=>[c.id,{}])));
  const [clientPrivacy, setClientPrivacy] = useState(()=>({...initPrivacy}));
  const [messages, setMessages] = useState(initMessages);
  const [msgInput, setMsgInput] = useState("");
  const [goals, setGoals] = useState(initGoals);
  const [reminders, setReminders] = useState(initReminders);
  const [editGoals, setEditGoals] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [insights, setInsights] = useState({});
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [reportPeriod, setReportPeriod] = useState("weekly");
  const [showCoachDownload, setShowCoachDownload] = useState(false);
  const chatRef = useRef(null);

  const weekDays = getWeekDays(7);
  const sc = CLIENTS.find(c=>c.id===selectedClient);
  const scData = selectedClient ? allClientData[selectedClient] : null;
  const scStreak = scData ? getStreak(scData) : 0;
  const scNotes = selectedClient ? (coachNotes[selectedClient]||[]) : [];
  const scGoals = selectedClient ? goals[selectedClient] : null;
  const scRem = selectedClient ? reminders[selectedClient] : null;
  const scMessages = selectedClient ? (messages[selectedClient]||[]) : [];

  function sendMsg() {
    if(!msgInput.trim()||!selectedClient) return;
    const msg={from:"coach",text:msgInput.trim(),time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),date:"Today"};
    setMessages(m=>({...m,[selectedClient]:[...(m[selectedClient]||[]),msg]}));
    setMsgInput("");
    setTimeout(()=>{if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight;},50);
  }

  function addNote() {
    if(!newNote.trim()||!selectedClient) return;
    const note={text:newNote.trim(),date:new Date().toLocaleDateString()};
    setCoachNotes(n=>({...n,[selectedClient]:[note,...(n[selectedClient]||[])]}));
    setNewNote("");
  }

  async function loadClientInsights(cid) {
    setLoadingInsights(true);
    const client=CLIENTS.find(c=>c.id===cid);
    try {
      const ins=await fetchInsights(client.name,allClientData[cid],goals[cid]);
      setInsights(i=>({...i,[cid]:ins}));
    } catch {
      setInsights(i=>({...i,[cid]:[{type:"tip",emoji:"💡",label:"Keep Going",text:"This client is building consistent habits. Check in to provide personalized encouragement."}]}));
    }
    setLoadingInsights(false);
  }

  function updateGoal(field, val) {
    setGoals(g=>({...g,[selectedClient]:{...g[selectedClient],[field]:val}}));
  }
  function updateReminder(field, val) {
    setReminders(r=>({...r,[selectedClient]:{...r[selectedClient],[field]:val}}));
  }

  useEffect(()=>{if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight;},[scMessages]);

  const coachTabs=[{id:"clients",label:"Clients"},{id:"reports",label:"Reports"}];
  const clientTabs=[{id:"overview",label:"Overview"},{id:"access",label:"🔑 Access"},{id:"journal",label:"📓 Journal"},{id:"insights",label:"✨ Insights"},{id:"goals",label:"Goals"},{id:"reminders",label:"Reminders"},{id:"chat",label:"Messages"},{id:"notes",label:"Notes"}];

  // Reports tab – aggregate
  function getAggregate() {
    const days = reportPeriod==="weekly"?7:30;
    return CLIENTS.map(c=>{
      const h=allClientData[c.id]||{};
      const streak=getStreak(h);
      const completions=[];
      for(let d=0;d<days;d++){
        const date=new Date(today); date.setDate(today.getDate()-d);
        const key=date.toISOString().split("T")[0];
        completions.push(getCompletion(h[key]));
      }
      const avg=Math.round(completions.reduce((a,b)=>a+b,0)/completions.length);
      return {...c,streak,avg};
    });
  }

  // Privacy helpers for selected client
  const scPrivacy = selectedClient ? (clientPrivacy[selectedClient] || initPrivacy[selectedClient] || {coachAccessEnabled:true,shareHabits:true,shareJournal:true,shareFoodDiary:true,shareMedications:true,shareMood:true}) : {};
  const scLocked = !scPrivacy.coachAccessEnabled;

  // Reusable locked placeholder
  const LockedSection = ({label}) => (
    <div className="coach-locked">
      <div className="coach-locked-icon">🔒</div>
      <div className="coach-locked-title">{label} — hidden by client</div>
      <div className="coach-locked-sub">
        {sc?.name?.split(" ")[0]} has turned off coach visibility for this section.
        This is their right — you can still support them in sessions.
      </div>
    </div>
  );

  if(selectedClient && sc) return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo">serenity</div>
          <div className="nav-tabs">{clientTabs.map(t=><button key={t.id} className={`nav-tab${clientTab===t.id?" active":""}`} onClick={()=>setClientTab(t.id)}>{t.label}</button>)}</div>
          <div className="nav-right">
            <span className="nav-badge">🌿 Coach</span>
            <button className="nav-logout" onClick={onLogout}>Sign out</button>
          </div>
        </div>
      </nav>
      <div className="main">
        <button className="back-btn" onClick={()=>setSelectedClient(null)}>← All Clients</button>

        {/* Client header */}
        <div className="card" style={{display:"flex",alignItems:"center",gap:20,marginBottom:20}}>
          <div className="cl-avatar" style={{width:60,height:60,fontSize:20}}>{sc.avatar}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:400}}>{sc.name}</div>
            <div style={{fontSize:13,color:"var(--light)",marginTop:3}}>{sc.goal}</div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:5,flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:"var(--sage)",fontWeight:600}}>Member since {sc.joined} · 🔥 {scStreak} day streak</span>
              {scLocked && <span style={{fontSize:11,background:"rgba(232,168,56,.15)",color:"#C07A10",padding:"2px 8px",borderRadius:20,fontWeight:600}}>🔒 Visibility off</span>}
              {!scLocked && !scPrivacy.shareHabits && <span style={{fontSize:11,background:"rgba(91,164,207,.12)",color:"#2A7AAF",padding:"2px 8px",borderRadius:20}}>📊 Habits hidden</span>}
              {!scLocked && !scPrivacy.shareJournal && <span style={{fontSize:11,background:"rgba(91,164,207,.12)",color:"#2A7AAF",padding:"2px 8px",borderRadius:20}}>📓 Journal hidden</span>}
            </div>
          </div>
          <div style={{textAlign:"right",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
            <div>
              <div style={{fontSize:24,fontWeight:700,color:"var(--terra)"}}>{getCompletion(scData?.[todayKey])}%</div>
              <div style={{fontSize:11,color:"var(--light)"}}>today</div>
            </div>
            <button className="btn-download" onClick={()=>setShowCoachDownload(true)}>📥 Export data</button>
          </div>
        </div>
        {showCoachDownload && (
          <DownloadModal
            client={sc}
            history={scData||{}}
            journalData={clientJournals[selectedClient]||{}}
            onClose={()=>setShowCoachDownload(false)}
          />
        )}

        {clientTab==="overview" && <>
          <div className="card" style={{marginBottom:18}}>
            <div className="section-label">7-Day Habit Progress</div>
            {HABITS.map(h=>(
              <div className="week-row" key={h.id}>
                <div className="week-habit-label">{h.icon} {h.label}</div>
                <div className="week-dots">
                  {weekDays.map(({key,label})=>{
                    const val=scData?.[key]?.[h.id]||0;
                    const pct=Math.min(100,Math.round((val/h.target)*100));
                    return <div key={key} className="wdot" style={{background:pct>=80?h.color:pct>=40?h.color+"99":"rgba(61,125,107,.08)",color:pct>=40?"#fff":"var(--light)",fontSize:9}}>{pct}%</div>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </>}

        {clientTab==="insights" && <>
          <div className="section-label" style={{marginBottom:18}}>AI-Powered Coaching Insights for {sc.name}</div>
          {loadingInsights && <div className="ai-loading"><div className="dot-pulse"><span/><span/><span/></div>Analyzing…</div>}
          {insights[selectedClient] && insights[selectedClient].map((ins,i)=>(
            <div key={i} className={`insight-card ${ins.type}`}>
              <div className="insight-type">{ins.emoji} {ins.label}</div>
              <div className="insight-text">{ins.text}</div>
            </div>
          ))}
          {!insights[selectedClient] && !loadingInsights && (
            <button className="btn-sm" onClick={()=>loadClientInsights(selectedClient)}>Generate Insights ✨</button>
          )}
          {insights[selectedClient] && !loadingInsights && (
            <button className="btn-sm-outline" style={{marginTop:8}} onClick={()=>loadClientInsights(selectedClient)}>Refresh ↺</button>
          )}
        </>}

        {clientTab==="goals" && <>
          <div className="card">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div className="section-label" style={{margin:0}}>Client Goals</div>
              <button className="btn-sm-outline" onClick={()=>setEditGoals(e=>!e)}>{editGoals?"Save":"Edit"}</button>
            </div>
            {editGoals ? <>
              {[{f:"primaryGoal",l:"Primary Goal"},{f:"weeklyCheckIn",l:"Weekly Check-In"},{f:"sleepTarget",l:"Sleep Target (hrs)"},{f:"waterTarget",l:"Water Target (glasses)"},{f:"exerciseTarget",l:"Exercise Target (min)"}].map(({f,l})=>(
                <div className="goal-edit-row" key={f}>
                  <div className="goal-edit-label">{l}</div>
                  <input className="goal-input-sm" value={scGoals?.[f]||""} onChange={e=>updateGoal(f,e.target.value)}/>
                </div>
              ))}
              <div className="goal-edit-row" style={{flexDirection:"column",alignItems:"flex-start",gap:6}}>
                <div className="goal-edit-label">Coach Notes</div>
                <textarea className="textarea" style={{width:"100%"}} value={scGoals?.notes||""} onChange={e=>updateGoal("notes",e.target.value)}/>
              </div>
            </> : <>
              {[{icon:"🎯",label:"Primary Goal",f:"primaryGoal"},{icon:"📅",label:"Check-In",f:"weeklyCheckIn"},{icon:"🌙",label:"Sleep Target",f:"sleepTarget",suf:"hrs"},{icon:"💧",label:"Water Target",f:"waterTarget",suf:"glasses"},{icon:"🏃",label:"Exercise Target",f:"exerciseTarget",suf:"min"}].map(({icon,label,f,suf})=>(
                <div className="goal-item" key={f}>
                  <span className="goal-icon">{icon}</span>
                  <div><div className="goal-label">{label}</div><div className="goal-val">{scGoals?.[f]||"—"}{suf?" "+suf:""}</div></div>
                </div>
              ))}
            </>}
          </div>
        </>}

        {clientTab==="reminders" && scRem && <>
          <div className="card">
            <div className="section-label">Reminder Settings for {sc.name}</div>
            <div className="toggle-row">
              <div><div className="toggle-label">Email Reminders</div><div className="toggle-sub">{sc.email}</div></div>
              <Toggle checked={scRem.email} onChange={v=>updateReminder("email",v)}/>
            </div>
            <div className="toggle-row">
              <div><div className="toggle-label">SMS Reminders</div><div className="toggle-sub">{sc.phone}</div></div>
              <Toggle checked={scRem.sms} onChange={v=>updateReminder("sms",v)}/>
            </div>
            <div className="toggle-row">
              <div><div className="toggle-label">Morning Reminder</div></div>
              <input className="time-input" type="time" value={scRem.morningTime} onChange={e=>updateReminder("morningTime",e.target.value)}/>
            </div>
            <div className="toggle-row">
              <div><div className="toggle-label">Evening Reminder</div></div>
              <input className="time-input" type="time" value={scRem.eveningTime} onChange={e=>updateReminder("eveningTime",e.target.value)}/>
            </div>
            <div style={{marginTop:18}}>
              <div className="section-label">Habits to Remind</div>
              <div className="checkbox-group" style={{marginTop:8}}>
                {HABITS.map(h=>(
                  <button key={h.id} className={`checkbox-tag${scRem.habits.includes(h.id)?" sel":""}`}
                    onClick={()=>updateReminder("habits",scRem.habits.includes(h.id)?scRem.habits.filter(x=>x!==h.id):[...scRem.habits,h.id])}>
                    {h.icon} {h.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>}

        {clientTab==="chat" && <>
          <div className="card" style={{padding:0}}>
            <div className="chat-wrap">
              <div className="chat-messages" ref={chatRef}>
                {scMessages.map((m,i)=>(
                  <div key={i} className={`msg ${m.from}`}>
                    <div className="msg-bubble">{m.text}</div>
                    <div className="msg-meta">{m.from==="client"?sc.name.split(" ")[0]+" · ":"Coach · "}{m.time} · {m.date}</div>
                  </div>
                ))}
              </div>
              <div className="chat-input-row">
                <input className="chat-input" placeholder={`Message ${sc.name.split(" ")[0]}…`} value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
                <button className="chat-send" onClick={sendMsg}>Send</button>
              </div>
            </div>
          </div>
        </>}

        {clientTab==="notes" && <>
          <div className="card">
            <div className="section-label">Private Coach Notes</div>
            <div style={{marginBottom:16}}>
              {scNotes.length===0 && <div className="empty">No notes yet.</div>}
              {scNotes.map((n,i)=>(
                <div key={i} className="note-item">
                  <div className="note-text">{n.text}</div>
                  <div className="note-date">{n.date}</div>
                </div>
              ))}
            </div>
            <textarea className="textarea" placeholder="Add a private note…" value={newNote} onChange={e=>setNewNote(e.target.value)}/>
            <button className="btn-sm" style={{marginTop:8}} onClick={addNote}>Save Note</button>
          </div>
        </>}

        {clientTab==="access" && (() => {
          const cAccess = clientAccessLevels[selectedClient] || {};
          const currentLevel = ACCESS_LEVELS[cAccess.accessLevel] || ACCESS_LEVELS.expired;
          const daysLeft = cAccess.accessLevel === "grace"
            ? getDaysRemaining(cAccess.graceEndDate)
            : cAccess.accessLevel === "active"
            ? getDaysRemaining(cAccess.programEndDate)
            : null;
          return (
            <div className="card">
              <div className="section-label">Access Management — {sc.name}</div>

              {/* Current status */}
              <div style={{background:"var(--warm)",border:"1px solid var(--border)",borderRadius:14,padding:"16px 18px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                <div>
                  <div style={{fontSize:12,color:"var(--light)",marginBottom:4}}>Current Access Level</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:18}}>{currentLevel.icon}</span>
                    <span style={{fontSize:15,fontWeight:600,color:"var(--dark)"}}>{currentLevel.label}</span>
                    {daysLeft !== null && <span style={{fontSize:12,color:"var(--light)"}}>· {daysLeft} days remaining</span>}
                  </div>
                </div>
                {cAccess.accessLevel === "app_msg" && (
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:11,color:"var(--light)",marginBottom:4}}>Messages this week</div>
                    <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                      {Array.from({length:5},(_,i)=>(
                        <div key={i} style={{width:10,height:10,borderRadius:"50%",background:i < (cAccess.messagesThisWeek||0) ? "var(--terra)" : "rgba(0,0,0,.1)"}}/>
                      ))}
                      <span style={{fontSize:11,color:"var(--mid)",marginLeft:4}}>{cAccess.messagesThisWeek||0}/5</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Change access level */}
              <div className="section-label" style={{marginBottom:12}}>Change Access</div>
              {Object.entries(ACCESS_LEVELS).map(([key, level]) => (
                <div key={key} className="access-control-row">
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:16}}>{level.icon}</span>
                    <div>
                      <div style={{fontSize:14,fontWeight:500,color:"var(--dark)"}}>{level.label}</div>
                      <div style={{fontSize:11,color:"var(--light)"}}>
                        {key==="active" && "Full app + unlimited messaging"}
                        {key==="grace" && "Full app + messaging (4-week post-program window)"}
                        {key==="app_only" && "App access only — no messaging ($12/mo)"}
                        {key==="app_msg" && "App + up to 5 messages/week ($25/mo)"}
                        {key==="view_only" && "View history only — no logging or messaging (free forever)"}
                        {key==="expired" && "No access — client sees upgrade screen"}
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn-sm"
                    style={{
                      background: cAccess.accessLevel === key ? "var(--sage)" : "var(--terra)",
                      cursor: cAccess.accessLevel === key ? "default" : "pointer",
                      opacity: cAccess.accessLevel === key ? 0.6 : 1,
                      minWidth: 80,
                    }}
                    disabled={cAccess.accessLevel === key}
                    onClick={() => setClientAccessLevels(a => ({...a, [selectedClient]: {...a[selectedClient], accessLevel: key}}))}
                  >
                    {cAccess.accessLevel === key ? "Current" : "Set"}
                  </button>
                </div>
              ))}

              {/* Reset weekly message count */}
              {cAccess.accessLevel === "app_msg" && (
                <div style={{marginTop:20,padding:"14px 16px",background:"rgba(61,125,107,.06)",borderRadius:12}}>
                  <div style={{fontSize:13,color:"var(--mid)",marginBottom:8}}>Weekly message count: <strong>{cAccess.messagesThisWeek||0} / 5 used</strong></div>
                  <button className="btn-sm-outline" onClick={() => setClientAccessLevels(a => ({...a,[selectedClient]:{...a[selectedClient],messagesThisWeek:0}}))}>
                    Reset count (new week)
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {clientTab==="journal" && <>
          <div style={{marginBottom:18}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:400,color:"var(--dark)",marginBottom:4}}>
              {sc.name.split(" ")[0]}'s Journal <span style={{fontSize:16}}>📓</span>
            </div>
            <div style={{fontSize:13,color:"var(--light)"}}>Read-only view — this is your client's private daily log</div>
          </div>
          {(scLocked || !scPrivacy.shareJournal)
            ? <LockedSection label="Journal & reflections" />
            : <JournalView
                journalData={clientJournals[selectedClient]||{}}
                onUpdate={()=>{}}
                readOnly={true}
              />
          }
        </>}
      </div>
    </>
  );

  // MAIN COACH DASHBOARD
  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo">serenity</div>
          <div className="nav-tabs">{coachTabs.map(t=><button key={t.id} className={`nav-tab${tab===t.id?" active":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}</div>
          <div className="nav-right">
            <span className="nav-badge">🌿 Coach</span>
            <button className="nav-logout" onClick={onLogout}>Sign out</button>
          </div>
        </div>
      </nav>
      <div className="main">
        {tab==="clients" && <>
          <div className="greeting">
            <div className="greeting-date">{dayNames[today.getDay()]}, {monthNames[today.getMonth()]} {today.getDate()}</div>
            <div className="greeting-title">Your <em>clients</em> 🌿</div>
          </div>
          {CLIENTS.map((c,i)=>{
            const h=allClientData[c.id]||{};
            const streak=getStreak(h);
            const todayPct=getCompletion(h[todayKey]);
            return (
              <div key={c.id} className={`client-list-card${selectedClient===c.id?" sel":""}`} style={{animationDelay:`${i*0.08}s`}} onClick={()=>setSelectedClient(c.id)}>
                <div className="cl-avatar">{c.avatar}</div>
                <div>
                  <div className="cl-name">{c.name}</div>
                  <div className="cl-goal">{c.goal}</div>
                  <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                    <span className={`pill ${todayPct>=70?"pill-green":todayPct>=40?"pill-orange":"pill-red"}`}>{todayPct}% today</span>
                    <span className="pill" style={{background:"rgba(61,125,107,.1)",color:"var(--terra)"}}>🔥 {streak} days</span>
                    {(()=>{ const lvl=ACCESS_LEVELS[c.accessLevel]||ACCESS_LEVELS.expired; return <span className="pill" style={{background:lvl.color+"22",color:lvl.color,border:"1px solid "+lvl.color+"44"}}>{lvl.icon} {lvl.label}</span>; })()}
                  </div>
                </div>
                <div className="cl-stats">
                  <div style={{fontSize:13,color:"var(--light)",marginBottom:6}}>This week</div>
                  <div style={{display:"flex",gap:4}}>
                    {HABITS.map(hab=>{
                      const val=h[todayKey]?.[hab.id]||0;
                      const pct=Math.min(100,Math.round((val/hab.target)*100));
                      return <div key={hab.id} title={hab.label} style={{width:8,height:32,borderRadius:4,background:"rgba(61,125,107,.1)",display:"flex",alignItems:"flex-end",overflow:"hidden"}}>
                        <div style={{width:"100%",height:`${pct}%`,background:hab.color,borderRadius:4,transition:"height .4s"}}/>
                      </div>;
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </>}

        {tab==="reports" && <>
          <div className="report-header">
            <div className="report-title">Practice Reports</div>
            <div className="report-sub">Overview of all client progress</div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:20}}>
            {["weekly","monthly"].map(p=>(
              <button key={p} className={`checkbox-tag${reportPeriod===p?" sel":""}`} onClick={()=>setReportPeriod(p)} style={{textTransform:"capitalize"}}>{p}</button>
            ))}
          </div>
          <div className="stat-grid">
            <div className="stat-card"><div className="stat-val">{CLIENTS.length}</div><div className="stat-label">Active Clients</div></div>
            <div className="stat-card"><div className="stat-val">{Math.round(getAggregate().reduce((a,c)=>a+c.avg,0)/CLIENTS.length)}%</div><div className="stat-label">Avg Completion</div></div>
            <div className="stat-card"><div className="stat-val">{Math.max(...getAggregate().map(c=>c.streak))}</div><div className="stat-label">Best Streak</div></div>
            <div className="stat-card"><div className="stat-val">{getAggregate().filter(c=>c.avg>=70).length}</div><div className="stat-label">On Track</div></div>
          </div>
          <div className="card">
            <div className="section-label">{reportPeriod==="weekly"?"7":"30"}-Day Completion by Client</div>
            {getAggregate().map(c=>(
              <div key={c.id} className="report-bar-row" style={{cursor:"pointer"}} onClick={()=>setSelectedClient(c.id)}>
                <div className="report-bar-label" style={{display:"flex",alignItems:"center",gap:8}}>
                  <div className="cl-avatar" style={{width:28,height:28,fontSize:10}}>{c.avatar}</div>
                  {c.name.split(" ")[0]}
                </div>
                <div className="report-bar-bg"><div className="report-bar-fill" style={{width:`${c.avg}%`,background:c.avg>=70?"#6BAE75":c.avg>=50?"#E8A838":"#E87D5B"}}/></div>
                <div className="report-pct">{c.avg}%</div>
              </div>
            ))}
          </div>
        </>}
      </div>
    </>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("login"); // login | onboarding | client | coach
  const [role, setRole] = useState(null);
  const [clientId, setClientId] = useState("");
  const [isNewClient, setIsNewClient] = useState(false);

  function handleLogin() {
    if(role==="coach") { setView("coach"); return; }
    if(role==="client") {
      if(isNewClient) { setView("onboarding"); return; }
      if(clientId) { setView("client"); return; }
    }
  }

  function handleOnboardingComplete(form) {
    // In a real app this would create an account
    setView("client");
    setClientId("c1"); // demo: assign first client slot
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {view==="login" && (
          <div className="login-wrap">
            <div className="login-card">
              <div className="login-logo">Serenity</div>
              <div className="login-tagline">of Body and Mind</div>
              <div className="section-label">I am a…</div>
              <div className="role-grid">
                <button className={`role-btn${role==="client"?" active":""}`} onClick={()=>setRole("client")}>
                  <span className="rb-icon">🌱</span><div className="rb-name">Client</div><div className="rb-desc">Track my habits</div>
                </button>
                <button className={`role-btn${role==="coach"?" active":""}`} onClick={()=>setRole("coach")}>
                  <span className="rb-icon">🌿</span><div className="rb-name">Coach</div><div className="rb-desc">Manage clients</div>
                </button>
              </div>

              {role==="client" && <>
                <div className="section-label">Account</div>
                <div className="role-grid" style={{marginBottom:16}}>
                  <button className={`role-btn${!isNewClient?" active":""}`} onClick={()=>setIsNewClient(false)}>
                    <span className="rb-icon">👋</span><div className="rb-name">Returning</div>
                  </button>
                  <button className={`role-btn${isNewClient?" active":""}`} onClick={()=>setIsNewClient(true)}>
                    <span className="rb-icon">✨</span><div className="rb-name">New Client</div>
                  </button>
                </div>
                {!isNewClient && (
                  <select className="select-field" value={clientId} onChange={e=>setClientId(e.target.value)}>
                    <option value="">Choose your profile…</option>
                    {CLIENTS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </>}

              <button className="btn-primary" disabled={!role||(role==="client"&&!isNewClient&&!clientId)} onClick={handleLogin}>
                {isNewClient&&role==="client"?"Start Onboarding →":"Enter →"}
              </button>
            </div>
          </div>
        )}

        {view==="onboarding" && <Onboarding onComplete={handleOnboardingComplete}/>}

        {view==="client" && (
          <ClientApp clientId={clientId||"c1"} onLogout={()=>{setView("login");setRole(null);setClientId("");}}/>
        )}

        {view==="coach" && (
          <CoachApp onLogout={()=>{setView("login");setRole(null);}}/>
        )}
      </div>
    </>
  );
}
