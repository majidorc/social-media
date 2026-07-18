"use client";

import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  formatTokenCount,
  formatUsageCost,
  getTotalTokenCount,
} from "@/lib/ai/cost-calculator";
import { cn } from "@/lib/utils";
import { PLATFORM_OPTIONS, PLATFORM_SHORT_LABELS } from "@/lib/constants";
import {
  buildImageDownloadFilename,
  downloadImageAsset,
} from "@/lib/download-image";
import { getInstagramAltText } from "@/lib/ai/prompts";
import {
  getPlatformShareLabel,
  sharePlatformContent,
} from "@/lib/platform-share";
import type { GenerationOutputs, RegenerateMode } from "@/types";
import type { Platform } from "@prisma/client";
import {
  Copy,
  Download,
  ImageIcon,
  Loader2,
  RefreshCw,
  Share2,
  Sparkles,
  Video,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { SchedulePostSection } from "@/components/dashboard/SchedulePostSection";
import { Toast } from "@/components/ui/Toast";

interface OutputPanelProps {
  workspaceId: string | null;
  scheduledFor: string | null;
  onScheduledChange?: (scheduledFor: string | null) => void;
  outputs: GenerationOutputs | null;
  isLoading: boolean;
  regeneratingMode?: RegenerateMode | null;
  onRegenerate?: (mode: RegenerateMode) => void;
  canRegenerateImage?: boolean;
  error: string | null;
  canSchedule?: boolean;
}

type OutputTab = "platforms" | "video-script";

export function OutputPanel({
  workspaceId,
  scheduledFor,
  onScheduledChange,
  outputs,
  isLoading,
  regeneratingMode = null,
  onRegenerate,
  canRegenerateImage = false,
  error,
  canSchedule = true,
}: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<OutputTab>("platforms");
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedAltText, setCopiedAltText] = useState(false);
  const [copiedVideoScript, setCopiedVideoScript] = useState(false);
  const [copiedVoiceover, setCopiedVoiceover] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [shareToastVariant, setShareToastVariant] = useState<"success" | "error">(
    "success",
  );

  const activePlatformOutput = useMemo(() => {
    if (!outputs || !activePlatform) {
      return outputs?.platforms[0] ?? null;
    }

    return (
      outputs.platforms.find((item) => item.platform === activePlatform) ??
      outputs.platforms[0] ??
      null
    );
  }, [activePlatform, outputs]);

  useEffect(() => {
    if (!outputs?.platforms.length) {
      setActivePlatform(null);
      return;
    }

    setActivePlatform((current) => {
      if (
        current &&
        outputs.platforms.some((item) => item.platform === current)
      ) {
        return current;
      }

      return outputs.platforms[0].platform;
    });
  }, [outputs]);

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

  const handleSharePlatform = async (platform: Platform, content: string) => {
    setIsSharing(true);
    setShareToast(null);

    try {
      const result = await sharePlatformContent(platform, content, {
        imageUrl: outputs?.visuals?.imageUrl ?? null,
      });

      setShareToastVariant(result.success ? "success" : "error");
      setShareToast(result.message);
    } catch {
      setShareToastVariant("error");
      setShareToast("Could not share this post. Try copying instead.");
    } finally {
      setIsSharing(false);
    }
  };

  const imageModelLabel = outputs?.visuals?.imageModel ?? null;
  const hasVideoScript = Boolean(
    outputs?.video?.script?.trim() || outputs?.video?.voiceoverCopy?.trim(),
  );
  const isBusy = isLoading || regeneratingMode !== null;
  const canRegenerate = Boolean(workspaceId && onRegenerate && !isBusy);
  const instagramAltText =
    activePlatformOutput?.platform === "INSTAGRAM"
      ? getInstagramAltText(activePlatformOutput.metadata)
      : null;

  return (
    <>
    <Card
      title="Generated outputs"
      description="Platform copy, optional graphics, and video scripts appear here after generation."
      className="h-full"
      actions={
        outputs && activeTab === "platforms" && activePlatformOutput ? (
          <Button
            type="button"
            size="sm"
            disabled={isSharing || isBusy}
            onClick={() =>
              void handleSharePlatform(
                activePlatformOutput.platform,
                activePlatformOutput.content,
              )
            }
            className="shrink-0"
          >
            {isSharing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            {getPlatformShareLabel(activePlatformOutput.platform)}
          </Button>
        ) : null
      }
    >
      {isLoading ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-muted sm:min-h-80">
          <Loader2 className="h-8 w-8 animate-spin text-accent-text" />
          <p className="text-sm">Generating platform copy and media assets...</p>
        </div>
      ) : error && !outputs ? (
        <Alert variant="error" className="p-4">
          {error}
        </Alert>
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
          {error ? (
            <Alert variant="error" className="px-4 py-2 text-xs">
              {error}
            </Alert>
          ) : null}

          <div className="rounded-xl border border-border bg-card-muted p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Blended prompt
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {outputs.blendedPrompt}
            </p>
          </div>

          {downloadError ? (
            <Alert variant="error" className="px-4 py-2 text-xs">
              {downloadError}
            </Alert>
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
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
                  </div>
                  <div className="relative aspect-square w-full bg-card-muted">
                    {regeneratingMode === "image" ? (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-card/80 text-muted">
                        <Loader2 className="h-7 w-7 animate-spin text-accent-text" />
                        <p className="text-xs">Regenerating image...</p>
                      </div>
                    ) : null}
                    <Image
                      src={outputs.visuals.imageUrl}
                      alt="AI-generated social graphic"
                      fill
                      unoptimized
                      crossOrigin="anonymous"
                      className="object-contain"
                    />
                  </div>
                  <div className="space-y-3 border-t border-border p-4">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        type="button"
                        className="w-full"
                        disabled={isDownloadingImage || isBusy}
                        onClick={() =>
                          handleDownloadImage(outputs.visuals?.imageUrl ?? "")
                        }
                      >
                        {isDownloadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {isDownloadingImage ? "Downloading..." : "Download image"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        disabled={!canRegenerate || !canRegenerateImage}
                        onClick={() => onRegenerate?.("image")}
                      >
                        {regeneratingMode === "image" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        {regeneratingMode === "image"
                          ? "Regenerating..."
                          : "Regenerate image"}
                      </Button>
                    </div>
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
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-card hover:text-foreground"
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
                <div className="space-y-3 rounded-xl border border-border bg-card-muted p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                    Visual image prompt
                  </p>
                  <p className="text-sm leading-relaxed text-foreground">
                    {outputs.visualImagePrompt}
                  </p>
                  {canRegenerateImage ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      disabled={!canRegenerate}
                      onClick={() => onRegenerate?.("image")}
                    >
                      {regeneratingMode === "image" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      {regeneratingMode === "image"
                        ? "Regenerating..."
                        : "Regenerate image"}
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border bg-card-muted p-6 text-center">
                  <p className="text-sm text-muted">
                    No image was generated for this run.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4 lg:col-span-7">
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
                {hasVideoScript ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab("video-script")}
                    className={cn(
                      "inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                      activeTab === "video-script"
                        ? "border-violet-500 text-accent-text"
                        : "border-transparent text-muted hover:text-foreground",
                    )}
                  >
                    <Video className="h-3.5 w-3.5" />
                    Reels/TikTok Script
                  </button>
                ) : null}
              </div>

              {activeTab === "video-script" && outputs.video ? (
                <div className="space-y-4">
                  <article className="rounded-xl border border-border bg-card-muted p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-accent-text" />
                        <h3 className="text-sm font-semibold text-foreground">
                          Video script
                        </h3>
                        <Badge>Script</Badge>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void copyText(
                            outputs.video?.script ?? "",
                            setCopiedVideoScript,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-card hover:text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copiedVideoScript ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                      {outputs.video.script}
                    </pre>
                  </article>

                  <article className="rounded-xl border border-border bg-card-muted p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">
                        Voiceover narration
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          void copyText(
                            outputs.video?.voiceoverCopy ?? "",
                            setCopiedVoiceover,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-card hover:text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copiedVoiceover ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">
                      {outputs.video.voiceoverCopy}
                    </p>
                  </article>
                </div>
              ) : (
                <div className="space-y-4">
                  {outputs.platforms.length > 1 ? (
                    <div className="flex flex-wrap gap-2">
                      {outputs.platforms.map((item) => {
                        const isActive = activePlatformOutput?.platform === item.platform;
                        const shortLabel =
                          PLATFORM_SHORT_LABELS[item.platform] ?? item.platform;

                        return (
                          <button
                            key={item.platform}
                            type="button"
                            onClick={() => setActivePlatform(item.platform)}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                              isActive
                                ? "border-violet-500/40 bg-accent-soft text-accent-text"
                                : "border-border bg-card-muted text-muted hover:border-violet-500/25 hover:text-foreground",
                            )}
                          >
                            {shortLabel}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {activePlatformOutput ? (
                    <article className="rounded-xl border border-border bg-card-muted p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">
                            {PLATFORM_OPTIONS.find(
                              (option) => option.value === activePlatformOutput.platform,
                            )?.label ?? activePlatformOutput.platform}
                          </h3>
                          <Badge>{activePlatformOutput.platform}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void copyContent(
                                activePlatformOutput.platform,
                                activePlatformOutput.content,
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-card hover:text-foreground"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            {copiedPlatform === activePlatformOutput.platform
                              ? "Copied"
                              : "Copy"}
                          </button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={isSharing || isBusy}
                            onClick={() =>
                              void handleSharePlatform(
                                activePlatformOutput.platform,
                                activePlatformOutput.content,
                              )
                            }
                          >
                            {isSharing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Share2 className="h-3.5 w-3.5" />
                            )}
                            Share
                          </Button>
                        </div>
                      </div>
                      {regeneratingMode === "text" ? (
                        <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-text" />
                          Regenerating caption...
                        </div>
                      ) : null}
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                        {activePlatformOutput.content}
                      </pre>
                      {instagramAltText ? (
                        <div className="mt-4 rounded-lg border border-border bg-card p-3">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                                Alt text
                              </p>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                                Describes your photo for people with visual
                                impairments. Use this on Instagram or write your
                                own.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                void copyText(instagramAltText, setCopiedAltText)
                              }
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-card-muted hover:text-foreground"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {copiedAltText ? "Copied" : "Copy"}
                            </button>
                          </div>
                          <p className="text-sm leading-relaxed text-foreground">
                            {instagramAltText}
                          </p>
                        </div>
                      ) : null}
                      <div className="mt-4 border-t border-border pt-3">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="w-full sm:w-auto"
                          disabled={!canRegenerate}
                          onClick={() => onRegenerate?.("text")}
                        >
                          {regeneratingMode === "text" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          {regeneratingMode === "text"
                            ? "Regenerating..."
                            : "Regenerate text"}
                        </Button>
                      </div>
                    </article>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {outputs.usage ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-card-muted px-4 py-3 text-xs">
              <span className="font-medium text-foreground">
                Tokens: {formatTokenCount(getTotalTokenCount(outputs.usage))}
              </span>
              <span className="text-muted" aria-hidden="true">
                |
              </span>
              <span className="text-muted">
                In: {formatTokenCount(outputs.usage.promptTokens)} · Out:{" "}
                {formatTokenCount(outputs.usage.completionTokens)}
              </span>
              {outputs.usage.imageCount > 0 ? (
                <>
                  <span className="text-muted" aria-hidden="true">
                    |
                  </span>
                  <span className="text-muted">
                    Images: {outputs.usage.imageCount}
                  </span>
                </>
              ) : null}
              <span className="text-muted" aria-hidden="true">
                |
              </span>
              <span className="font-medium text-accent-text">
                Cost: {formatUsageCost(outputs.usage.totalCost)}
              </span>
            </div>
          ) : null}

          <SchedulePostSection
            workspaceId={workspaceId}
            scheduledFor={scheduledFor}
            onScheduledChange={onScheduledChange}
            canSchedule={canSchedule}
          />
        </div>
      )}
    </Card>
    <Toast
      message={shareToast}
      variant={shareToastVariant}
      onDismiss={() => setShareToast(null)}
    />
    </>
  );
}
