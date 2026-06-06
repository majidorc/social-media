"use client";

import type { AiImageModel, AiModel, Platform } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FileDropzone } from "@/components/ui/Card";
import { ImageModelSelector } from "@/components/dashboard/ImageModelSelector";
import { ModelOverride } from "@/components/dashboard/ModelOverride";
import { OutputPanel } from "@/components/dashboard/OutputPanel";
import { PlatformSelector } from "@/components/dashboard/PlatformSelector";
import type { GenerateResponse, GenerationOutputs } from "@/types";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useState } from "react";

interface ContentGeneratorProps {
  defaultModel: AiModel | null;
  availableModels: AiModel[];
  availableImageModels: AiImageModel[];
}

export function ContentGenerator({
  defaultModel,
  availableModels,
  availableImageModels,
}: ContentGeneratorProps) {
  const [idea, setIdea] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>(["INSTAGRAM", "TWITTER"]);
  const [modelOverride, setModelOverride] = useState<AiModel | "">("");
  const [imageModel, setImageModel] = useState<AiImageModel | "">("");
  const [outputs, setOutputs] = useState<GenerationOutputs | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = defaultModel !== null || modelOverride !== "";

  const handleGenerate = async () => {
    if (platforms.length === 0) {
      setError("Select at least one target platform.");
      return;
    }

    if (!canGenerate) {
      setError("Add an API key in Settings before generating content.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        idea: idea.trim() || undefined,
        imageUrls: imageUrl.trim() ? [imageUrl.trim()] : [],
        linkUrl: linkUrl.trim() || undefined,
        videoUrls: videoUrl.trim() ? [videoUrl.trim()] : [],
        platforms,
        aiModel: modelOverride || undefined,
        imageModel: imageModel || undefined,
      };

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Generation failed",
        );
      }

      const result = data as GenerateResponse;
      setOutputs(result.outputs);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Something went wrong",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-violet-400">Content Generator</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
          Create multi-platform content
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
          Every input is optional. Mix and match ideas, media, and links — then
          generate tailored copy and optional AI graphics in one run.
        </p>
      </header>

      {!defaultModel && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          No AI provider is configured yet.{" "}
          <Link href="/settings" className="font-medium underline underline-offset-2">
            Add an API key in Settings
          </Link>{" "}
          to unlock generation.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Card
            title="Inputs"
            description="All fields are optional. Provide as much or as little context as you need."
          >
            <div className="space-y-5">
              <Textarea
                label="Idea"
                placeholder="Describe your content idea, tone, audience, or draft prompt..."
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                hint="Optional — your core creative direction."
              />

              <FileDropzone
                label="Image"
                hint="Optional — upload a reference image or paste a public URL."
                accept="image/*"
                urlValue={imageUrl}
                onUrlChange={setImageUrl}
                onFileSelect={(file) =>
                  setImageFileName(file ? file.name : null)
                }
                fileName={imageFileName}
              />

              <Input
                label="Link"
                type="url"
                placeholder="https://example.com/article"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                hint="Optional — source URL for web scraping context."
              />

              <FileDropzone
                label="Video"
                hint="Optional — upload a reference video or paste a public URL."
                accept="video/*"
                urlValue={videoUrl}
                onUrlChange={setVideoUrl}
                onFileSelect={(file) =>
                  setVideoFileName(file ? file.name : null)
                }
                fileName={videoFileName}
              />
            </div>
          </Card>

          <Card
            title="Target platforms"
            description="Choose one or more destinations for your content."
          >
            <PlatformSelector selected={platforms} onChange={setPlatforms} />
          </Card>

          <Card title="Generation config">
            <div className="space-y-4">
              <ModelOverride
                defaultModel={defaultModel}
                availableModels={availableModels}
                value={modelOverride}
                onChange={setModelOverride}
              />
              <ImageModelSelector
                availableImageModels={availableImageModels}
                value={imageModel}
                onChange={setImageModel}
              />
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={handleGenerate}
                disabled={isLoading || !canGenerate}
              >
                <Sparkles className="h-4 w-4" />
                {isLoading
                  ? imageModel
                    ? "Generating copy & image..."
                    : "Generating..."
                  : imageModel
                    ? "Generate content & image"
                    : "Generate content"}
              </Button>
            </div>
          </Card>
        </div>

        <OutputPanel outputs={outputs} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
}
