"use client";

import { useState } from "react";
import PhotoUploadForm from "@/components/photo-upload-form";
import ConsentToggle from "@/components/photo-consent-toggle";
import { btnSecondaryCls } from "@/lib/ui";

// Seção "Fotos da semana (opcional)" dentro do Feedback semanal.
// As fotos enviadas aqui são as mesmas da página Fotos (ligadas à semana pela data).
export default function WeeklyPhotos({
  studentId,
  today,
  weekStart,
  consentActive,
  children,
}: {
  studentId: string;
  today: string;
  weekStart: string;
  consentActive: boolean;
  children?: React.ReactNode; // miniaturas das fotos já enviadas nesta semana
}) {
  const [adding, setAdding] = useState(false);
  const [justSent, setJustSent] = useState(false);

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div>
        <h2 className="font-semibold">
          Fotos da semana <span className="font-normal text-zinc-500">(opcional)</span>
        </h2>
        <p className="text-sm text-zinc-500">Ajudam seu Personal a acompanhar sua evolução.</p>
      </div>

      {children}

      {!consentActive ? (
        <div className="space-y-2 text-sm">
          <p>
            Para enviar fotos, é preciso autorizar. Com a autorização, seu Personal pode ver suas fotos
            de evolução. Você pode retirar quando quiser, na página Fotos.
          </p>
          <ConsentToggle active={false} />
        </div>
      ) : adding ? (
        <div className="space-y-3">
          <PhotoUploadForm
            studentId={studentId}
            today={today}
            minDate={weekStart}
            onDone={() => {
              setAdding(false);
              setJustSent(true);
            }}
          />
          <button type="button" onClick={() => setAdding(false)} className={`${btnSecondaryCls} w-full`}>
            Cancelar
          </button>
        </div>
      ) : (
        <>
          {justSent && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              Fotos enviadas! Seu Personal já pode vê-las.
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setJustSent(false);
              setAdding(true);
            }}
            className={`${btnSecondaryCls} w-full`}
          >
            📷 Adicionar fotos
          </button>
        </>
      )}
    </div>
  );
}
