"use client";

import type { Platform } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FileDropzone } from "@/components/ui/Card";
import { ImageModelSelector } from "@/components/dashboard/ImageModelSelector";
import { ModelOverride } from "@/components/dashboard/ModelOverride";
import { OutputPanel } from "@/components/dashboard/OutputPanel";
import { PlatformSelector } from "@/components/dashboard/PlatformSelector";
import { useLiveModels } from "@/hooks/useLiveModels";
import { notifyGenerationHistoryUpdated } from "@/lib/generation-history-events";
import type { GenerateResponse, GenerationOutputs, WorkspaceDetailResponse } from "@/types";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface ContentGeneratorProps {
  defaultModel: string | null;
}

export function ContentGenerator({ defaultModel }: ContentGeneratorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspace");
  const loadedWorkspaceRef = useRef<string | null>(null);

  const {
    textModels,
    imageModels,
    isLoading: modelsLoading,
    error: modelsError,
  } = useLiveModels();

  const [idea, setIdea] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>(["INSTAGRAM", "TWITTER"]);
  const [modelOverride, setModelOverride] = useState("");
  const [imageModel, setImageModel] = useState("");
  const [outputs, setOutputs] = useState<GenerationOutputs | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyWorkspace = useCallback((workspace: WorkspaceDetailResponse["workspace"]) => {
    setIdea(workspace.idea ?? "");
    setImageUrl(workspace.imageUrls[0] ?? "");
    setLinkUrl(workspace.linkUrl ?? "");
    setVideoUrl(workspace.videoUrls[0] ?? "");
    setImageFileName(null);
    setVideoFileName(null);
    setPlatforms(workspace.platforms);
    setModelOverride(workspace.aiModel);
    setImageModel(workspace.imageModel ?? "");
    setOutputs(workspace.outputs);
    setError(null);
  }, []);

  useEffect(() => {
    if (!workspaceId) {
      loadedWorkspaceRef.current = null;
      return;
    }

    if (loadedWorkspaceRef.current === workspaceId) {
      return;
    }

    let cancelled = false;

    const loadWorkspace = async () => {
      setIsLoadingHistory(true);
      setError(null);

      try {
        const response = await fetch(`/api/generate/${workspaceId}`, {
          credentials: "same-origin",
        });
        const data = (await response.json()) as WorkspaceDetailResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load generation.");
        }

        if (!cancelled) {
          applyWorkspace(data.workspace);
          loadedWorkspaceRef.current = workspaceId;
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load generation.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
        }
      }
    };

    void loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [applyWorkspace, workspaceId]);

  const canGenerate =
    !modelsLoading && (defaultModel !== null || modelOverride !== "");

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
      loadedWorkspaceRef.current = result.workspaceId;
      router.replace(`/dashboard?workspace=${result.workspaceId}`);
      notifyGenerationHistoryUpdated();
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

      {isLoadingHistory ? (
        <div className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-sm text-violet-200">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading saved generation...
        </div>
      ) : null}

      {!modelsLoading && !defaultModel && textModels.length === 0 && (
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
                textModels={textModels}
                isLoading={modelsLoading}
                loadError={modelsError}
                value={modelOverride}
                onChange={setModelOverride}
              />
              <ImageModelSelector
                imageModels={imageModels}
                isLoading={modelsLoading}
                loadError={modelsError}
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

        <OutputPanel
          outputs={outputs}
          isLoading={isLoading || isLoadingHistory}
          error={error}
        />
      </div>
    </div>
  );
}
