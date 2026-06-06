const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(diffMs)) {
    return "Unknown";
  }

  if (diffMs < MINUTE) {
    return "Just now";
  }

  if (diffMs < HOUR) {
    const minutes = Math.floor(diffMs / MINUTE);
    return `${minutes}m ago`;
  }

  if (diffMs < DAY) {
    const hours = Math.floor(diffMs / HOUR);
    return `${hours}h ago`;
  }

  if (diffMs < DAY * 7) {
    const days = Math.floor(diffMs / DAY);
    return `${days}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function truncateLabel(text: string | null | undefined, max = 42): string {
  const value = text?.trim() || "Untitled generation";
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 1)}…`;
}
