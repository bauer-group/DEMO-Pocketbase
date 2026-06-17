import PocketBase from "pocketbase";
import type { RecordModel } from "pocketbase";
import type { UserRecord } from "./types";

// ----------------------------------------------------------------------------
// PocketBase-Client als Singleton.
//
//   - Production: VITE_PB_URL zeigt direkt auf die API (z. B. api.example.com).
//   - Dev/Container: leeres VITE_PB_URL -> location.origin -> der jeweilige
//     Proxy (Vite-Dev-Proxy bzw. Nginx) leitet /api & /_/ an PocketBase weiter.
//     So gibt es nie eine CORS-Sonderbehandlung.
// ----------------------------------------------------------------------------

const baseUrl =
  import.meta.env.VITE_PB_URL && import.meta.env.VITE_PB_URL.length > 0
    ? import.meta.env.VITE_PB_URL
    : typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:8090";

export const pb = new PocketBase(baseUrl);

// Wir verwalten parallele Requests/Realtime selbst -> PocketBases automatisches
// Request-Cancelling deaktivieren (sonst werden überlappende List-Calls killt).
pb.autoCancellation(false);

export const currentUser = (): UserRecord | null =>
  (pb.authStore.record as UserRecord | null) ?? null;

export const isLoggedIn = (): boolean => pb.authStore.isValid;

// Absolute Datei-URL (optional als Thumbnail, z. B. "100x100").
export function fileUrl(
  record: RecordModel,
  filename: string,
  thumb?: string
): string {
  if (!filename) return "";
  return pb.files.getURL(record, filename, thumb ? { thumb } : {});
}
