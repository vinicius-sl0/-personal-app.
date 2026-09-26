"use client";

import { useState } from "react";
import { deletePhotoSet } from "@/lib/photo-actions";
import { formatDate } from "@/lib/assessment";
import { ANGLE_LABEL, PHOTO_ANGLES, type PhotoAngle, type PhotoSetView } from "@/lib/photos";
import { btnSecondaryCls, errorCls, inputCls } from "@/lib/ui";

function Photo({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-zinc-100 p-2 text-center text-xs text-muted dark:bg-zinc-900">
        Foto indisponível
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} loading="lazy" className="aspect-[3/4] w-full rounded-lg bg-zinc-100 object-cover dark:bg-zinc-900" />
    </a>
  );
}

function Compare({ sets }: { sets: PhotoSetView[] }) {
  // sets vem do mais recente para o mais antigo
  const [beforeId, setBeforeId] = useState(sets[sets.length - 1].id);
  const [afterId, setAfterId] = useState(sets[0].id);
  const [angle, setAngle] = useState<PhotoAngle>("frente");

  const before = sets.find((s) => s.id === beforeId);
  const after = sets.find((s) => s.id === afterId);
  const pickPhoto = (s: PhotoSetView | undefined) => s?.photos.find((p) => p.angle === angle);

  const dateOptions = sets.map((s) => (
    <option key={s.id} value={s.id}>
      {formatDate(s.taken_at)}
    </option>
  ));

  return (
    <div className="space-y-3 rounded-xl border border-line p-4 bg-card">
      <h2 className="font-semibold">Comparar antes e depois</h2>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Ângulo</span>
        <select value={angle} onChange={(e) => setAngle(e.target.value as PhotoAngle)} className={inputCls}>
          {PHOTO_ANGLES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Antes", id: beforeId, set: setBeforeId, s: before },
          { label: "Depois", id: afterId, set: setAfterId, s: after },
        ].map((col) => {
          const photo = pickPhoto(col.s);
          return (
            <div key={col.label} className="space-y-2">
              <label className="block space-y-1">
                <span className="text-sm font-medium">{col.label}</span>
                <select value={col.id} onChange={(e) => col.set(e.target.value)} className={`${inputCls} !h-10 text-sm`}>
                  {dateOptions}
                </select>
              </label>
              {photo ? (
                <Photo url={photo.url} alt={`${col.label}: ${ANGLE_LABEL[angle]}`} />
              ) : (
                <div className="flex aspect-[3/4] items-center justify-center rounded-lg border border-dashed border-line-strong p-2 text-center text-xs text-muted">
                  Sem foto de “{ANGLE_LABEL[angle]}” nesta data
                </div>
              )}
            </div>
          );
        })}
      </div>
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

      <h2 className="font-semibold">Histórico de fotos</h2>
      <ul className="space-y-4">
        {sets.map((s) => (
          <li key={s.id} className="space-y-3 rounded-xl border border-line p-4 bg-card">
            <div>
              <p className="font-medium">{formatDate(s.taken_at)}</p>
              {s.notes && <p className="text-sm text-muted">{s.notes}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
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
