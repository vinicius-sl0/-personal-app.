import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { BRAND } from "@/lib/brand";

// Perguntas frequentes da página inicial. SÓ respostas verdadeiras sobre o funcionamento que já
// existe na plataforma (cadastro, app, treino, evolução, contato, dados). Perguntas sobre preço,
// planos ou formato do atendimento ficam de fora até o Personal responder.
const first = BRAND.name.split(" ")[0];

const ITEMS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Como faço para começar?",
    a: (
      <>
        Toque em <strong>Quero me tornar aluno</strong>, responda 4 perguntas rápidas e continue a conversa comigo pelo
        WhatsApp. Depois de combinarmos, você recebe um convite para ativar a sua conta na plataforma.
      </>
    ),
  },
  {
    q: "Preciso instalar algum aplicativo?",
    a: "Não é obrigatório: a plataforma abre no navegador do celular. Se quiser, dá para instalar o app na tela inicial e receber avisos de treino e de mensagens.",
  },
  {
    q: "Como recebo o meu treino?",
    a: "A sua ficha fica no app, separada por treino (A, B, C...), com séries, repetições, carga, descanso e o vídeo de cada exercício. No dia, você faz o check-in e registra cada série.",
  },
  {
    q: "Como acompanho a minha evolução?",
    a: "Pelas avaliações físicas com gráficos, pelas fotos de progresso (só com a sua autorização), pela frequência dos treinos e pelo volume de treino de cada grupo muscular.",
  },
  {
    q: `Como falo com a ${first}?`,
    a: "Pelo chat do app, com texto, foto e áudio. E toda semana você responde o Feedback semanal, contando como foi a sua semana de treinos.",
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
export default function Faq() {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
      {ITEMS.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display text-lg font-semibold transition-colors hover:bg-subtle sm:px-6 [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDown aria-hidden className="size-5 shrink-0 text-brand-ink transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <p className="px-5 pb-5 leading-relaxed text-soft sm:px-6">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
