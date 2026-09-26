// Avatar com iniciais (o app ainda não tem foto de perfil). Neutro, com contorno laranja opcional.
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function Avatar({ name, size = "md", ring = false }: { name: string; size?: "sm" | "md" | "lg"; ring?: boolean }) {
  const s = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg" }[size];
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full bg-subtle-strong font-semibold text-strong ${s} ${
        ring ? "ring-2 ring-brand ring-offset-2 ring-offset-card" : ""
      }`}
    >
      {initials(name)}
    </span>
  );
}
