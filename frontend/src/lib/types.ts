import type { RecordModel } from "pocketbase";

// ----------------------------------------------------------------------------
// Domänen-Typen, die die PocketBase-Collections (siehe pb_migrations) im
// Frontend typsicher abbilden. `expand` spiegelt die per ?expand geladenen
// Relationen wider.
// ----------------------------------------------------------------------------

export type Role = "owner" | "editor" | "viewer";
export type NoteStatus = "draft" | "published" | "archived";

export interface UserRecord extends RecordModel {
  email: string;
  name: string;
  avatar: string;
}

export interface Workspace extends RecordModel {
  name: string;
  slug: string;
  description: string;
  color: string;
  owner: string;
}

export interface WorkspaceMember extends RecordModel {
  workspace: string;
  user: string;
  role: Role;
  expand?: { user?: UserRecord };
}

export interface Tag extends RecordModel {
  workspace: string;
  name: string;
  color: string;
}

export interface Note extends RecordModel {
  workspace: string;
  author: string;
  title: string;
  content: string;
  status: NoteStatus;
  pinned: boolean;
  tags: string[];
  attachments: string[];
  expand?: { author?: UserRecord; tags?: Tag[] };
}

export interface Comment extends RecordModel {
  note: string;
  author: string;
  body: string;
  expand?: { author?: UserRecord };
}

export interface Activity extends RecordModel {
  workspace: string;
  actor: string;
  action: string;
  subject: string;
  meta: Record<string, unknown>;
  expand?: { actor?: UserRecord };
}

// Antwort des Custom-Endpoints GET /api/demo/stats/{workspace}
export interface WorkspaceStats {
  workspace: string;
  role: Role;
  notes: { total: number; byStatus: Record<NoteStatus, number> };
  members: number;
  tags: number;
  activities: number;
}
