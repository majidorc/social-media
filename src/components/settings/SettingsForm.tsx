"use client";

import type { AiModel } from "@prisma/client";
import { saveApiKeys, saveDefaultModel } from "@/lib/actions/settings";
import { AI_MODEL_OPTIONS, API_KEY_PROVIDERS } from "@/lib/constants";
import type { SettingsResponse } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { KeyRound, Save, ShieldCheck } from "lucide-react";
import { useState, useTransition } from "react";

interface SettingsFormProps {
  initialSettings: SettingsResponse;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [defaultModel, setDefaultModel] = useState<AiModel>(
    initialSettings.defaultAiModel,
  );
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const configuredKeys = Object.fromEntries(
    initialSettings.apiKeys.map((item) => [item.provider, item]),
  );

  const handleSaveKeys = () => {
    startTransition(async () => {
      setMessage(null);
      setError(null);

      const result = await saveApiKeys({
        openai: openaiKey,
        anthropic: anthropicKey,
        google: googleKey,
      });

      if (result.success) {
        setMessage(result.message);
        setOpenaiKey("");
        setAnthropicKey("");
        setGoogleKey("");
        return;
      }

      setError(result.message);
    });
  };

  const handleSaveModel = () => {
    startTransition(async () => {
      setMessage(null);
      setError(null);

      const result = await saveDefaultModel(defaultModel);

      if (result.success) {
        setMessage(result.message);
        return;
      }

      setError(result.message);
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
          Store provider credentials securely and choose your default AI model
          for the content generator.
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
        title="Default AI model"
        description="This model is used across the dashboard unless you override it per generation."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              label="Preferred model"
              value={defaultModel}
              onChange={(event) =>
                setDefaultModel(event.target.value as AiModel)
              }
              options={AI_MODEL_OPTIONS.map((option) => ({
                value: option.value,
                label: `${option.label} · ${option.provider}`,
              }))}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSaveModel}
            disabled={isPending}
          >
            <Save className="h-4 w-4" />
            Save model
          </Button>
        </div>
      </Card>

      <Card
        title="API keys"
        description="Keys are mock-encrypted before storage. Leave a field blank to keep the existing key."
      >
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200/80">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Endpoints: <code className="text-emerald-300">GET /api/settings</code>{" "}
            and <code className="text-emerald-300">PUT /api/settings</code> (keys)
            or <code className="text-emerald-300">PUT /api/settings?action=model</code>.
          </p>
        </div>

        <div className="space-y-5">
          {API_KEY_PROVIDERS.map(({ provider, label, placeholder, description }) => {
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
    </div>
  );
}
