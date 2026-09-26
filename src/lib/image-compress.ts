// Reduz a imagem (lado maior até `maxSide` px) e regrava em WebP (ou JPEG, se o navegador não
// gerar WebP). Regravar também remove os dados escondidos da imagem (EXIF), como a localização GPS.
// Só funciona no navegador. Usado nas fotos de progresso e nas imagens de exercício.
export async function compressImage(file: File, maxSide: number) {
  // Alguns Safari antigos recusam a opção; nesse caso lê sem ela.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => createImageBitmap(file));
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponível");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const toBlob = (type: string, quality: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

  let blob = await toBlob("image/webp", 0.82);
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", 0.85);
  if (!blob) throw new Error("falha ao gerar imagem");

  return { blob, width, height, mime: blob.type as "image/webp" | "image/jpeg" };
}
