export function LoadingScreen() {
  return (
    <div className="login-wrap">
      <div className="login-card" style={{textAlign:"center"}}>
        <div className="login-logo">Serenity</div>
        <div className="login-tagline">of Body and Mind</div>
        <div style={{marginTop:24,color:"var(--light)",fontSize:14}}>Loading your wellness journey...</div>
        <div style={{marginTop:16,display:"flex",justifyContent:"center",gap:6}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{width:8,height:8,borderRadius:"50%",background:"var(--terra)",opacity:0.4,animation:`pulse 1s ${i*0.2}s infinite`}}/>
          ))}
        </div>
      </div>
    </div>
  );
}
