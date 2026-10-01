// Redimensionne une image côté client avant l'upload : évite de stocker des
// photos de plusieurs Mo dans Supabase Storage et accélère les chargements
// futurs. Fait via canvas, aucune dépendance. maxDimension/quality sont
// réglables par appelant (un avatar peut rester petit, une capture d'écran
// de résultat de match doit rester lisible une fois zoomée).
const DEFAULT_MAX_DIMENSION = 512;
const DEFAULT_JPEG_QUALITY = 0.85;

export async function resizeImageFile(
  file: File,
  options?: { maxDimension?: number; quality?: number; filename?: string },
): Promise<File> {
  const maxDimension = options?.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options?.quality ?? DEFAULT_JPEG_QUALITY;
  const filename = options?.filename ?? "avatar.jpg";

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) return file;

  return new File([blob], filename, { type: "image/jpeg" });
}
