// Estado da instalação do app (PWA), compartilhado pelos botões "Instalar o app".
//
// Android/Chrome/Edge: o navegador dispara "beforeinstallprompt" quando o app pode ser instalado;
// guardamos o evento para abrir a janela de instalação quando a pessoa tocar no botão.
// iPhone/iPad: a Apple não tem esse evento — a instalação é manual (Compartilhar → Adicionar à
// Tela de Início), então mostramos as instruções.

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallState = {
  ready: boolean; // false no servidor e antes de conferir o aparelho
  standalone: boolean; // já está aberto como app instalado
  ios: boolean;
  canPrompt: boolean; // há janela de instalação disponível (Android/Chrome/Edge)
};

const SERVER: InstallState = { ready: false, standalone: false, ios: false, canPrompt: false };
let state: InstallState = SERVER;
let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function compute(): InstallState {
  const nav = navigator as Navigator & { standalone?: boolean };
  return {
    ready: true,
    standalone: window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true,
    ios: /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    canPrompt: deferred !== null,
  };
}

function update() {
  state = compute();
  listeners.forEach((fn) => fn());
}

// Começa a escutar assim que o código do navegador carrega (antes da tela ficar pronta),
// para não perder o aviso do navegador.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // não mostra a faixa automática; o app oferece no momento certo
    deferred = e as InstallPromptEvent;
    update();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    update();
  });
}

export function subscribeInstall(fn: () => void) {
  listeners.add(fn);
  if (!state.ready) queueMicrotask(update);
  return () => {
    listeners.delete(fn);
  };
}

export const getInstallState = () => state;
export const getServerInstallState = () => SERVER;

// Abre a janela de instalação do navegador. Devolve true se a pessoa aceitou.
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const ev = deferred;
  await ev.prompt();
  const { outcome } = await ev.userChoice;
  deferred = null; // o mesmo aviso só pode ser usado uma vez
  update();
  return outcome === "accepted";
}
