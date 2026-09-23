"use client";

import { useActionState } from "react";
import { setPhotoConsent, type PhotoActionState } from "@/lib/photo-actions";
import { btnPrimaryCls, btnSecondaryCls, errorCls } from "@/lib/ui";

export default function ConsentToggle({ active }: { active: boolean }) {
  const [state, formAction, pending] = useActionState(setPhotoConsent, {} as PhotoActionState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          active &&
          !confirm(
            "Retirar a autorização? Seu Personal deixa de ver suas fotos e ninguém poderá enviar novas. As fotos já enviadas continuam guardadas e só você vê.",
          )
        ) {
          e.preventDefault();
        }
      }}
      className="space-y-2"
    >
      <input type="hidden" name="grant" value={active ? "0" : "1"} />
      <button type="submit" disabled={pending} className={active ? `${btnSecondaryCls} w-full` : btnPrimaryCls}>
        {pending ? "Salvando..." : active ? "Retirar autorização" : "Autorizar fotos de evolução"}
      </button>
      {state.error && <p role="alert" className={errorCls}>{state.error}</p>}
    </form>
  );
}
