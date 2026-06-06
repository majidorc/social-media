"use client";

import type { AiImageModel } from "@prisma/client";
import { Select } from "@/components/ui/Select";
import { AI_IMAGE_MODEL_OPTIONS } from "@/lib/constants";

interface ImageModelSelectorProps {
  availableImageModels: AiImageModel[];
  value: AiImageModel | "";
  onChange: (value: AiImageModel | "") => void;
}

export function ImageModelSelector({
  availableImageModels,
  value,
  onChange,
}: ImageModelSelectorProps) {
  const availableOptions = AI_IMAGE_MODEL_OPTIONS.filter((option) =>
    availableImageModels.includes(option.value),
  );

  return (
    <Select
      label="Image generation model (optional)"
      hint={
        availableOptions.length > 0
          ? "When selected, the text model also writes an image prompt and a graphic is generated in the same run."
          : "Add an OpenAI or Google API key in Settings to enable image generation."
      }
      value={value}
      onChange={(event) =>
        onChange((event.target.value as AiImageModel | "") || "")
      }
      disabled={availableOptions.length === 0}
      options={[
        { value: "", label: "Text only — no image generation" },
        ...availableOptions.map((option) => ({
          value: option.value,
          label: `${option.label} · ${option.provider}`,
        })),
      ]}
    />
  );
}
