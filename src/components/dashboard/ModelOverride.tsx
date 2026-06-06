"use client";

import { Select } from "@/components/ui/Select";
import { formatModelLabel } from "@/lib/ai/models";
import type { LiveModelOption } from "@/types";

interface ModelOverrideProps {
  defaultModel: string | null;
  textModels: LiveModelOption[];
  isLoading: boolean;
  loadError: string | null;
  value: string;
  onChange: (value: string) => void;
}

export function ModelOverride({
  defaultModel,
  textModels,
  isLoading,
  loadError,
  value,
  onChange,
}: ModelOverrideProps) {
  const defaultOption = defaultModel
    ? textModels.find((option) => option.value === defaultModel)
    : null;

  const defaultLabel = defaultOption
    ? defaultOption.label
    : defaultModel ?? "none configured";

  const disabled = isLoading || textModels.length === 0;

  return (
    <Select
      label="Text model override (optional)"
      hint={
        loadError
          ? loadError
          : isLoading
            ? "Loading models from your configured providers..."
            : defaultModel
              ? `Leave as default to use ${defaultLabel} from Settings.`
              : "Add an API key in Settings to enable generation."
      }
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      options={
        isLoading
          ? [{ value: "", label: "Loading models..." }]
          : [
              { value: "", label: `Use default (${defaultLabel})` },
              ...textModels.map((option) => ({
                value: option.value,
                label: formatModelLabel(option),
              })),
            ]
      }
    />
  );
}
