import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

// PocketBase liefert Datumswerte als "2026-06-17 10:30:00.000Z".
// In ein Date parsen (Leerzeichen -> 'T' macht es ISO-konform).
function parse(date: string): Date {
  return new Date(date.replace(" ", "T"));
}

export function timeAgo(date?: string): string {
  if (!date) return "";
  try {
    return formatDistanceToNow(parse(date), { addSuffix: true, locale: de });
  } catch {
    return "";
  }
}

export function initials(name?: string, email?: string): string {
  const src = (name && name.trim()) || email || "?";
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
