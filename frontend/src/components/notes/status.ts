import type { NoteStatus } from "@/lib/types";

type Tone = "neutral" | "brand" | "green" | "amber" | "red" | "slate";

export const STATUS_META: Record<NoteStatus, { label: string; tone: Tone }> = {
  draft: { label: "Entwurf", tone: "amber" },
  published: { label: "Veröffentlicht", tone: "green" },
  archived: { label: "Archiviert", tone: "slate" },
};

const IMAGE_RE = /\.(png|jpe?g|webp|gif|avif)$/i;
export const isImage = (filename: string): boolean => IMAGE_RE.test(filename);
