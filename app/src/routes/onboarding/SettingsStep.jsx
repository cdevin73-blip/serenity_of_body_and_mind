import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { DEFAULT_PRIVACY } from "../../lib/constants";
import { PrivacySettings } from "../../components/PrivacySettings";
import { Toast, useToast } from "../../components/Toast";

const CHECK_IN_DAYS = ["Every Monday", "Every Tuesday", "Every Wednesday", "Every Thursday", "Every Friday"];

export function SettingsStep() {
  const { advance } = useOutletContext();
  const { session } = useAuth();
  const { toast, showToast, clearToast } = useToast();

  const [primaryGoal, setPrimaryGoal] = useState("");
  const [why, setWhy] = useState("");
  const [sleepTarget, setSleepTarget] = useState(8);
  const [waterTarget, setWaterTarget] = useState(8);
  const [movementTarget, setMovementTarget] = useState(30);
  const [weeklyCheckIn, setWeeklyCheckIn] = useState("Every Monday");
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = primaryGoal.trim().length > 1 && !submitting;

  async function handleSubmit() {
    if (!canSubmit || !session?.user) return;
    setSubmitting(true);
    const userId = session.user.id;

    const { error: goalsError } = await supabase.from("goals").upsert({
      user_id: userId,
      primary_goal: primaryGoal.trim(),
      why: why.trim(),
      sleep_target: sleepTarget,
      water_target: waterTarget,
      movement_target: movementTarget,
      weekly_check_in: weeklyCheckIn,
    }, { onConflict: "user_id" });

    const { error: privacyError } = await supabase.from("privacy_settings").upsert({
      user_id: userId,
      coach_access_enabled: privacy.coachAccessEnabled,
      share_habits: privacy.shareHabits,
      share_journal: privacy.shareJournal,
      share_food_diary: privacy.shareFoodDiary,
      share_medications: privacy.shareMedications,
      share_mood: privacy.shareMood,
    }, { onConflict: "user_id" });

    if (goalsError || privacyError) {
      console.error("Settings save error:", goalsError || privacyError);
      showToast("Some of your settings didn't save — you can update them later in Settings.");
      setSubmitting(false);
      return;
    }

    await advance("complete", "/client/today", { complete: true });
  }

  return (
    <>
      <Toast toast={toast} onClose={clearToast} />
      <div className="ob-title">Set up your goals 🎯</div>
      <div className="ob-sub">This helps your coach tailor your plan. You can change any of this later.</div>

      <div className="field-group">
        <div className="field-label">Primary Goal</div>
        <input className="text-input" placeholder="e.g. Lose weight, sleep better, reduce stress…" value={primaryGoal} onChange={e => setPrimaryGoal(e.target.value)} />
      </div>
      <div className="field-group">
        <div className="field-label">What motivates you?</div>
        <textarea className="textarea" placeholder="e.g. I want to have more energy for my kids…" value={why} onChange={e => setWhy(e.target.value)} />
      </div>

      <div className="field-group">
        <div className="field-label">Daily Targets</div>
        <div className="two-col">
          <div>
            <div className="field-label" style={{ marginBottom: 4 }}>Sleep (hrs)</div>
            <input className="text-input" type="number" min="0" max="24" value={sleepTarget} onChange={e => setSleepTarget(Number(e.target.value))} />
          </div>
          <div>
            <div className="field-label" style={{ marginBottom: 4 }}>Water (glasses)</div>
            <input className="text-input" type="number" min="0" max="30" value={waterTarget} onChange={e => setWaterTarget(Number(e.target.value))} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="field-label" style={{ marginBottom: 4 }}>Movement (min/day)</div>
          <input className="text-input" type="number" min="0" max="300" value={movementTarget} onChange={e => setMovementTarget(Number(e.target.value))} />
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Weekly Check-In Day</div>
        <select className="select-field" value={weeklyCheckIn} onChange={e => setWeeklyCheckIn(e.target.value)}>
          {CHECK_IN_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="field-group">
        <div className="field-label">Privacy</div>
        <PrivacySettings privacy={privacy} onChange={setPrivacy} />
      </div>

      <div className="ob-actions">
        <button className="btn-next" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? "Finishing up…" : "Finish Setup →"}
        </button>
      </div>
    </>
  );
}
