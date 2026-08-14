import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase as supabaseClient } from "../../lib/supabaseClient";
import { DEFAULT_PRIVACY } from "../../lib/constants";
import { today, dayNames, monthNames, getWeekDays } from "../../lib/dates";
import { JOURNAL_SECTIONS, getJournalCompletion, getJournalStreak, getJournalSectionRate, getJournalNumericAvg } from "../../lib/journal";
import { getAccessInfo, countMessagesThisWeek } from "../../lib/access";
import { Toast, useToast } from "../../components/Toast";
import { MessageLimitBar } from "../../components/MessageLimitBar";
import { AccessExpiredScreen, GraceBanner, ViewOnlyBanner } from "../../components/AccessScreens";
import { PrivacySettings } from "../../components/PrivacySettings";
import { JournalView } from "../../components/JournalView";
import { DownloadModal } from "../../components/DownloadModal";
import { Quiz } from "../../components/Quiz/Quiz";
import { QUIZZES } from "../../lib/quizzes";

export function ClientApp() {
  const { profile: supabaseProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { tab = "journal", section = "goals" } = useParams();
  const setTab = (id) => navigate(`/client/${id}`);
  const setSection = (id) => navigate(`/client/settings/${id}`);
  const clientId = supabaseProfile.id;

  async function onLogout() {
    await logout();
    navigate("/auth");
  }

  const [clientData] = useState(() => ({
    id: supabaseProfile.id,
    name: supabaseProfile.full_name || supabaseProfile.email || "Client",
    avatar: (supabaseProfile.full_name || supabaseProfile.email || "C").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2),
    email: supabaseProfile.email,
    goal: supabaseProfile.goal || "Building healthy habits",
    program: supabaseProfile.program || null,
    programEndDate: supabaseProfile.program_end_date || null,
    accessLevel: supabaseProfile.access_level || "active",
    graceEndDate: supabaseProfile.grace_end_date || null,
    subscriptionPlan: supabaseProfile.subscription_plan || null,
    messagesThisWeek: supabaseProfile.messages_this_week || 0,
  }));
  const [subscribedLevel, setSubscribedLevel] = useState(null);
  const client = subscribedLevel ? { ...clientData, accessLevel: subscribedLevel, subscriptionPlan: subscribedLevel } : clientData;
  const access = getAccessInfo(client);
  const [customHabits, setCustomHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [journalData, setJournalData] = useState({});
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [msgInput, setMsgInput] = useState("");
  const [msgChars, setMsgChars] = useState(0);
  const [goals, setGoals] = useState({ primaryGoal:"", why:"", sleepTarget:8, waterTarget:8, movementTarget:30, weeklyCheckIn:"Every Monday" });
  const [savingGoals, setSavingGoals] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY);
  const [quizResults, setQuizResults] = useState({});
  const [activeQuiz, setActiveQuiz] = useState(null);
  const { toast, showToast, clearToast } = useToast();
  const chatRef = useRef(null);
  const journalSaveTimer = useRef(null);
  const MSG_LIMIT = 500;
  const isViewOnly = access.viewOnly || false;

  const weekDays = getWeekDays(7);
  const streak = getJournalStreak(journalData);

  const msgLimit = access.msgLimit;
  const msgsUsed = countMessagesThisWeek(messages, clientId);
  const canSendMsg = access.canMessage && (msgLimit === null || msgsUsed < msgLimit);

  async function sendMsg() {
    if(!msgInput.trim() || !canSendMsg || msgInput.length > MSG_LIMIT) return;
    const text = msgInput.trim();

    if (!supabaseClient || !clientId || clientId.length <= 10) return;

    const { data: coaches, error: coachLookupError } = await supabaseClient
      .from("profiles").select("id").eq("role","coach").limit(1);

    if (coachLookupError) {
      console.error("Coach lookup error:", coachLookupError);
      showToast("Couldn't reach your coach right now. Your message wasn't sent — try again in a moment.");
      return;
    }
    if (!coaches || coaches.length === 0) {
      showToast("No coach is set up to receive messages yet. Your message wasn't sent.");
      return;
    }

    setMsgInput(""); setMsgChars(0);

    const { error } = await supabaseClient.from("messages").insert({
      sender_id: clientId,
      receiver_id: coaches[0].id,
      message: text,
    });

    if (error) {
      console.error("Message send error:", error);
      showToast("Your message didn't send. It's still in the box below — try again.");
      setMsgInput(text); setMsgChars(text.length);
      return;
    }

    const { data: sent }     = await supabaseClient.from("messages").select("*").eq("sender_id", clientId).order("created_at",{ascending:true});
    const { data: received } = await supabaseClient.from("messages").select("*").eq("receiver_id", clientId).order("created_at",{ascending:true});
    const all = [...(sent||[]), ...(received||[])];
    all.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    setMessages(all.map(m => ({
      id: m.id, from: m.sender_id === clientId ? "client" : "coach",
      sender_id: m.sender_id, text: m.message, created_at: m.created_at,
      time: new Date(m.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
      date: new Date(m.created_at).toLocaleDateString([],{month:"short",day:"numeric"}),
    })));
  }

  async function saveGoals() {
    setSavingGoals(true);
    if (supabaseClient && clientId && clientId.length > 10) {
      const { error } = await supabaseClient.from("goals").upsert({
        user_id: clientId,
        primary_goal: goals.primaryGoal || "",
        why: goals.why || "",
        sleep_target: goals.sleepTarget,
        water_target: goals.waterTarget,
        movement_target: goals.movementTarget,
        weekly_check_in: goals.weeklyCheckIn,
      }, { onConflict: "user_id" });
      if (error) {
        console.error("Goals save error:", error);
        showToast("Your goals didn't save — please try again.");
      } else {
        showToast("Goals saved!", "success");
      }
    }
    setSavingGoals(false);
  }

  async function addCustomHabit() {
    if (!newHabitName.trim() || !supabaseClient || !clientId || clientId.length <= 10) return;
    const name = newHabitName.trim();
    setNewHabitName("");
    const { data, error } = await supabaseClient
      .from("custom_habits")
      .insert({ user_id: clientId, name, icon: "⭐", unit: "times", target: 1 })
      .select()
      .single();
    if (error) {
      console.error("Custom habit save error:", error);
      showToast("That habit didn't save — please try again.");
      return;
    }
    setCustomHabits(h => [...h, { id: data.id, label: data.name, icon: data.icon, unit: data.unit, target: data.target }]);
  }

  async function deleteCustomHabit(id) {
    setCustomHabits(h => h.filter(x => x.id !== id));
    if (supabaseClient && clientId && clientId.length > 10) {
      const { error } = await supabaseClient.from("custom_habits").delete().eq("id", id);
      if (error) {
        console.error("Custom habit delete error:", error);
        showToast("That habit didn't delete — please try again.");
      }
    }
  }

  useEffect(() => {
    if (!supabaseClient || !clientId || clientId.length <= 10) return;

    async function loadData() {
      const { data: journal } = await supabaseClient
        .from("journal_entries")
        .select("*")
        .eq("user_id", clientId);

      if (journal) {
        const j = {};
        journal.forEach(row => {
          j[row.entry_date] = {
            sleepHours:  parseFloat(row.sleep_hours) || 0,
            waterGlasses: parseInt(row.water_glasses) || 0,
            intention:  row.intention  || "",
            reflection: row.reflection || "",
            gratitude:  [row.gratitude_1||"", row.gratitude_2||"", row.gratitude_3||""],
            medications: row.medications || "",
            movementCardio:     row.movement_cardio     || "",
            movementWeights:    row.movement_weights    || "",
            movementStretching: row.movement_stretching || "",
            meditation: row.meditation || "",
            morning:    { food: row.morning_food||"" },
            afternoon:  { food: row.afternoon_food||"" },
            evening:    { food: row.evening_food||"" },
          };
        });
        setJournalData(j);
      }

      const { data: priv } = await supabaseClient
        .from("privacy_settings")
        .select("*")
        .eq("user_id", clientId)
        .maybeSingle();

      if (priv) {
        setPrivacy({
          coachAccessEnabled: priv.coach_access_enabled ?? true,
          shareHabits:        priv.share_habits        ?? true,
          shareJournal:       priv.share_journal       ?? true,
          shareFoodDiary:     priv.share_food_diary    ?? true,
          shareMedications:   priv.share_medications   ?? true,
        });
      }

      const { data: quizzes } = await supabaseClient
        .from("quiz_results")
        .select("quiz_type, primary_style, scores")
        .eq("user_id", clientId);

      if (quizzes) {
        const q = {};
        quizzes.forEach(row => { q[row.quiz_type] = { primaryStyle: row.primary_style, scores: row.scores }; });
        setQuizResults(q);
      }

      const { data: goalsRow } = await supabaseClient
        .from("goals")
        .select("*")
        .eq("user_id", clientId)
        .maybeSingle();

      if (goalsRow) {
        setGoals({
          primaryGoal:    goalsRow.primary_goal || "",
          why:             goalsRow.why || "",
          sleepTarget:     goalsRow.sleep_target ?? 8,
          waterTarget:     goalsRow.water_target ?? 8,
          movementTarget:  goalsRow.movement_target ?? 30,
          weeklyCheckIn:   goalsRow.weekly_check_in || "Every Monday",
        });
      }

      const { data: customRows } = await supabaseClient
        .from("custom_habits")
        .select("*")
        .eq("user_id", clientId)
        .order("created_at", { ascending: true });

      if (customRows) {
        setCustomHabits(customRows.map(row => ({
          id: row.id,
          label: row.name,
          icon: row.icon || "⭐",
          unit: row.unit || "times",
          target: row.target ?? 1,
        })));
      }
    }

    loadData();
  }, [clientId]);

  useEffect(() => {
    if (!supabaseClient || !clientId || clientId.length <= 10) {
      setMessagesLoading(false);
      return;
    }

    async function loadMessages() {
      const { data: sent } = await supabaseClient
        .from("messages").select("*")
        .eq("sender_id", clientId)
        .order("created_at", { ascending: true });

      const { data: received } = await supabaseClient
        .from("messages").select("*")
        .eq("receiver_id", clientId)
        .order("created_at", { ascending: true });

      const all = [...(sent||[]), ...(received||[])];
      all.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));

      setMessages(all.map(m => ({
        id:         m.id,
        from:       m.sender_id === clientId ? "client" : "coach",
        sender_id:  m.sender_id,
        text:       m.message,
        created_at: m.created_at,
        time:       new Date(m.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
        date:       new Date(m.created_at).toLocaleDateString([],{month:"short",day:"numeric"}),
      })));
      setMessagesLoading(false);
    }

    loadMessages();
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, [clientId]);

  useEffect(()=>{
    if(tab==="chat" && chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, tab]);

  // Access gate: show subscription screen if expired
  if (!access.appAccess) {
    return <AccessExpiredScreen client={client} onSubscribe={(plan) => setSubscribedLevel(plan)}/>;
  }

  const tabs = [
    {id:"journal",label:"📓 Journal"},
    {id:"chat",label:"Messages"},
    {id:"history",label:"History"},
    {id:"settings",label:"⚙️ Settings"},
  ];

  const settingsTabs = [
    {id:"goals",label:"Goals"},
    {id:"habits",label:"Habits"},
    {id:"privacy",label:"🔒 Privacy"},
    {id:"profile",label:"🧠 My Profile"},
  ];

  return (
    <>
      <Toast toast={toast} onClose={clearToast} />
      {showDownload && (
        <DownloadModal
          client={client}
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
                onClick={()=>setTab(t.id)}>
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
        {tab==="history" && <>
          <div className="section-title" style={{marginBottom:22}}>Your Progress</div>
          <div className="card" style={{marginBottom:18}}>
            <div className="section-label">7-Day Completion</div>
            <div className="history-grid7">
              {weekDays.map(({key,label})=>{
                const pct=getJournalCompletion(journalData[key]);
                const bg=pct>=80?"#6BAE75":pct>=50?"#E8A838":pct>0?"#E87D5B":"rgba(61,125,107,.1)";
                return (
                  <div className="hday" key={key}>
                    <div className="hday-lbl">{label}</div>
                    <div className="hday-dot" style={{background:bg,color:pct>0?"#fff":"var(--light)"}}>{pct>0?`${pct}%`:"—"}</div>
                  </div>
                );
              })}
            </div>
            <div className="section-label" style={{marginTop:8}}>Per Section</div>
            {JOURNAL_SECTIONS.map(s=>(
              <div className="week-row" key={s.id}>
                <div className="week-habit-label">{s.icon} {s.label}</div>
                <div className="week-dots">
                  {weekDays.map(({key,label})=>{
                    const done = journalData[key] ? s.check(journalData[key]) : false;
                    const pct = done ? 100 : 0;
                    return <div key={key} className="wdot" style={{background:pct>=80?s.color:pct>=40?s.color+"99":"rgba(61,125,107,.08)",color:pct>=40?"#fff":"var(--light)"}}>{label[0]}</div>;
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="section-label">30-Day Averages</div>
            {[
              { id:"sleepHours",   icon:"🌙", label:"Sleep",  color:"#7C6FA0", target:8 },
              { id:"waterGlasses", icon:"💧", label:"Water",  color:"#5BA4CF", target:8 },
            ].map(f=>{
              const avg=getJournalNumericAvg(journalData,f.id,30);
              const pct=Math.min(100,Math.round((avg/f.target)*100));
              return (
                <div className="report-bar-row" key={f.id}>
                  <div className="report-bar-label">{f.icon} {f.label}</div>
                  <div className="report-bar-bg"><div className="report-bar-fill" style={{width:`${pct}%`,background:f.color}}/></div>
                  <div className="report-pct">{pct}%</div>
                </div>
              );
            })}
            <div className="section-label" style={{marginTop:16}}>Logged This Month</div>
            {JOURNAL_SECTIONS.map(s=>{
              const pct=getJournalSectionRate(journalData,s.id,30);
              return (
                <div className="report-bar-row" key={s.id}>
                  <div className="report-bar-label">{s.icon} {s.label}</div>
                  <div className="report-bar-bg"><div className="report-bar-fill" style={{width:`${pct}%`,background:s.color}}/></div>
                  <div className="report-pct">{pct}%</div>
                </div>
              );
            })}
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
                {messagesLoading
                  ? <div style={{textAlign:"center",padding:24,color:"var(--light)",fontSize:13}}>Loading messages...</div>
                  : messages.length === 0
                  ? <div style={{textAlign:"center",padding:24,color:"var(--light)",fontSize:13}}>No messages yet. Say hello!</div>
                  : messages.map((m,i)=>(
                    <div key={m.id||i} className={`msg ${m.from}`}>
                      <div className="msg-bubble">{m.text}</div>
                      <div className="msg-meta">{m.from==="coach"?"Coach · ":""}{m.time} · {m.date}</div>
                    </div>
                  ))
                }
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

        {tab==="settings" && <>
          <div className="section-title" style={{marginBottom:18}}>Settings</div>
          <div className="tabs" style={{marginBottom:22}}>
            {settingsTabs.map(t=>(
              <button key={t.id} className={`tab${section===t.id?" active":""}`} onClick={()=>setSection(t.id)}>{t.label}</button>
            ))}
          </div>

          {section==="goals" && <>
            <div className="card" style={{marginBottom:18}}>
              <div className="section-label">Primary Goal</div>
              <input className="text-input" style={{marginBottom:14}} placeholder="e.g. Lose weight, sleep better, reduce stress…"
                value={goals.primaryGoal} onChange={e=>setGoals(g=>({...g,primaryGoal:e.target.value}))}/>
              <div className="section-label">What motivates you?</div>
              <textarea className="textarea" placeholder="e.g. I want to have more energy for my kids…"
                value={goals.why} onChange={e=>setGoals(g=>({...g,why:e.target.value}))}/>
            </div>
            <button className="btn-sm" disabled={savingGoals} onClick={saveGoals}>{savingGoals?"Saving…":"Save Goals"}</button>
          </>}

          {section==="habits" && <>
            <div className="card" style={{marginBottom:18}}>
              <div className="section-label">Daily Targets</div>
              <div className="two-col">
                <div>
                  <div className="field-label" style={{marginBottom:4}}>Sleep (hrs)</div>
                  <input className="text-input" type="number" min="0" max="24" value={goals.sleepTarget} onChange={e=>setGoals(g=>({...g,sleepTarget:Number(e.target.value)}))}/>
                </div>
                <div>
                  <div className="field-label" style={{marginBottom:4}}>Water (glasses)</div>
                  <input className="text-input" type="number" min="0" max="30" value={goals.waterTarget} onChange={e=>setGoals(g=>({...g,waterTarget:Number(e.target.value)}))}/>
                </div>
              </div>
              <div style={{marginTop:12}}>
                <div className="field-label" style={{marginBottom:4}}>Movement (min/day)</div>
                <input className="text-input" type="number" min="0" max="300" value={goals.movementTarget} onChange={e=>setGoals(g=>({...g,movementTarget:Number(e.target.value)}))}/>
              </div>
              <button className="btn-sm" style={{marginTop:14}} disabled={savingGoals} onClick={saveGoals}>{savingGoals?"Saving…":"Save Targets"}</button>
            </div>

            <div className="section-title" style={{marginBottom:18,fontSize:20}}>Custom Habits</div>
            <div className="card" style={{marginBottom:18}}>
              <div className="section-label">Add a New Habit</div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <input className="text-input" placeholder="Habit name (e.g. Journaling)" value={newHabitName} onChange={e=>setNewHabitName(e.target.value)} style={{flex:1}}/>
                <button className="btn-sm" onClick={addCustomHabit}>+ Add</button>
              </div>
            </div>
            {customHabits.length===0 && <div className="empty">No custom habits yet. Add one above!</div>}
            {customHabits.map(h=>(
              <div key={h.id} className="card-sm" style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <span style={{fontSize:20}}>{h.icon}</span>
                <span style={{fontSize:14,fontWeight:500}}>{h.label}</span>
                <span style={{fontSize:12,color:"var(--light)",marginLeft:"auto"}}>{h.unit} / day</span>
                <button onClick={()=>deleteCustomHabit(h.id)} style={{background:"none",border:"none",color:"var(--light)",cursor:"pointer",fontSize:16,lineHeight:1,padding:0}}>×</button>
              </div>
            ))}
          </>}

          {section==="privacy" && <>
            <PrivacySettings privacy={privacy} onChange={async (newPrivacy) => {
              setPrivacy(newPrivacy);
              if (supabaseClient && clientId && clientId.length > 10) {
                const { error } = await supabaseClient
                  .from("privacy_settings")
                  .upsert({
                    user_id:              clientId,
                    coach_access_enabled: newPrivacy.coachAccessEnabled,
                    share_habits:         newPrivacy.shareHabits,
                    share_journal:        newPrivacy.shareJournal,
                    share_food_diary:     newPrivacy.shareFoodDiary,
                    share_medications:    newPrivacy.shareMedications,
                  }, { onConflict: "user_id" });
                if (error) {
                  console.error("Privacy save error:", error);
                  showToast("Your privacy settings didn't save — please try again.");
                }
              }
            }} />
          </>}

          {section==="profile" && <>
            {activeQuiz ? (
              <div className="card">
                <button className="btn-sm-outline" style={{marginBottom:18}} onClick={()=>setActiveQuiz(null)}>← Back to My Profile</button>
                <Quiz
                  key={activeQuiz}
                  quizKey={activeQuiz}
                  mode="standalone"
                  doneLabel="Done"
                  onDone={(result)=>{
                    setQuizResults(q=>({...q,[activeQuiz]:result}));
                    setActiveQuiz(null);
                  }}
                />
              </div>
            ) : (
              <>
                {Object.values(QUIZZES).map(qd=>{
                  const saved = quizResults[qd.quizType];
                  return (
                    <div className="quiz-summary-card" key={qd.quizType}>
                      <div>
                        <div style={{fontSize:15,fontWeight:600,color:"var(--dark)",marginBottom:4}}>{qd.title}</div>
                        {saved
                          ? <div style={{fontSize:13,color:"var(--terra)",fontWeight:500}}>
                              Your style: {saved.primaryStyle.split(",").map(k=>qd.profiles[k]?.label).join(" & ")}
                            </div>
                          : <div style={{fontSize:13,color:"var(--light)"}}>Not taken yet — {qd.questions.length} quick questions</div>
                        }
                      </div>
                      <button className={saved?"btn-sm-outline":"btn-sm"} onClick={()=>setActiveQuiz(qd.quizType)}>
                        {saved?"View / Retake":"Take Quiz →"}
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </>}
        </>}

        {tab==="journal" && <>
          <div className="greeting" style={{marginBottom:20}}>
            <div className="greeting-date">{dayNames[today.getDay()]}, {monthNames[today.getMonth()]} {today.getDate()}</div>
            <div className="greeting-title">Good day, <em>{client.name.split(" ")[0]}</em> ✨</div>
          </div>
          {client.accessLevel === "grace" && <GraceBanner daysLeft={access.daysLeft} />}
          {isViewOnly && <ViewOnlyBanner onDownload={()=>setShowDownload(true)}/>}
          <JournalView
            journalData={journalData}
            streak={streak}
            onUpdate={(dateKey, entry) => {
              setJournalData(d => ({...d, [dateKey]: entry}));
              if (journalSaveTimer.current) clearTimeout(journalSaveTimer.current);
              journalSaveTimer.current = setTimeout(async () => {
                if (supabaseClient && clientId && clientId.length > 10) {
                  const { error } = await supabaseClient
                    .from("journal_entries")
                    .upsert({
                      user_id:         clientId,
                      entry_date:      dateKey,
                      sleep_hours:     entry.sleepHours || 0,
                      water_glasses:   entry.waterGlasses || 0,
                      intention:       entry.intention || "",
                      reflection:      entry.reflection || "",
                      gratitude_1:     entry.gratitude?.[0] || "",
                      gratitude_2:     entry.gratitude?.[1] || "",
                      gratitude_3:     entry.gratitude?.[2] || "",
                      medications:     entry.medications || "",
                      movement_cardio:     entry.movementCardio || "",
                      movement_weights:    entry.movementWeights || "",
                      movement_stretching: entry.movementStretching || "",
                      meditation:      entry.meditation || "",
                      morning_food:    entry.morning?.food || "",
                      afternoon_food:  entry.afternoon?.food || "",
                      evening_food:    entry.evening?.food || "",
                    }, { onConflict: "user_id,entry_date" });
                  if (error) {
                    console.error("Journal save error:", error);
                    showToast("Your journal entry didn't save — please try again.");
                  }
                }
              }, 600);
            }}
            readOnly={isViewOnly}
          />
        </>}
      </div>
    </>
  );
}
