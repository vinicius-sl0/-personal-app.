// Prepara as fotos da página inicial: remove informações escondidas (GPS, modelo do celular,
// data), gira na posição certa, reduz o tamanho e salva em /public (que é PÚBLICO na internet).
//
// Como usar: coloque os originais na pasta "material/" (ela NÃO vai para o Git) e rode:
//   pnpm fotos
//
//   material/personal.jpg              → public/landing/personal.webp   (foto principal)
//   material/logo.png  (ou .svg)       → public/logo.png / logo.svg (logo completo)
//   material/logo-icone.png (opcional) → public/logo-icone.png + ícones do app (símbolo quadrado;
//                                        sem ele, os ícones usam o logo completo)
//   material/resultados/nome-antes.jpg → public/landing/resultados/nome-antes.webp
//   material/resultados/nome-depois.jpg
//
// Aceita .jpg, .jpeg, .png, .webp e .heic (fotos de iPhone, quando o sistema suportar).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const IN = path.join(ROOT, "material");
const OUT = path.join(ROOT, "public");
const PHOTO_EXT = /\.(jpe?g|png|webp|heic|heif)$/i;

const done = [];

function find(dir, base) {
  if (!fs.existsSync(dir)) return null;
  const f = fs.readdirSync(dir).find((n) => path.parse(n).name.toLowerCase() === base && (PHOTO_EXT.test(n) || n.endsWith(".svg")));
  return f ? path.join(dir, f) : null;
}

// Foto: sem metadados (o sharp só copia se pedirmos), girada pela orientação do celular.
async function photo(src, dest, maxSide) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const info = await sharp(src)
    .rotate()
    .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(dest);
  done.push({ arquivo: path.relative(ROOT, dest), largura: info.width, altura: info.height, kb: Math.round(info.size / 1024) });
}

async function main() {
  if (!fs.existsSync(IN)) {
    console.log('Pasta "material/" não encontrada. Crie a pasta e coloque as fotos nela.');
    return;
  }

  const personal = find(IN, "personal");
  if (personal) await photo(personal, path.join(OUT, "landing", "personal.webp"), 1400);

  const logo = find(IN, "logo");
  if (logo && logo.endsWith(".svg")) {
    fs.copyFileSync(logo, path.join(OUT, "logo.svg"));
    done.push({ arquivo: "public/logo.svg" });
  } else if (logo) {
    const dest = path.join(OUT, "logo.png");
    const info = await sharp(logo).rotate().resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true }).png().toFile(dest);
    done.push({ arquivo: "public/logo.png", largura: info.width, altura: info.height, kb: Math.round(info.size / 1024) });
  }
  const mark = find(IN, "logo-icone");
  if (mark) {
    const dest = path.join(OUT, "logo-icone.png");
    await sharp(mark).resize({ width: 256, height: 256, fit: "contain", background: "#ffffff" }).png().toFile(dest);
    done.push({ arquivo: "public/logo-icone.png", largura: 256, altura: 256 });
  }
  const iconSrc = mark ?? logo;
  if (iconSrc) {
    // Ícones do app (aba do navegador e tela inicial do celular): símbolo centralizado em quadrado
    // branco (o logo foi desenhado para fundo claro).
    for (const [name, size] of [["icon.png", 512], ["apple-icon.png", 180]]) {
      const dest = path.join(ROOT, "src", "app", name);
      const pad = Math.round(size * 0.08);
      await sharp(iconSrc, { density: 300 })
        .resize({ width: size - pad * 2, height: size - pad * 2, fit: "contain", background: "#ffffff" })
        .extend({ top: pad, bottom: pad, left: pad, right: pad, background: "#ffffff" })
        .flatten({ background: "#ffffff" })
        .png()
        .toFile(dest);
      done.push({ arquivo: path.relative(ROOT, dest), largura: size, altura: size });
    }
  }

  const resDir = path.join(IN, "resultados");
  if (fs.existsSync(resDir)) {
    for (const f of fs.readdirSync(resDir).filter((n) => PHOTO_EXT.test(n))) {
      const name = path.parse(f).name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9-]+/g, "-");
      await photo(path.join(resDir, f), path.join(OUT, "landing", "resultados", `${name}.webp`), 900);
    }
  }

  if (done.length === 0) console.log('Nenhuma foto encontrada em "material/". Veja os nomes esperados no topo deste arquivo.');
  else console.table(done);
}

main().catch((err) => {
  console.error("Erro ao preparar as fotos:", err.message);
  process.exit(1);
});
