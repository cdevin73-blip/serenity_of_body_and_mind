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
