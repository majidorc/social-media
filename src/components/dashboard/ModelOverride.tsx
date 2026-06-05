"use client";

import type { AiModel } from "@prisma/client";
import { Select } from "@/components/ui/Select";
import { AI_MODEL_OPTIONS } from "@/lib/constants";

interface ModelOverrideProps {
  defaultModel: AiModel;
  value: AiModel | "";
  onChange: (value: AiModel | "") => void;
}

export function ModelOverride({
  defaultModel,
  value,
  onChange,
}: ModelOverrideProps) {
  const defaultLabel =
    AI_MODEL_OPTIONS.find((option) => option.value === defaultModel)?.label ??
    defaultModel;

  return (
    <Select
      label="Model override (optional)"
      hint={`Leave as default to use ${defaultLabel} from Settings.`}
      value={value}
      onChange={(event) =>
        onChange((event.target.value as AiModel | "") || "")
      }
      options={[
        { value: "", label: `Use default (${defaultLabel})` },
        ...AI_MODEL_OPTIONS.map((option) => ({
          value: option.value,
          label: `${option.label} · ${option.provider}`,
        })),
      ]}
    />
  );
}
