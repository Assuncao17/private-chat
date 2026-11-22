import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase.js";
import { tr } from "./i18n.js";
import Icon from "./Icon.jsx";

const COLS = "id, sender_id, body, created_at, deleted_at";

const hhmm = (iso) =>
  new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

export default function Chat({ conv, profile, onBack }) {
  const [messages, setMessages] = useState([]);
  const [names, setNames] = useState({});
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reads, setReads] = useState({}); // user_id -> última leitura
  const endRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const markRead = () => supabase.rpc("mark_read", { cid: conv.id });

    // Vai buscar o estado atual (mensagens e leituras). Serve no arranque e
    // também quando o telemóvel volta a ficar ativo ou a ligação se refaz.
    async function refresh(first = false) {
      const [m, r] = await Promise.all([
        supabase
          .from("messages")
          .select(COLS)
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("conversation_members").select("user_id, last_read_at").eq("conversation_id", conv.id),
      ]);
      if (!alive) return;
      if (m.error) setError(tr("err.load"));
      else setMessages(m.data.reverse());
      if (r.data) setReads(Object.fromEntries(r.data.map((x) => [x.user_id, x.last_read_at])));
      if (first) setLoading(false);
      markRead();
    }

    supabase
      .from("profiles")
      .select("id, display_name")
      .then(({ data }) => {
        if (alive && data) setNames(Object.fromEntries(data.map((x) => [x.id, x.display_name])));
      });
    refresh(true);

    const filter = `conversation_id=eq.${conv.id}`;
    const channel = supabase
      .channel(`chat-${conv.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter }, ({ new: row }) => {
        setMessages((cur) => (cur.some((x) => x.id === row.id) ? cur : [...cur, row]));
        markRead();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter }, ({ new: row }) => {
        setMessages((cur) => cur.map((x) => (x.id === row.id ? { ...x, ...row } : x)));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversation_members", filter }, ({ new: row }) => {
        setReads((cur) => ({ ...cur, [row.user_id]: row.last_read_at }));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") refresh();
      });

    // No iPhone a ligação em tempo real pára quando a app fica em segundo plano.
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onVisible);
    // Rede de segurança: confere as leituras de vez em quando.
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 15000);

    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onVisible);
      supabase.removeChannel(channel);
    };
  }, [conv.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, loading]);

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    setError("");
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conv.id, sender_id: profile.id, body })
      .select(COLS)
      .single();
    if (error) {
      setText(body);
      return setError(tr("err.send"));
    }
    setMessages((cur) => (cur.some((x) => x.id === data.id) ? cur : [...cur, data]));
  }

  async function remove(id) {
    setSelected(null);
    const when = new Date().toISOString();
    const { error } = await supabase.from("messages").update({ deleted_at: when }).eq("id", id);
    if (error) return setError(tr("err.save"));
    setMessages((cur) => cur.map((x) => (x.id === id ? { ...x, deleted_at: when } : x)));
  }

  // Quem já viu a minha última mensagem
  const others = Object.keys(reads).filter((id) => id !== profile.id);
  const lastMine = [...messages].reverse().find((m) => m.sender_id === profile.id && !m.deleted_at);
  function receipt() {
    if (!lastMine) return "";
    const seen = others.filter((id) => new Date(reads[id]) >= new Date(lastMine.created_at)).length;
    if (conv.kind === "direct") return seen > 0 ? tr("chat.seen") : tr("chat.sent");
    if (seen === 0) return tr("chat.sent");
    return seen >= others.length ? tr("chat.seenAll") : `${tr("chat.seenBy")} ${seen}/${others.length}`;
  }

  return (
    <div className="shell chat">
      <header className="chat-head">
        <button className="icon-btn" onClick={onBack} aria-label={tr("chat.back")}>
          <Icon name="back" />
        </button>
        <span className="avatar">{(conv.title || "?").slice(0, 1).toUpperCase()}</span>
        <h1>{conv.title}</h1>
      </header>

      <main className="messages">
        {!loading && messages.length === 0 && (
          <p className="muted center-text">{tr("chat.empty")}</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === profile.id;
          const deleted = Boolean(m.deleted_at);
          return (
            <div key={m.id} className={`msg ${mine ? "mine" : "theirs"}`}>
              {conv.kind === "group" && !mine && (
                <small className="sender">{names[m.sender_id] || "—"}</small>
              )}
              <div
                className={`bubble ${deleted ? "gone" : ""}`}
                onClick={() => mine && !deleted && setSelected(selected === m.id ? null : m.id)}
              >
                {deleted ? tr("chat.deleted") : m.body}
              </div>
              <small className="time">
                {hhmm(m.created_at)}
                {lastMine && m.id === lastMine.id && <span className="receipt">{receipt()}</span>}
                {selected === m.id && (
                  <button className="link danger" onClick={() => remove(m.id)}>
                    {tr("chat.delete")}
                  </button>
                )}
              </small>
            </div>
          );
        })}
        <div ref={endRef} />
      </main>

      {error && (
        <p className="error chat-error" role="alert">
          {error}
        </p>
      )}

      <form className="composer" onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={tr("chat.placeholder")}
          maxLength={4000}
          autoComplete="off"
          enterKeyHint="send"
        />
        <button className="send" type="submit" disabled={!text.trim()} aria-label={tr("chat.send")}>
          <Icon name="send" />
        </button>
      </form>
    </div>
  );
}
