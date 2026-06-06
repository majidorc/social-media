"use client";

import { Select } from "@/components/ui/Select";
import { formatModelLabel } from "@/lib/ai/models";
import type { LiveModelOption } from "@/types";

interface ImageModelSelectorProps {
  imageModels: LiveModelOption[];
  isLoading: boolean;
  loadError: string | null;
  value: string;
  onChange: (value: string) => void;
}

export function ImageModelSelector({
  imageModels,
  isLoading,
  loadError,
  value,
  onChange,
}: ImageModelSelectorProps) {
  const disabled = isLoading || imageModels.length === 0;

  return (
    <Select
      label="Image generation model (optional)"
      hint={
        loadError
          ? loadError
          : isLoading
            ? "Loading image models from your configured providers..."
            : imageModels.length > 0
              ? "When selected, the text model also writes an image prompt and a graphic is generated in the same run."
              : "Add an OpenAI or Google API key in Settings to enable image generation."
      }
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      options={
        isLoading
          ? [{ value: "", label: "Loading image models..." }]
          : [
              { value: "", label: "Text only — no image generation" },
              ...imageModels.map((option) => ({
                value: option.value,
                label: formatModelLabel(option),
              })),
            ]
      }
    />
  );
}
