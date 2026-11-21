import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";
import { tr } from "./i18n.js";

function when(iso) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString())
    return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
}

export default function Chats({ onOpen }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data, error } = await supabase.rpc("my_conversations");
      if (!alive) return;
      if (error) return setError(tr("err.load"));
      setError("");
      setItems(data);
    }
    load();
    const channel = supabase
      .channel("inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, load)
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="stack">
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {items && items.length === 0 && (
        <div className="empty">
          <h2>{tr("chats.emptyTitle")}</h2>
          <p className="muted">{tr("chats.emptyBody")}</p>
        </div>
      )}
      <ul className="list">
        {(items || []).map((c) => (
          <li key={c.id}>
            <button
              className="item conv"
              onClick={() => onOpen({ id: c.id, title: c.title, kind: c.kind })}
            >
              <span className="avatar">{(c.title || "?").slice(0, 1).toUpperCase()}</span>
              <span className="conv-main">
                <span className="row between">
                  <strong>{c.title}</strong>
                  <small className="muted">{when(c.last_at)}</small>
                </span>
                <span className="row between">
                  <span className="muted preview">{c.last_body || tr("chats.noMessages")}</span>
                  {c.unread > 0 && <span className="badge">{c.unread}</span>}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
