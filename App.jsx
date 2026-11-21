import { useEffect, useState } from "react";
import { supabase, configured } from "./lib/supabase.js";
import { tr } from "./i18n.js";
import { useTheme } from "./theme.js";
import AuthScreen from "./components/AuthScreen.jsx";
import Shell from "./components/Shell.jsx";
import Notice from "./components/Notice.jsx";

export default function App() {
  const theme = useTheme();
  const [session, setSession] = useState(undefined); // undefined = a carregar
  const [profile, setProfile] = useState(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!configured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setBlocked(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data || data.status !== "active") setBlocked(true);
        else {
          setProfile(data);
          setBlocked(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (!configured) {
    return <Notice title={tr("setup.title")} body={tr("setup.body")} />;
  }
  if (session === undefined) return <div className="splash" aria-busy="true" />;
  if (!session) return <AuthScreen />;
  if (blocked) {
    return (
      <Notice
        title={tr("revoked.title")}
        body={tr("revoked.body")}
        action={{ label: tr("profile.signOut"), onClick: () => supabase.auth.signOut() }}
      />
    );
  }
  if (!profile) return <div className="splash" aria-busy="true" />;

  return <Shell profile={profile} setProfile={setProfile} theme={theme} />;
}
