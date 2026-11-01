import { copy } from "@/constants/copy";

export function formatDate(value: string, includeTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return copy.common.dateUnavailable;
  return date.toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } as const : {}),
  });
}

export function formatDuration(value: number | null) {
  return value !== null && Number.isFinite(value) && value >= 0
    ? `${value.toLocaleString("id-ID", { maximumFractionDigits: 1 })} ${copy.record.seconds}`
    : copy.common.durationUnavailable;
}
