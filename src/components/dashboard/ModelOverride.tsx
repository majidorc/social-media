"use client";

import type { AiModel } from "@prisma/client";
import { Select } from "@/components/ui/Select";
import { AI_MODEL_OPTIONS } from "@/lib/constants";

interface ModelOverrideProps {
  defaultModel: AiModel | null;
  availableModels: AiModel[];
  value: AiModel | "";
  onChange: (value: AiModel | "") => void;
}

export function ModelOverride({
  defaultModel,
  availableModels,
  value,
  onChange,
}: ModelOverrideProps) {
  const availableOptions = AI_MODEL_OPTIONS.filter((option) =>
    availableModels.includes(option.value),
  );

  const defaultLabel = defaultModel
    ? (AI_MODEL_OPTIONS.find((option) => option.value === defaultModel)?.label ??
      defaultModel)
    : "none configured";

  return (
    <Select
      label="Model override (optional)"
      hint={
        defaultModel
          ? `Leave as default to use ${defaultLabel} from Settings.`
          : "Add an API key in Settings to enable generation."
      }
      value={value}
      onChange={(event) =>
        onChange((event.target.value as AiModel | "") || "")
      }
      disabled={availableOptions.length === 0}
      options={[
        { value: "", label: `Use default (${defaultLabel})` },
        ...availableOptions.map((option) => ({
          value: option.value,
          label: `${option.label} · ${option.provider}`,
        })),
      ]}
    />
  );
}
