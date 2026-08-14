import { MOODS } from "../lib/constants";

export function HabitCard({habit, value, onChange, idx, readOnly=false}) {
  const pct = Math.min(100, Math.round((value/habit.target)*100));
  return (
    <div className="habit-card" style={{animationDelay:`${idx*0.07}s`}}>
      <div className="habit-header">
        <span className="habit-icon">{habit.icon}</span>
        <div>
          <div className="habit-name">{habit.label}</div>
          <div className="habit-target">Goal: {habit.target} {habit.unit}</div>
        </div>
        {pct>=100 && <span style={{marginLeft:"auto",fontSize:16}}>✅</span>}
      </div>
      {habit.id==="mood" ? (
        <div className="mood-row">
          {MOODS.map((m,mi)=>(
            <button key={mi} className={`mood-btn${value===mi+1?" sel":""}`} onClick={()=>onChange(mi+1)}>{m}</button>
          ))}
        </div>
      ):(
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div className="habit-stepper">
            <button className="step-btn" onClick={()=>onChange(Math.max(0,value-1))} disabled={readOnly} style={{opacity:readOnly?.5:1}}>−</button>
            <span className="step-val">{value}</span>
            <button className="step-btn" onClick={()=>onChange(Math.min(habit.target*2,value+1))} disabled={readOnly} style={{opacity:readOnly?.5:1}}>+</button>
          </div>
          <span className="habit-unit">{habit.unit}</span>
        </div>
      )}
      <div className="progress-bar">
        <div className="progress-fill" style={{width:`${pct}%`,background:habit.color}}/>
      </div>
    </div>
  );
}
