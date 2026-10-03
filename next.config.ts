import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App instalável: o navegador sempre confere se há versão nova do service worker
  // (sem isso, uma correção no public/sw.js poderia demorar a chegar nos celulares).
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
  // Endereços antigos do "check-in semanal" (renomeado para Feedback semanal)
  // continuam funcionando: quem tiver o link salvo é levado para a página nova.
  async redirects() {
    return [
      { source: "/aluno/checkin", destination: "/aluno/feedback", permanent: false },
      { source: "/personal/checkins", destination: "/personal/feedback", permanent: false },
      { source: "/personal/alunos/:id/checkins", destination: "/personal/alunos/:id/feedback", permanent: false },
    ];
  },
};

export default nextConfig;
