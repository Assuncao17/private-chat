import { useState } from "react";
import { supabase } from "./supabase.js";
import { tr } from "./i18n.js";
import PushToggle from "./Push.jsx";

export default function Profile({ profile, setProfile, theme }) {
  const [name, setName] = useState(profile.display_name);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const value = name.trim();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: value })
      .eq("id", profile.id);
    setBusy(false);
    if (error) return setMsg(tr("err.save"));
    setProfile({ ...profile, display_name: value });
    setMsg(tr("profile.saved"));
  }

  const modes = [
    ["system", tr("profile.theme.system")],
    ["light", tr("profile.theme.light")],
    ["dark", tr("profile.theme.dark")],
  ];

  return (
    <div className="stack gap-lg">
      <form onSubmit={save} className="panel stack">
        <label className="field">
          <span>{tr("profile.name")}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <button className="btn" disabled={busy || !name.trim()}>
          {tr("profile.save")}
        </button>
        {msg && <p className="muted" role="status">{msg}</p>}
      </form>

      <section className="panel stack">
        <h2>{tr("profile.theme")}</h2>
        <div className="seg">
          {modes.map(([id, label]) => (
            <button
              key={id}
              className={theme.mode === id ? "on" : ""}
              onClick={() => theme.setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <PushToggle />

      <button className="btn ghost" onClick={() => supabase.auth.signOut()}>
        {tr("profile.signOut")}
      </button>
    </div>
  );
}
