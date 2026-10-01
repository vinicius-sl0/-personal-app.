"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { submitLead } from "@/lib/lead-actions";
import {
  DAYS,
  EXPERIENCES,
  GOALS,
  MODALITIES,
  leadMessage,
  leadSchema,
  whatsappLink,
  type LeadInput,
} from "@/lib/leads";
import { btnGhostCls, btnPrimaryCls, errorCls, inputCls, labelCls } from "@/lib/ui";
import { WhatsAppIcon } from "@/components/landing/social-icons";

type Answers = Partial<Pick<LeadInput, "goal" | "experience" | "daysPerWeek" | "modality">>;
type ChoiceKey = keyof Answers;

const STEPS: { key: ChoiceKey; title: string; options: { value: string; label: string }[] }[] = [
  { key: "goal", title: "Qual é o seu principal objetivo?", options: [...GOALS] },
  { key: "experience", title: "Como está sua experiência com treino?", options: [...EXPERIENCES] },
  {
    key: "daysPerWeek",
    title: "Quantos dias por semana você consegue treinar?",
    options: DAYS.map((d) => ({ value: String(d), label: `${d} dias` })),
  },
  { key: "modality", title: "Você prefere acompanhamento presencial ou online?", options: [...MODALITIES] },
];
const TOTAL = STEPS.length + 1; // + a tela de nome e WhatsApp

// Perguntas uma por tela (bom no celular). Ao enviar: grava no banco e leva ao WhatsApp do Personal.
export default function LeadWizard({ personalName, whatsapp }: { personalName: string; whatsapp: string | null }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [website, setWebsite] = useState(""); // campo-isca para robôs (escondido)
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ link: string | null } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstName = personalName.split(" ")[0];

  // Leva o foco para o título de cada nova tela (leitores de tela anunciam a pergunta).
  useEffect(() => {
    heading.current?.focus();
  }, [step, done]);

  function choose(key: ChoiceKey, value: string) {
    setAnswers((a) => ({ ...a, [key]: key === "daysPerWeek" ? Number(value) : value }));
    setStep((s) => s + 1);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input = { ...answers, fullName, whatsapp: phone, privacy } as LeadInput;
    const check = leadSchema.safeParse(input);
    if (!check.success) {
      setError(check.error.issues[0]?.message ?? "Confira as respostas.");
      return;
    }

    setSending(true);
    try {
      const res = await submitLead(input, website);
      if (res.error) {
        setError(res.error);
        return;
      }
      const link = whatsapp ? whatsappLink(whatsapp, leadMessage(check.data, firstName)) : null;
      setDone({ link });
      if (link) window.location.href = link; // abre o WhatsApp (app no celular, site no computador)
    } catch (err) {
      console.error("submitLead:", err);
      setError("Falha de conexão ao enviar. Confira sua internet e tente de novo.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <section className="text-center">
        <span aria-hidden className="mx-auto grid size-14 place-items-center rounded-full bg-brand text-brand-contrast">
          <Check className="size-7" strokeWidth={3} />
        </span>
        <h1 ref={heading} tabIndex={-1} className="mt-6 text-3xl font-bold outline-none">
          Respostas enviadas
        </h1>
        {done.link ? (
          <>
            <p className="mt-3 text-soft">
              Agora é só mandar a mensagem no WhatsApp para conversar com {firstName}. Ela já vai com as suas respostas.
            </p>
            <a href={done.link} className={`${btnPrimaryCls} mt-8`}>
              <WhatsAppIcon /> Abrir o WhatsApp
            </a>
          </>
        ) : (
          <p className="mt-3 text-soft">
            {firstName} recebeu suas respostas e vai chamar você no WhatsApp que você informou.
          </p>
        )}
        <Link href="/" className={`${btnGhostCls} mt-4`}>
          Voltar ao site
        </Link>
      </section>
    );
  }

  const current = STEPS[step];

  return (
    <div>
      {/* Progresso */}
      <div className="mb-8">
        <p className="mb-2 text-sm text-muted">
          Pergunta {step + 1} de {TOTAL}
        </p>
        <div aria-hidden className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${TOTAL}, 1fr)` }}>
          {Array.from({ length: TOTAL }, (_, i) => (
            <span key={i} className={`h-1.5 rounded-full ${i <= step ? "bg-brand" : "bg-steel"}`} />
          ))}
        </div>
      </div>

      {current ? (
        <div key={current.key}>
          <h1 ref={heading} id="pergunta" tabIndex={-1} className="text-[1.75rem] font-bold leading-tight outline-none sm:text-3xl">
            {current.title}
          </h1>
          <div
            role="group"
            aria-labelledby="pergunta"
            className={`mt-6 grid gap-2.5 ${current.key === "daysPerWeek" ? "grid-cols-5" : ""}`}
          >
            {current.options.map((o) => {
              const selected = String(answers[current.key] ?? "") === o.value;
              const isDays = current.key === "daysPerWeek";
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={selected}
                  aria-label={isDays ? o.label : undefined}
                  onClick={() => choose(current.key, o.value)}
                  className={`flex items-center gap-3 rounded-[10px] border text-left transition-colors ${
                    isDays ? "h-20 flex-col justify-center gap-0 text-center" : "min-h-14 px-4 py-3"
                  } ${selected ? "border-brand bg-brand-soft" : "border-line-strong bg-card hover:border-chrome"}`}
                >
                  {isDays ? (
                    <>
                      <span className="font-display text-3xl font-bold leading-none tabular-nums">{o.value}</span>
                      <span className="mt-1 text-xs text-muted">dias</span>
                    </>
                  ) : (
                    <>
                      <span
                        aria-hidden
                        className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                          selected ? "border-brand bg-brand" : "border-field"
                        }`}
                      >
                        {selected && <span className="size-2 rounded-full bg-brand-contrast" />}
                      </span>
                      <span className="text-lg font-medium">{o.label}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <h1 ref={heading} tabIndex={-1} className="text-[1.75rem] font-bold leading-tight outline-none sm:text-3xl">
            Para {firstName} falar com você
          </h1>
          <div className="mt-6 space-y-4">
            <label className="block space-y-1.5">
              <span className={labelCls}>Seu nome</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                maxLength={120}
                className={inputCls}
              />
            </label>
            <label className="block space-y-1.5">
              <span className={labelCls}>Seu WhatsApp, com DDD</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(11) 99999-9999"
                maxLength={20}
                className={inputCls}
              />
            </label>
            {/* Isca para robôs: invisível para pessoas e leitores de tela */}
            <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
              <label>
                Site
                <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-soft">
              <input
                type="checkbox"
                checked={privacy}
                onChange={(e) => setPrivacy(e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]"
              />
              <span>
                Li a{" "}
                <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline">
                  Política de Privacidade
                </a>{" "}
                e concordo que {firstName} guarde estas respostas para entrar em contato comigo.
              </span>
            </label>
          </div>

          {error && (
            <div role="alert" className={`${errorCls} mt-5`}>
              {error}
            </div>
          )}

          <button type="submit" disabled={sending} className={`${btnPrimaryCls} mt-6`}>
            {whatsapp && <WhatsAppIcon />}
            {sending ? "Enviando..." : whatsapp ? "Enviar e abrir o WhatsApp" : "Enviar respostas"}
          </button>
        </form>
      )}

      {step > 0 && (
        <button type="button" onClick={() => { setError(null); setStep((s) => s - 1); }} className={`${btnGhostCls} mt-6 -ml-3`}>
          <ArrowLeft aria-hidden className="size-4" />
          Voltar
        </button>
      )}
    </div>
  );
}
