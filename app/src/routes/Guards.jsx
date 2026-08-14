import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoadingScreen } from "../components/LoadingScreen";

export function RequireAuth() {
  const { session, profile, loading } = useAuth();
  if (loading) return <LoadingScreen/>;
  if (!session) return <Navigate to="/auth" replace/>;
  if (!profile) return <Navigate to="/onboarding" replace/>;
  return <Outlet/>;
}

const ONBOARDING_STEP_PATH = {
  agreement: "/onboarding/agreement",
  quiz_learning_style: "/onboarding/quiz/learning-style",
  quiz_motivation: "/onboarding/quiz/motivation",
  settings: "/onboarding/settings",
};

export function RequireOnboarding() {
  const { profile } = useAuth();
  const location = useLocation();
  const onOnboardingRoute = location.pathname.startsWith("/onboarding");

  if (!profile || profile.role === "coach") return <Outlet/>;

  if (!profile.onboarding_complete) {
    if (!onOnboardingRoute) {
      const target = ONBOARDING_STEP_PATH[profile.onboarding_step] || "/onboarding/agreement";
      return <Navigate to={target} replace/>;
    }
    return <Outlet/>;
  }

  if (onOnboardingRoute) return <Navigate to="/client/journal" replace/>;
  return <Outlet/>;
}

export function RequireRole({ role }) {
  const { profile } = useAuth();
  const effectiveRole = profile?.role === "coach" ? "coach" : "client";
  if (effectiveRole !== role) {
    return <Navigate to={effectiveRole === "coach" ? "/coach" : "/client/journal"} replace/>;
  }
  return <Outlet/>;
}

export function RootRedirect() {
  const { session, profile, loading } = useAuth();
  if (loading) return <LoadingScreen/>;
  if (!session) return <Navigate to="/auth" replace/>;
  if (!profile) return <Navigate to="/onboarding" replace/>;
  return <Navigate to={profile.role === "coach" ? "/coach" : "/client/journal"} replace/>;
}
