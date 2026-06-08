"use client";

import { formatModelLabel } from "@/lib/ai/models";
import { API_KEY_PROVIDERS } from "@/lib/constants";
import {
  WATERMARK_POSITION_OPTIONS,
  watermarkPreviewPositionClass,
} from "@/lib/watermark-position";
import { cn } from "@/lib/utils";
import { useLiveModels } from "@/hooks/useLiveModels";
import type { SettingsResponse } from "@/types";
import type { WatermarkPosition } from "@/types";
import { SubscriptionBillingCard } from "@/components/settings/SubscriptionBillingCard";
import { UpgradeBanner } from "@/components/subscription/UpgradeBanner";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  KeyRound,
  ExternalLink,
  Save,
  ShieldCheck,
  ImageIcon,
  Trash2,
  Upload,
  Building2,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

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
  const [watermarkLogoUrl, setWatermarkLogoUrl] = useState<string | null>(
    initialSettings.watermarkLogoUrl,
  );
  const [watermarkFileName, setWatermarkFileName] = useState<string | null>(null);
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>(
    initialSettings.watermarkPosition,
  );
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const [companyName, setCompanyName] = useState(initialSettings.companyName ?? "");
  const [businessDescription, setBusinessDescription] = useState(
    initialSettings.businessDescription ?? "",
  );
  const [websiteUrl, setWebsiteUrl] = useState(initialSettings.websiteUrl ?? "");
  const [socialHandle, setSocialHandle] = useState(initialSettings.socialHandle ?? "");
  const [brandProfiles, setBrandProfiles] = useState(initialSettings.brandProfiles);
  const [newProfileName, setNewProfileName] = useState("");

  const configuredKeys = Object.fromEntries(
    initialSettings.apiKeys.map((item) => [item.provider, item]),
  );

  const hasConfiguredKeys = initialSettings.apiKeys.some((item) => item.configured);
  const hasLiveModels = textModels.length > 0;
  const { planFeatures } = initialSettings;
  const canManageMultipleBrands = planFeatures.maxBrandProfiles > 1;
  const allowedWatermarkOptions = WATERMARK_POSITION_OPTIONS.filter((option) =>
    planFeatures.allowedWatermarkPositions.includes(option.value),
  );

  useEffect(() => {
    const values = textModels.map((model) => model.value);
    setDefaultModel(pickDefaultModel(initialSettings, values));
  }, [initialSettings, textModels]);

  useEffect(() => {
    setWatermarkLogoUrl(initialSettings.watermarkLogoUrl);
  }, [initialSettings.watermarkLogoUrl]);

  useEffect(() => {
    setWatermarkPosition(initialSettings.watermarkPosition);
  }, [initialSettings.watermarkPosition]);

  useEffect(() => {
    setCompanyName(initialSettings.companyName ?? "");
    setBusinessDescription(initialSettings.businessDescription ?? "");
    setWebsiteUrl(initialSettings.websiteUrl ?? "");
    setSocialHandle(initialSettings.socialHandle ?? "");
  }, [
    initialSettings.businessDescription,
    initialSettings.companyName,
    initialSettings.socialHandle,
    initialSettings.websiteUrl,
  ]);

  useEffect(() => {
    setBrandProfiles(initialSettings.brandProfiles);
  }, [initialSettings.brandProfiles]);

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

  const handleUploadWatermark = (file: File | null) => {
    if (!file) {
      return;
    }

    startTransition(async () => {
      setMessage(null);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("logo", file);

        const response = await fetch("/api/settings/watermark", {
          method: "POST",
          body: formData,
        });

        const result = (await response.json()) as {
          success?: boolean;
          message?: string;
          error?: string;
          watermarkLogoUrl?: string;
        };

        if (!response.ok || !result.success) {
          setError(result.error ?? result.message ?? "Failed to save brand logo.");
          return;
        }

        setWatermarkLogoUrl(result.watermarkLogoUrl ?? null);
        setWatermarkFileName(file.name);
        setMessage(result.message ?? "Brand logo saved.");
        router.refresh();
      } catch {
        setError("Failed to save brand logo.");
      } finally {
        if (watermarkInputRef.current) {
          watermarkInputRef.current.value = "";
        }
      }
    });
  };

  const handleRemoveWatermark = () => {
    startTransition(async () => {
      setMessage(null);
      setError(null);

      try {
        const response = await fetch("/api/settings/watermark", {
          method: "DELETE",
        });

        const result = (await response.json()) as {
          success?: boolean;
          message?: string;
          error?: string;
        };

        if (!response.ok || !result.success) {
          setError(result.error ?? result.message ?? "Failed to remove brand logo.");
          return;
        }

        setWatermarkLogoUrl(null);
        setWatermarkFileName(null);
        setMessage(result.message ?? "Brand logo removed.");
        router.refresh();
      } catch {
        setError("Failed to remove brand logo.");
      }
    });
  };

  const handleSaveWatermarkPosition = () => {
    startTransition(async () => {
      setMessage(null);
      setError(null);

      try {
        const response = await fetch("/api/settings/watermark", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watermarkPosition }),
        });

        const result = (await response.json()) as {
          success?: boolean;
          message?: string;
          error?: string;
          watermarkPosition?: WatermarkPosition;
        };

        if (!response.ok || !result.success) {
          setError(result.error ?? result.message ?? "Failed to save watermark position.");
          return;
        }

        if (result.watermarkPosition) {
          setWatermarkPosition(result.watermarkPosition);
        }

        setMessage(result.message ?? "Watermark position updated.");
        router.refresh();
      } catch {
        setError("Failed to save watermark position.");
      }
    });
  };

  const handleSaveBrandProfile = () => {
    startTransition(async () => {
      setMessage(null);
      setError(null);

      try {
        const response = await fetch("/api/settings?action=brand-profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName,
            businessDescription,
            websiteUrl,
            socialHandle,
          }),
        });

        const result = (await response.json()) as {
          success?: boolean;
          message?: string;
          error?: string;
        };

        if (!response.ok || !result.success) {
          setError(result.error ?? result.message ?? "Failed to save brand profile.");
          return;
        }

        setMessage(result.message ?? "Brand profile saved.");
        router.refresh();
      } catch {
        setError("Failed to save brand profile.");
      }
    });
  };

  const handleCreateBrandProfile = () => {
    if (!newProfileName.trim()) {
      setError("Enter a name for the new brand profile.");
      return;
    }

    startTransition(async () => {
      setMessage(null);
      setError(null);

      try {
        const response = await fetch("/api/settings?action=brand-profile-create", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newProfileName.trim(),
            companyName,
            businessDescription,
            websiteUrl,
            socialHandle,
          }),
        });

        const result = (await response.json()) as {
          success?: boolean;
          message?: string;
          error?: string;
          profile?: (typeof brandProfiles)[number];
        };

        if (!response.ok || !result.success) {
          setError(result.error ?? result.message ?? "Failed to save brand profile.");
          return;
        }

        if (result.profile) {
          setBrandProfiles((current) => [...current, result.profile!]);
        }

        setNewProfileName("");
        setMessage(result.message ?? "Brand profile saved.");
        router.refresh();
      } catch {
        setError("Failed to save brand profile.");
      }
    });
  };

  const handleSwitchBrandProfile = (profileId: string) => {
    startTransition(async () => {
      setMessage(null);
      setError(null);

      try {
        const response = await fetch("/api/settings?action=brand-profile-switch", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId }),
        });

        const result = (await response.json()) as {
          success?: boolean;
          message?: string;
          error?: string;
        };

        if (!response.ok || !result.success) {
          setError(result.error ?? result.message ?? "Failed to switch brand profile.");
          return;
        }

        setMessage(result.message ?? "Brand profile switched.");
        router.refresh();
      } catch {
        setError("Failed to switch brand profile.");
      }
    });
  };

  const handleDeleteBrandProfile = (profileId: string) => {
    startTransition(async () => {
      setMessage(null);
      setError(null);

      try {
        const response = await fetch("/api/settings?action=brand-profile-delete", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId }),
        });

        const result = (await response.json()) as {
          success?: boolean;
          message?: string;
          error?: string;
        };

        if (!response.ok || !result.success) {
          setError(result.error ?? result.message ?? "Failed to delete brand profile.");
          return;
        }

        setBrandProfiles((current) => current.filter((profile) => profile.id !== profileId));
        setMessage(result.message ?? "Brand profile deleted.");
        router.refresh();
      } catch {
        setError("Failed to delete brand profile.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-accent-text">Settings</p>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          API keys & model preferences
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Add your provider API keys first. Available models are synced live from
          each provider&apos;s API when you open this page or save keys.
        </p>
      </header>

      {(message || error) && (
        <Alert variant={error ? "error" : "success"}>{error ?? message}</Alert>
      )}

      <SubscriptionBillingCard
        plan={initialSettings.plan}
        billingInterval={initialSettings.billingInterval}
        planActivatedAt={initialSettings.planActivatedAt}
        planExpiresAt={initialSettings.planExpiresAt}
        hasStripeCustomer={initialSettings.hasStripeCustomer}
        canRestoreSubscription={initialSettings.canRestoreSubscription}
        onNotice={(text) => {
          setError(null);
          setMessage(text);
        }}
        onError={(text) => {
          setMessage(null);
          setError(text);
        }}
      />

      <Card
        title="API keys"
        description="Keys are encrypted before storage. Leave a field blank to keep the existing key."
      >
        <Alert variant="info" className="mb-5 flex items-start gap-3 p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Keys are encrypted before storage. Model lists are fetched live from
            OpenAI, Anthropic, and Google using your saved credentials.
          </p>
        </Alert>

        <div className="space-y-5">
          {API_KEY_PROVIDERS.map(
            ({ provider, label, placeholder, description, apiKeyHelpUrl }) => {
            const status = configuredKeys[provider];

            return (
              <div
                key={provider}
                className="rounded-xl border border-border bg-card-muted p-4"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <KeyRound className="h-4 w-4 text-accent-text" />
                  <h3 className="text-sm font-semibold text-foreground">{label}</h3>
                  <Badge variant={status?.configured ? "success" : "warning"}>
                    {status?.configured
                      ? `Configured · ${status.maskedKey}`
                      : "Not configured"}
                  </Badge>
                  <a
                    href={apiKeyHelpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-xs text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline"
                  >
                    How to get API key?
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="mb-3 text-xs text-muted">{description}</p>
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
          <p className="text-sm text-muted">
            Configure OpenAI, Google Gemini, or Anthropic above — then pick your
            default model from the live synced list.
          </p>
        )}
      </Card>

      <Card
        title="Brand Profile Context"
        description="Save your company details so generated copy uses real URLs and handles instead of generic placeholders."
      >
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-violet-500/20 bg-accent-soft px-4 py-3 text-sm leading-relaxed text-accent-text">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This context is injected into every generation prompt. CTAs will prefer
            your website and social handle over phrases like &quot;link in bio&quot;.
          </p>
        </div>

        <div className="space-y-5">
          <Input
            label="Company name"
            placeholder="Acme Studio"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
          />

          <Input
            label="Website URL"
            type="url"
            placeholder="https://example.com"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            hint="Used in calls to action when a direct link fits the platform."
          />

          <Input
            label="Social media handle"
            placeholder="@username"
            value={socialHandle}
            onChange={(event) => setSocialHandle(event.target.value)}
            hint="Include the @ prefix if you use one."
          />

          <Textarea
            label="Business description / What you do"
            placeholder="Describe your company, products, audience, tone of voice, and key differentiators..."
            value={businessDescription}
            onChange={(event) => setBusinessDescription(event.target.value)}
            hint="Helps the AI write on-brand copy tailored to your business."
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={handleSaveBrandProfile}
            disabled={isPending}
          >
            <Save className="h-4 w-4" />
            Save active brand profile
          </Button>
        </div>

        {!canManageMultipleBrands ? (
          <p className="mt-4 text-xs text-muted">
            Free and Pro plans include one brand profile. Upgrade to Agency to save
            and switch between multiple companies.
          </p>
        ) : (
          <div className="mt-6 space-y-4 rounded-xl border border-border bg-card-muted p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Saved brand profiles
              </h3>
              <p className="mt-1 text-xs text-muted">
                Store multiple client brands and switch the active context for
                generation.
              </p>
            </div>

            {brandProfiles.length > 0 ? (
              <ul className="space-y-2">
                {brandProfiles.map((profile) => (
                  <li
                    key={profile.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {profile.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {profile.companyName ?? "No company name"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSwitchBrandProfile(profile.id)}
                        disabled={isPending}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Switch
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBrandProfile(profile.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">No saved profiles yet.</p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Input
                label="New profile name"
                placeholder="Client brand name"
                value={newProfileName}
                onChange={(event) => setNewProfileName(event.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleCreateBrandProfile}
                disabled={isPending}
              >
                <Save className="h-4 w-4" />
                Save as new profile
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card
        title="Brand watermark"
        description="Upload a transparent PNG logo and choose where it appears on generated images."
      >
        <div className="mb-5 rounded-xl border border-violet-500/20 bg-accent-soft px-4 py-3 text-sm leading-relaxed text-accent-text">
          Use a PNG with a transparent background. Recommended size: 512×512 px or smaller.
          If upload fails, generation still works without a watermark.
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card-muted px-4 py-8 text-center transition-colors hover:border-violet-500/40 hover:bg-card">
            <Upload className="mb-3 h-8 w-8 text-muted" />
            <span className="text-sm font-medium text-foreground">
              Drop a PNG logo here or click to browse
            </span>
            <span className="mt-1 text-xs text-muted">
              {watermarkFileName ?? "PNG only · max 2 MB"}
            </span>
            <input
              ref={watermarkInputRef}
              type="file"
              accept="image/png"
              className="sr-only"
              disabled={isPending}
              onChange={(event) =>
                handleUploadWatermark(event.target.files?.[0] ?? null)
              }
            />
          </label>

          <div className="flex flex-col rounded-xl border border-border bg-card-muted p-4">
            <div className="mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-accent-text" />
              <p className="text-sm font-medium text-foreground">Preview</p>
            </div>
            <div className="relative flex min-h-[140px] flex-1 items-center justify-center overflow-hidden rounded-lg border border-border bg-[linear-gradient(45deg,var(--border)_25%,transparent_25%,transparent_75%,var(--border)_75%,var(--border)),linear-gradient(45deg,var(--border)_25%,transparent_25%,transparent_75%,var(--border)_75%,var(--border))] bg-[length:16px_16px] bg-[position:0_0,8px_8px]">
              {watermarkLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={watermarkLogoUrl}
                  alt="Brand watermark preview"
                  className={cn(
                    "absolute max-h-10 max-w-[40%] object-contain",
                    watermarkPreviewPositionClass(watermarkPosition),
                  )}
                />
              ) : (
                <p className="px-4 text-center text-xs text-muted">
                  No logo uploaded yet
                </p>
              )}
            </div>
            {watermarkLogoUrl ? (
              <Button
                type="button"
                variant="ghost"
                className="mt-4 w-full"
                onClick={handleRemoveWatermark}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
                Remove logo
              </Button>
            ) : null}
          </div>
        </div>

        {!planFeatures.canCustomizeWatermarkPosition ? (
          <div className="mt-5">
            <UpgradeBanner
              title="Custom watermark placement is a Pro feature"
              description="Free plan uses the default bottom-right watermark position. Upgrade to Pro to place your logo in any corner or center."
              requiredPlan="PRO"
              className="mb-4"
            />
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              label="Watermark position"
              value={watermarkPosition}
              onChange={(event) =>
                setWatermarkPosition(event.target.value as WatermarkPosition)
              }
              options={allowedWatermarkOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              disabled={!planFeatures.canCustomizeWatermarkPosition}
              hint={
                planFeatures.canCustomizeWatermarkPosition
                  ? "Corner positions use 24px padding from the image edge."
                  : "Upgrade to Pro to unlock additional watermark positions."
              }
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSaveWatermarkPosition}
            disabled={isPending || !planFeatures.canCustomizeWatermarkPosition}
          >
            <Save className="h-4 w-4" />
            Save position
          </Button>
        </div>
      </Card>
    </div>
  );
}
