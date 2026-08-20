import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { ACCESS_LEVELS, DEFAULT_PRIVACY } from "../../lib/constants";
import { today, todayKey, dayNames, monthNames, getWeekDays } from "../../lib/dates";
import { JOURNAL_SECTIONS, getJournalCompletion, getJournalStreak } from "../../lib/journal";
import { getDaysRemaining, countMessagesThisWeek } from "../../lib/access";
import { getAggregate } from "../../lib/report";
import { Toast, useToast } from "../../components/Toast";
import { DownloadModal } from "../../components/DownloadModal";
import { JournalView } from "../../components/JournalView";
import { QuizResults } from "../../components/Quiz/QuizResults";
import { QUIZZES, CHART_COLORS } from "../../lib/quizzes";

export function CoachApp() {
  const { profile: coachProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const tab = location.pathname === "/coach/reports" ? "reports" : "clients";
  const selectedClient = params.clientId || null;
  const clientTab = params.clientTab || "journal";
  const setTab = (id) => navigate(id === "reports" ? "/coach/reports" : "/coach");
  const setSelectedClient = (id) => navigate(id ? `/coach/clients/${id}/journal` : "/coach");
  const setClientTab = (id) => navigate(`/coach/clients/${selectedClient}/${id}`);

  async function onLogout() {
    await logout();
    navigate("/auth");
  }

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [allClientData, setAllClientData] = useState({});
  const [coachNotes, setCoachNotes] = useState({});
  const [clientAccessLevels, setClientAccessLevels] = useState({});
  const [clientJournals, setClientJournals] = useState({});
  const [clientPrivacy, setClientPrivacy] = useState({});
  const [clientQuizzes, setClientQuizzes] = useState({});
  const [quizBadges, setQuizBadges] = useState({});
  const [clientGoals, setClientGoals] = useState({});
  const [clientAgreements, setClientAgreements] = useState({});
  const [messages, setMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [msgInput, setMsgInput] = useState("");
  const [newNote, setNewNote] = useState("");
  const [reportPeriod, setReportPeriod] = useState("weekly");
  const [showCoachDownload, setShowCoachDownload] = useState(false);
  const { toast, showToast, clearToast } = useToast();
  const chatRef = useRef(null);

  useEffect(() => {
    async function fetchClients() {
      setLoadingClients(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "client")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching clients:", error);
        showToast("Couldn't load your client list — check your connection and refresh.");
        setLoadingClients(false);
        return;
      }

      if (data) {
        const mapped = data.map(p => ({
          id: p.id,
          name: p.full_name || p.email || "New Client",
          avatar: (p.full_name || p.email || "C").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2),
          joined: p.joined_date ? new Date(p.joined_date).toLocaleDateString("en-US",{month:"short",year:"numeric"}) : "Recent",
          goal: p.goal || "Getting started",
          email: p.email,
          program: p.program || null,
          programEndDate: p.program_end_date || null,
          accessLevel: p.access_level || "active",
          graceEndDate: p.grace_end_date || null,
          subscriptionPlan: p.subscription_plan || null,
          messagesThisWeek: p.messages_this_week || 0,
        }));
        setClients(mapped);
        const accessMap = {};
        data.forEach(p => {
          accessMap[p.id] = {
            accessLevel: p.access_level || "active",
            messagesThisWeek: p.messages_this_week || 0,
            programEndDate: p.program_end_date || null,
            graceEndDate: p.grace_end_date || null,
            subscriptionPlan: p.subscription_plan || null,
          };
        });
        setClientAccessLevels(accessMap);
      }

      const { data: quizzes } = await supabase
        .from("quiz_results")
        .select("user_id, quiz_type, primary_style");
      if (quizzes) {
        const badges = {};
        quizzes.forEach(row => {
          badges[row.user_id] = { ...(badges[row.user_id] || {}), [row.quiz_type]: row.primary_style };
        });
        setQuizBadges(badges);
      }

      // Respects each client's own privacy choice, same gate used in the per-client
      // detail view — a client with coach visibility or shareHabits off contributes
      // no data here, so their list pills correctly show 0/hidden rather than leaking.
      if (data && data.length) {
        const ids = data.map(p => p.id);
        const { data: privRows } = await supabase
          .from("privacy_settings").select("*").in("user_id", ids);
        const privMap = {};
        (privRows || []).forEach(r => { privMap[r.user_id] = r; });
        const sharableIds = ids.filter(id => {
          const r = privMap[id];
          return (r?.coach_access_enabled ?? true) && (r?.share_habits ?? true);
        });

        if (sharableIds.length) {
          const { data: journalRows } = await supabase
            .from("journal_entries").select("*").in("user_id", sharableIds);
          const grouped = {};
          (journalRows || []).forEach(row => {
            grouped[row.user_id] = grouped[row.user_id] || {};
            grouped[row.user_id][row.entry_date] = {
              sleepHours:  parseFloat(row.sleep_hours)  || 0,
              waterGlasses: parseInt(row.water_glasses) || 0,
              intention:   row.intention   || "",
              reflection:  row.reflection  || "",
              gratitude:   [row.gratitude_1||"", row.gratitude_2||"", row.gratitude_3||""],
              medications: row.medications || "",
              movementCardio:     row.movement_cardio     || "",
              movementWeights:    row.movement_weights    || "",
              movementStretching: row.movement_stretching || "",
              morning:   { food: row.morning_food||"" },
              afternoon: { food: row.afternoon_food||"" },
              evening:   { food: row.evening_food||"" },
            };
          });
          setAllClientData(grouped);
        }
      }

      setLoadingClients(false);
    }
    fetchClients();
  }, []);

  // ── Unread message counts, per client, for the list badges & Messages sub-tab ──
  useEffect(() => {
    if (!coachProfile?.id) return;
    let cancelled = false;
    async function loadUnread() {
      const { data } = await supabase.from("messages")
        .select("sender_id")
        .eq("receiver_id", coachProfile.id)
        .is("read_at", null);
      if (cancelled) return;
      const counts = {};
      (data || []).forEach(row => { counts[row.sender_id] = (counts[row.sender_id] || 0) + 1; });
      setUnreadCounts(counts);
    }
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [coachProfile?.id]);

  const weekDays = getWeekDays(7);
  const sc = clients.find(c=>c.id===selectedClient);
  const CLIENTS = clients;

  const scData      = selectedClient ? (clientJournals["__habits__"+selectedClient] || null) : null;
  const scPrivacy   = selectedClient ? (clientPrivacy[selectedClient] || DEFAULT_PRIVACY) : DEFAULT_PRIVACY;
  const scMessages  = messages[selectedClient] || [];
  const scNotes     = selectedClient ? (coachNotes[selectedClient] || []) : [];
  const scGoals     = selectedClient ? (clientGoals[selectedClient] || null) : null;
  const scAgreement = selectedClient ? (clientAgreements[selectedClient] || null) : null;
  const scStreak    = scData ? getJournalStreak(scData) : 0;
  const scWeeklyMsgs = selectedClient ? countMessagesThisWeek(messages[selectedClient], selectedClient) : 0;
  const scQuizzes   = selectedClient ? (clientQuizzes[selectedClient] || {}) : {};

  async function sendMsg() {
    if(!msgInput.trim()||!selectedClient||!coachProfile?.id) return;
    const text = msgInput.trim();

    const { error } = await supabase.from("messages").insert({
      sender_id: coachProfile.id,
      receiver_id: selectedClient,
      message: text,
    });

    if (error) {
      console.error("Coach send error:", error);
      showToast("Your message didn't send. It's still in the box below — try again.");
      return;
    }

    setMsgInput("");

    const { data: toCoach }   = await supabase.from("messages").select("*").eq("sender_id", selectedClient).eq("receiver_id", coachProfile.id).order("created_at",{ascending:true});
    const { data: fromCoach } = await supabase.from("messages").select("*").eq("sender_id", coachProfile.id).eq("receiver_id", selectedClient).order("created_at",{ascending:true});
    const all = [...(toCoach||[]), ...(fromCoach||[])];
    all.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    setMessages(prev => ({...prev, [selectedClient]: all.map(m => ({
      id: m.id, from: m.sender_id === coachProfile.id ? "coach" : "client",
      sender_id: m.sender_id, text: m.message, created_at: m.created_at, read_at: m.read_at,
      time: new Date(m.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
      date: new Date(m.created_at).toLocaleDateString([],{month:"short",day:"numeric"}),
    }))}));
    setTimeout(()=>{if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight;},50);
  }

  async function addNote() {
    if(!newNote.trim()||!selectedClient||!coachProfile?.id) return;
    const text = newNote.trim();
    setNewNote("");
    const { data, error } = await supabase.from("coach_notes").insert({
      client_id: selectedClient,
      coach_id: coachProfile.id,
      note: text,
    }).select().single();
    if (error) {
      console.error("Note save error:", error);
      showToast("Your note didn't save — please try again.");
      return;
    }
    setCoachNotes(n => ({...n, [selectedClient]: [
      { text: data.note, date: new Date(data.created_at).toLocaleDateString() },
      ...(n[selectedClient]||[]),
    ]}));
  }

  // ── COACH: Load client data when a client is selected ────────────
  // Privacy is enforced here, at the fetch layer, not just in what gets rendered.
  useEffect(() => {
    if (!supabase || !selectedClient || !coachProfile?.id) return;
    let cancelled = false;

    async function loadPrivacy() {
      const { data } = await supabase
        .from("privacy_settings").select("*")
        .eq("user_id", selectedClient).maybeSingle();

      const privacy = {
        coachAccessEnabled: data?.coach_access_enabled ?? true,
        shareHabits:        data?.share_habits        ?? true,
        shareJournal:       data?.share_journal       ?? true,
        shareFoodDiary:     data?.share_food_diary    ?? true,
        shareMedications:   data?.share_medications   ?? true,
      };
      setClientPrivacy(prev => ({...prev, [selectedClient]: privacy}));
      return privacy;
    }

    async function loadHabits(privacy) {
      // Completion/streak now derive from journal_entries too, but this stays a
      // separate fetch gated on shareHabits alone (not shareJournal/shareFoodDiary/
      // shareMedications) — a client can share their completion streak without
      // sharing the actual journal text, same as before the Phase 3 remap.
      if (!privacy.coachAccessEnabled || !privacy.shareHabits) {
        setClientJournals(prev => ({...prev, ["__habits__"+selectedClient]: {}}));
        return;
      }
      const { data } = await supabase
        .from("journal_entries").select("*")
        .eq("user_id", selectedClient)
        .order("entry_date", { ascending: true });

      if (data) {
        const h = {};
        data.forEach(row => {
          h[row.entry_date] = {
            sleepHours:  parseFloat(row.sleep_hours)  || 0,
            waterGlasses: parseInt(row.water_glasses) || 0,
            intention:   row.intention   || "",
            reflection:  row.reflection  || "",
            gratitude:   [row.gratitude_1||"", row.gratitude_2||"", row.gratitude_3||""],
            medications: row.medications || "",
            movementCardio:     row.movement_cardio     || "",
            movementWeights:    row.movement_weights    || "",
            movementStretching: row.movement_stretching || "",
            morning:   { food: row.morning_food||"" },
            afternoon: { food: row.afternoon_food||"" },
            evening:   { food: row.evening_food||"" },
          };
        });
        setClientJournals(prev => ({...prev, ["__habits__"+selectedClient]: h}));
      }
    }

    async function loadJournal(privacy) {
      if (!privacy.coachAccessEnabled || (!privacy.shareJournal && !privacy.shareFoodDiary && !privacy.shareMedications)) {
        setClientJournals(prev => ({...prev, [selectedClient]: {}}));
        return;
      }
      const { data } = await supabase
        .from("journal_entries").select("*")
        .eq("user_id", selectedClient);

      if (data) {
        const j = {};
        data.forEach(row => {
          j[row.entry_date] = {
            sleepHours:  privacy.shareJournal ? (parseFloat(row.sleep_hours)||0) : 0,
            waterGlasses: privacy.shareFoodDiary ? (parseInt(row.water_glasses)||0) : 0,
            intention:   privacy.shareJournal ? (row.intention||"")  : "",
            reflection:  privacy.shareJournal ? (row.reflection||"") : "",
            gratitude:   privacy.shareJournal ? [row.gratitude_1||"", row.gratitude_2||"", row.gratitude_3||""] : ["","",""],
            medications: privacy.shareMedications ? (row.medications||"") : "",
            movementCardio:     privacy.shareJournal ? (row.movement_cardio||"")     : "",
            movementWeights:    privacy.shareJournal ? (row.movement_weights||"")    : "",
            movementStretching: privacy.shareJournal ? (row.movement_stretching||"") : "",
            meditation:  privacy.shareJournal ? (row.meditation||"") : "",
            morning:   { food: privacy.shareFoodDiary ? (row.morning_food||"")   : "" },
            afternoon: { food: privacy.shareFoodDiary ? (row.afternoon_food||"") : "" },
            evening:   { food: privacy.shareFoodDiary ? (row.evening_food||"")   : "" },
          };
        });
        setClientJournals(prev => ({...prev, [selectedClient]: j}));
      }
    }

    async function loadMessages() {
      const { data: toCoach }   = await supabase.from("messages").select("*").eq("sender_id", selectedClient).eq("receiver_id", coachProfile.id).order("created_at",{ascending:true});
      const { data: fromCoach } = await supabase.from("messages").select("*").eq("sender_id", coachProfile.id).eq("receiver_id", selectedClient).order("created_at",{ascending:true});

      const all = [...(toCoach||[]), ...(fromCoach||[])];
      all.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));

      setMessages(prev => ({...prev, [selectedClient]: all.map(m => ({
        id: m.id,
        from: m.sender_id === coachProfile.id ? "coach" : "client",
        sender_id: m.sender_id,
        text: m.message,
        created_at: m.created_at,
        read_at: m.read_at,
        time: new Date(m.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
        date: new Date(m.created_at).toLocaleDateString([],{month:"short",day:"numeric"}),
      }))}));
    }

    async function loadQuizzes() {
      const { data } = await supabase
        .from("quiz_results")
        .select("quiz_type, primary_style, scores")
        .eq("user_id", selectedClient);
      const q = {};
      (data || []).forEach(row => { q[row.quiz_type] = { primaryStyle: row.primary_style, scores: row.scores }; });
      setClientQuizzes(prev => ({ ...prev, [selectedClient]: q }));
    }

    async function loadGoals() {
      const { data } = await supabase
        .from("goals").select("*")
        .eq("user_id", selectedClient).maybeSingle();
      if (data) {
        setClientGoals(prev => ({ ...prev, [selectedClient]: {
          primaryGoal: data.primary_goal || "",
          why: data.why || "",
          sleepTarget: data.sleep_target ?? 8,
          waterTarget: data.water_target ?? 8,
          movementTarget: data.movement_target ?? 30,
        }}));
      }
    }

    async function loadAgreement() {
      const { data } = await supabase
        .from("agreements").select("*")
        .eq("user_id", selectedClient)
        .order("signed_at", { ascending: false })
        .limit(1).maybeSingle();
      setClientAgreements(prev => ({ ...prev, [selectedClient]: data || null }));
    }

    async function loadNotes() {
      const { data } = await supabase
        .from("coach_notes").select("*")
        .eq("client_id", selectedClient)
        .order("created_at", { ascending: false });
      setCoachNotes(prev => ({ ...prev, [selectedClient]: (data || []).map(row => ({
        text: row.note, date: new Date(row.created_at).toLocaleDateString(),
      })) }));
    }

    async function loadAll() {
      const privacy = await loadPrivacy();
      if (cancelled) return;
      await Promise.all([loadHabits(privacy), loadJournal(privacy), loadQuizzes(), loadGoals(), loadAgreement(), loadNotes()]);
      if (cancelled) return;
      await loadMessages();
    }
    loadAll();

    const interval = setInterval(loadMessages, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [selectedClient, coachProfile]);

  useEffect(()=>{
    if(clientTab==="chat" && chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [scMessages, clientTab]);

  useEffect(() => {
    if (clientTab !== "chat" || !selectedClient || !coachProfile?.id) return;
    const unreadIds = scMessages.filter(m => m.from === "client" && !m.read_at).map(m => m.id);
    if (unreadIds.length === 0) return;
    async function markRead() {
      const now = new Date().toISOString();
      const { error } = await supabase.from("messages").update({ read_at: now }).in("id", unreadIds);
      if (error) { console.error("Mark read error:", error); return; }
      setMessages(prev => ({...prev, [selectedClient]: (prev[selectedClient]||[]).map(m =>
        unreadIds.includes(m.id) ? { ...m, read_at: now } : m
      )}));
      setUnreadCounts(prev => { const next = { ...prev }; delete next[selectedClient]; return next; });
    }
    markRead();
  }, [clientTab, selectedClient, scMessages]);

  const scLocked = !scPrivacy.coachAccessEnabled;

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

  const clientTabs = [
    {id:"journal",label:"📓 Journal"},
    {id:"settings",label:"⚙️ Settings"},
    {id:"notes",label:"Notes"},
    {id:"chat",label:"Messages"},
  ];

  if(selectedClient && sc) return (
    <>
      <Toast toast={toast} onClose={clearToast} />
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo">serenity</div>
          <div className="nav-tabs" style={{overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>{clientTabs.map(t=><button key={t.id} className={`nav-tab${clientTab===t.id?" active":""}`} onClick={()=>setClientTab(t.id)}>{t.label}{t.id==="chat" && unreadCounts[selectedClient]>0 && <span className="unread-dot">{unreadCounts[selectedClient]}</span>}</button>)}</div>
          <div className="nav-right">
            <span className="nav-badge">🌿 Coach</span>
            <button className="nav-logout" onClick={onLogout}>Sign out</button>
          </div>
        </div>
      </nav>
      <div className="main">
        <button className="back-btn" onClick={()=>setSelectedClient(null)}>← All Clients</button>

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
              <div style={{fontSize:24,fontWeight:700,color:"var(--terra)"}}>{getJournalCompletion(scData?.[todayKey])}%</div>
              <div style={{fontSize:11,color:"var(--light)"}}>today</div>
            </div>
            <button className="btn-download" onClick={()=>setShowCoachDownload(true)}>📥 Export data</button>
          </div>
        </div>
        {showCoachDownload && (
          <DownloadModal
            client={sc}
            journalData={clientJournals[selectedClient]||{}}
            onClose={()=>setShowCoachDownload(false)}
          />
        )}

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
          <div className="card" style={{marginBottom:18}}>
            <div className="section-label">Onboarding Documents</div>
            {scAgreement ? (
              <div className="goal-item">
                <span className="goal-icon">📋</span>
                <div>
                  <div className="goal-label">Client Services Agreement v{scAgreement.agreement_version}</div>
                  <div className="goal-val">Signed by {scAgreement.signature_name} on {new Date(scAgreement.signed_at).toLocaleDateString()}</div>
                </div>
              </div>
            ) : (
              <div className="empty">{sc.name.split(" ")[0]} hasn't signed the agreement yet.</div>
            )}
          </div>

          <div className="section-title" style={{marginBottom:18,fontSize:20}}>Quiz Results</div>
          {Object.values(QUIZZES).map(qd => {
            const saved = scQuizzes[qd.quizType];
            return (
              <div className="card" style={{marginBottom:16}} key={qd.quizType}>
                {saved ? (
                  <QuizResults
                    quizDef={qd}
                    scores={saved.scores}
                    primaryStyle={saved.primaryStyle}
                    totalQuestions={qd.questions.length}
                    readOnly
                  />
                ) : (
                  <div className="empty">{sc.name.split(" ")[0]} hasn't taken the {qd.title} quiz yet.</div>
                )}
              </div>
            );
          })}

          <div className="section-title" style={{marginBottom:18,fontSize:20}}>Private Coach Notes</div>
          <div className="card">
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

        {clientTab==="settings" && (() => {
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
                        <div key={i} style={{width:10,height:10,borderRadius:"50%",background:i < scWeeklyMsgs ? "var(--terra)" : "rgba(0,0,0,.1)"}}/>
                      ))}
                      <span style={{fontSize:11,color:"var(--mid)",marginLeft:4}}>{scWeeklyMsgs}/5</span>
                    </div>
                  </div>
                )}
              </div>

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
                    onClick={async () => {
                    if (supabase && selectedClient) {
                      const { error } = await supabase.from("profiles").update({ access_level: key }).eq("id", selectedClient);
                      if (error) {
                        console.error("Access level update error:", error);
                        showToast("Couldn't update this client's access level — please try again.");
                        return;
                      }
                    }
                    setClientAccessLevels(a => ({...a, [selectedClient]: {...a[selectedClient], accessLevel: key}}));
                  }}
                  >
                    {cAccess.accessLevel === key ? "Current" : "Set"}
                  </button>
                </div>
              ))}

              {cAccess.accessLevel === "app_msg" && (
                <div style={{marginTop:20,padding:"14px 16px",background:"rgba(61,125,107,.06)",borderRadius:12}}>
                  <div style={{fontSize:13,color:"var(--mid)"}}>Weekly message count: <strong>{scWeeklyMsgs} / 5 used</strong> <span style={{color:"var(--light)",fontWeight:400}}>(rolling 7-day count, updates automatically)</span></div>
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
          {scGoals && (
            <div className="card" style={{marginBottom:18}}>
              <div className="section-label">Goals & Targets</div>
              <div className="goal-item">
                <span className="goal-icon">🎯</span>
                <div><div className="goal-label">Primary Goal</div><div className="goal-val">{scGoals.primaryGoal || "—"}</div></div>
              </div>
              {scGoals.why && (
                <div className="goal-item">
                  <span className="goal-icon">💭</span>
                  <div><div className="goal-label">Why</div><div className="goal-val">{scGoals.why}</div></div>
                </div>
              )}
              <div className="goal-item">
                <span className="goal-icon">🌙</span>
                <div><div className="goal-label">Sleep Target</div><div className="goal-val">{scGoals.sleepTarget} hrs</div></div>
              </div>
              <div className="goal-item">
                <span className="goal-icon">💧</span>
                <div><div className="goal-label">Water Target</div><div className="goal-val">{scGoals.waterTarget} glasses</div></div>
              </div>
              <div className="goal-item">
                <span className="goal-icon">🏃</span>
                <div><div className="goal-label">Movement Target</div><div className="goal-val">{scGoals.movementTarget} min</div></div>
              </div>
            </div>
          )}
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
      <Toast toast={toast} onClose={clearToast} />
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo">serenity</div>
          <div className="nav-tabs">{[{id:"clients",label:"Clients"},{id:"reports",label:"Reports"}].map(t=><button key={t.id} className={`nav-tab${tab===t.id?" active":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}</div>
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
          {loadingClients && (
            <div style={{textAlign:"center",padding:"48px 24px",color:"var(--light)"}}>
              <div style={{fontSize:32,marginBottom:12}}>🌿</div>
              <div style={{fontSize:14}}>Loading your clients...</div>
            </div>
          )}
          {!loadingClients && clients.length === 0 && (
            <div style={{textAlign:"center",padding:"48px 24px",background:"var(--warm)",borderRadius:18,border:"1.5px dashed var(--border)"}}>
              <div style={{fontSize:40,marginBottom:14}}>👋</div>
              <div style={{fontSize:17,fontWeight:600,color:"var(--dark)",marginBottom:8}}>No clients yet</div>
              <div style={{fontSize:13,color:"var(--light)",lineHeight:1.6}}>When clients sign up at app.serenityofbodyandmind.com<br/>they will appear here.</div>
            </div>
          )}
          {clients.map((c,i)=>{
            const h=allClientData[c.id]||{};
            const streak=getJournalStreak(h);
            const todayPct=getJournalCompletion(h[todayKey]);
            return (
              <div key={c.id} className={`client-list-card${selectedClient===c.id?" sel":""}`} style={{animationDelay:`${i*0.08}s`}} onClick={()=>setSelectedClient(c.id)}>
                <div className="cl-avatar">{c.avatar}</div>
                <div>
                  <div className="cl-name">{c.name}{unreadCounts[c.id]>0 && <span className="unread-dot">{unreadCounts[c.id]}</span>}</div>
                  <div className="cl-goal">{c.goal}</div>
                  <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                    <span className={`pill ${todayPct>=70?"pill-green":todayPct>=40?"pill-orange":"pill-red"}`}>{todayPct}% today</span>
                    <span className="pill" style={{background:"rgba(61,125,107,.1)",color:"var(--terra)"}}>🔥 {streak} days</span>
                    {(()=>{ const lvl=ACCESS_LEVELS[c.accessLevel]||ACCESS_LEVELS.expired; return <span className="pill" style={{background:lvl.color+"22",color:lvl.color,border:"1px solid "+lvl.color+"44"}}>{lvl.icon} {lvl.label}</span>; })()}
                    {Object.entries(quizBadges[c.id]||{}).map(([quizType,primaryStyle])=>{
                      const qd=QUIZZES[quizType];
                      if(!qd) return null;
                      const firstKey=primaryStyle.split(",")[0];
                      const color=CHART_COLORS[qd.styles.indexOf(firstKey)] || "var(--terra)";
                      return (
                        <span key={quizType} className="quiz-badge" style={{background:color}}>
                          {qd.profiles[firstKey]?.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="cl-stats">
                  <div style={{fontSize:13,color:"var(--light)",marginBottom:6}}>Today</div>
                  <div style={{display:"flex",gap:4}}>
                    {JOURNAL_SECTIONS.map(s=>{
                      const done = h[todayKey] ? s.check(h[todayKey]) : false;
                      const pct = done ? 100 : 0;
                      return <div key={s.id} title={s.label} style={{width:8,height:32,borderRadius:4,background:"rgba(61,125,107,.1)",display:"flex",alignItems:"flex-end",overflow:"hidden"}}>
                        <div style={{width:"100%",height:`${pct}%`,background:s.color,borderRadius:4,transition:"height .4s"}}/>
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
            <div className="stat-card"><div className="stat-val">{CLIENTS.length ? Math.round(getAggregate(CLIENTS, allClientData).reduce((a,c)=>a+c.avg,0)/CLIENTS.length) : 0}%</div><div className="stat-label">Avg Completion</div></div>
            <div className="stat-card"><div className="stat-val">{CLIENTS.length ? Math.max(...getAggregate(CLIENTS, allClientData).map(c=>c.streak)) : 0}</div><div className="stat-label">Best Streak</div></div>
            <div className="stat-card"><div className="stat-val">{getAggregate(CLIENTS, allClientData).filter(c=>c.avg>=70).length}</div><div className="stat-label">On Track</div></div>
          </div>
          <div className="card">
            <div className="section-label">{reportPeriod==="weekly"?"7":"30"}-Day Completion by Client</div>
            {getAggregate(CLIENTS, allClientData).map(c=>(
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
