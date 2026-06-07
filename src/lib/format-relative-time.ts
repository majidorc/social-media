const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

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
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }

  if (diffMs < DAY) {
    const hours = Math.floor(diffMs / HOUR);
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart.getTime() - DAY);

  if (startOfDay(date).getTime() === yesterdayStart.getTime()) {
    return "Yesterday";
  }

  if (diffMs < DAY * 7) {
    const days = Math.floor(diffMs / DAY);
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
}

export {
  getHistoryItemTitle,
  HISTORY_TITLE_FALLBACK,
  resolveHistoryItemTitle,
  truncateHistoryTitle,
  truncateLabel,
} from "@/lib/history-display";
