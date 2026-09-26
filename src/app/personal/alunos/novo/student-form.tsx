"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import InviteLink from "@/components/invite-link";
import { btnPrimaryCls, btnSecondaryCls, errorCls, inputCls } from "@/lib/ui";
import { WEEKDAYS } from "@/lib/attendance";
import { createStudent, type StudentFormState } from "../actions";

const initialState: StudentFormState = {};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

export default function StudentForm() {
  const [state, formAction, pending] = useActionState(createStudent, initialState);

  if (state.inviteUrl && state.studentName) {
    return (
      <div className="space-y-4">
        <p className="text-sm">Aluno cadastrado com sucesso. Envie o link abaixo para ele:</p>
        <InviteLink url={state.inviteUrl} name={state.studentName} />
        <div className="flex gap-2">
          <Link href="/personal/alunos/novo" className={btnSecondaryCls} prefetch={false}>
            Cadastrar outro
          </Link>
          <Link href="/personal/alunos" className={btnSecondaryCls}>
            Ver lista de alunos
          </Link>
        </div>
      </div>
    );
  }

  return (
    // onSubmit em vez de action={...}: assim o React não apaga o que foi digitado quando volta um erro.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="space-y-4"
      noValidate
    >
      <Field label="Nome completo">
        <input name="full_name" required autoComplete="off" className={inputCls} />
      </Field>

      <Field label="E-mail" hint="O aluno usará este e-mail para entrar. Ele não poderá ser trocado depois.">
        <input name="email" type="email" inputMode="email" required autoComplete="off" className={inputCls} />
      </Field>

      <Field label="Telefone / WhatsApp (opcional)">
        <input name="phone" type="tel" inputMode="tel" autoComplete="off" className={inputCls} />
      </Field>

      <Field label="Data de nascimento" hint="Necessária para aplicar as regras de menores de idade.">
        <input name="birth_date" type="date" required className={inputCls} />
      </Field>

      <Field label="Sexo">
        <select name="sex" defaultValue="nao_informado" className={inputCls}>
          <option value="nao_informado">Não informar</option>
          <option value="feminino">Feminino</option>
          <option value="masculino">Masculino</option>
          <option value="outro">Outro</option>
        </select>
      </Field>

      <Field label="Objetivo (opcional)">
        <textarea
          name="goal"
          rows={3}
          className={`${inputCls} h-auto py-2`}
          placeholder="Ex.: emagrecimento, ganho de massa, condicionamento"
        />
      </Field>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Dias de treino (opcional)</legend>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w) => (
            <label key={w.value} className="cursor-pointer">
              <input type="checkbox" name="training_days" value={w.value} aria-label={w.long} className="peer sr-only" />
              <span className="flex h-11 items-center justify-center rounded-lg border border-zinc-300 text-xs font-semibold transition peer-checked:border-zinc-900 peer-checked:bg-zinc-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-900/30 dark:border-zinc-700 dark:peer-checked:border-zinc-100 dark:peer-checked:bg-zinc-100 dark:peer-checked:text-zinc-900">
                {w.short}
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          Usados na Frequência para marcar faltas. Pode deixar em branco e definir depois.
        </p>
      </fieldset>

      <details className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <summary className="cursor-pointer text-sm font-medium">
          Responsável legal (obrigatório para menores de 18 anos)
        </summary>
        <div className="mt-3 space-y-4">
          <Field label="Nome do responsável">
            <input name="guardian_name" autoComplete="off" className={inputCls} />
          </Field>
          <Field label="E-mail do responsável">
            <input name="guardian_email" type="email" autoComplete="off" className={inputCls} />
          </Field>
          <Field label="Telefone do responsável">
            <input name="guardian_phone" type="tel" autoComplete="off" className={inputCls} />
          </Field>
        </div>
      </details>

      {state.error && <p role="alert" className={errorCls}>{state.error}</p>}

      <button type="submit" disabled={pending} className={btnPrimaryCls}>
        {pending ? "Cadastrando..." : "Cadastrar e gerar convite"}
      </button>
    </form>
  );
}
