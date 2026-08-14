export function QuizIntro({ title, subtitle, questionCount, onStart }) {
  return (
    <>
      <div className="ob-title">{title}</div>
      <div className="ob-sub">{subtitle}</div>
      <div style={{ fontSize: 13, color: "var(--light)", marginBottom: 24 }}>
        {questionCount} quick questions — takes about 2 minutes.
      </div>
      <div className="ob-actions">
        <button className="btn-next" onClick={onStart}>Start Quiz →</button>
      </div>
    </>
  );
}
