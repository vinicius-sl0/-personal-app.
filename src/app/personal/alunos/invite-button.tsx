"use client";

import { useActionState } from "react";
import InviteLink from "@/components/invite-link";
import { btnSecondaryCls, errorCls } from "@/lib/ui";
import { regenerateInvite, type InviteState } from "./actions";

const initialState: InviteState = {};

export default function InviteButton({ studentId }: { studentId: string }) {
  const [state, formAction, pending] = useActionState(regenerateInvite, initialState);

  return (
    <div className="mt-3 space-y-3">
      <form action={formAction}>
        <input type="hidden" name="student_id" value={studentId} />
        <button type="submit" disabled={pending} className={btnSecondaryCls}>
          {pending ? "Gerando..." : "Gerar link de convite"}
        </button>
      </form>
      {state.error && <p className={errorCls}>{state.error}</p>}
      {state.inviteUrl && state.studentName && (
        <InviteLink url={state.inviteUrl} name={state.studentName} />
      )}
    </div>
  );
}
