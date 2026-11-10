import { LANDING } from "@/lib/landing-content";
import LandingHeader from "@/components/landing/landing-header";
import PointerGlow from "@/components/landing/pointer-glow";
import Hero from "@/components/landing/sections/hero";
import Ribbons from "@/components/landing/sections/ribbons";
import Benefits from "@/components/landing/sections/benefits";
import Comparison from "@/components/landing/sections/comparison";
import Results from "@/components/landing/sections/results";
import About from "@/components/landing/sections/about";
import Journey from "@/components/landing/sections/journey";
import Testimonials from "@/components/landing/sections/testimonials";
import FaqSection from "@/components/landing/sections/faq-section";
import FinalCta from "@/components/landing/sections/final-cta";
import Footer from "@/components/landing/sections/footer";
import s from "@/components/landing/landing.module.css";

// PÁGINA INICIAL (landing de apresentação e venda). Conteúdo em src/lib/landing-content.ts;
// cada seção em src/components/landing/sections/. Estilos só desta página em landing.module.css.
//
// Ordem: primeira tela → faixas → benefícios → comparativo → resultados → conheça a Marília →
// como funciona → depoimentos → dúvidas → chamada final → rodapé.
// Âncoras já divulgadas (não mudar): #sobre #resultados #no-app #depoimentos #duvidas #contato.
export default function Home() {
  const { hero, results, testimonials, contact, ribbon } = LANDING;
  const whatsappHref = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(contact.whatsappMessage)}`
    : null;

  // Resultados de exemplo só aparecem enquanto a página está em construção (draft: true).
  const visibleResults = LANDING.draft ? results : results.filter((r) => !r.example);
  // Depoimentos: SÓ os reais, sempre (exemplo de depoimento nunca aparece, nem em construção).
  const visibleTestimonials = testimonials.filter((t) => !t.example);
  const showResults = visibleResults.length > 0;
  const showTestimonials = visibleTestimonials.length > 0;

  const nav = [
    { href: "#no-app", label: "Benefícios" },
    showResults && { href: "#resultados", label: "Resultados" },
    { href: "#sobre", label: "Sobre" },
    { href: "#como-funciona", label: "Como funciona" },
    showTestimonials && { href: "#depoimentos", label: "Depoimentos" },
    { href: "#duvidas", label: "Dúvidas" },
    { href: "#contato", label: "Contato" },
  ].filter(Boolean) as { href: string; label: string }[];

  // Número de cada seção na ordem em que aparece (seções ocultas não pulam números).
  let n = 0;
  const next = () => ++n;

  return (
    // Página pública sempre escura (identidade preto + laranja), independente do tema do aparelho.
    <div className={`theme-dark min-h-dvh bg-surface text-ink ${s.root}`}>
      {LANDING.draft && (
        <p className="relative z-50 bg-amber-400 px-4 py-2 text-center text-xs font-medium text-black">
          Página em construção: textos e imagens marcados como “Exemplo” serão trocados pelo conteúdo real.
        </p>
      )}

      <PointerGlow />
      <LandingHeader nav={nav} brand={hero.brand} />

      <main>
        <Hero showResults={showResults} />
        <Ribbons words={ribbon} />
        <Benefits index={next()} />
        <Comparison index={next()} />
        {showResults && <Results index={next()} results={visibleResults} />}
        <About index={next()} />
        <Journey index={next()} />
        {showTestimonials && <Testimonials index={next()} items={visibleTestimonials} />}
        <FaqSection index={next()} whatsappHref={whatsappHref} />
        <FinalCta whatsappHref={whatsappHref} />
      </main>

      <Footer nav={nav} whatsappHref={whatsappHref} />
    </div>
  );
}
