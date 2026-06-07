import type { WatermarkPosition } from "@prisma/client";

export const DEFAULT_WATERMARK_POSITION: WatermarkPosition = "BOTTOM_RIGHT";

export const WATERMARK_CORNER_PADDING_PX = 24;

export const WATERMARK_POSITION_OPTIONS: {
  value: WatermarkPosition;
  label: string;
}[] = [
  { value: "TOP_LEFT", label: "Top Left" },
  { value: "TOP_RIGHT", label: "Top Right" },
  { value: "BOTTOM_LEFT", label: "Bottom Left" },
  { value: "BOTTOM_RIGHT", label: "Bottom Right" },
  { value: "CENTER", label: "Center" },
];

export function isWatermarkPosition(value: string): value is WatermarkPosition {
  return WATERMARK_POSITION_OPTIONS.some((option) => option.value === value);
}

export function resolveWatermarkPosition(
  value: WatermarkPosition | null | undefined,
): WatermarkPosition {
  if (value && isWatermarkPosition(value)) {
    return value;
  }

  return DEFAULT_WATERMARK_POSITION;
}

export function computeWatermarkCoordinates(
  position: WatermarkPosition,
  imageWidth: number,
  imageHeight: number,
  logoWidth: number,
  logoHeight: number,
  padding: number = WATERMARK_CORNER_PADDING_PX,
): { left: number; top: number } {
  switch (position) {
    case "TOP_LEFT":
      return {
        top: padding,
        left: padding,
      };
    case "TOP_RIGHT":
      return {
        top: padding,
        left: imageWidth - logoWidth - padding,
      };
    case "BOTTOM_LEFT":
      return {
        top: imageHeight - logoHeight - padding,
        left: padding,
      };
    case "BOTTOM_RIGHT":
      return {
        top: imageHeight - logoHeight - padding,
        left: imageWidth - logoWidth - padding,
      };
    case "CENTER":
      return {
        top: Math.floor((imageHeight - logoHeight) / 2),
        left: Math.floor((imageWidth - logoWidth) / 2),
      };
    default:
      return {
        top: imageHeight - logoHeight - padding,
        left: imageWidth - logoWidth - padding,
      };
  }
}

export function watermarkPreviewPositionClass(position: WatermarkPosition): string {
  switch (position) {
    case "TOP_LEFT":
      return "top-2 left-2";
    case "TOP_RIGHT":
      return "top-2 right-2";
    case "BOTTOM_LEFT":
      return "bottom-2 left-2";
    case "BOTTOM_RIGHT":
      return "bottom-2 right-2";
    case "CENTER":
      return "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";
    default:
      return "bottom-2 right-2";
  }
}
