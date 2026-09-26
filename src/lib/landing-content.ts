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
    photo: null as Photo, // ex.: { src: "/landing/personal.jpg", alt: "Foto do Personal Trainer" }
    example: true,
  },

  about: {
    title: "Sobre mim",
    // Parágrafos da história profissional.
    story: [
      "Aqui entra a história do Personal: como começou, o que o motivou a trabalhar com treinamento e o que o diferencia.",
      "Um segundo parágrafo pode falar da experiência com alunos, formação e da forma de trabalhar.",
    ],
    // Números de destaque (ex.: anos de experiência, alunos acompanhados). Só números reais.
    stats: [
      { value: "00", label: "anos de experiência" },
      { value: "00", label: "alunos acompanhados" },
      { value: "CREF", label: "000000-G/UF" },
    ],
    specialties: ["Hipertrofia", "Emagrecimento", "Condicionamento físico", "Treino para iniciantes"],
    methodology: [
      { title: "Avaliação", text: "Entendo seu ponto de partida: medidas, composição corporal, histórico e objetivo." },
      { title: "Planejamento", text: "Monto seu treino sob medida, com séries, cargas e técnicas adequadas a você." },
      { title: "Acompanhamento", text: "Acompanho cada treino, seu feedback semanal e ajusto o plano quando preciso." },
    ],
    goals: "Aqui entra o objetivo do trabalho do Personal: o que ele quer proporcionar aos alunos.",
    example: true,
  },

  // Resultados reais de alunos (com autorização). Enquanto vazio, mostra exemplos marcados.
  results: [
    {
      name: "Aluno(a) exemplo 1",
      goal: "Emagrecimento",
      duration: "0 meses de acompanhamento",
      description: "Descrição curta do resultado alcançado, com números reais da avaliação.",
      before: null as Photo,
      after: null as Photo,
      example: true,
    },
    {
      name: "Aluno(a) exemplo 2",
      goal: "Hipertrofia",
      duration: "0 meses de acompanhamento",
      description: "Descrição curta do resultado alcançado, com números reais da avaliação.",
      before: null as Photo,
      after: null as Photo,
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
    whatsapp: null as string | null, // só números com DDI e DDD, ex.: "5511999999999"
    whatsappMessage: "Olá! Vim pelo site e quero saber mais sobre o acompanhamento.",
    email: null as string | null,
    city: null as string | null, // ex.: "São Paulo · SP" ou "Online e presencial"
    others: [] as { label: string; href: string }[], // ex.: [{ label: "YouTube", href: "https://..." }]
  },
};
