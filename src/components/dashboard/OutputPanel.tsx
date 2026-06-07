"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { PLATFORM_OPTIONS } from "@/lib/constants";
import {
  buildImageDownloadFilename,
  buildVideoDownloadFilename,
  downloadImageAsset,
  downloadVideoAsset,
} from "@/lib/download-image";
import type { GenerationOutputs } from "@/types";
import {
  Copy,
  Download,
  ImageIcon,
  Loader2,
  Sparkles,
  Video,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SchedulePostSection } from "@/components/dashboard/SchedulePostSection";

interface OutputPanelProps {
  workspaceId: string | null;
  scheduledFor: string | null;
  onScheduledChange?: (scheduledFor: string | null) => void;
  outputs: GenerationOutputs | null;
  isLoading: boolean;
  error: string | null;
}

type OutputTab = "platforms" | "video";

export function OutputPanel({
  workspaceId,
  scheduledFor,
  onScheduledChange,
  outputs,
  isLoading,
  error,
}: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<OutputTab>("platforms");
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedVideoScript, setCopiedVideoScript] = useState(false);
  const [copiedVoiceover, setCopiedVoiceover] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (outputs?.video) {
      setActiveTab("video");
      return;
    }

    setActiveTab("platforms");
  }, [outputs?.video?.url]);

  const copyContent = async (platform: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  const copyText = async (
    text: string,
    setCopied: (value: boolean) => void,
  ) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = async (imageUrl: string) => {
    setDownloadError(null);
    setIsDownloadingImage(true);

    try {
      await downloadImageAsset(imageUrl, buildImageDownloadFilename());
    } catch {
      setDownloadError("Image download failed. Try again in a moment.");
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const handleDownloadVideo = async (videoUrl: string) => {
    setDownloadError(null);
    setIsDownloadingVideo(true);

    try {
      await downloadVideoAsset(videoUrl, buildVideoDownloadFilename());
    } catch {
      setDownloadError("Video download failed. Try again in a moment.");
    } finally {
      setIsDownloadingVideo(false);
    }
  };

  const imageModelLabel = outputs?.visuals?.imageModel ?? null;
  const hasVideo = Boolean(outputs?.video?.url);

  return (
    <Card
      title="Generated outputs"
      description="Platform copy, optional graphics, and video assets appear here after generation."
      className="h-full"
    >
      {isLoading ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-muted sm:min-h-80">
          <Loader2 className="h-8 w-8 animate-spin text-accent-text" />
          <p className="text-sm">Generating platform copy and media assets...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : !outputs ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-center text-muted sm:min-h-80">
          <Sparkles className="h-10 w-10 text-muted" />
          <p className="max-w-sm text-sm">
            Add any combination of inputs, pick your platforms, and click
            Generate to preview tailored content and optional media.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card-muted p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Blended prompt
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {outputs.blendedPrompt}
            </p>
          </div>

          {outputs.visuals ? (
            <article className="overflow-hidden rounded-xl border border-border bg-card-muted">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-accent-text" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Generated graphic
                  </h3>
                  {imageModelLabel ? <Badge>{imageModelLabel}</Badge> : null}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isDownloadingImage}
                  onClick={() =>
                    handleDownloadImage(outputs.visuals?.imageUrl ?? "")
                  }
                >
                  {isDownloadingImage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {isDownloadingImage ? "Downloading..." : "Download image"}
                </Button>
              </div>
              <div className="relative aspect-square w-full bg-card-muted">
                <Image
                  src={outputs.visuals.imageUrl}
                  alt="AI-generated social graphic"
                  fill
                  unoptimized
                  crossOrigin="anonymous"
                  className="object-contain"
                />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Image prompt used
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      void copyText(
                        outputs.visuals?.promptUsed ?? "",
                        setCopiedPrompt,
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-card-muted hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedPrompt ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                  {outputs.visuals.promptUsed}
                </p>
              </div>
            </article>
          ) : outputs.visualImagePrompt ? (
            <div className="rounded-xl border border-border bg-card-muted p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                Visual image prompt
              </p>
              <p className="text-sm leading-relaxed text-foreground">
                {outputs.visualImagePrompt}
              </p>
            </div>
          ) : null}

          {downloadError ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300">
              {downloadError}
            </p>
          ) : null}

          <div className="space-y-4">
            <div className="flex gap-2 border-b border-border">
              <button
                type="button"
                onClick={() => setActiveTab("platforms")}
                className={cn(
                  "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  activeTab === "platforms"
                    ? "border-violet-500 text-accent-text"
                    : "border-transparent text-muted hover:text-foreground",
                )}
              >
                Platforms
              </button>
              {hasVideo ? (
                <button
                  type="button"
                  onClick={() => setActiveTab("video")}
                  className={cn(
                    "inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                    activeTab === "video"
                      ? "border-violet-500 text-accent-text"
                      : "border-transparent text-muted hover:text-foreground",
                  )}
                >
                  <Video className="h-3.5 w-3.5" />
                  Video
                </button>
              ) : null}
            </div>

            {activeTab === "video" && outputs.video ? (
              <article className="overflow-hidden rounded-xl border border-border bg-card-muted">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-accent-text" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Generated video
                    </h3>
                    <Badge>Preview</Badge>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isDownloadingVideo}
                    onClick={() => handleDownloadVideo(outputs.video?.url ?? "")}
                  >
                    {isDownloadingVideo ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    {isDownloadingVideo ? "Downloading..." : "Download video"}
                  </Button>
                </div>
                <div className="bg-black p-3">
                  <video
                    src={outputs.video.url}
                    controls
                    playsInline
                    preload="metadata"
                    className="aspect-video w-full rounded-lg bg-card-muted"
                  >
                    Your browser does not support HTML5 video playback.
                  </video>
                </div>
                <div className="space-y-4 p-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">
                        Video script
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          void copyText(
                            outputs.video?.script ?? "",
                            setCopiedVideoScript,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-card-muted hover:text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copiedVideoScript ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                      {outputs.video.script}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">
                        Voiceover copy
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          void copyText(
                            outputs.video?.voiceoverCopy ?? "",
                            setCopiedVoiceover,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-card-muted hover:text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copiedVoiceover ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">
                      {outputs.video.voiceoverCopy}
                    </p>
                  </div>
                </div>
              </article>
            ) : (
              <div className="space-y-4">
                {outputs.platforms.map((item) => {
                  const label =
                    PLATFORM_OPTIONS.find(
                      (option) => option.value === item.platform,
                    )?.label ?? item.platform;

                  return (
                    <article
                      key={item.platform}
                      className="rounded-xl border border-border bg-card-muted p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">
                            {label}
                          </h3>
                          <Badge>{item.platform}</Badge>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            void copyContent(item.platform, item.content)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-card-muted hover:text-foreground"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedPlatform === item.platform ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                        {item.content}
                      </pre>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <SchedulePostSection
            workspaceId={workspaceId}
            scheduledFor={scheduledFor}
            onScheduledChange={onScheduledChange}
          />
        </div>
      )}
    </Card>
  );
}
