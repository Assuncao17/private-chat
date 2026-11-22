import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

// As fotos são privadas: pedimos um endereço temporário e guardamo-lo em memória.
const cache = new Map(); // caminho -> { url, exp }

async function signedUrl(path) {
  const hit = cache.get(path);
  if (hit && hit.exp > Date.now()) return hit.url;
  const { data, error } = await supabase.storage.from("chat-media").createSignedUrl(path, 3600);
  if (error || !data) throw error || new Error("sem endereço");
  cache.set(path, { url: data.signedUrl, exp: Date.now() + 50 * 60 * 1000 });
  return data.signedUrl;
}

export default function Photo({ path, onOpen }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    signedUrl(path)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [path]);

  if (failed) return <div className="photo ph">Foto indisponível</div>;
  if (!url) return <div className="photo ph" aria-busy="true" />;
  return (
    <img
      className="photo"
      src={url}
      alt="Foto"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(url);
      }}
    />
  );
}
