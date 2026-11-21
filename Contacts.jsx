import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";
import { tr } from "./i18n.js";

export default function Contacts({ profile, onOpen }) {
  const [people, setPeople] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, display_name, role, status")
      .eq("status", "active")
      .neq("id", profile.id)
      .order("display_name")
      .then(({ data, error }) => {
        if (error) return setError(tr("err.load"));
        setPeople(data);
      });
  }, [profile.id]);

  async function open(p) {
    setBusy(p.id);
    setError("");
    const { data, error } = await supabase.rpc("start_direct", { other: p.id });
    setBusy("");
    if (error || !data) return setError(tr("err.generic"));
    onOpen({ id: data, title: p.display_name || "—", kind: "direct" });
  }

  return (
    <div className="stack">
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {people && people.length === 0 && (
        <div className="empty">
          <h2>{tr("contacts.emptyTitle")}</h2>
          <p className="muted">{tr("contacts.emptyBody")}</p>
        </div>
      )}
      <ul className="list">
        {(people || []).map((p) => (
          <li key={p.id}>
            <button className="item conv" onClick={() => open(p)} disabled={busy === p.id}>
              <span className="avatar">{(p.display_name || "?").slice(0, 1).toUpperCase()}</span>
              <span className="conv-main">
                <strong>{p.display_name || "—"}</strong>
                <small className="muted">{tr(`admin.role.${p.role}`)}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
