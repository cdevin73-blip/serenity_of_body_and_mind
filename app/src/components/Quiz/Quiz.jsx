import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { QUIZZES } from "../../lib/quizzes";
import { QuizIntro } from "./QuizIntro";
import { QuizQuestion } from "./QuizQuestion";
import { QuizResults } from "./QuizResults";

function scoreAnswers(quizDef, answers) {
  const scores = {};
  quizDef.styles.forEach(s => { scores[s] = 0; });
  quizDef.questions.forEach(q => {
    const val = answers[q.id];
    if (val) scores[val] = (scores[val] || 0) + 1;
  });
  const max = Math.max(...Object.values(scores));
  const primaryStyle = quizDef.styles.filter(s => scores[s] === max).join(",");
  return { scores, primaryStyle };
}

export function Quiz({ quizKey, mode, onDone, doneLabel }) {
  const { session } = useAuth();
  const quizDef = QUIZZES[quizKey];

  const [phase, setPhase] = useState("loading"); // loading | intro | question | results
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null); // { scores, primaryStyle }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadSaved() {
      if (!session?.user) { setPhase("intro"); return; }
      const { data } = await supabase
        .from("quiz_results")
        .select("scores, primary_style")
        .eq("user_id", session.user.id)
        .eq("quiz_type", quizDef.quizType)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setResult({ scores: data.scores, primaryStyle: data.primary_style });
        setPhase("results");
      } else {
        setPhase("intro");
      }
    }
    loadSaved();
    return () => { cancelled = true; };
  }, [session, quizDef.quizType]);

  const currentQuestion = quizDef.questions[currentIndex];

  function selectAnswer(value) {
    setAnswers(a => ({ ...a, [currentQuestion.id]: value }));
  }

  async function finishQuiz(finalAnswers) {
    const { scores, primaryStyle } = scoreAnswers(quizDef, finalAnswers);
    setSaving(true);

    if (session?.user) {
      const { error } = await supabase.from("quiz_results").upsert({
        user_id: session.user.id,
        quiz_type: quizDef.quizType,
        primary_style: primaryStyle,
        scores,
        answers: finalAnswers,
        completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,quiz_type" });
      if (error) console.error("Quiz save error:", error);
    }

    setSaving(false);
    setResult({ scores, primaryStyle });
    setPhase("results");
  }

  function handleNext() {
    if (currentIndex + 1 < quizDef.questions.length) {
      setCurrentIndex(i => i + 1);
    } else {
      finishQuiz(answers);
    }
  }

  function handleBack() {
    setCurrentIndex(i => Math.max(0, i - 1));
  }

  function handleRetake() {
    setAnswers({});
    setCurrentIndex(0);
    setPhase("question");
  }

  if (phase === "loading") return null;

  if (phase === "intro") {
    return (
      <QuizIntro
        title={quizDef.title}
        subtitle={quizDef.subtitle}
        questionCount={quizDef.questions.length}
        onStart={() => setPhase("question")}
      />
    );
  }

  if (phase === "question") {
    return (
      <QuizQuestion
        question={currentQuestion}
        index={currentIndex}
        total={quizDef.questions.length}
        selected={answers[currentQuestion.id] || null}
        onSelect={selectAnswer}
        onBack={handleBack}
        onNext={saving ? () => {} : handleNext}
        canGoBack={currentIndex > 0}
      />
    );
  }

  return (
    <QuizResults
      quizDef={quizDef}
      scores={result.scores}
      primaryStyle={result.primaryStyle}
      totalQuestions={quizDef.questions.length}
      onRetake={mode === "standalone" || mode === "onboarding" ? handleRetake : null}
      onDone={onDone ? () => onDone(result) : null}
      doneLabel={doneLabel}
    />
  );
}
