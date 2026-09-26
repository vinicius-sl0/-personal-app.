// IDENTIDADE DO PERSONAL — o único lugar para nome, descrição e logo.
// As CORES ficam em src/app/globals.css (tokens --brand, --line...).
// Os ÍCONES ficam em src/app: favicon.ico (aba do navegador); para o ícone do celular,
// coloque um icon.png (512×512) e um apple-icon.png (180×180) na mesma pasta — o Next usa sozinho.

export type BrandLogo = {
  src: string; // arquivo dentro da pasta /public, ex.: "/logo.svg"
  width: number; // tamanho natural da imagem, em pixels
  height: number;
  alt: string; // descrição para leitores de tela, ex.: "Logo João Silva Personal"
};

export const BRAND = {
  // Nome que aparece na aba do navegador, na página inicial e no login.
  name: "Personal Trainer",
  // Frase curta abaixo do nome na página inicial (e descrição para buscadores).
  tagline: "Acompanhe seus treinos, avaliações e evolução em um só lugar.",
  // Logo: deixe null até receber o arquivo do Personal.
  logo: null as BrandLogo | null,
};
