import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";
import { tr } from "./i18n.js";
import Icon from "./Icon.jsx";
import Profile from "./Profile.jsx";
import Admin from "./Admin.jsx";
import Chats from "./Chats.jsx";
import Chat from "./Chat.jsx";
import Contacts from "./Contacts.jsx";

export default function Shell({ profile, setProfile, theme }) {
  const [tab, setTab] = useState("chats");
  const [open, setOpen] = useState(null); // conversa aberta

  const storageKey = `pc-last-${profile.id}`;

  // abre uma conversa pelo id (precisa do nome e do tipo, que vêm da lista)
  async function openById(id) {
    const { data } = await supabase.rpc("my_conversations");
    const c = (data || []).find((x) => x.id === id);
    if (c) setOpen({ id: c.id, title: c.title, kind: c.kind });
  }

  // 1) ao abrir a app: a conversa da notificação, ou a última em que estavas
  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.search).get("c");
    if (fromLink) {
      window.history.replaceState(null, "", "/");
      openById(fromLink);
      return;
    }
    let last = null;
    try {
      last = localStorage.getItem(storageKey);
    } catch {
      last = null;
    }
    if (last) openById(last);
  }, []);

  // 2) notificação tocada com a app já aberta
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (e) => {
      if (e.data?.type === "open-conv" && e.data.id) openById(e.data.id);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  // 3) lembrar a conversa aberta (ao voltar atrás, deixa de ser lembrada)
  useEffect(() => {
    try {
      if (open) localStorage.setItem(storageKey, open.id);
      else localStorage.removeItem(storageKey);
    } catch {
      /* sem armazenamento: ignora */
    }
  }, [open]);

  const tabs = [
    { id: "chats", icon: "chat", label: tr("tab.chats") },
    { id: "contacts", icon: "users", label: tr("tab.contacts") },
    ...(profile.role === "admin" ? [{ id: "admin", icon: "shield", label: tr("tab.admin") }] : []),
    { id: "profile", icon: "user", label: tr("tab.profile") },
  ];
  const current = tabs.find((t) => t.id === tab);

  if (open) return <Chat conv={open} profile={profile} onBack={() => setOpen(null)} />;

  return (
    <div className="shell">
      <header className="topbar">
        <h1>{current.label}</h1>
      </header>

      <main className="content">
        {tab === "chats" && <Chats onOpen={setOpen} />}
        {tab === "contacts" && <Contacts profile={profile} onOpen={setOpen} />}
        {tab === "admin" && <Admin profile={profile} />}
        {tab === "profile" && <Profile profile={profile} setProfile={setProfile} theme={theme} />}
      </main>

      <nav className="tabbar" aria-label="Navegação">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={t.id === tab ? "on" : ""}
            aria-current={t.id === tab ? "page" : undefined}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
