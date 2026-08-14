import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";

const STEPS = [
  { key: "agreement", path: "/onboarding/agreement", label: "Agreement" },
  { key: "quiz_learning_style", path: "/onboarding/quiz/learning-style", label: "Learning Style" },
  { key: "quiz_motivation", path: "/onboarding/quiz/motivation", label: "Motivation" },
  { key: "settings", path: "/onboarding/settings", label: "Settings" },
];

function stepIndexForPath(pathname) {
  const i = STEPS.findIndex(s => s.path === pathname);
  return i === -1 ? 0 : i;
}

function stepIndexForKey(key) {
  const i = STEPS.findIndex(s => s.key === key);
  return i === -1 ? 0 : i;
}

export function OnboardingLayout() {
  const { session, profile, setProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const storedIndex = stepIndexForKey(profile?.onboarding_step);
  const urlIndex = stepIndexForPath(location.pathname);

  // Don't get ahead of saved progress — navigating backward to a completed step is fine.
  if (urlIndex > storedIndex) {
    return <Navigate to={STEPS[storedIndex].path} replace />;
  }

  async function advance(nextStepKey, nextPath, { complete = false } = {}) {
    if (session?.user) {
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_step: nextStepKey, onboarding_complete: complete })
        .eq("id", session.user.id);
      if (error) console.error("Onboarding step save error:", error);
    }
    setProfile(prev => ({ ...prev, onboarding_step: nextStepKey, onboarding_complete: complete }));
    navigate(nextPath);
  }

  async function handleLogout() {
    await logout();
    navigate("/auth");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", zIndex: 1 }}>
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 999 }}>
        <button onClick={handleLogout} style={{ background: "rgba(0,0,0,.08)", border: "none", borderRadius: 20, padding: "8px 16px", fontSize: 12, cursor: "pointer", color: "#666" }}>
          Sign out
        </button>
      </div>
      <div className="ob-step">
        <div className="ob-progress">
          {STEPS.map((s, i) => <div key={s.key} className={`ob-dot${i <= urlIndex ? " done" : ""}`} />)}
        </div>
        <div className="section-label">Step {urlIndex + 1} of {STEPS.length} — {STEPS[urlIndex].label}</div>
        <Outlet context={{ advance, steps: STEPS, stepIndex: urlIndex }} />
      </div>
    </div>
  );
}
