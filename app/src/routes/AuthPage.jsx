import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

export function AuthPage() {
  const [mode, setMode] = useState("login"); // login | signup | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { loadProfile } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    await loadProfile(data.user);
    navigate("/");
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, role: "client" } }
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setMessage("Check your email to confirm your account, then sign in.");
    setMode("login"); setLoading(false);
  }

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    if (error) { setError(error.message); } else {
      setMessage("Password reset email sent - check your inbox.");
    }
    setLoading(false);
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">Serenity</div>
        <div className="login-tagline">of Body and Mind</div>

        {message && (
          <div style={{background:"rgba(61,125,107,.1)",border:"1px solid rgba(61,125,107,.3)",borderRadius:12,padding:"12px 16px",marginBottom:16,fontSize:13,color:"var(--sage)",lineHeight:1.5}}>
            {message}
          </div>
        )}
        {error && (
          <div style={{background:"rgba(220,80,60,.08)",border:"1px solid rgba(220,80,60,.25)",borderRadius:12,padding:"12px 16px",marginBottom:16,fontSize:13,color:"#C03020",lineHeight:1.5}}>
            {error}
          </div>
        )}

        {mode === "login" && (
          <>
            <div className="section-label" style={{marginBottom:12}}>Sign in to your account</div>
            <input className="select-field" type="email" placeholder="Email address" value={email}
              onChange={e=>setEmail(e.target.value)} style={{marginBottom:10}}/>
            <input className="select-field" type="password" placeholder="Password" value={password}
              onChange={e=>setPassword(e.target.value)} style={{marginBottom:16}}/>
            <button className="btn-primary" disabled={loading||!email||!password} onClick={handleLogin}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <div style={{textAlign:"center",marginTop:16,display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={()=>{setMode("signup");setError("");setMessage("");}}
                style={{background:"none",border:"none",color:"var(--terra)",fontSize:13,cursor:"pointer",fontFamily:"var(--font)"}}>
                New client? Create account
              </button>
              <button onClick={()=>{setMode("reset");setError("");setMessage("");}}
                style={{background:"none",border:"none",color:"var(--light)",fontSize:12,cursor:"pointer",fontFamily:"var(--font)"}}>
                Forgot password?
              </button>
            </div>
          </>
        )}

        {mode === "signup" && (
          <>
            <div className="section-label" style={{marginBottom:12}}>Create your account</div>
            <input className="select-field" type="text" placeholder="Your full name" value={name}
              onChange={e=>setName(e.target.value)} style={{marginBottom:10}}/>
            <input className="select-field" type="email" placeholder="Email address" value={email}
              onChange={e=>setEmail(e.target.value)} style={{marginBottom:10}}/>
            <input className="select-field" type="password" placeholder="Choose a password (min 8 chars)" value={password}
              onChange={e=>setPassword(e.target.value)} style={{marginBottom:16}}/>
            <button className="btn-primary" disabled={loading||!email||!password||!name} onClick={handleSignup}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
            <div style={{textAlign:"center",marginTop:16}}>
              <button onClick={()=>{setMode("login");setError("");setMessage("");}}
                style={{background:"none",border:"none",color:"var(--light)",fontSize:13,cursor:"pointer",fontFamily:"var(--font)"}}>
                Already have an account? Sign in
              </button>
            </div>
          </>
        )}

        {mode === "reset" && (
          <>
            <div className="section-label" style={{marginBottom:12}}>Reset your password</div>
            <input className="select-field" type="email" placeholder="Email address" value={email}
              onChange={e=>setEmail(e.target.value)} style={{marginBottom:16}}/>
            <button className="btn-primary" disabled={loading||!email} onClick={handleReset}>
              {loading ? "Sending..." : "Send Reset Email"}
            </button>
            <div style={{textAlign:"center",marginTop:16}}>
              <button onClick={()=>{setMode("login");setError("");setMessage("");}}
                style={{background:"none",border:"none",color:"var(--light)",fontSize:13,cursor:"pointer",fontFamily:"var(--font)"}}>
                Back to sign in
              </button>
            </div>
          </>
        )}

        <p style={{fontSize:11,color:"var(--light)",textAlign:"center",marginTop:20,lineHeight:1.6}}>
          Serenity of Body and Mind, LLC<br/>
          <a href="https://serenityofbodyandmind.com" target="_blank" rel="noreferrer" style={{color:"var(--light)"}}>serenityofbodyandmind.com</a>
        </p>
      </div>
    </div>
  );
}
