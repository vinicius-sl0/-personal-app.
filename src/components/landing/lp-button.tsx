import Link from "next/link";
import s from "./landing.module.css";

// Botão da página inicial (pílula). "primary" = laranja com luz e reflexo; "ghost" = contorno.
// Endereço interno (/quero-ser-aluno, /login, #secao) usa <Link>; externo (WhatsApp, Instagram)
// abre em nova aba.
export function lpBtnCls({
  variant = "primary",
  size = "md",
  block = false,
}: {
  variant?: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  block?: boolean;
} = {}) {
  return [s.btn, s[variant], size !== "md" && s[size], block && s.block].filter(Boolean).join(" ");
}

export default function LpButton({
  href,
  children,
  variant = "primary",
  size = "md",
  block = false,
  className = "",
  onClick,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const cls = `${lpBtnCls({ variant, size, block })} ${className}`;
  const glow = variant === "primary" ? { "data-glow": "" } : {};
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} onClick={onClick} aria-label={ariaLabel} {...glow}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} onClick={onClick} aria-label={ariaLabel} {...glow}>
      {children}
    </Link>
  );
}
