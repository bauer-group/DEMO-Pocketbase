/// <reference path="../pb_data/types.d.ts" />

// ----------------------------------------------------------------------------
// Schema-Migration (PocketBase v0.23+ JSVM-API).
//
// Modelliert einen kollaborativen Workspace, der die volle Bandbreite von
// PocketBase demonstriert:
//
//   workspaces          – Container; jeder User kann mehrere besitzen/teilen
//   workspace_members   – m:n User<->Workspace mit Rolle (RBAC)
//   tags                – Labels je Workspace
//   notes               – Inhalte mit Status, Pin, Tags (m:n) und Datei-Uploads
//   comments            – Diskussion an einer Note (1:n)
//   activities          – serverseitig geschriebener Audit-/Activity-Feed
//
// Das Highlight sind die *membership-basierten* API-Regeln: Zugriff
// entscheidet sich über einen JOIN auf workspace_members, nicht über
// "Owner == ich". So entsteht echte Kollaboration – nur über deklarative Rules.
//
// Reihenfolge: Erst werden alle Collections (Felder/Indizes) angelegt, danach
// in einer zweiten Phase die Regeln gesetzt. Damit dürfen Regeln beliebige
// (auch später erstellte) Collections referenzieren.
// ----------------------------------------------------------------------------

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // === Phase 1: Collections anlegen (Felder + Indizes) ====================

    const workspaces = new Collection({
      type: "base",
      name: "workspaces",
      fields: [
        { type: "text", name: "name", required: true, min: 1, max: 80 },
        { type: "text", name: "slug", required: true, min: 1, max: 80, pattern: "^[a-z0-9-]+$" },
        { type: "text", name: "description", max: 500 },
        { type: "text", name: "color", max: 9 },
        { type: "relation", name: "owner", required: true, collectionId: users.id, cascadeDelete: false, maxSelect: 1 },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_workspaces_slug ON workspaces (slug)"],
    });
    app.save(workspaces);

    const members = new Collection({
      type: "base",
      name: "workspace_members",
      fields: [
        { type: "relation", name: "workspace", required: true, collectionId: workspaces.id, cascadeDelete: true, maxSelect: 1 },
        { type: "relation", name: "user", required: true, collectionId: users.id, cascadeDelete: true, maxSelect: 1 },
        { type: "select", name: "role", required: true, maxSelect: 1, values: ["owner", "editor", "viewer"] },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_members_unique ON workspace_members (workspace, user)",
        "CREATE INDEX idx_members_user ON workspace_members (user)",
      ],
    });
    app.save(members);

    const tags = new Collection({
      type: "base",
      name: "tags",
      fields: [
        { type: "relation", name: "workspace", required: true, collectionId: workspaces.id, cascadeDelete: true, maxSelect: 1 },
        { type: "text", name: "name", required: true, min: 1, max: 40 },
        { type: "text", name: "color", max: 9 },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_tags_unique ON tags (workspace, name)"],
    });
    app.save(tags);

    const notes = new Collection({
      type: "base",
      name: "notes",
      fields: [
        { type: "relation", name: "workspace", required: true, collectionId: workspaces.id, cascadeDelete: true, maxSelect: 1 },
        { type: "relation", name: "author", required: true, collectionId: users.id, cascadeDelete: false, maxSelect: 1 },
        { type: "text", name: "title", required: true, min: 1, max: 200 },
        { type: "editor", name: "content", maxSize: 100000 },
        { type: "select", name: "status", required: true, maxSelect: 1, values: ["draft", "published", "archived"] },
        { type: "bool", name: "pinned" },
        { type: "relation", name: "tags", collectionId: tags.id, cascadeDelete: false, maxSelect: 20 },
        {
          type: "file",
          name: "attachments",
          maxSelect: 5,
          maxSize: 5242880,
          mimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"],
          thumbs: ["100x100", "600x0"],
        },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE INDEX idx_notes_workspace ON notes (workspace)",
        "CREATE INDEX idx_notes_status ON notes (status)",
        "CREATE INDEX idx_notes_created ON notes (created)",
      ],
    });
    app.save(notes);

    const comments = new Collection({
      type: "base",
      name: "comments",
      fields: [
        { type: "relation", name: "note", required: true, collectionId: notes.id, cascadeDelete: true, maxSelect: 1 },
        { type: "relation", name: "author", required: true, collectionId: users.id, cascadeDelete: false, maxSelect: 1 },
        { type: "text", name: "body", required: true, min: 1, max: 2000 },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      ],
      indexes: ["CREATE INDEX idx_comments_note ON comments (note)"],
    });
    app.save(comments);

    const activities = new Collection({
      type: "base",
      name: "activities",
      fields: [
        { type: "relation", name: "workspace", required: true, collectionId: workspaces.id, cascadeDelete: true, maxSelect: 1 },
        { type: "relation", name: "actor", collectionId: users.id, cascadeDelete: false, maxSelect: 1 },
        { type: "text", name: "action", required: true, max: 40 },
        { type: "text", name: "subject", max: 200 },
        { type: "json", name: "meta", maxSize: 20000 },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      ],
      indexes: [
        "CREATE INDEX idx_activities_workspace ON activities (workspace)",
        "CREATE INDEX idx_activities_created ON activities (created)",
      ],
    });
    app.save(activities);

    // === Phase 2: API-Regeln setzen (alle Collections existieren jetzt) =====

    // "Ist der Request-User Mitglied des in <wsField> referenzierten Workspaces?"
    // Beide Bedingungen wirken auf denselben workspace_members-JOIN.
    const memberOf = (wsField) =>
      `@request.auth.id != "" ` +
      `&& @collection.workspace_members.workspace ?= ${wsField} ` +
      `&& @collection.workspace_members.user ?= @request.auth.id`;

    workspaces.listRule = memberOf("id");
    workspaces.viewRule = memberOf("id");
    workspaces.createRule =
      '@request.auth.id != "" && @request.body.owner = @request.auth.id';
    workspaces.updateRule = '@request.auth.id != "" && owner = @request.auth.id';
    workspaces.deleteRule = '@request.auth.id != "" && owner = @request.auth.id';
    app.save(workspaces);

    members.listRule = memberOf("workspace");
    members.viewRule = memberOf("workspace");
    members.createRule = '@request.auth.id != "" && workspace.owner = @request.auth.id';
    members.updateRule = '@request.auth.id != "" && workspace.owner = @request.auth.id';
    members.deleteRule = '@request.auth.id != "" && workspace.owner = @request.auth.id';
    app.save(members);

    tags.listRule = memberOf("workspace");
    tags.viewRule = memberOf("workspace");
    tags.createRule = memberOf("@request.body.workspace");
    tags.updateRule = memberOf("workspace");
    tags.deleteRule = memberOf("workspace");
    app.save(tags);

    notes.listRule = memberOf("workspace");
    notes.viewRule = memberOf("workspace");
    notes.createRule =
      memberOf("@request.body.workspace") +
      " && @request.body.author = @request.auth.id";
    notes.updateRule = memberOf("workspace");
    notes.deleteRule = memberOf("workspace");
    app.save(notes);

    comments.listRule = memberOf("note.workspace");
    comments.viewRule = memberOf("note.workspace");
    comments.createRule =
      memberOf("@request.body.note.workspace") +
      " && @request.body.author = @request.auth.id";
    comments.updateRule = '@request.auth.id != "" && author = @request.auth.id';
    comments.deleteRule = '@request.auth.id != "" && author = @request.auth.id';
    app.save(comments);

    activities.listRule = memberOf("workspace");
    activities.viewRule = memberOf("workspace");
    activities.createRule = null; // nur Hooks/Superuser
    activities.updateRule = null;
    activities.deleteRule = null;
    app.save(activities);
  },

  // --- Rollback (umgekehrte Reihenfolge wegen Relationen) -------------------
  (app) => {
    for (const name of [
      "activities",
      "comments",
      "notes",
      "tags",
      "workspace_members",
      "workspaces",
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (_) {
        /* ignore */
      }
    }
  }
);
