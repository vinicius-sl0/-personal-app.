"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteLead, setLeadNotes, setLeadStatus } from "@/lib/lead-actions";
import {
  LEAD_STATUSES,
  experienceLabel,
  formatBrPhone,
  goalLabel,
  modalityLabel,
  whatsappLink,
} from "@/lib/leads";
import { BRAND } from "@/lib/brand";
import { btnDangerCls, btnSecondaryCls, cardCls, errorCls } from "@/lib/ui";
import { WhatsAppIcon } from "@/components/landing/social-icons";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

type Lead = {
  id: string;
  full_name: string;
  whatsapp: string;
  goal: string;
  experience: string;
  days_per_week: number;
  modality: string;
  status: string;
  notes: string | null;
  created_at: string;
};

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const STATUS_DOT: Record<string, string> = {
  novo: "bg-brand",
  em_conversa: "bg-sky-500",
  virou_aluno: "bg-emerald-500",
  nao_fechou: "bg-zinc-400",
};

export default function LeadCard({ lead, expired }: { lead: Lead; expired: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [busy, setBusy] = useState<null | "status" | "notes" | "delete">(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const firstName = lead.full_name.split(" ")[0];
  const personalFirst = BRAND.name.split(" ")[0];
  const notesChanged = notes.trim() !== (lead.notes ?? "");

  // Sempre: espera o banco confirmar, só então atualiza a tela; erro aparece escrito.
  async function run(kind: "status" | "notes" | "delete", action: () => Promise<{ error?: string }>, ok: string) {
    setBusy(kind);
    setError(null);
    try {
      const res = await action();
      if (res.error) {
        setError(res.error);
        return false;
      }
      toast.success(ok);
      router.refresh();
      return true;
    } catch (err) {
      console.error(err);
      setError("Falha de conexão. Tente novamente.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function changeStatus(v: string) {
    const prev = status;
    const ok = await run("status", () => setLeadStatus(lead.id, v), "Situação atualizada");
    setStatus(ok ? v : prev);
  }

  return (
    <article className={`${cardCls} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight">{lead.full_name}</h2>
          <p className="text-sm text-muted">
            {formatBrPhone(lead.whatsapp)}, enviado em {dateFmt.format(new Date(lead.created_at))}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span aria-hidden className={`size-2.5 rounded-full ${STATUS_DOT[status] ?? "bg-zinc-400"}`} />
          <span className="sr-only">Situação</span>
          <select
            value={status}
            disabled={busy !== null}
            onChange={(e) => changeStatus(e.target.value)}
            className="h-10 rounded-[10px] border border-field bg-card px-2 text-sm text-ink"
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted">Objetivo</dt>
          <dd className="font-medium">{goalLabel(lead.goal)}</dd>
        </div>
        <div>
          <dt className="text-muted">Experiência</dt>
          <dd className="font-medium">{experienceLabel(lead.experience)}</dd>
        </div>
        <div>
          <dt className="text-muted">Dias por semana</dt>
          <dd className="font-medium">{lead.days_per_week}</dd>
        </div>
        <div>
          <dt className="text-muted">Prefere</dt>
          <dd className="font-medium">{modalityLabel(lead.modality)}</dd>
        </div>
      </dl>

      {expired && (
        <p className="mt-4 rounded-[10px] border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-800 dark:text-amber-200">
          Enviado há mais de 12 meses e não virou aluno. Pela Política de Privacidade, exclua este interessado.
        </p>
      )}

      <label className="mt-4 block space-y-1.5">
        <span className="text-sm text-muted">Observação (só você vê)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
          rows={2}
          placeholder="Ex.: chamei no dia 02, volta a falar em março"
          className="w-full rounded-[10px] border border-field bg-card px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-soft)]"
        />
      </label>

      {error && (
        <p role="alert" className={`${errorCls} mt-3`}>
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={whatsappLink(lead.whatsapp, `Olá, ${firstName}! Aqui é ${personalFirst}. Vi que você quer se tornar aluno(a).`)}
          target="_blank"
          rel="noopener noreferrer"
          className={btnSecondaryCls}
        >
          <WhatsAppIcon /> Chamar no WhatsApp
        </a>
        {notesChanged && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => run("notes", () => setLeadNotes(lead.id, notes), "Observação salva")}
            className={btnSecondaryCls}
          >
            {busy === "notes" ? "Salvando..." : "Salvar observação"}
          </button>
        )}
        <button type="button" disabled={busy !== null} onClick={() => setConfirmDelete(true)} className={`${btnDangerCls} sm:ml-auto`}>
          <Trash2 aria-hidden className="size-4" /> Excluir
        </button>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Excluir interessado?"
        footer={
          <>
            <button type="button" onClick={() => setConfirmDelete(false)} className={btnSecondaryCls}>
              Cancelar
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={async () => {
                const ok = await run("delete", () => deleteLead(lead.id), "Interessado excluído");
                if (ok) setConfirmDelete(false);
              }}
              className={btnDangerCls}
            >
              {busy === "delete" ? "Excluindo..." : "Excluir"}
            </button>
          </>
        }
      >
        <p className="text-sm text-soft">
          As respostas de {lead.full_name} serão apagadas de vez. Use quando a pessoa pedir ou quando não houver mais
          conversa.
        </p>
        {error && <p role="alert" className={`${errorCls} mt-3`}>{error}</p>}
      </Modal>
    </article>
  );
}
