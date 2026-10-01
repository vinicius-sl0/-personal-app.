// Etiqueta "Exemplo" para conteúdo provisório da landing (ver src/lib/landing-content.ts).
// Cores fixas (âmbar com texto preto): a landing mistura áreas sempre escuras com áreas que
// seguem o tema do aparelho, e a etiqueta precisa ser legível nas duas.
export function ExampleTag({ show = true }: { show?: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-semibold text-black">
      Exemplo
    </span>
  );
}
