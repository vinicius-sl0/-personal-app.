// CONTEÚDO DA PÁGINA INICIAL (landing page) — edite aqui para trocar textos, fotos e contatos.
//
// ⚠️ Tudo marcado com `example: true` é PROVISÓRIO (texto/imagem de exemplo) e aparece na página
// com a etiqueta "Exemplo". Troque pelo material real do Personal e mude para `example: false`.
// Não publique resultados ou depoimentos inventados: eles precisam ser reais e autorizados.
//
// Fotos: coloque os arquivos em /public/landing/ e informe o caminho, ex.: "/landing/personal.jpg".
// Fotos de alunos (antes/depois) SÓ com autorização de uso de imagem para divulgação (LGPD).

import { BRAND } from "@/lib/brand";

export type Photo = { src: string; alt: string } | null; // null = mostra espaço reservado

export const LANDING = {
  // Enquanto true, aparece uma faixa avisando que a página ainda tem conteúdo de exemplo.
  draft: true,
  // Faixa amarela "Página em construção" no topo. Desligada a pedido do usuário (2026-11-09) mesmo com
  // draft: true — o rascunho continua valendo para mostrar os itens marcados como "Exemplo".
  draftBanner: false,

  hero: {
    name: BRAND.name,
    // Nome da marca na landing (rótulo acima do título e topo da página).
    brand: "Marília Ferreira Team",
    // Título comercial: "accent" aparece em laranja.
    headline: { lead: "Treino pensado", accent: "para você.", tail: "Acompanhamento de perto." },
    description:
      "Treino individualizado, avaliações físicas e feedback semanal, com a sua evolução acompanhada pelo app no seu celular.",
    photo: { src: "/landing/personal-2.webp", alt: "Marília Ferreira, Personal Trainer, apontando para quem vê, na academia" } as Photo,
    example: false,
  },

  // Faixas de texto que passam entre a primeira tela e os benefícios (só o que o serviço oferece).
  ribbon: ["Treino individualizado", "Avaliação física", "Feedback semanal", "Evolução medida", "Acompanhamento contínuo"],

  about: {
    title: "Conheça a Marília",
    photo: { src: "/landing/personal.webp", alt: "Marília Ferreira sorrindo na academia" } as Photo,
    // Parágrafos da história profissional.
    story: [
      "Olá! Sou Marília Ferreira, personal trainer formada, CREF 013060-G/CE, e há mais de 10 anos transformo vidas por meio do exercício físico personalizado e da construção de hábitos mais saudáveis.",
      "Acredito que os resultados vão muito além da estética: envolvem saúde, autoestima, força, disposição e qualidade de vida.",
      "Por isso, cada planejamento é elaborado de forma individualizada, respeitando seus objetivos, suas necessidades e sua realidade. Aqui, você terá um treinamento pensado para você, com orientação, acompanhamento e estratégias para evoluir com segurança e consistência.",
    ],
    // Números de destaque (ex.: anos de experiência, alunos acompanhados). Só números reais.
    stats: [
      { value: "10", label: "anos de experiência" },
      { value: "30", label: "alunos acompanhados" },
      { value: "013060-G/CE", label: "CREF" },
    ],
    specialties: ["Hipertrofia", "Emagrecimento", "Condicionamento físico", "Treino para iniciantes"],
    goals: "Meu compromisso é ajudar você a superar seus limites, desenvolver sua melhor versão e construir resultados que façam sentido não apenas hoje, mas ao longo da sua vida.",
    example: false,
  },

  // Resultados reais de alunos (com autorização). Enquanto vazio, mostra exemplos marcados.
  results: [
    {
      // Fotos reais (resultado1). Falta: nome, objetivo, tempo e resultado com números reais.
      // Só publicar com a autorização de uso de imagem assinada pela aluna/aluno.
      name: "Aluno(a) exemplo 1",
      goal: "Emagrecimento",
      duration: "0 meses de acompanhamento",
      description: "Descrição curta do resultado alcançado, com números reais da avaliação.",
      before: { src: "/landing/resultados/resultado1-antes.webp", alt: "Resultado de aluno: antes" } as Photo,
      after: { src: "/landing/resultados/resultado1-depois.webp", alt: "Resultado de aluno: depois" } as Photo,
      example: true,
    },
    {
      name: "Aluno(a) exemplo 2",
      goal: "Hipertrofia",
      duration: "0 meses de acompanhamento",
      description: "Descrição curta do resultado alcançado, com números reais da avaliação.",
      before: { src: "/landing/resultados/resultado2-antes.webp", alt: "Resultado de aluno: antes" } as Photo,
      after: { src: "/landing/resultados/resultado2-depois.webp", alt: "Resultado de aluno: depois" } as Photo,
      example: false,
    },
    {
      name: "Aluno(a) exemplo 3",
      goal: "Condicionamento",
      duration: "0 meses de acompanhamento",
      description: "Descrição curta do resultado alcançado, com números reais da avaliação.",
      before: { src: "/landing/resultados/resultado3-antes.webp", alt: "Resultado de aluno: antes" } as Photo,
      after: { src: "/landing/resultados/resultado3-depois.webp", alt: "Resultado de aluno: depois" } as Photo,
      example: false,
    },
  ],

  // Benefícios: descrevem o que o acompanhamento e a plataforma realmente oferecem (não são exemplos).
  // "icon" escolhe o ícone em src/components/landing/sections/benefits.tsx.
  benefits: [
    { icon: "target", title: "Treinos individualizados", text: "Fichas montadas para o seu objetivo, o seu nível e a sua rotina, com o vídeo de cada exercício. Nada de treino genérico." },
    { icon: "assessment", title: "Avaliações físicas", text: "Medidas e composição corporal registradas, com gráficos de uma avaliação para a outra." },
    { icon: "chat", title: "Acompanhamento contínuo", text: "Contato direto pelo chat do app, com texto, foto e áudio." },
    { icon: "plan", title: "Planejamento personalizado", text: "Séries, cargas, descanso e técnicas definidos para você e ajustados quando preciso." },
    { icon: "feedback", title: "Feedback semanal", text: "Toda semana você conta como foram os treinos, a disposição e as dificuldades. Eu respondo e ajusto." },
    { icon: "chart", title: "Monitoramento da evolução", text: "Frequência dos treinos, fotos de progresso (só com a sua autorização), volume de treino e avaliações em um só lugar." },
  ],

  // Comparativo "O jeito comum de treinar X Marília Team". Sem citar nem depreciar outros profissionais.
  comparison: {
    common: [
      "Treinos genéricos, iguais para todo mundo",
      "Sem alguém acompanhando de perto",
      "Sem planejamento para o seu objetivo",
      "Difícil saber se está evoluindo",
      "Dúvidas sem ter a quem perguntar",
    ],
    team: [
      "Treinos individualizados",
      "Planejamento de acordo com os seus objetivos",
      "Avaliações físicas com acompanhamento dos números",
      "Evolução acompanhada com gráficos e fotos",
      "Feedback semanal e orientação contínua",
    ],
  },

  // "Como funciona o acompanhamento": a jornada do aluno, na ordem real. "icon" em sections/journey.tsx.
  journey: [
    { icon: "signup", title: "Cadastro inicial", text: "Você responde 4 perguntas rápidas e continuamos a conversa pelo WhatsApp. Combinado o acompanhamento, você recebe o convite para ativar a sua conta." },
    { icon: "assessment", title: "Avaliação física", text: "Registro o seu ponto de partida: medidas, composição corporal, histórico e objetivo." },
    { icon: "plan", title: "Planejamento individualizado", text: "Monto a sua ficha sob medida, com séries, repetições, cargas, descanso e técnicas adequadas a você." },
    { icon: "workout", title: "Execução dos treinos", text: "No app, você faz o check-in, vê o vídeo de cada exercício e registra cada série." },
    { icon: "feedback", title: "Feedback e acompanhamento", text: "Toda semana você responde o Feedback semanal, e a gente conversa pelo chat sempre que precisar." },
    { icon: "chart", title: "Monitoramento da evolução", text: "Avaliações, gráficos, fotos de progresso e frequência mostram a sua evolução, e o plano é ajustado quando preciso." },
  ],

  // Depoimentos reais de alunos (com autorização). A seção só aparece quando houver pelo menos um
  // com `example: false` (os exemplos ficam ocultos mesmo com draft: true).
  testimonials: [
    { quote: "Espaço para um depoimento real de aluno sobre a experiência com o acompanhamento.", name: "Nome do aluno", detail: "Aluno há 0 meses", example: true },
    { quote: "Outro depoimento real, de preferência mencionando o resultado e a forma de trabalho.", name: "Nome do aluno", detail: "Aluno há 0 meses", example: true },
    { quote: "Um terceiro depoimento ajuda a transmitir confiança para quem está conhecendo o trabalho.", name: "Nome do aluno", detail: "Aluno há 0 meses", example: true },
  ],

  // Contatos: deixe null o que não for usar (o botão não aparece).
  contact: {
    instagram: "https://www.instagram.com/mariliaferreira_trainer/" as string | null, // ex.: "https://instagram.com/usuario"
    whatsapp: "5585986729270" as string | null, // só números com DDI e DDD, ex.: "5511999999999"
    whatsappMessage: "Olá! Vim pelo site e quero saber mais sobre o acompanhamento.",
    email: null as string | null,
    city: null as string | null, // ex.: "São Paulo · SP" ou "Online e presencial"
    others: [] as { label: string; href: string }[], // ex.: [{ label: "YouTube", href: "https://..." }]
  },
};
