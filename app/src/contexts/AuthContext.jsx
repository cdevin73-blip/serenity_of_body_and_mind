import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user);
      else setLoading(false);
    });

    // Ignore TOKEN_REFRESHED to prevent page resets during polling
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      setSession(session);
      if (session) loadProfile(session.user);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(user) {
    setLoading(true);

    // Retry up to 3 times - profile creation trigger may have a slight delay
    let data = null;
    let error = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      data = result.data;
      error = result.error;
      if (data) break;
      await new Promise(r => setTimeout(r, 1000));
    }

    if (error || !data) {
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || "",
          role: user.user_metadata?.role || "client",
        })
        .select()
        .single();

      if (newProfile) {
        data = newProfile;
      } else {
        setProfile(null);
        setLoading(false);
        return;
      }
    }

    setProfile(data);
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  const value = { session, profile, setProfile, loading, logout, loadProfile };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
