"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PLATFORM_OPTIONS } from "@/lib/constants";
import type { GenerationOutputs } from "@/types";
import { Copy, ImageIcon, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface OutputPanelProps {
  outputs: GenerationOutputs | null;
  isLoading: boolean;
  error: string | null;
}

export function OutputPanel({ outputs, isLoading, error }: OutputPanelProps) {
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const copyContent = async (platform: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  const copyImagePrompt = async (prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const imageModelLabel = outputs?.visuals?.imageModel ?? null;

  return (
    <Card
      title="Generated outputs"
      description="Platform-specific content and optional AI graphics appear here after generation."
      className="h-full"
    >
      {isLoading ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <p className="text-sm">Generating platform copy and visual assets...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : !outputs ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 text-center text-zinc-500">
          <Sparkles className="h-10 w-10 text-zinc-700" />
          <p className="max-w-sm text-sm">
            Add any combination of inputs, pick your platforms, and click
            Generate to preview tailored content and optional graphics.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Blended prompt
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
              {outputs.blendedPrompt}
            </p>
          </div>

          {outputs.visuals ? (
            <article className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Generated graphic
                  </h3>
                  {imageModelLabel ? <Badge>{imageModelLabel}</Badge> : null}
                </div>
              </div>
              <div className="relative aspect-square w-full bg-zinc-900">
                <Image
                  src={outputs.visuals.imageUrl}
                  alt="AI-generated social graphic"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Image prompt used
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      copyImagePrompt(outputs.visuals?.promptUsed ?? "")
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedPrompt ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-zinc-300">
                  {outputs.visuals.promptUsed}
                </p>
              </div>
            </article>
          ) : outputs.visualImagePrompt ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Visual image prompt
              </p>
              <p className="text-sm leading-relaxed text-zinc-300">
                {outputs.visualImagePrompt}
              </p>
            </div>
          ) : null}

          <div className="space-y-4">
            {outputs.platforms.map((item) => {
              const label =
                PLATFORM_OPTIONS.find(
                  (option) => option.value === item.platform,
                )?.label ?? item.platform;

              return (
                <article
                  key={item.platform}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-zinc-100">
                        {label}
                      </h3>
                      <Badge>{item.platform}</Badge>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyContent(item.platform, item.content)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copiedPlatform === item.platform ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-300">
                    {item.content}
                  </pre>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
