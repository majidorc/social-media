import type { WatermarkPosition } from "@prisma/client";
import sharp from "sharp";
import {
  computeWatermarkCoordinates,
  resolveWatermarkPosition,
  WATERMARK_CORNER_PADDING_PX,
} from "@/lib/watermark-position";

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

export interface ApplyWatermarkOptions {
  padding?: number;
  position?: WatermarkPosition | null;
}

export async function applyWatermark(
  imageUrl: string,
  logoUrl: string,
  options?: ApplyWatermarkOptions,
): Promise<string> {
  const padding = options?.padding ?? WATERMARK_CORNER_PADDING_PX;
  const position = resolveWatermarkPosition(options?.position ?? undefined);

  const [baseImageBuffer, logoSourceBuffer] = await Promise.all([
    loadImageBuffer(imageUrl),
    loadImageBuffer(logoUrl),
  ]);

  const baseMetadata = await sharp(baseImageBuffer).metadata();
  const baseWidth = baseMetadata.width;
  const baseHeight = baseMetadata.height;

  if (!baseWidth || !baseHeight) {
    throw new Error("Generated image is missing width or height metadata.");
  }

  const maxLogoWidth = Math.max(1, Math.round(baseWidth * MAX_LOGO_WIDTH_RATIO));
  const logoBuffer = await sharp(logoSourceBuffer)
    .resize({
      width: maxLogoWidth,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  const logoMetadata = await sharp(logoBuffer).metadata();
  const logoWidth = logoMetadata.width;
  const logoHeight = logoMetadata.height;

  if (!logoWidth || !logoHeight) {
    throw new Error("Watermark logo is missing width or height metadata.");
  }

  const { left, top } = computeWatermarkCoordinates(
    position,
    baseWidth,
    baseHeight,
    logoWidth,
    logoHeight,
    padding,
  );

  const outputFormat = baseMetadata.format === "jpeg" ? "jpeg" : "png";
  const composited = sharp(baseImageBuffer).composite([
    {
      input: logoBuffer,
      top,
      left,
    },
  ]);

  const outputBuffer =
    outputFormat === "jpeg"
      ? await composited.jpeg({ quality: 90 }).toBuffer()
      : await composited.png().toBuffer();

  const mimeType = outputFormat === "jpeg" ? "image/jpeg" : "image/png";

  return `data:${mimeType};base64,${outputBuffer.toString("base64")}`;
}

export interface ApplyWatermarkIfConfiguredOptions {
  position?: WatermarkPosition | null;
  padding?: number;
}

export async function applyWatermarkIfConfigured(
  imageUrl: string,
  watermarkLogoUrl: string | null | undefined,
  options?: ApplyWatermarkIfConfiguredOptions,
): Promise<string> {
  if (!watermarkLogoUrl?.trim()) {
    return imageUrl;
  }

  try {
    return await applyWatermark(imageUrl, watermarkLogoUrl, {
      position: options?.position,
      padding: options?.padding,
    });
  } catch (error) {
    console.error(
      "[watermark] Failed to apply logo overlay, using raw image:",
      error,
    );
    return imageUrl;
  }
}
