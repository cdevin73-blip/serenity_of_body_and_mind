export function MessageLimitBar({ used, limit }) {
  if (limit === null) return null; // unlimited (active clients)
  if (limit === 0) return (
    <div className="msg-limit-bar">
      <span className="msg-limit-label">💬 Messaging not included in your current plan</span>
      <span style={{fontSize:11,color:"var(--terra)",fontWeight:600,cursor:"pointer"}}>Upgrade →</span>
    </div>
  );
  return (
    <div className="msg-limit-bar">
      <span className="msg-limit-label">💬 {used} of {limit} messages used this week</span>
      <div className="msg-limit-dots">
        {Array.from({length: limit}, (_,i) => (
          <div key={i} className={`msg-dot${i < used ? " used" : ""}`}/>
        ))}
      </div>
    </div>
  );
}
