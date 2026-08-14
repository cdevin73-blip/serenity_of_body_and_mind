export const CSS = `
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
.nav-tabs{display:flex;gap:2px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;flex-shrink:1;min-width:0;}.nav-tabs::-webkit-scrollbar{display:none;}
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

/* ── ONBOARDING: AGREEMENT & QUIZ ── */
.legal-box{max-height:340px;overflow-y:auto;border:1.5px solid var(--border);border-radius:14px;padding:20px 22px;background:var(--warm);font-size:12.5px;line-height:1.7;color:var(--mid);margin-bottom:20px;}
.legal-box h4{font-size:13px;color:var(--dark);margin:16px 0 4px;font-weight:700;}
.legal-box h4:first-child{margin-top:0;}
.legal-box p{margin-bottom:8px;}
.legal-notice{background:rgba(232,168,56,.1);border:1px solid rgba(232,168,56,.3);border-radius:12px;padding:12px 16px;font-size:12.5px;color:#8a6a1f;line-height:1.6;margin-bottom:20px;}
.agree-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:20px;}
.agree-row input[type=checkbox]{margin-top:3px;width:16px;height:16px;accent-color:var(--terra);flex-shrink:0;cursor:pointer;}
.agree-row label{font-size:13px;color:var(--mid);line-height:1.5;cursor:pointer;}
.quiz-q{margin-bottom:24px;}
.quiz-q-text{font-size:15px;color:var(--dark);font-weight:500;margin-bottom:12px;line-height:1.5;}
.quiz-options{display:flex;flex-direction:column;gap:8px;}
.quiz-option{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:12px;border:1.5px solid var(--border);background:transparent;font-family:'DM Sans',sans-serif;font-size:13.5px;color:var(--mid);cursor:pointer;transition:all .2s;text-align:left;width:100%;}
.quiz-option:hover{border-color:var(--sage);}
.quiz-option.sel{border-color:var(--terra);background:rgba(61,125,107,.08);color:var(--terra);font-weight:600;}
.quiz-option-letter{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:rgba(61,125,107,.08);font-size:11px;font-weight:700;color:var(--terra);flex-shrink:0;}
.quiz-option.sel .quiz-option-letter{background:var(--terra);color:#fff;}
.quiz-progress-bar{height:6px;background:rgba(61,125,107,.1);border-radius:6px;margin-bottom:24px;overflow:hidden;}
.quiz-progress-fill{height:100%;background:linear-gradient(135deg,var(--terra),var(--terra-l));border-radius:6px;transition:width .3s ease;}

/* ── QUIZ RESULTS ── */
.quiz-results-header{text-align:center;margin-bottom:24px;}
.quiz-results-icon{font-size:40px;margin-bottom:10px;}
.quiz-results-style{font-family:'Fraunces',serif;font-size:26px;color:var(--dark);margin-bottom:8px;}
.quiz-results-summary{font-size:14px;color:var(--mid);line-height:1.6;margin-bottom:24px;text-align:center;}
.quiz-bar-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.quiz-bar-swatch{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
.quiz-bar-label{font-size:12.5px;color:var(--mid);width:120px;flex-shrink:0;}
.quiz-bar-track{flex:1;height:20px;background:rgba(61,125,107,.06);border-radius:10px;overflow:hidden;}
.quiz-bar-fill{height:100%;border-radius:10px;transition:width .5s ease;}
.quiz-bar-val{font-size:12px;color:var(--mid);width:36px;text-align:right;flex-shrink:0;font-weight:600;}
.quiz-tip-list{list-style:none;margin-top:8px;}
.quiz-tip-list li{font-size:13px;color:var(--mid);line-height:1.6;padding-left:18px;position:relative;margin-bottom:8px;}
.quiz-tip-list li::before{content:'✦';position:absolute;left:0;color:var(--terra);font-size:11px;}
.quiz-results-actions{display:flex;gap:12px;margin-top:24px;}
.quiz-summary-card{background:var(--card);border-radius:18px;padding:20px;box-shadow:var(--sh);border:1px solid var(--border);margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
.quiz-badge{font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600;color:#fff;}

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
.sleep-entry{display:flex;align-items:center;justify-content:space-between;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:14px 20px;margin-bottom:14px;box-shadow:var(--sh);flex-wrap:wrap;gap:10px;}
.sleep-entry-label{font-size:13px;font-weight:600;color:var(--mid);display:flex;align-items:center;gap:8px;}
.sleep-entry-input{display:flex;align-items:center;gap:8px;}
.sleep-entry-input input{width:60px;padding:8px 10px;border-radius:10px;border:1.5px solid var(--border);background:var(--warm);font-family:'DM Sans',sans-serif;font-size:14px;color:var(--dark);text-align:center;}
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

@media(max-width:600px){
  .nav-tab{padding:6px 10px;font-size:11px;}
  .nav-badge{display:none;}
  .nav-tabs{gap:1px;}
}`;
