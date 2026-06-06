function triggerBlobDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64 = ""] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);/);
  const mime = mimeMatch?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mime });
}

export function buildImageDownloadFilename(prefix = "ai-hub"): string {
  return `${prefix}-${Date.now()}.png`;
}

export function buildVideoDownloadFilename(prefix = "ai-hub"): string {
  return `${prefix}-${Date.now()}.mp4`;
}

export async function downloadImageAsset(
  imageUrl: string,
  filename = buildImageDownloadFilename(),
): Promise<void> {
  if (imageUrl.startsWith("data:")) {
    triggerBlobDownload(dataUrlToBlob(imageUrl), filename);
    return;
  }

  try {
    const response = await fetch(imageUrl, { mode: "cors" });
    if (!response.ok) {
      throw new Error("Fetch failed");
    }

    const blob = await response.blob();
    triggerBlobDownload(blob, filename);
    return;
  } catch {
    const proxyResponse = await fetch(
      `/api/download-image?url=${encodeURIComponent(imageUrl)}`,
    );

    if (!proxyResponse.ok) {
      throw new Error("Could not download image.");
    }

    const blob = await proxyResponse.blob();
    triggerBlobDownload(blob, filename);
  }
}

export async function downloadVideoAsset(
  videoUrl: string,
  filename = buildVideoDownloadFilename(),
): Promise<void> {
  if (videoUrl.startsWith("data:")) {
    triggerBlobDownload(dataUrlToBlob(videoUrl), filename);
    return;
  }

  try {
    const response = await fetch(videoUrl, { mode: "cors" });
    if (!response.ok) {
      throw new Error("Fetch failed");
    }

    const blob = await response.blob();
    triggerBlobDownload(blob, filename);
    return;
  } catch {
    const proxyResponse = await fetch(
      `/api/download-image?url=${encodeURIComponent(videoUrl)}`,
    );

    if (!proxyResponse.ok) {
      throw new Error("Could not download video.");
    }

    const blob = await proxyResponse.blob();
    triggerBlobDownload(blob, filename);
  }
}
