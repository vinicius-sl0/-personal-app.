"use client";

import { useState, useSyncExternalStore } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { getInstallState, getServerInstallState, promptInstall, subscribeInstall } from "@/lib/pwa-install";
import { BRAND } from "@/lib/brand";
import { btnPrimaryCls, btnSecondaryCls } from "@/lib/ui";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

function useInstall() {
  return useSyncExternalStore(subscribeInstall, getInstallState, getServerInstallState);
}

// Ação de instalar: janela do navegador (Android/Chrome/Edge) ou instruções (iPhone).
function useInstallAction() {
  const s = useInstall();
  const toast = useToast();
  const [showIos, setShowIos] = useState(false);
  const available = s.ready && !s.standalone && (s.canPrompt || s.ios);

  async function install() {
    if (s.canPrompt) {
      const ok = await promptInstall();
      if (ok) toast.success("App instalado. Ele aparece na tela inicial do seu aparelho.");
    } else {
      setShowIos(true);
    }
  }

  const iosModal = (
    <Modal
      open={showIos}
      onClose={() => setShowIos(false)}
      title="Instalar no iPhone"
      footer={
        <button type="button" onClick={() => setShowIos(false)} className={btnSecondaryCls}>
          Entendi
        </button>
      }
    >
      <ol className="space-y-4 text-sm">
        <li className="flex gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-subtle-strong font-display font-semibold">1</span>
          <span className="pt-1">
            No Safari, toque em <strong>Compartilhar</strong>{" "}
            <Share aria-label="(ícone de quadrado com seta para cima)" className="inline size-4 align-text-bottom" /> na barra de
            baixo.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-subtle-strong font-display font-semibold">2</span>
          <span className="pt-1">
            Role a lista e toque em <strong>Adicionar à Tela de Início</strong>{" "}
            <SquarePlus aria-hidden className="inline size-4 align-text-bottom" />.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-subtle-strong font-display font-semibold">3</span>
          <span className="pt-1">
            Toque em <strong>Adicionar</strong>. O ícone de {BRAND.name} aparece junto dos seus apps.
          </span>
        </li>
      </ol>
    </Modal>
  );

  return { available, install, iosModal };
}

// Item do menu lateral ("Instalar o app"). Some quando já está instalado ou o aparelho não permite.
export function InstallAppMenuButton() {
  const { available, install, iosModal } = useInstallAction();
  if (!available) return null;
  return (
    <>
      <button
        type="button"
        onClick={install}
        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-soft transition-colors hover:bg-subtle hover:text-ink"
      >
        <Download aria-hidden className="size-4" />
        Instalar o app
      </button>
      {iosModal}
    </>
  );
}

const DISMISS_KEY = "pwa-install-card-dismissed";

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

// Cartão no início do aluno, com "agora não" (lembrado neste aparelho).
export function InstallAppCard() {
  const { available, install, iosModal } = useInstallAction();
  const dismissedStored = useSyncExternalStore(
    () => () => {},
    readDismissed,
    () => true, // no servidor, não mostra (evita piscar)
  );
  const [dismissed, setDismissed] = useState(false);
  if (!available || dismissed || dismissedStored) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // navegador sem armazenamento: só esconde nesta visita
    }
  }

  return (
    <section aria-label="Instalar o app" className="relative flex items-center gap-4 rounded-2xl border border-line bg-card p-4">
      <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-brand-soft text-brand-ink">
        <Download className="size-5" />
      </span>
      <div className="min-w-0 flex-1 pr-6">
        <p className="font-display font-semibold">Instale o app no celular</p>
        <p className="text-sm text-soft">Abre direto da tela inicial, em tela cheia, sem procurar o site.</p>
        <button type="button" onClick={install} className={`${btnPrimaryCls} mt-3 !h-10 !w-auto px-4 text-sm`}>
          Instalar o app
        </button>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Agora não"
        title="Agora não"
        className="absolute right-2 top-2 rounded-lg p-2 text-muted transition-colors hover:bg-subtle hover:text-ink"
      >
        <X aria-hidden className="size-4" />
      </button>
      {iosModal}
    </section>
  );
}
