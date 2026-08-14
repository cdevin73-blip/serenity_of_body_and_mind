import { HABITS } from "./constants";

// Use local date not UTC - prevents yesterday's date showing in Pacific time
export const today = new Date();
export const todayKey = today.getFullYear() + "-" +
  String(today.getMonth()+1).padStart(2,"0") + "-" +
  String(today.getDate()).padStart(2,"0");
export const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function getWeekDays(n=7) {
  return Array.from({length:n},(_,i)=>{
    const d=new Date(today); d.setDate(today.getDate()-n+1+i);
    return {key:d.toISOString().split("T")[0], label:dayNames[d.getDay()]};
  });
}

export function getCompletion(dayData) {
  if(!dayData) return 0;
  const total=HABITS.reduce((s,h)=>s+Math.min(1,(dayData[h.id]||0)/h.target),0);
  return Math.round((total/HABITS.length)*100);
}

export function getStreak(history) {
  let streak=0;
  for(let d=0;d<60;d++){
    const date=new Date(today); date.setDate(today.getDate()-d);
    const key=date.toISOString().split("T")[0];
    const dd=history[key];
    if(!dd) break;
    const ok=HABITS.filter(h=>(dd[h.id]||0)>=h.target*0.6).length;
    if(ok>=3) streak++; else break;
  }
  return streak;
}

export function getMonthAvg(history, habitId) {
  const vals=[]; const h=HABITS.find(x=>x.id===habitId);
  for(let d=0;d<30;d++){
    const date=new Date(today); date.setDate(today.getDate()-d);
    const key=date.toISOString().split("T")[0];
    if(history[key]?.[habitId]!==undefined) vals.push(history[key][habitId]);
  }
  if(!vals.length) return 0;
  return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10;
}
