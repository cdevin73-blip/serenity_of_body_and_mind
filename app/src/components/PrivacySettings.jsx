import { Toggle } from "./Toggle";

export function PrivacySettings({ privacy, onChange }) {
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
