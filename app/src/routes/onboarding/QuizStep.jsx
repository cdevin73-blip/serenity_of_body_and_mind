import { useOutletContext } from "react-router-dom";
import { Quiz } from "../../components/Quiz/Quiz";

const QUIZ_KEY_MAP = { learning_style: "learning", motivation: "motivation" };

const NEXT_STEP = {
  learning_style: { key: "quiz_motivation", path: "/onboarding/quiz/motivation" },
  motivation: { key: "settings", path: "/onboarding/settings" },
};

export function QuizStep({ quizKey }) {
  const { advance } = useOutletContext();
  const next = NEXT_STEP[quizKey];

  return (
    <Quiz
      quizKey={QUIZ_KEY_MAP[quizKey]}
      mode="onboarding"
      doneLabel="Continue →"
      onDone={() => advance(next.key, next.path)}
    />
  );
}
