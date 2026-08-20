// Redimensionne une image côté client avant l'upload (avatar) : évite de
// stocker des photos de plusieurs Mo dans Supabase Storage et accélère les
// chargements futurs (CDC 13.4/14.2). Fait via canvas, aucune dépendance.
const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.85;

export async function resizeImageFile(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) return file;

  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}
