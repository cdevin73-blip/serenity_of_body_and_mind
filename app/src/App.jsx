import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { RequireAuth, RequireOnboarding, RequireRole, RootRedirect } from "./routes/Guards";
import { CSS } from "./lib/styles";
import { AuthPage } from "./routes/AuthPage";
import { OnboardingLayout } from "./routes/onboarding/OnboardingLayout";
import { AgreementStep } from "./routes/onboarding/AgreementStep";
import { QuizStep } from "./routes/onboarding/QuizStep";
import { SettingsStep } from "./routes/onboarding/SettingsStep";
import { ClientApp } from "./routes/client/ClientApp";
import { CoachApp } from "./routes/coach/CoachApp";

export default function App() {
  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />

              <Route element={<RequireAuth />}>
                <Route element={<RequireOnboarding />}>
                  <Route path="/onboarding" element={<OnboardingLayout />}>
                    <Route index element={<Navigate to="agreement" replace />} />
                    <Route path="agreement" element={<AgreementStep />} />
                    <Route path="quiz/learning-style" element={<QuizStep quizKey="learning_style" />} />
                    <Route path="quiz/motivation" element={<QuizStep quizKey="motivation" />} />
                    <Route path="settings" element={<SettingsStep />} />
                  </Route>

                  <Route element={<RequireRole role="client" />}>
                    <Route path="/client/:tab" element={<ClientApp />} />
                    <Route path="/client/:tab/:section" element={<ClientApp />} />
                  </Route>
                </Route>

                <Route element={<RequireRole role="coach" />}>
                  <Route path="/coach" element={<CoachApp />} />
                  <Route path="/coach/reports" element={<CoachApp />} />
                  <Route path="/coach/clients/:clientId/:clientTab" element={<CoachApp />} />
                </Route>

                <Route path="/" element={<RootRedirect />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </div>
    </>
  );
}
