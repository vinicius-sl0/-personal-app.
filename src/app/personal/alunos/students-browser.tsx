"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Rows3, Search, Users } from "lucide-react";
import { formatDate, todayIso } from "@/lib/assessment";
import { cardCls, inputCls } from "@/lib/ui";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import InviteButton from "./invite-button";

export type StudentRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: "convidado" | "ativo" | "pausado" | "arquivado";
  goal: string | null;
  createdAt: string;
  lastWorkout: string | null; // AAAA-MM-DD
  lastAssessment: string | null;
};

const STATUS: Record<StudentRow["status"], { label: string; tone: BadgeTone }> = {
  ativo: { label: "Ativo", tone: "success" },
  convidado: { label: "Convite pendente", tone: "warning" },
  pausado: { label: "Pausado", tone: "neutral" },
  arquivado: { label: "Arquivado", tone: "neutral" },
};

const FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "ativo", label: "Ativos" },
  { key: "pausado", label: "Pausados" },
  { key: "convidado", label: "Convites" },
  { key: "arquivado", label: "Arquivados" },
] as const;

const SORTS = [
  { key: "nome", label: "Nome (A–Z)" },
  { key: "treino", label: "Último treino (mais antigo primeiro)" },
  { key: "avaliacao", label: "Última avaliação (mais antiga primeiro)" },
  { key: "recentes", label: "Cadastrados recentemente" },
] as const;

// "há 3 dias", "hoje"... (datas no formato do banco)
function since(iso: string | null) {
  if (!iso) return null;
  const days = Math.round((Date.parse(`${todayIso()}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`)) / 86400000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  return formatDate(iso);
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function StudentsBrowser({ students }: { students: StudentRow[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("todos");
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("nome");
  const [view, setView] = useState<"cards" | "tabela">("cards");

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: students.filter((s) => s.status !== "arquivado").length };
    for (const s of students) c[s.status] = (c[s.status] ?? 0) + 1;
    return c;
  }, [students]);

  const list = useMemo(() => {
    const term = norm(q.trim());
    const byDateAsc = (a: string | null, b: string | null) => (a ?? "0000").localeCompare(b ?? "0000");
    return students
      .filter((s) => (filter === "todos" ? s.status !== "arquivado" : s.status === filter))
      .filter((s) => !term || norm(s.name).includes(term) || norm(s.email).includes(term) || norm(s.goal ?? "").includes(term))
      .sort((a, b) => {
        if (sort === "treino") return byDateAsc(a.lastWorkout, b.lastWorkout);
        if (sort === "avaliacao") return byDateAsc(a.lastAssessment, b.lastAssessment);
        if (sort === "recentes") return b.createdAt.localeCompare(a.createdAt);
        return a.name.localeCompare(b.name, "pt-BR");
      });
  }, [students, q, filter, sort]);

  return (
    <div className="space-y-4">
      {/* Barra de busca, filtro e ordenação */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Buscar aluno</span>
          <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, e-mail ou objetivo"
            className={`${inputCls} pl-10`}
          />
        </label>
        <div className="flex gap-2">
          <label className="flex-1 lg:w-72 lg:flex-none">
            <span className="sr-only">Ordenar por</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={inputCls}>
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <div role="group" aria-label="Forma de exibição" className="hidden rounded-xl border border-line bg-card p-1 md:flex">
            {(
              [
                ["cards", LayoutGrid, "Cards"],
                ["tabela", Rows3, "Tabela"],
              ] as const
            ).map(([key, Icon, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={view === key}
                aria-label={label}
                title={label}
                onClick={() => setView(key)}
                className={`grid size-10 place-items-center rounded-lg transition ${view === key ? "bg-brand text-brand-contrast" : "text-soft hover:bg-subtle"}`}
              >
                <Icon aria-hidden className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div role="group" aria-label="Filtrar por situação" className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              filter === f.key ? "border-brand bg-brand-soft text-ink" : "border-line bg-card text-soft hover:border-line-strong"
            }`}
          >
            {f.label}
            <span className="text-xs tabular-nums text-muted">{counts[f.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {list.length} aluno(s) encontrado(s)
      </p>

      {list.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title={students.length === 0 ? "Nenhum aluno ainda" : "Nenhum aluno encontrado"}
          description={students.length === 0 ? "Clique em “Novo aluno” para cadastrar o primeiro." : "Tente outra busca ou outro filtro."}
        />
      ) : view === "tabela" ? (
        <div className={`${cardCls} overflow-x-auto`}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Aluno</th>
                <th scope="col" className="px-4 py-3 font-medium">Objetivo</th>
                <th scope="col" className="px-4 py-3 font-medium">Situação</th>
                <th scope="col" className="px-4 py-3 font-medium">Último treino</th>
                <th scope="col" className="px-4 py-3 font-medium">Última avaliação</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0 hover:bg-subtle">
                  <td className="px-4 py-3">
                    <Link href={`/personal/alunos/${s.id}`} className="flex items-center gap-3 font-medium hover:text-brand-ink">
                      <Avatar name={s.name} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate">{s.name}</span>
                        <span className="block truncate text-xs font-normal text-muted">{s.email}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="max-w-[14rem] truncate px-4 py-3 text-soft">{s.goal ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS[s.status].tone} dot>
                      {STATUS[s.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-soft">{since(s.lastWorkout) ?? "—"}</td>
                  <td className="px-4 py-3 text-soft">{s.lastAssessment ? formatDate(s.lastAssessment) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((s) => (
            <li key={s.id} className={`${cardCls} flex flex-col p-4 transition hover:border-line-strong`}>
              <Link href={`/personal/alunos/${s.id}`} className="group flex items-start gap-3">
                <Avatar name={s.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold group-hover:text-brand-ink">{s.name}</span>
                  <span className="block truncate text-sm text-muted">{s.goal ?? "Objetivo não informado"}</span>
                </span>
                <Badge tone={STATUS[s.status].tone} dot>
                  {STATUS[s.status].label}
                </Badge>
              </Link>
              {s.status === "convidado" ? (
                <InviteButton studentId={s.id} />
              ) : (
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-subtle px-2.5 py-2">
                    <dt className="text-muted">Último treino</dt>
                    <dd className="mt-0.5 font-medium text-ink">{since(s.lastWorkout) ?? "Nenhum ainda"}</dd>
                  </div>
                  <div className="rounded-lg bg-subtle px-2.5 py-2">
                    <dt className="text-muted">Última avaliação</dt>
                    <dd className="mt-0.5 font-medium text-ink">{s.lastAssessment ? formatDate(s.lastAssessment) : "Nenhuma ainda"}</dd>
                  </div>
                </dl>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
