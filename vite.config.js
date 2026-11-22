import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

// Ficheiros estáticos que ficam na raiz do projeto (sem pastas)
const estaticos = [
  "manifest.webmanifest",
  "icon.svg",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "sw.js",
];

function copiarEstaticos() {
  return {
    name: "copiar-estaticos",
    generateBundle() {
      for (const nome of estaticos) {
        this.emitFile({
          type: "asset",
          fileName: nome,
          source: readFileSync(new URL(`./${nome}`, import.meta.url)),
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copiarEstaticos()],
});
