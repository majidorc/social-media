"use client";

import type { Platform } from "@prisma/client";
import { Checkbox } from "@/components/ui/Checkbox";
import { PLATFORM_OPTIONS } from "@/lib/constants";

interface PlatformSelectorProps {
  selected: Platform[];
  onChange: (platforms: Platform[]) => void;
}

export function PlatformSelector({ selected, onChange }: PlatformSelectorProps) {
  const togglePlatform = (platform: Platform) => {
    if (selected.includes(platform)) {
      onChange(selected.filter((item) => item !== platform));
      return;
    }

    onChange([...selected, platform]);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-violet-500/20 bg-accent-soft px-4 py-3 text-xs leading-relaxed text-accent-text">
        Select multiple platforms to receive tailored outputs — e.g. Twitter
        respects character limits, Instagram includes hooks and CapCut scripts.
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {PLATFORM_OPTIONS.map((platform) => (
          <Checkbox
            key={platform.value}
            label={platform.label}
            description={platform.description}
            checked={selected.includes(platform.value)}
            onChange={() => togglePlatform(platform.value)}
          />
        ))}
      </div>
    </div>
  );
}
