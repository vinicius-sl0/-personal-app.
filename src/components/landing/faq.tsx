import Link from "next/link";
import { Plus } from "lucide-react";
import { BRAND } from "@/lib/brand";
import s from "./landing.module.css";

// Perguntas frequentes da página inicial. SÓ respostas verdadeiras sobre o funcionamento que já
// existe na plataforma (cadastro, app, treino, avaliação, evolução, contato, dados). Perguntas sobre
// preço, planos ou formato do atendimento ficam de fora até o Personal responder.
const first = BRAND.name.split(" ")[0];

const ITEMS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Como funciona o acompanhamento?",
    a: "Começa com a avaliação física. Depois você recebe a sua ficha no app, treina registrando cada série e, toda semana, responde o Feedback semanal. Eu acompanho tudo e ajusto o plano quando preciso.",
  },
  {
    q: "Como são elaborados os treinos?",
    a: "Sob medida para o seu objetivo, o seu nível e a sua rotina. A ficha é separada por treino (A, B, C...), com séries, repetições, carga, descanso, técnicas e o vídeo de cada exercício.",
  },
  {
    q: "Como funciona a avaliação física?",
    a: "Registro as suas medidas e a sua composição corporal, além do histórico e do objetivo. Os resultados ficam no app, com gráficos que mostram a evolução de uma avaliação para a outra.",
  },
  {
    q: "Como faço para começar?",
    a: (
      <>
        Toque em <strong className="text-ink">Quero ser aluno</strong>, responda 4 perguntas rápidas e continue a conversa comigo pelo
        WhatsApp. Depois de combinarmos, você recebe um convite para ativar a sua conta na plataforma.
      </>
    ),
  },
  {
    q: `Como falo com a ${first}?`,
    a: "Pelo chat do app, com texto, foto e áudio. E toda semana você responde o Feedback semanal, contando como foi a sua semana de treinos.",
  },
  {
    q: "Como acompanho a minha evolução?",
    a: "Pelas avaliações físicas com gráficos, pelas fotos de progresso (só com a sua autorização), pela frequência dos treinos e pelo volume de treino de cada grupo muscular.",
  },
  {
    q: "Preciso instalar algum aplicativo?",
    a: "Não é obrigatório: a plataforma abre no navegador do celular. Se quiser, dá para instalar o app na tela inicial e receber avisos de treino e de mensagens.",
  },
  {
    q: "Os meus dados ficam protegidos?",
    a: (
      <>
        Sim. Dados de saúde e fotos só são usados com a sua autorização, seguindo a LGPD. Veja os detalhes na{" "}
        <Link href="/privacidade" className="font-medium text-ink underline">
          Política de Privacidade
        </Link>
        .
      </>
    ),
  },
];

// Abre e fecha com o próprio navegador (<details>): funciona sem JavaScript e com teclado.
// Onde o navegador permite, a abertura é animada (ver .faq no landing.module.css).
export default function Faq() {
  return (
    <div className={`space-y-3 ${s.faq}`}>
      {ITEMS.map((item) => (
        <details
          key={item.q}
          className="group rounded-2xl border border-line bg-card/80 transition-colors open:border-line-strong open:bg-card hover:border-line-strong"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-5 font-display text-lg font-semibold sm:px-6 [&::-webkit-details-marker]:hidden">
            {item.q}
            <span
              aria-hidden
              className="grid size-9 shrink-0 place-items-center rounded-full border border-line-strong text-brand-ink transition-[transform,background-color,border-color,color] duration-300 group-open:rotate-45 group-open:border-brand group-open:bg-brand group-open:text-brand-contrast"
            >
              <Plus className="size-4" />
            </span>
          </summary>
          <p className="px-5 pb-6 leading-relaxed text-soft sm:px-6">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
