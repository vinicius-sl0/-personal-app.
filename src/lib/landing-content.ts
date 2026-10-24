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

  hero: {
    name: BRAND.name,
    headline: "Treino personalizado para quem quer resultado de verdade.",
    description:
      "Acompanhamento individual, treino montado para o seu objetivo e evolução medida semana a semana — tudo em uma plataforma no seu celular.",
    photo: { src: "/landing/personal.webp", alt: "Marília Ferreira, Personal Trainer, na academia" } as Photo,
    example: false,
  },

  about: {
    title: "Sobre mim",
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
    methodology: [
      { title: "Avaliação", text: "Entendo seu ponto de partida: medidas, composição corporal, histórico e objetivo." },
      { title: "Planejamento", text: "Monto seu treino sob medida, com séries, cargas e técnicas adequadas a você." },
      { title: "Acompanhamento", text: "Acompanho cada treino, seu feedback semanal e ajusto o plano quando preciso." },
    ],
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
      example: true,
    },
    {
      name: "Aluno(a) exemplo 3",
      goal: "Condicionamento",
      duration: "0 meses de acompanhamento",
      description: "Descrição curta do resultado alcançado, com números reais da avaliação.",
      before: null as Photo,
      after: null as Photo,
      example: true,
    },
  ],

  // Benefícios: descrevem o que a plataforma realmente oferece (não são exemplos).
  benefits: [
    { icon: "target", title: "Treino sob medida", text: "Fichas montadas para o seu objetivo, nível e rotina — nada de treino genérico." },
    { icon: "video", title: "Vídeo de cada exercício", text: "Veja como executar cada movimento, com a técnica explicada na hora do treino." },
    { icon: "check", title: "Check-in do treino", text: "Registre cada treino, séries e cargas. Sua frequência fica visível semana a semana." },
    { icon: "chart", title: "Evolução medida", text: "Avaliações físicas, gráficos, fotos de progresso e volume de treino por grupo muscular." },
    { icon: "message", title: "Contato direto", text: "Converse com seu Personal pelo app e envie seu feedback semanal." },
    { icon: "shield", title: "Seus dados protegidos", text: "Informações de saúde e fotos só com a sua autorização, seguindo a LGPD." },
  ],

  // Depoimentos reais de alunos (com autorização). Enquanto exemplos, aparecem marcados.
  testimonials: [
    { quote: "Espaço para um depoimento real de aluno sobre a experiência com o acompanhamento.", name: "Nome do aluno", detail: "Aluno há 0 meses", example: true },
    { quote: "Outro depoimento real, de preferência mencionando o resultado e a forma de trabalho.", name: "Nome do aluno", detail: "Aluno há 0 meses", example: true },
    { quote: "Um terceiro depoimento ajuda a transmitir confiança para quem está conhecendo o trabalho.", name: "Nome do aluno", detail: "Aluno há 0 meses", example: true },
  ],

  // Contatos: deixe null o que não for usar (o botão não aparece).
  contact: {
    instagram: null as string | null, // ex.: "https://instagram.com/usuario"
    whatsapp: "5585992971823" as string | null, // só números com DDI e DDD, ex.: "5511999999999"
    whatsappMessage: "Olá! Vim pelo site e quero saber mais sobre o acompanhamento.",
    email: null as string | null,
    city: null as string | null, // ex.: "São Paulo · SP" ou "Online e presencial"
    others: [] as { label: string; href: string }[], // ex.: [{ label: "YouTube", href: "https://..." }]
  },
};
