import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";
import { tr } from "./i18n.js";

const supported =
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;
const isIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone =
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true);

function toKey(b64) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function getReg() {
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

async function saveSub(sub) {
  const j = sub.toJSON();
  return supabase.rpc("save_push", {
    p_endpoint: j.endpoint,
    p_p256dh: j.keys.p256dh,
    p_auth_key: j.keys.auth,
  });
}

export default function PushToggle() {
  const [state, setState] = useState("loading"); // loading | unsupported | install | denied | off | on
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let alive = true;
    const set = (s) => alive && setState(s);
    (async () => {
      if (!supported) return set("unsupported");
      if (isIOS && !standalone) return set("install");
      if (Notification.permission === "denied") return set("denied");
      const reg = await getReg();
      const sub = await reg.pushManager.getSubscription();
      if (sub && Notification.permission === "granted") {
        await saveSub(sub);
        return set("on");
      }
      set("off");
    })().catch(() => set("off"));
    return () => {
      alive = false;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setNote("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState(perm === "denied" ? "denied" : "off");
      const { data, error } = await supabase.functions.invoke("push", { body: { action: "key" } });
      if (error || !data?.publicKey) throw error || new Error("sem chave");
      const reg = await getReg();
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: toKey(data.publicKey),
        });
      }
      const res = await saveSub(sub);
      if (res.error) throw res.error;
      setState("on");
    } catch {
      setNote(tr("push.error"));
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setNote("");
    try {
      const reg = await getReg();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setNote(tr("push.error"));
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setNote("");
    const { error } = await supabase.functions.invoke("push", { body: { action: "test" } });
    setBusy(false);
    setNote(error ? tr("push.error") : tr("push.testSent"));
  }

  return (
    <section className="panel stack">
      <h2>{tr("push.title")}</h2>
      {state === "unsupported" && <p className="muted">{tr("push.unsupported")}</p>}
      {state === "install" && <p className="muted">{tr("push.install")}</p>}
      {state === "denied" && <p className="muted">{tr("push.denied")}</p>}
      {state === "off" && (
        <button className="btn" onClick={enable} disabled={busy}>
          {tr("push.enable")}
        </button>
      )}
      {state === "on" && (
        <>
          <p className="muted">{tr("push.on")}</p>
          <button className="btn" onClick={sendTest} disabled={busy}>
            {tr("push.test")}
          </button>
          <button className="btn ghost" onClick={disable} disabled={busy}>
            {tr("push.disable")}
          </button>
        </>
      )}
      {note && (
        <p className="muted" role="status">
          {note}
        </p>
      )}
    </section>
  );
}
