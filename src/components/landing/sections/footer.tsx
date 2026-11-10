import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LANDING } from "@/lib/landing-content";
import { BrandMark } from "@/components/brand-mark";
import { InstagramIcon, WhatsAppIcon } from "@/components/landing/social-icons";

const iconLinkCls =
  "grid size-11 place-items-center rounded-full border border-line text-soft transition-colors hover:border-chrome hover:text-ink";

// RODAPÉ: logo completo (sobre fundo branco, como foi desenhado), redes, navegação e links legais.
export default function Footer({ nav, whatsappHref }: { nav: { href: string; label: string }[]; whatsappHref: string | null }) {
  const { contact, hero } = LANDING;
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          {BRAND.logoFull ? (
            <span className="inline-block rounded-2xl bg-white px-4 py-3">
              <Image src={BRAND.logoFull.src} alt={BRAND.logoFull.alt} width={BRAND.logoFull.width} height={BRAND.logoFull.height} className="h-20 w-auto" />
            </span>
          ) : (
            <div className="flex items-center gap-2.5">
              <BrandMark size="md" />
              <span className="font-display font-semibold">{hero.brand}</span>
            </div>
          )}
          <p className="mt-4 max-w-sm text-sm text-soft">{BRAND.tagline}</p>
          <div className="mt-5 flex gap-2">
            {contact.instagram && (
              <a href={contact.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={iconLinkCls}>
                <InstagramIcon />
              </a>
            )}
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={iconLinkCls}>
                <WhatsAppIcon />
              </a>
            )}
          </div>
        </div>
        <nav aria-label="Links do rodapé">
          <p className="mb-3 font-display text-sm font-semibold">Navegação</p>
          <ul className="space-y-2 text-sm text-soft">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="hover:text-ink">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="mb-3 font-display text-sm font-semibold">Plataforma</p>
          <ul className="space-y-2 text-sm text-soft">
            <li>
              <Link href="/quero-ser-aluno" className="font-medium text-brand-ink hover:underline">
                Quero ser aluno
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-ink">
                Entrar
              </Link>
            </li>
            <li>
              <Link href="/termos" className="hover:text-ink">
                Termos de uso
              </Link>
            </li>
            <li>
              <Link href="/privacidade" className="hover:text-ink">
                Política de privacidade
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">
          © {year} {hero.brand}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
