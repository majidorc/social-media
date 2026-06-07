import type { Platform } from "@prisma/client";
import { cn } from "@/lib/utils";
import { PLATFORM_SHORT_LABELS } from "@/lib/constants";

interface PlatformBadgesProps {
  platforms: Platform[];
  size?: "sm" | "md";
  className?: string;
}

export function PlatformBadges({
  platforms,
  size = "sm",
  className,
}: PlatformBadgesProps) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {platforms.map((platform) => (
        <span
          key={platform}
          title={platform}
          className={cn(
            "inline-flex items-center rounded-md bg-accent-soft font-semibold text-accent-text",
            size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
          )}
        >
          {PLATFORM_SHORT_LABELS[platform]}
        </span>
      ))}
    </div>
  );
}
