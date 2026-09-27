import type { Metadata } from "next";
import { Barlow, Geist_Mono, Saira } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { ToastProvider } from "@/components/ui/toast";

// Tipografia da marca: Saira (larga e esportiva, ecoa o "MARILIA FERREIRA" do logo) em títulos e
// números grandes; Barlow nos textos. A Saira é variável também na largura (eixo wdth), usada
// mais larga só no topo da página inicial.
const saira = Saira({
  variable: "--font-saira",
  subsets: ["latin"],
  axes: ["wdth"],
});

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Título da aba: "Página · Nome do Personal" (o nome vem de src/lib/brand.ts).
export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
  description: BRAND.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${saira.variable} ${barlow.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
