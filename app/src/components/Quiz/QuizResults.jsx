import { CHART_COLORS } from "../../lib/quizzes";

export function QuizResults({ quizDef, scores, primaryStyle, totalQuestions, onRetake, onDone, doneLabel, readOnly }) {
  const primaryKeys = (primaryStyle || "").split(",").filter(Boolean);
  const sortedStyles = [...quizDef.styles].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));

  return (
    <>
      <div className="quiz-results-header">
        <div className="quiz-results-icon">✨</div>
        <div className="section-label" style={{ textAlign: "center" }}>{quizDef.title} Results</div>
        <div className="quiz-results-style">
          {primaryKeys.map(k => quizDef.profiles[k]?.label).join(" & ")}
        </div>
      </div>

      {primaryKeys.map(k => (
        <div className="quiz-results-summary" key={k}>{quizDef.profiles[k]?.summary}</div>
      ))}

      <div className="section-label">Score Breakdown</div>
      <div style={{ marginBottom: 24 }}>
        {sortedStyles.map(styleKey => {
          const count = scores[styleKey] || 0;
          const pct = Math.round((count / totalQuestions) * 100);
          const color = CHART_COLORS[quizDef.styles.indexOf(styleKey)];
          return (
            <div className="quiz-bar-row" key={styleKey}>
              <span className="quiz-bar-swatch" style={{ background: color }} />
              <span className="quiz-bar-label">{quizDef.profiles[styleKey]?.label}</span>
              <div className="quiz-bar-track">
                <div className="quiz-bar-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
              <span className="quiz-bar-val">{pct}%</span>
            </div>
          );
        })}
      </div>

      <div className="section-label">Coaching Notes</div>
      {primaryKeys.map(k => (
        <ul className="quiz-tip-list" key={k}>
          {quizDef.profiles[k]?.tips.map((tip, i) => <li key={i}>{tip}</li>)}
        </ul>
      ))}

      {!readOnly && (
        <div className="quiz-results-actions">
          {onRetake && <button className="btn-back" onClick={onRetake}>Retake Quiz</button>}
          {onDone && <button className="btn-next" onClick={onDone}>{doneLabel || "Done"}</button>}
        </div>
      )}
    </>
  );
}
