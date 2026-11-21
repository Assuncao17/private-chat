import { useState } from "react";
import { tr } from "../i18n.js";
import Icon from "./Icon.jsx";
import Profile from "./Profile.jsx";
import Admin from "./Admin.jsx";

function Empty({ title, body }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p className="muted">{body}</p>
    </div>
  );
}

export default function Shell({ profile, setProfile, theme }) {
  const [tab, setTab] = useState("chats");

  const tabs = [
    { id: "chats", icon: "chat", label: tr("tab.chats") },
    { id: "contacts", icon: "users", label: tr("tab.contacts") },
    ...(profile.role === "admin" ? [{ id: "admin", icon: "shield", label: tr("tab.admin") }] : []),
    { id: "profile", icon: "user", label: tr("tab.profile") },
  ];
  const current = tabs.find((t) => t.id === tab);

  return (
    <div className="shell">
      <header className="topbar">
        <h1>{current.label}</h1>
      </header>

      <main className="content">
        {tab === "chats" && <Empty title={tr("chats.emptyTitle")} body={tr("chats.emptyBody")} />}
        {tab === "contacts" && (
          <Empty title={tr("contacts.emptyTitle")} body={tr("contacts.emptyBody")} />
        )}
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
