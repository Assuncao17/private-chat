import { useEffect, useState } from "react";

const KEY = "pc-theme";

export function useTheme() {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(KEY) || "system";
    } catch {
      return "system";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (mode === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", mode);
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* ignora */
    }
  }, [mode]);

  return { mode, setMode };
}
