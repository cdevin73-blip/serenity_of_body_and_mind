import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase as supabaseClient } from "../../lib/supabaseClient";
import { HABITS, DEFAULT_GOALS, DEFAULT_PRIVACY } from "../../lib/constants";
import { today, dayNames, monthNames, getWeekDays } from "../../lib/dates";
import { JOURNAL_SECTIONS, getJournalCompletion, getJournalStreak, getJournalSectionRate, getJournalNumericAvg } from "../../lib/journal";
import { getAccessInfo, countMessagesThisWeek } from "../../lib/access";
import { fetchInsights } from "../../lib/insights";
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
  const { tab = "journal" } = useParams();
  const setTab = (id) => navigate(`/client/${id}`);
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
  const [goals] = useState(DEFAULT_GOALS);
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
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

  async function loadInsights() {
    setLoadingInsights(true); setTab("insights");
    try { const ins=await fetchInsights(client.name,journalData,goals); setInsights(ins); }
    catch { setInsights([{type:"tip",emoji:"💡",label:"Keep Going",text:"You're building great habits! Stay consistent and your coach will share personalized feedback soon."}]); }
    setLoadingInsights(false);
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
    {id:"history",label:"History"},
    {id:"insights",label:"✨ Insights"},
    {id:"goals",label:"My Goals"},
    {id:"chat",label:"Messages"},
    {id:"custom",label:"My Habits"},
    {id:"profile",label:"🧠 My Profile"},
    {id:"privacy",label:"🔒 Privacy"},
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

        {tab==="profile" && <>
          <div className="greeting" style={{marginBottom:20}}>
            <div className="greeting-title">My <em>Profile</em> 🧠</div>
            <div style={{fontSize:13,color:"var(--light)",marginTop:4}}>Two quick quizzes that help your coach tailor how she works with you</div>
          </div>
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

        {tab==="privacy" && <>
          <div className="greeting" style={{marginBottom:20}}>
            <div className="greeting-title">Privacy <em>Settings</em> 🔒</div>
            <div style={{fontSize:13,color:"var(--light)",marginTop:4}}>Control what your coach can see — you're always in charge of your data</div>
          </div>
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
