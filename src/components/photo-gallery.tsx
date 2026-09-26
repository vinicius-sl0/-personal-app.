"use client";

import { useState } from "react";
import { deletePhotoSet } from "@/lib/photo-actions";
import { formatDate } from "@/lib/assessment";
import { ANGLE_LABEL, PHOTO_ANGLES, type PhotoAngle, type PhotoSetView } from "@/lib/photos";
import { btnSecondaryCls, errorCls, inputCls } from "@/lib/ui";
import BeforeAfterSlider from "@/components/before-after-slider";

function Photo({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-xl bg-subtle p-2 text-center text-xs text-muted">
        Foto indisponível
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="group block overflow-hidden rounded-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} loading="lazy" className="aspect-[3/4] w-full bg-subtle object-cover transition duration-300 group-hover:scale-[1.03]" />
    </a>
  );
}

function Compare({ sets }: { sets: PhotoSetView[] }) {
  // sets vem do mais recente para o mais antigo
  const [beforeId, setBeforeId] = useState(sets[sets.length - 1].id);
  const [afterId, setAfterId] = useState(sets[0].id);
  const [angle, setAngle] = useState<PhotoAngle>("frente");
  const [mode, setMode] = useState<"deslizar" | "lado">("deslizar");

  const before = sets.find((s) => s.id === beforeId);
  const after = sets.find((s) => s.id === afterId);
  const pickPhoto = (s: PhotoSetView | undefined) => s?.photos.find((p) => p.angle === angle);
  const bp = pickPhoto(before);
  const ap = pickPhoto(after);

  const dateOptions = sets.map((s) => (
    <option key={s.id} value={s.id}>
      {formatDate(s.taken_at)}
    </option>
  ));
  const missing = (label: string) => (
    <div className="flex aspect-[3/4] items-center justify-center rounded-xl border border-dashed border-line-strong p-3 text-center text-xs text-muted">
      Sem foto de “{ANGLE_LABEL[angle]}” no {label.toLowerCase()}
    </div>
  );

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Antes x Depois</h2>
        <div role="group" aria-label="Forma de comparar" className="flex gap-1 rounded-xl border border-line p-1">
          {(
            [
              ["deslizar", "Deslizar"],
              ["lado", "Lado a lado"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              aria-pressed={mode === k}
              onClick={() => setMode(k)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${mode === k ? "bg-brand text-brand-contrast" : "text-soft hover:text-ink"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted">Ângulo</span>
          <select value={angle} onChange={(e) => setAngle(e.target.value as PhotoAngle)} className={`${inputCls} !h-10 text-sm`}>
            {PHOTO_ANGLES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted">Antes</span>
          <select value={beforeId} onChange={(e) => setBeforeId(e.target.value)} className={`${inputCls} !h-10 text-sm`}>
            {dateOptions}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted">Depois</span>
          <select value={afterId} onChange={(e) => setAfterId(e.target.value)} className={`${inputCls} !h-10 text-sm`}>
            {dateOptions}
          </select>
        </label>
      </div>

      {mode === "deslizar" && bp?.url && ap?.url ? (
        <>
          <BeforeAfterSlider
            key={`${bp.id}-${ap.id}`}
            before={{ url: bp.url, label: `Antes (${before ? formatDate(before.taken_at) : ""}): ${ANGLE_LABEL[angle]}` }}
            after={{ url: ap.url, label: `Depois (${after ? formatDate(after.taken_at) : ""}): ${ANGLE_LABEL[angle]}` }}
          />
          <p className="text-center text-xs text-muted">
            {before && formatDate(before.taken_at)} → {after && formatDate(after.taken_at)} · arraste a divisória
          </p>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <figure className="space-y-1.5">
            {bp ? <Photo url={bp.url} alt={`Antes: ${ANGLE_LABEL[angle]}`} /> : missing("Antes")}
            <figcaption className="text-center text-xs text-muted">Antes · {before && formatDate(before.taken_at)}</figcaption>
          </figure>
          <figure className="space-y-1.5">
            {ap ? <Photo url={ap.url} alt={`Depois: ${ANGLE_LABEL[angle]}`} /> : missing("Depois")}
            <figcaption className="text-center text-xs text-muted">Depois · {after && formatDate(after.taken_at)}</figcaption>
          </figure>
        </div>
      )}
      {mode === "deslizar" && (!bp?.url || !ap?.url) && (
        <p className="text-center text-xs text-muted">Para deslizar, as duas datas precisam ter foto de “{ANGLE_LABEL[angle]}”.</p>
      )}
    </div>
  );
}

function DeleteSetButton({ setId }: { setId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("Excluir as fotos desta data? Elas serão apagadas de vez e isso não pode ser desfeito.")) return;
    setPending(true);
    setError(null);
    try {
      const res = await deletePhotoSet(setId);
      if (res.error) setError(res.error);
    } catch (err) {
      console.error("deletePhotoSet:", err);
      setError("Falha de conexão ao excluir. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className={`${btnSecondaryCls} w-full text-red-700 dark:text-red-400`}
      >
        {pending ? "Excluindo..." : "Excluir fotos desta data"}
      </button>
      {error && <p role="alert" className={errorCls}>{error}</p>}
    </div>
  );
}

export default function PhotoGallery({ sets, canDelete }: { sets: PhotoSetView[]; canDelete: boolean }) {
  return (
    <div className="space-y-4">
      {sets.length >= 2 && <Compare key={sets.map((s) => s.id).join()} sets={sets} />}

      <h2 className="text-lg font-semibold">Histórico de fotos</h2>
      <ul className="space-y-3">
        {sets.map((s) => (
          <li key={s.id} className="space-y-3 rounded-2xl border border-line bg-card p-4">
            <div>
              <p className="font-medium">{formatDate(s.taken_at)}</p>
              {s.notes && <p className="text-sm text-muted">{s.notes}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {s.photos
                .slice().sort((a, b) => PHOTO_ANGLES.findIndex((x) => x.value === a.angle) - PHOTO_ANGLES.findIndex((x) => x.value === b.angle))
                .map((p) => (
                  <figure key={p.id} className="space-y-1">
                    <Photo url={p.url} alt={`${ANGLE_LABEL[p.angle]} em ${formatDate(s.taken_at)}`} />
                    <figcaption className="text-xs text-muted">{ANGLE_LABEL[p.angle]}</figcaption>
                  </figure>
                ))}
            </div>
            {canDelete && <DeleteSetButton setId={s.id} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
