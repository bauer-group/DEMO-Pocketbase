import { ClientResponseError } from "pocketbase";

// Macht aus PocketBase-/Netzwerk-Fehlern eine knappe, anzeigbare Nachricht.
export function getErrorMessage(err: unknown): string {
  if (err instanceof ClientResponseError) {
    // Feldspezifische Validierungsfehler bevorzugt anzeigen.
    const data = err.response?.data as
      | Record<string, { message?: string }>
      | undefined;
    if (data) {
      const first = Object.values(data).find((d) => d?.message);
      if (first?.message) return first.message;
    }
    return err.message || "Anfrage fehlgeschlagen.";
  }
  if (err instanceof Error) return err.message;
  return String(err);
}
