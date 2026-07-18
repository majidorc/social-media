import sharp from "sharp";
import { loadImageBuffer } from "@/lib/image/watermark";

const MAX_EDGE_PX = 1280;
const JPEG_QUALITY = 82;
/** Rough base64 length where Coolify/proxy responses start failing. */
const OVERSIZED_DATA_URL_CHARS = 900_000;

export function isOversizedDataUrl(imageUrl: string): boolean {
  return imageUrl.startsWith("data:") && imageUrl.length > OVERSIZED_DATA_URL_CHARS;
}

/** Shrink generated data URLs so workspace JSON + API responses stay proxy-safe. */
export async function optimizeGeneratedImageDataUrl(
  imageUrl: string,
): Promise<string> {
  const trimmed = imageUrl.trim();

  if (!trimmed.startsWith("data:")) {
    return trimmed;
  }

  try {
    const buffer = await loadImageBuffer(trimmed);
    const optimized = await sharp(buffer)
      .rotate()
      .resize({
        width: MAX_EDGE_PX,
        height: MAX_EDGE_PX,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    return `data:image/jpeg;base64,${optimized.toString("base64")}`;
  } catch (error) {
    console.error("[image] Failed to optimize generated image:", error);
    return trimmed;
  }
}
