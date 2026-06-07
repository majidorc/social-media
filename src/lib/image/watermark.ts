import sharp from "sharp";

const DEFAULT_PADDING_PX = 20;
const MAX_LOGO_WIDTH_RATIO = 0.2;

const DATA_URL_PATTERN = /^data:([^;]+);base64,(.+)$/;

export async function loadImageBuffer(source: string): Promise<Buffer> {
  const trimmed = source.trim();

  if (trimmed.startsWith("data:")) {
    const match = trimmed.match(DATA_URL_PATTERN);
    if (!match?.[2]) {
      throw new Error("Invalid data URL.");
    }

    return Buffer.from(match[2], "base64");
  }

  const response = await fetch(trimmed);
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status}).`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function applyWatermark(
  imageUrl: string,
  logoUrl: string,
  options?: { padding?: number },
): Promise<string> {
  const padding = options?.padding ?? DEFAULT_PADDING_PX;

  const [imageBuffer, logoBuffer] = await Promise.all([
    loadImageBuffer(imageUrl),
    loadImageBuffer(logoUrl),
  ]);

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const imageWidth = metadata.width ?? 1024;
  const imageHeight = metadata.height ?? 1024;

  const maxLogoWidth = Math.max(1, Math.round(imageWidth * MAX_LOGO_WIDTH_RATIO));
  const logo = sharp(logoBuffer).resize({
    width: maxLogoWidth,
    fit: "inside",
    withoutEnlargement: true,
  });

  const logoMeta = await logo.metadata();
  const logoWidth = logoMeta.width ?? maxLogoWidth;
  const logoHeight = logoMeta.height ?? maxLogoWidth;
  const logoPng = await logo.png().toBuffer();

  const left = Math.max(0, imageWidth - logoWidth - padding);
  const top = Math.max(0, imageHeight - logoHeight - padding);

  const outputFormat = metadata.format === "jpeg" ? "jpeg" : "png";
  const composited = image.composite([
    {
      input: logoPng,
      left,
      top,
    },
  ]);

  const outputBuffer =
    outputFormat === "jpeg"
      ? await composited.jpeg({ quality: 90 }).toBuffer()
      : await composited.png().toBuffer();

  const mimeType = outputFormat === "jpeg" ? "image/jpeg" : "image/png";

  return `data:${mimeType};base64,${outputBuffer.toString("base64")}`;
}

export async function applyWatermarkIfConfigured(
  imageUrl: string,
  watermarkLogoUrl: string | null | undefined,
): Promise<string> {
  if (!watermarkLogoUrl?.trim()) {
    return imageUrl;
  }

  try {
    return await applyWatermark(imageUrl, watermarkLogoUrl);
  } catch (error) {
    console.error(
      "[watermark] Failed to apply logo overlay, using raw image:",
      error,
    );
    return imageUrl;
  }
}
