"use client";

import { useState } from "react";

function youTubeEmbed(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
  }
  return null;
}

export default function ExerciseVideo({ url }: { url: string }) {
  const [show, setShow] = useState(false);
  const embed = youTubeEmbed(url);

  if (!show) {
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-line-strong text-sm font-medium"
      >
        ▶ Assistir vídeo do exercício
      </button>
    );
  }

  if (embed) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          src={embed}
          title="Vídeo do exercício"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  // Link externo (não-YouTube): abre em nova aba, já que não dá para embutir com segurança.
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-11 w-full items-center justify-center rounded-lg border border-line-strong text-sm font-medium underline"
    >
      ▶ Abrir vídeo do exercício
    </a>
  );
}
