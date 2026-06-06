"use client";

import { formatModelLabel } from "@/lib/ai/models";
import { API_KEY_PROVIDERS } from "@/lib/constants";
import { useLiveModels } from "@/hooks/useLiveModels";
import type { SettingsResponse } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { KeyRound, ExternalLink, Save, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface SettingsFormProps {
  initialSettings: SettingsResponse;
}

function pickDefaultModel(
  settings: SettingsResponse,
  availableValues: string[],
): string {
  if (availableValues.includes(settings.defaultAiModel)) {
    return settings.defaultAiModel;
  }

  return availableValues[0] ?? settings.defaultAiModel;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const {
    textModels,
    isLoading: modelsLoading,
    error: modelsError,
    refresh: refreshModels,
  } = useLiveModels();

  const [defaultModel, setDefaultModel] = useState(initialSettings.defaultAiModel);
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const configuredKeys = Object.fromEntries(
    initialSettings.apiKeys.map((item) => [item.provider, item]),
  );

  const hasConfiguredKeys = initialSettings.apiKeys.some((item) => item.configured);
  const hasLiveModels = textModels.length > 0;

  useEffect(() => {
    const values = textModels.map((model) => model.value);
    setDefaultModel(pickDefaultModel(initialSettings, values));
  }, [initialSettings, textModels]);

  const handleSaveKeys = () => {
    startTransition(async () => {
      setMessage(null);
      setError(null);

      try {
        const response = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            openai: openaiKey,
            anthropic: anthropicKey,
            google: googleKey,
          }),
        });

        const result = (await response.json()) as {
          success?: boolean;
          message?: string;
          error?: string;
        };

        if (!response.ok || !result.success) {
          setError(result.error ?? result.message ?? "Failed to save API keys.");
          return;
        }

        setMessage(result.message ?? "API keys saved securely.");
        setOpenaiKey("");
        setAnthropicKey("");
        setGoogleKey("");
        await refreshModels();
        router.refresh();
      } catch {
        setError("Failed to save API keys.");
      }
    });
  };

  const handleSaveModel = () => {
    startTransition(async () => {
      setMessage(null);
      setError(null);

      try {
        const response = await fetch("/api/settings?action=model", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ defaultAiModel: defaultModel }),
        });

        const result = (await response.json()) as {
          success?: boolean;
          message?: string;
          error?: string;
        };

        if (!response.ok || !result.success) {
          setError(result.error ?? result.message ?? "Failed to save default model.");
          return;
        }

        setMessage(result.message ?? "Default model updated.");
        router.refresh();
      } catch {
        setError("Failed to save default model.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-violet-400">Settings</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
          API keys & model preferences
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
          Add your provider API keys first. Available models are synced live from
          each provider&apos;s API when you open this page or save keys.
        </p>
      </header>

      {(message || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {error ?? message}
        </div>
      )}

      <Card
        title="API keys"
        description="Keys are encrypted before storage. Leave a field blank to keep the existing key."
      >
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200/80">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Keys are encrypted before storage. Model lists are fetched live from
            OpenAI, Anthropic, and Google using your saved credentials.
          </p>
        </div>

        <div className="space-y-5">
          {API_KEY_PROVIDERS.map(
            ({ provider, label, placeholder, description, apiKeyHelpUrl }) => {
            const status = configuredKeys[provider];

            return (
              <div
                key={provider}
                className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <KeyRound className="h-4 w-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-zinc-100">{label}</h3>
                  <Badge variant={status?.configured ? "success" : "warning"}>
                    {status?.configured
                      ? `Configured · ${status.maskedKey}`
                      : "Not configured"}
                  </Badge>
                  <a
                    href={apiKeyHelpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-xs text-zinc-400 underline-offset-2 transition-colors hover:text-zinc-200 hover:underline"
                  >
                    How to get API key?
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="mb-3 text-xs text-zinc-500">{description}</p>
                <Input
                  type="password"
                  placeholder={placeholder}
                  autoComplete="off"
                  value={
                    provider === "OPENAI"
                      ? openaiKey
                      : provider === "ANTHROPIC"
                        ? anthropicKey
                        : googleKey
                  }
                  onChange={(event) => {
                    if (provider === "OPENAI") setOpenaiKey(event.target.value);
                    if (provider === "ANTHROPIC")
                      setAnthropicKey(event.target.value);
                    if (provider === "GOOGLE") setGoogleKey(event.target.value);
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <Button
            type="button"
            onClick={handleSaveKeys}
            disabled={isPending}
          >
            <Save className="h-4 w-4" />
            Save API keys
          </Button>
        </div>
      </Card>

      <Card
        title="Default AI model"
        description={
          modelsLoading
            ? "Syncing available models from your providers..."
            : hasLiveModels
              ? "Only models returned live from your configured providers are shown."
              : "Save at least one API key above to unlock model selection."
        }
      >
        {hasConfiguredKeys ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Select
                label="Preferred model"
                value={defaultModel}
                onChange={(event) => setDefaultModel(event.target.value)}
                disabled={modelsLoading || !hasLiveModels}
                hint={modelsError ?? undefined}
                options={
                  modelsLoading
                    ? [{ value: defaultModel, label: "Loading models..." }]
                    : textModels.map((option) => ({
                        value: option.value,
                        label: formatModelLabel(option),
                      }))
                }
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveModel}
              disabled={isPending || modelsLoading || !hasLiveModels}
            >
              <Save className="h-4 w-4" />
              Save model
            </Button>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Configure OpenAI, Google Gemini, or Anthropic above — then pick your
            default model from the live synced list.
          </p>
        )}
      </Card>
    </div>
  );
}
