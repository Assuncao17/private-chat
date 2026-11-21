import { useEffect, useState } from "react";
import { supabase, MAX_MEMBERS } from "../lib/supabase.js";
import { tr } from "../i18n.js";

function Seats({ used }) {
  return (
    <div className="seats" aria-hidden="true">
      {Array.from({ length: MAX_MEMBERS }, (_, i) => (
        <span key={i} className={i < used ? "seat on" : "seat"} />
      ))}
    </div>
  );
}

function inviteStatus(inv) {
  if (inv.used_at) return "used";
  if (inv.revoked) return "revoked";
  return "available";
}

export default function Admin({ profile }) {
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  async function load() {
    const [m, i] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, role, status, created_at")
        .order("created_at"),
      supabase
        .from("invites")
        .select("id, code, used_at, revoked, created_at")
        .order("created_at", { ascending: false }),
    ]);
    if (m.error || i.error) return setError(tr("err.load"));
    setMembers(m.data);
    setInvites(i.data);
  }

  useEffect(() => {
    load();
  }, []);

  const used = members.length;
  const free = MAX_MEMBERS - used;
  const pending = invites.filter((i) => inviteStatus(i) === "available").length;
  const canCreate = pending < free;

  async function createInvite() {
    setBusy(true);
    setError("");
    const { data, error } = await supabase
      .from("invites")
      .insert({ created_by: profile.id })
      .select("id, code, used_at, revoked, created_at")
      .single();
    setBusy(false);
    if (error) return setError(tr("err.save"));
    setInvites([data, ...invites]);
  }

  async function revoke(id) {
    const { error } = await supabase.from("invites").update({ revoked: true }).eq("id", id);
    if (error) return setError(tr("err.save"));
    setInvites(invites.map((i) => (i.id === id ? { ...i, revoked: true } : i)));
  }

  async function copy(text, key) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(key);
    setTimeout(() => setCopied(""), 1600);
  }

  const linkFor = (code) => `${window.location.origin}/?convite=${code}`;

  return (
    <div className="stack gap-lg">
      <section className="panel stack">
        <div className="row between">
          <h2>{tr("admin.seats")}</h2>
          <span className="muted">
            {free} {tr("admin.seatsFree")}
          </span>
        </div>
        <Seats used={used} />
      </section>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <section className="stack">
        <div className="row between">
          <h2>{tr("admin.invites")}</h2>
          <button className="btn primary small" onClick={createInvite} disabled={busy || !canCreate}>
            {tr("admin.newInvite")}
          </button>
        </div>
        {!canCreate && <p className="hint">{tr("admin.noSeats")}</p>}
        {invites.length === 0 && <p className="muted">{tr("admin.noInvites")}</p>}
        <ul className="list">
          {invites.map((inv) => {
            const status = inviteStatus(inv);
            return (
              <li key={inv.id} className="item stack">
                <div className="row between">
                  <code className="code">{inv.code}</code>
                  <span className={`pill ${status}`}>{tr(`admin.status.${status}`)}</span>
                </div>
                {status === "available" && (
                  <div className="row gap">
                    <button className="btn small" onClick={() => copy(linkFor(inv.code), inv.id + "l")}>
                      {copied === inv.id + "l" ? tr("admin.copied") : tr("admin.copyLink")}
                    </button>
                    <button className="btn small ghost" onClick={() => copy(inv.code, inv.id + "c")}>
                      {copied === inv.id + "c" ? tr("admin.copied") : tr("admin.copyCode")}
                    </button>
                    <button className="btn small ghost danger" onClick={() => revoke(inv.id)}>
                      {tr("admin.revoke")}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="stack">
        <h2>{tr("admin.members")}</h2>
        <ul className="list">
          {members.map((m) => (
            <li key={m.id} className="item row between">
              <div className="row gap">
                <span className="avatar">{(m.display_name || "?").slice(0, 1).toUpperCase()}</span>
                <div>
                  <div>{m.display_name || "—"}</div>
                  <small className="muted">{tr(`admin.role.${m.role}`)}</small>
                </div>
              </div>
              <span className={`pill ${m.status === "active" ? "available" : "revoked"}`}>
                {m.status === "active" ? tr("admin.status.active") : tr("admin.status.inactive")}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
