"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PlatformBadges } from "@/components/planner/PlatformBadges";
import { PLATFORM_OPTIONS } from "@/lib/constants";
import { formatScheduledDate } from "@/lib/planner-calendar";
import {
  getPlannerItemDisplayTitle,
  hasPlannerVideoScript,
} from "@/lib/workspace-planner";
import type { ScheduledWorkspaceItem } from "@/types";
import { Copy, ImageIcon, Video } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ScheduledPostModalProps {
  item: ScheduledWorkspaceItem | null;
  onClose: () => void;
}

export function ScheduledPostModal({ item, onClose }: ScheduledPostModalProps) {
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [copiedVideoScript, setCopiedVideoScript] = useState(false);
  const [copiedVoiceover, setCopiedVoiceover] = useState(false);

  const copyContent = async (platform: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedPlatform(platform);
    window.setTimeout(() => setCopiedPlatform(null), 2000);
  };

  const copyText = async (text: string, setCopied: (value: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const showVideoScript = item ? hasPlannerVideoScript(item.outputs) : false;

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      title={item ? getPlannerItemDisplayTitle(item, 80) : ""}
      description={
        item ? `Scheduled for ${formatScheduledDate(item.scheduledFor)}` : undefined
      }
    >
      {item ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadges platforms={item.platforms} size="md" />
            <Badge>{item.platforms.length} platforms</Badge>
          </div>

          <div className="rounded-xl border border-border bg-card-muted p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Blended prompt
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {item.outputs.blendedPrompt}
            </p>
          </div>

          {item.outputs.visuals ? (
            <article className="overflow-hidden rounded-xl border border-border bg-card-muted">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <ImageIcon className="h-4 w-4 text-accent-text" />
                <h3 className="text-sm font-semibold text-foreground">
                  Generated graphic
                </h3>
              </div>
              <div className="relative aspect-square w-full bg-card-muted">
                <Image
                  src={item.outputs.visuals.imageUrl}
                  alt="Scheduled post graphic"
                  fill
                  unoptimized
                  crossOrigin="anonymous"
                  className="object-contain"
                />
              </div>
            </article>
          ) : null}

          {showVideoScript && item.outputs.video ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Video className="h-4 w-4 text-accent-text" />
                <h3 className="text-sm font-semibold text-foreground">
                  Reels/TikTok Script
                </h3>
              </div>

              <article className="rounded-xl border border-border bg-card-muted p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      Video script
                    </h4>
                    <Badge>Script</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void copyText(
                        item.outputs.video?.script ?? "",
                        setCopiedVideoScript,
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-card hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedVideoScript ? "Copied" : "Copy script"}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                  {item.outputs.video.script}
                </pre>
              </article>

              <article className="rounded-xl border border-border bg-card-muted p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Voiceover narration
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      void copyText(
                        item.outputs.video?.voiceoverCopy ?? "",
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
                  {item.outputs.video.voiceoverCopy}
                </p>
              </article>
            </div>
          ) : null}

          <div className="space-y-4">
            {item.outputs.platforms.map((platformOutput) => {
              const label =
                PLATFORM_OPTIONS.find(
                  (option) => option.value === platformOutput.platform,
                )?.label ?? platformOutput.platform;

              return (
                <article
                  key={platformOutput.platform}
                  className="rounded-xl border border-border bg-card-muted p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {label}
                      </h3>
                      <Badge>{platformOutput.platform}</Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        void copyContent(
                          platformOutput.platform,
                          platformOutput.content,
                        )
                      }
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copiedPlatform === platformOutput.platform
                        ? "Copied"
                        : "Copy"}
                    </Button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                    {platformOutput.content}
                  </pre>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
