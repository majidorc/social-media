import type { Platform } from "@prisma/client";
import { PLATFORM_OPTIONS } from "@/lib/constants";

export interface PlatformShareOutcome {
  success: boolean;
  message: string;
}

const SHARE_LABELS: Record<Platform, string> = {
  INSTAGRAM: "Share to Instagram",
  TWITTER: "Post on X",
  LINKEDIN: "Share on LinkedIn",
  TIKTOK: "Share on TikTok",
  YOUTUBE: "Open YouTube Studio",
  FACEBOOK: "Share on Facebook",
};

export function getPlatformShareLabel(platform: Platform): string {
  return SHARE_LABELS[platform];
}

export function getPlatformDisplayLabel(platform: Platform): string {
  return (
    PLATFORM_OPTIONS.find((option) => option.value === platform)?.label ?? platform
  );
}

async function fetchImageBlob(imageUrl: string): Promise<Blob> {
  if (imageUrl.startsWith("data:")) {
    const [header, base64 = ""] = imageUrl.split(",");
    const mimeMatch = header.match(/data:(.*?);/);
    const mime = mimeMatch?.[1] ?? "image/png";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return new Blob([bytes], { type: mime });
  }

  try {
    const response = await fetch(imageUrl, { mode: "cors" });
    if (response.ok) {
      return response.blob();
    }
  } catch {
    // Fall through to proxy.
  }

  const proxyResponse = await fetch(
    `/api/download-image?url=${encodeURIComponent(imageUrl)}`,
    { credentials: "same-origin" },
  );

  if (!proxyResponse.ok) {
    throw new Error("Could not load image for sharing.");
  }

  return proxyResponse.blob();
}

async function tryNativeShareWithImage(
  text: string,
  imageUrl: string,
): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share || !navigator.canShare) {
    return false;
  }

  try {
    const blob = await fetchImageBlob(imageUrl);
    const file = new File([blob], "social-post.png", {
      type: blob.type || "image/png",
    });
    const shareData: ShareData = { text, files: [file] };

    if (!navigator.canShare(shareData)) {
      return false;
    }

    await navigator.share(shareData);
    return true;
  } catch {
    return false;
  }
}

function openShareWindow(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer,width=580,height=640");
}

export async function sharePlatformContent(
  platform: Platform,
  content: string,
  options?: { imageUrl?: string | null },
): Promise<PlatformShareOutcome> {
  const text = content.trim();

  if (!text) {
    return { success: false, message: "Nothing to share yet." };
  }

  switch (platform) {
    case "TWITTER": {
      const tweet =
        text.length > 280 ? `${text.slice(0, 277).trimEnd()}…` : text;
      openShareWindow(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`,
      );
      return { success: true, message: "Opened X compose window with your caption." };
    }

    case "FACEBOOK": {
      openShareWindow(
        `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`,
      );
      return { success: true, message: "Opened Facebook share dialog." };
    }

    case "LINKEDIN": {
      await navigator.clipboard.writeText(text);
      openShareWindow("https://www.linkedin.com/feed/");
      return {
        success: true,
        message: "Caption copied — paste it into your LinkedIn post.",
      };
    }

    case "INSTAGRAM": {
      await navigator.clipboard.writeText(text);

      if (options?.imageUrl) {
        const sharedNatively = await tryNativeShareWithImage(text, options.imageUrl);
        if (sharedNatively) {
          return {
            success: true,
            message: "Choose Instagram in the share sheet to finish posting.",
          };
        }
      }

      openShareWindow("https://www.instagram.com/");
      return {
        success: true,
        message:
          "Caption copied — open Instagram, create a post, and paste your caption.",
      };
    }

    case "TIKTOK": {
      await navigator.clipboard.writeText(text);
      openShareWindow("https://www.tiktok.com/upload");
      return {
        success: true,
        message: "Caption copied — paste it when uploading on TikTok.",
      };
    }

    case "YOUTUBE": {
      await navigator.clipboard.writeText(text);
      openShareWindow("https://studio.youtube.com/");
      return {
        success: true,
        message: "Description copied — paste it in YouTube Studio.",
      };
    }

    default: {
      await navigator.clipboard.writeText(text);
      return { success: true, message: "Content copied to clipboard." };
    }
  }
}
