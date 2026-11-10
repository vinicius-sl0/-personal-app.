// Título de seção da página inicial: número do capítulo + nome curto em prata, título grande e
// uma frase de apoio. O número segue a ordem real das seções na página.
export default function SectionHeading({
  index,
  label,
  title,
  description,
  center = false,
  id,
}: {
  index?: number;
  label: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  center?: boolean;
  id?: string;
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className={`flex items-center gap-3 font-display text-sm font-semibold text-chrome ${center ? "justify-center" : ""}`}>
        {index !== undefined && <span className="tabular-nums text-brand-ink">{String(index).padStart(2, "0")}</span>}
        <span aria-hidden className="h-px w-10 bg-chrome/50" />
        <span>{label}</span>
      </p>
      <h2 id={id} className="mt-5 text-[clamp(2rem,5vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.02em]">
        {title}
      </h2>
      {description && <p className={`mt-5 text-lg leading-relaxed text-soft sm:text-xl ${center ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>{description}</p>}
    </div>
  );
}
