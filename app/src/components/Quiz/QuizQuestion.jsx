const LETTERS = ["A", "B", "C", "D", "E"];

export function QuizQuestion({ question, index, total, selected, onSelect, onBack, onNext, canGoBack }) {
  return (
    <>
      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>
      <div className="section-label">Question {index + 1} of {total}</div>
      <div className="quiz-q">
        <div className="quiz-q-text">{question.text}</div>
        <div className="quiz-options">
          {question.options.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              className={`quiz-option${selected === opt.value ? " sel" : ""}`}
              onClick={() => onSelect(opt.value)}
            >
              <span className="quiz-option-letter">{LETTERS[i]}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="ob-actions">
        {canGoBack && <button className="btn-back" onClick={onBack}>← Back</button>}
        <button className="btn-next" disabled={!selected} onClick={onNext}>
          {index + 1 === total ? "See Results →" : "Next →"}
        </button>
      </div>
    </>
  );
}
