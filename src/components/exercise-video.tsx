// Vídeo demonstrativo do exercício, já no lugar (sem botão "Assistir"): aparece pronto e só toca
// quando o aluno tocar — nada de reprodução automática, para não gastar a internet do celular.
//   • YouTube → player embutido pelo youtube-nocookie.com (privacidade)
//   • Vimeo   → player embutido com "não rastrear" (dnt=1)
//   • arquivo de vídeo (.mp4, .webm, .mov) → player do próprio navegador
//   • outros sites → não dá para embutir com segurança: link para abrir em nova aba
import { PlayCircle } from "lucide-react";

type Source = { kind: "iframe"; src: string } | { kind: "file"; src: string } | { kind: "link"; src: string };

function detect(url: string): Source {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&playsinline=1&modestbranding=1` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}?dnt=1&playsinline=1` };
  if (/^https?:\/\/.+\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)) return { kind: "file", src: url };
  return { kind: "link", src: url };
}

export default function ExerciseVideo({ url, title }: { url: string; title: string }) {
  const source = detect(url);

  if (source.kind === "iframe") {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-line bg-black">
        <iframe
          src={source.src}
          title={`Vídeo: ${title}`}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="size-full"
        />
      </div>
    );
  }

  if (source.kind === "file") {
    return (
      <video
        src={source.src}
        controls
        playsInline
        preload="metadata"
        aria-label={`Vídeo: ${title}`}
        className="aspect-video w-full rounded-2xl border border-line bg-black object-contain"
      />
    );
  }

  return (
    <a
      href={source.src}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line-strong bg-card px-4 py-3 text-sm font-medium transition hover:border-chrome/70"
    >
      <PlayCircle aria-hidden className="size-5 text-brand-ink" />
      Abrir o vídeo do exercício (abre em outra aba)
    </a>
  );
}
