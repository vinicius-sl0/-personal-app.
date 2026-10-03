"use client";

import { useEffect } from "react";
import "@/lib/pwa-install"; // começa a escutar o aviso de instalação do navegador o quanto antes

// Registra o service worker (public/sw.js) — só no site publicado: no `pnpm dev` ele atrapalharia
// a atualização automática das telas.
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      console.error("Service worker:", err);
    });
  }, []);
  return null;
}
