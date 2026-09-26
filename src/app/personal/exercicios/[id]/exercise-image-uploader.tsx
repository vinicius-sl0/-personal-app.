"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compress";
import { EXERCISE_MEDIA_BUCKET, exerciseImagePrefix } from "@/lib/exercise-media";
import { btnSecondaryCls, cardCls, errorCls } from "@/lib/ui";
import { useToast } from "@/components/ui/toast";
import { removeExerciseImage, saveExerciseImage } from "../actions";

// Imagem do exercício (ex.: posição inicial/final). Vai direto do aparelho para o bucket privado;
// o banco só registra depois que o arquivo foi enviado. Erros aparecem na tela.
export default function ExerciseImageUploader({
  exerciseId,
  ownerId,
  currentUrl,
}: {
  exerciseId: string;
  ownerId: string;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"enviando" | "removendo" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setBusy("enviando");
    const supabase = createClient();
    let path: string | null = null;
    try {
      let img;
      try {
        img = await compressImage(file, 1280);
      } catch {
        throw new Error("Não foi possível ler essa imagem. Tente um arquivo JPG ou PNG.");
      }
      path = `${exerciseImagePrefix(ownerId, exerciseId)}${crypto.randomUUID()}.${img.mime === "image/webp" ? "webp" : "jpg"}`;
      const { error: upError } = await supabase.storage.from(EXERCISE_MEDIA_BUCKET).upload(path, img.blob, { contentType: img.mime, upsert: false });
      if (upError) throw new Error("Não foi possível enviar a imagem: " + upError.message);

      const res = await saveExerciseImage({ exerciseId, storagePath: path });
      if (res.error) throw new Error(res.error);
      toast.success("Imagem salva");
      router.refresh();
    } catch (err) {
      // Se o registro falhou depois do envio, apaga o arquivo para não ficar solto.
      if (path) await supabase.storage.from(EXERCISE_MEDIA_BUCKET).remove([path]);
      setError(err instanceof Error && err.message ? err.message : "Falha de conexão ao enviar a imagem.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("Remover a imagem deste exercício?")) return;
    setError(null);
    setBusy("removendo");
    try {
      const res = await removeExerciseImage(exerciseId);
      if (res.error) setError(res.error);
      else {
        toast.success("Imagem removida");
        router.refresh();
      }
    } catch {
      setError("Falha de conexão ao remover a imagem.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={`${cardCls} space-y-3 p-4 sm:p-5`}>
      <div>
        <p className="font-semibold">Imagem do exercício</p>
        <p className="text-sm text-muted">Opcional. Aparece para o aluno na hora do treino (ex.: posição correta).</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative grid aspect-[4/3] w-full max-w-60 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-subtle">
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUrl} alt="Imagem atual do exercício" className="size-full object-cover" />
          ) : (
            <ImageIcon aria-hidden className="size-8 text-muted" />
          )}
          {busy && (
            <span className="absolute inset-0 grid place-items-center bg-black/50 text-white">
              <Loader2 aria-hidden className="size-6 animate-spin" />
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) upload(f);
            }}
          />
          <button type="button" disabled={!!busy} onClick={() => inputRef.current?.click()} className={btnSecondaryCls}>
            <Upload aria-hidden className="size-4" />
            {busy === "enviando" ? "Enviando..." : currentUrl ? "Trocar imagem" : "Enviar imagem"}
          </button>
          {currentUrl && (
            <button type="button" disabled={!!busy} onClick={remove} className={`${btnSecondaryCls} text-red-600 dark:text-red-400`}>
              <Trash2 aria-hidden className="size-4" />
              {busy === "removendo" ? "Removendo..." : "Remover"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className={errorCls}>
          {error}
        </p>
      )}
    </div>
  );
}
