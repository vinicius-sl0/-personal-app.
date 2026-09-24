import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
