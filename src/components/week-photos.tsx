import { formatDate } from "@/lib/assessment";
import { weekStartOf } from "@/lib/feedback";
import { ANGLE_LABEL, PHOTO_ANGLES, type PhotoSetView } from "@/lib/photos";

// Agrupa conjuntos de fotos pela semana (segunda-feira) em que foram tiradas.
export function groupSetsByWeek(sets: PhotoSetView[]) {
  const byWeek = new Map<string, PhotoSetView[]>();
  for (const s of sets) {
    const week = weekStartOf(s.taken_at);
    byWeek.set(week, [...(byWeek.get(week) ?? []), s]);
  }
  return byWeek;
}

const order = (angle: string) => PHOTO_ANGLES.findIndex((a) => a.value === angle);

// Miniaturas das fotos de uma semana (tocar abre a foto inteira).
export default function WeekPhotos({ sets, title = "Fotos da semana" }: { sets: PhotoSetView[]; title?: string }) {
  const photos = sets.flatMap((s) =>
    s.photos
      .slice()
      .sort((a, b) => order(a.angle) - order(b.angle))
      .map((p) => ({ ...p, taken_at: s.taken_at })),
  );
  if (photos.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-zinc-500">
        📷 {title} ({photos.length})
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {photos.map((p) =>
          p.url ? (
            <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={`${ANGLE_LABEL[p.angle]} em ${formatDate(p.taken_at)}`}
                loading="lazy"
                className="aspect-[3/4] w-full rounded-md bg-zinc-100 object-cover dark:bg-zinc-900"
              />
              <span className="block truncate text-[10px] text-zinc-500">{ANGLE_LABEL[p.angle]}</span>
            </a>
          ) : (
            <div
              key={p.id}
              className="flex aspect-[3/4] items-center justify-center rounded-md bg-zinc-100 p-1 text-center text-[10px] text-zinc-500 dark:bg-zinc-900"
            >
              Indisponível
            </div>
          ),
        )}
      </div>
    </div>
  );
}
