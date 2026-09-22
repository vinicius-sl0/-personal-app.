"use client";

import Link from "next/link";
import { btnSecondaryCls } from "@/lib/ui";
import { archiveExercise, duplicateExercise, unarchiveExercise } from "./actions";

export default function ExerciseRowActions({
  id,
  archived,
}: {
  id: string;
  archived: boolean;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Link href={`/personal/exercicios/${id}`} className={`${btnSecondaryCls} !h-9 px-3 text-xs`}>
        Editar
      </Link>
      <form action={duplicateExercise}>
        <input type="hidden" name="id" value={id} />
        <button className={`${btnSecondaryCls} !h-9 px-3 text-xs`}>Duplicar</button>
      </form>
      {archived ? (
        <form action={unarchiveExercise}>
          <input type="hidden" name="id" value={id} />
          <button className={`${btnSecondaryCls} !h-9 px-3 text-xs`}>Reativar</button>
        </form>
      ) : (
        <form action={archiveExercise}>
          <input type="hidden" name="id" value={id} />
          <button className={`${btnSecondaryCls} !h-9 px-3 text-xs`}>Arquivar</button>
        </form>
      )}
    </div>
  );
}
