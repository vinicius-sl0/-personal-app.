"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { savePhotoSet } from "@/lib/photo-actions";
import { PHOTO_ANGLES, PHOTO_BUCKET, photoPathPrefix, type PhotoAngle } from "@/lib/photos";
import { btnPrimaryCls, errorCls, inputCls } from "@/lib/ui";

const MAX_SIDE = 1600; // px no lado maior — nítido no celular e leve para enviar
const MAX_BYTES = 5 * 1024 * 1024; // limite do bucket

type Picked = { file: File; preview: string };

// Reduz a foto e regrava em WebP (ou JPEG, se o navegador não gerar WebP).
// Regravar também remove os dados escondidos da imagem (EXIF), como a localização GPS.
async function compress(file: File) {
  // Alguns Safari antigos recusam a opção; nesse caso lê sem ela.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() =>
    createImageBitmap(file),
  );
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponível");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const toBlob = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

  let blob = await toBlob("image/webp", 0.82);
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", 0.85);
  if (!blob) throw new Error("falha ao gerar imagem");

  return { blob, width, height, mime: blob.type as "image/webp" | "image/jpeg" };
}

export default function PhotoUploadForm({
  studentId,
  today,
  backHref,
  onDone,
  minDate,
}: {
  studentId: string;
  today: string;
  minDate?: string; // ex.: segunda-feira da semana, quando o envio é pelo Feedback
  // Depois de salvar: vai para `backHref`, ou (usado dentro do Feedback) chama `onDone` e fica na página.
  backHref?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [takenAt, setTakenAt] = useState(today);
  const [notes, setNotes] = useState("");
  const [picked, setPicked] = useState<Partial<Record<PhotoAngle, Picked>>>({});
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Libera a memória das pré-visualizações ao sair da tela.
  const pickedRef = useRef(picked);
  useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);
  useEffect(() => {
    return () => Object.values(pickedRef.current).forEach((p) => p && URL.revokeObjectURL(p.preview));
  }, []);

  function pick(angle: PhotoAngle, file: File | undefined) {
    setError(null);
    const old = picked[angle];
    if (old) URL.revokeObjectURL(old.preview);
    const replacement = file ? { file, preview: URL.createObjectURL(file) } : null;
    setPicked((prev) => {
      const next = { ...prev };
      if (replacement) next[angle] = replacement;
      else delete next[angle];
      return next;
    });
  }

  const chosen = PHOTO_ANGLES.filter((a) => picked[a.value]);
  const busy = progress !== null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (chosen.length === 0) {
      setError("Escolha pelo menos uma foto.");
      return;
    }
    if (minDate && takenAt < minDate) {
      setError("Escolha uma data desta semana.");
      return;
    }

    const supabase = createClient();
    const setId = crypto.randomUUID();
    const uploaded: string[] = [];
    const photos = [];

    try {
      for (const [i, a] of chosen.entries()) {
        setProgress(`Enviando foto ${i + 1} de ${chosen.length}...`);
        const file = picked[a.value]!.file;

        let img;
        try {
          img = await compress(file);
        } catch (err) {
          console.error("compress:", err);
          throw new Error(`Não foi possível ler a foto "${a.label}". Tente outra imagem (JPG ou PNG).`);
        }
        if (img.blob.size > MAX_BYTES) throw new Error(`A foto "${a.label}" ficou grande demais. Tente outra.`);

        const ext = img.mime === "image/webp" ? "webp" : "jpg";
        const path = `${photoPathPrefix(studentId, setId)}${a.value}-${crypto.randomUUID()}.${ext}`;
        const { error: upError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(path, img.blob, { contentType: img.mime, upsert: false });
        if (upError) throw new Error(`Não foi possível enviar a foto "${a.label}": ${upError.message}`);

        uploaded.push(path);
        photos.push({
          angle: a.value,
          storage_path: path,
          width: img.width,
          height: img.height,
          size_bytes: img.blob.size,
          mime_type: img.mime,
        });
      }

      setProgress("Salvando...");
      const res = await savePhotoSet({
        set_id: setId,
        student_id: studentId,
        taken_at: takenAt,
        notes: notes.trim() || null,
        photos,
      });
      if (res.error) throw new Error(res.error);
    } catch (err) {
      // Tenta apagar os arquivos já enviados, para não ficarem soltos no Storage.
      if (uploaded.length > 0) {
        const { error: cleanError } = await supabase.storage.from(PHOTO_BUCKET).remove(uploaded);
        if (cleanError) console.error("limpeza de fotos:", cleanError.message);
      }
      setProgress(null);
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Falha de conexão ao enviar as fotos. Tente novamente.",
      );
      return;
    }

    if (onDone) onDone();
    else if (backHref) router.push(backHref);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Data das fotos</span>
        <input
          type="date"
          value={takenAt}
          min={minDate}
          max={today}
          disabled={busy}
          onChange={(e) => setTakenAt(e.target.value)}
          className={inputCls}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        {PHOTO_ANGLES.map((a) => {
          const p = picked[a.value];
          return (
            <div key={a.value} className="space-y-1">
              <span className="text-sm font-medium">{a.label}</span>
              <label
                className={`relative flex aspect-[3/4] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center text-xs text-muted ${
                  p ? "border-transparent" : "border-line-strong"
                }`}
              >
                {p ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.preview} alt={`Pré-visualização: ${a.label}`} className="h-full w-full object-cover" />
                ) : (
                  <span className="px-2">Toque para escolher ou tirar a foto</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = ""; // permite escolher o mesmo arquivo de novo depois de "Remover"
                    if (file) pick(a.value, file);
                  }}
                />
              </label>
              {p && !busy && (
                <button type="button" onClick={() => pick(a.value, undefined)} className="text-xs text-muted underline">
                  Remover
                </button>
              )}
            </div>
          );
        })}
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Observação (opcional)</span>
        <textarea
          value={notes}
          maxLength={500}
          rows={2}
          disabled={busy}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex.: em jejum, pela manhã"
          className={`${inputCls} !h-auto py-2`}
        />
      </label>

      {error && <p role="alert" className={errorCls}>{error}</p>}

      <button type="submit" disabled={busy || chosen.length === 0} className={btnPrimaryCls}>
        {progress ?? `Salvar ${chosen.length === 1 ? "1 foto" : `${chosen.length} fotos`}`}
      </button>
    </form>
  );
}
