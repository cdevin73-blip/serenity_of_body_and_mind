import { useState } from "react";
import { SUBSCRIPTION_PLANS } from "../lib/constants";

export function AccessExpiredScreen({ client, onSubscribe }) {
  const [selected, setSelected] = useState(null);
  return (
    <div className="access-screen">
      <div className="access-card">
        <span className="access-icon">🌿</span>
        <div className="access-title">Your program has ended</div>
        <p className="access-sub">
          Thank you for your wellness journey with Serenity of Body and Mind.
          Keep your momentum going — subscribe to continue using the app.
        </p>
        <div className="plan-cards">
          {SUBSCRIPTION_PLANS.map(plan => (
            <div
              key={plan.id}
              className={`plan-card${plan.highlight ? " highlight" : ""}${selected === plan.id ? " highlight" : ""}`}
              onClick={() => setSelected(plan.id)}
            >
              <div className="plan-card-top">
                <div>
                  <span className="plan-name">{plan.name}</span>
                  {plan.highlight && <span className="plan-badge">Recommended</span>}
                </div>
                <span className="plan-price">{plan.price}</span>
              </div>
              <p className="plan-desc">{plan.description}</p>
              <ul className="plan-features">
                {plan.features.map((f,i) => <li key={i}>{f}</li>)}
                {plan.excludes.map((f,i) => <li key={i} className="excluded">{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <button
          className="btn-primary"
          disabled={!selected}
          onClick={() => onSubscribe(selected)}
          style={{fontSize:13,padding:"13px 0"}}
        >
          {selected
            ? `Continue with ${SUBSCRIPTION_PLANS.find(p=>p.id===selected)?.name} →`
            : "Select a plan to continue"}
        </button>
        <p style={{fontSize:11,color:"var(--light)",marginTop:12}}>
          Payments handled securely. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

export function GraceBanner({ daysLeft }) {
  return (
    <div className="grace-banner">
      <span className="grace-banner-icon">⏳</span>
      <div className="grace-banner-text">
        <strong>Grace period — {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining.</strong>
        {" "}Your coaching program has ended but you still have full access.
        Subscribe before your grace period ends to keep your data and continue tracking.
      </div>
    </div>
  );
}

export function ViewOnlyBanner({ onDownload }) {
  return (
    <div className="view-only-banner">
      <div className="view-only-left">
        <span className="view-only-icon">👁️</span>
        <div className="view-only-text">
          <strong>View-only mode.</strong> Your wellness history is preserved and always accessible.
          To track new habits or message your coach, reactivate your subscription.
        </div>
      </div>
      <div style={{display:"flex",gap:8,flexShrink:0}}>
        <button className="btn-download" onClick={onDownload}>📥 Download data</button>
        <button className="btn-secondary" style={{fontSize:12,padding:"9px 16px"}}>Reactivate</button>
      </div>
    </div>
  );
}
