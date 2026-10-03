import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

// App instalável (PWA): nome, cores e ícones que o celular usa ao "Adicionar à tela de início".
// Abre no /login, que leva quem já está conectado direto ao próprio painel.
// Ícones gerados por `pnpm fotos` (scripts/preparar-fotos.mjs) em public/icons/.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: BRAND.name,
    short_name: BRAND.name.split(" ")[0],
    description: BRAND.tagline,
    lang: "pt-BR",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    categories: ["health", "fitness", "sports"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
