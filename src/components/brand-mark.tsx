import Image from "next/image";
import { Dumbbell } from "lucide-react";
import { BRAND } from "@/lib/brand";

const SIZES = { sm: "size-8 rounded-lg", md: "size-9 rounded-xl", lg: "size-10 rounded-xl" };
const ICON = { sm: "size-4", md: "size-5", lg: "size-5" };

// Símbolo da marca ao lado do nome (menu, login, página inicial). Com o logo do Personal em
// src/lib/brand.ts, mostra o símbolo num quadrado branco (o logo foi feito para fundo claro);
// sem logo, mostra o ícone de halter laranja.
export function BrandMark({ size = "md" }: { size?: keyof typeof SIZES }) {
  if (BRAND.logo) {
    return (
      <span aria-hidden className={`relative block shrink-0 overflow-hidden bg-white ${SIZES[size]}`}>
        <Image src={BRAND.logo.src} alt="" fill sizes="40px" className="object-contain p-0.5" />
      </span>
    );
  }
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center bg-brand text-brand-contrast ${SIZES[size]}`}>
      <Dumbbell className={ICON[size]} />
    </span>
  );
}
