import { useState } from "react";
import { dayNames, monthNames } from "../lib/dates";
import { emptyJournalDay } from "../lib/journal";

export function JournalView({ journalData, onUpdate, readOnly = false, streak = 0 }) {
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

  return (
    <div>
      <div className="journal-date-nav">
        <button className="date-nav-btn" onClick={() => setOffset(o => o + 1)}>&#8592;</button>
        <div className="date-nav-label">{dayLabel}</div>
        <button className="date-nav-btn" onClick={() => setOffset(o => Math.max(0, o - 1))} disabled={offset === 0} style={{ opacity: offset === 0 ? 0.3 : 1 }}>&#8594;</button>
      </div>

      {offset === 0 && !readOnly && (
        <div className="streak-banner">
          <div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:400}}>🔥 Current Streak</div>
            <div style={{fontSize:13,opacity:.8,marginTop:2}}>You're on a roll — keep it up!</div>
          </div>
          <div className="streak-num">{streak} <span style={{fontSize:18}}>days</span></div>
        </div>
      )}

      <div className="sleep-entry">
        <div className="sleep-entry-label">🌙 Last night's sleep</div>
        <div className="sleep-entry-input">
          <input type="number" min="0" max="24" step="0.5" readOnly={readOnly}
            value={entry.sleepHours || ""} placeholder="0"
            onChange={e => upd({ sleepHours: parseFloat(e.target.value) || 0 })} />
          <span style={{fontSize:13,color:"var(--light)"}}>hrs</span>
        </div>
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
              <div className="journal-section-sub">{(entry.waterGlasses || 0) * 8} oz of water logged today · Goal: 80 oz</div>
            </div>
          </div>
          <div className="water-row" style={{ marginBottom: 16, marginTop: 0 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <button key={i} className={`water-check${(entry.waterGlasses || 0) > i ? " checked" : ""}`}
                onClick={() => !readOnly && upd({ waterGlasses: (entry.waterGlasses || 0) > i ? i : i + 1 })}
                title={`${(i + 1) * 8} oz`}>💧</button>
            ))}
          </div>
          {[
            { key: "morning",   label: "Morning",   icon: "🌅", sub: "Wake-up to noon" },
            { key: "afternoon", label: "Afternoon", icon: "☀️", sub: "Noon to 5pm" },
            { key: "evening",   label: "Evening",   icon: "🌙", sub: "5pm to bedtime" },
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
            <div><div className="journal-section-title">Movement</div><div className="journal-section-sub">What movement did you do today?</div></div>
          </div>
          {[
            { key: "movementCardio",      label: "Cardio",              icon: "🏃" },
            { key: "movementWeights",     label: "Weight Training",     icon: "🏋️" },
            { key: "movementStretching",  label: "Stretching & Yoga",   icon: "🧘‍♀️" },
          ].map(m => (
            <div className="food-period" key={m.key}>
              <div className="food-period-label"><span>{m.icon}</span> {m.label}</div>
              <textarea className="journal-textarea sm"
                placeholder={readOnly ? (entry[m.key] || "None logged.") : `e.g. ${m.label.toLowerCase()}…`}
                value={entry[m.key] || ""} readOnly={readOnly}
                onChange={e => upd({ [m.key]: e.target.value })} />
            </div>
          ))}
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
