import { useState } from "react";
import { supabase } from "./supabase.js";
import { tr } from "./i18n.js";
import Logo from "./Logo.jsx";

const inviteFromUrl = new URLSearchParams(window.location.search).get("convite") || "";

export default function AuthScreen() {
  const [mode, setMode] = useState(inviteFromUrl ? "register" : "login");
  const [form, setForm] = useState({ email: "", password: "", name: "", code: inviteFromUrl });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(
        error.message === "Invalid login credentials" ? tr("err.credentials") : tr("err.generic")
      );
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const email = form.email.trim();
      if (mode === "register") {
        const { error } = await supabase.functions.invoke("redeem-invite", {
          body: {
            code: form.code.trim(),
            email,
            password: form.password,
            display_name: form.name.trim(),
          },
        });
        if (error) {
          let message = tr("err.generic");
          try {
            const body = await error.context.json();
            if (body?.error) message = body.error;
          } catch {
            /* mantém a mensagem genérica */
          }
          throw new Error(message);
        }
      }
      await signIn(email, form.password);
      if (inviteFromUrl) window.history.replaceState({}, "", window.location.pathname);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <main className="center">
      <div className="auth">
        <div className="brand">
          <Logo size={56} />
          <h1>Private Chat</h1>
          <p className="muted">{tr("auth.tagline")}</p>
        </div>

        <div className="seg" role="tablist">
          <button
            role="tab"
            aria-selected={!isRegister}
            className={!isRegister ? "on" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            {tr("auth.tab.login")}
          </button>
          <button
            role="tab"
            aria-selected={isRegister}
            className={isRegister ? "on" : ""}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            {tr("auth.tab.register")}
          </button>
        </div>

        <form onSubmit={submit} className="stack">
          {isRegister && (
            <>
              <p className="hint">{tr("auth.registerHint")}</p>
              <label className="field">
                <span>{tr("auth.code")}</span>
                <input
                  value={form.code}
                  onChange={set("code")}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                />
              </label>
              <label className="field">
                <span>{tr("auth.name")}</span>
                <input value={form.name} onChange={set("name")} autoComplete="name" required />
              </label>
            </>
          )}
          <label className="field">
            <span>{tr("auth.email")}</span>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
              autoCapitalize="none"
              required
            />
          </label>
          <label className="field">
            <span>{tr("auth.password")}</span>
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={isRegister ? 8 : undefined}
              required
            />
            {isRegister && <small className="muted">{tr("auth.passwordHint")}</small>}
          </label>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button className="btn primary" disabled={busy}>
            {busy ? tr("auth.busy") : isRegister ? tr("auth.submit.register") : tr("auth.submit.login")}
          </button>
        </form>
      </div>
    </main>
  );
}
