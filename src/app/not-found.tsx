import Link from "next/link";
import { Compass } from "lucide-react";
import { btnPrimaryCls } from "@/lib/ui";

export const metadata = { title: "Página não encontrada" };

// Endereço que não existe (ou link antigo). O botão leva para o início; quem estiver
// logado é redirecionado de lá para o próprio painel.
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-surface px-4">
      <div className="max-w-sm space-y-4 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
          <Compass aria-hidden className="size-7" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Página não encontrada</h1>
        <p className="text-sm text-muted">O endereço pode ter mudado ou estar digitado errado.</p>
        <Link href="/" className={`${btnPrimaryCls} !w-auto px-6`}>
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
