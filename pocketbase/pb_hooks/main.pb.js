/// <reference path="../pb_data/types.d.ts" />

// ============================================================================
// pb_hooks/main.pb.js
//
// Serverseitige Logik, die PocketBase über die reine CRUD-API hinaus zeigt:
//
//   1. Event-Hooks      – fälschungssicherer Activity-Feed + Auto-Mitgliedschaft
//   2. Custom-API-Route – aggregierte Workspace-Statistiken (/api/demo/stats)
//   3. Public-Route     – erweiterter Info-Endpoint (/api/demo/info)
//   4. Cron-Job         – nächtliches Housekeeping (alte Activities prunen)
//
// WICHTIG: PocketBase führt jeden Handler in einem ISOLIERTEN Scope aus –
// Funktionen/Variablen aus dem Modul-Scope sind darin NICHT sichtbar. Daher
// werden Helfer bewusst innerhalb der Handler definiert (kein Closure-Sharing).
// ============================================================================

// ----------------------------------------------------------------------------
// 1a) Neuer Workspace -> Owner automatisch als Mitglied (Rolle "owner")
//     + Activity. Idempotent (Seed legt Mitgliedschaft evtl. selbst an).
// ----------------------------------------------------------------------------
onRecordAfterCreateSuccess((e) => {
  try {
    const ws = e.record;
    const ownerId = ws.get("owner");

    let exists = null;
    try {
      exists = e.app.findFirstRecordByFilter(
        "workspace_members",
        "workspace = {:w} && user = {:u}",
        { w: ws.id, u: ownerId }
      );
    } catch (_) {
      /* not found */
    }
    if (!exists) {
      const m = new Record(e.app.findCollectionByNameOrId("workspace_members"));
      m.set("workspace", ws.id);
      m.set("user", ownerId);
      m.set("role", "owner");
      e.app.save(m);
    }

    const act = new Record(e.app.findCollectionByNameOrId("activities"));
    act.set("workspace", ws.id);
    act.set("actor", ownerId);
    act.set("action", "workspace.created");
    act.set("subject", ws.get("name"));
    e.app.save(act);
  } catch (err) {
    e.app.logger().warn("workspace hook failed", "error", String(err));
  }
  e.next();
}, "workspaces");

// ----------------------------------------------------------------------------
// 1b) Neue Notiz -> Activity-Eintrag.
// ----------------------------------------------------------------------------
onRecordAfterCreateSuccess((e) => {
  try {
    const n = e.record;
    const act = new Record(e.app.findCollectionByNameOrId("activities"));
    act.set("workspace", n.get("workspace"));
    act.set("actor", n.get("author"));
    act.set("action", "note.created");
    act.set("subject", n.get("title"));
    act.set("meta", { status: n.get("status") });
    e.app.save(act);
  } catch (err) {
    e.app.logger().warn("note hook failed", "error", String(err));
  }
  e.next();
}, "notes");

// ----------------------------------------------------------------------------
// 1c) Neuer Kommentar -> Activity-Eintrag (Workspace über die Note auflösen).
// ----------------------------------------------------------------------------
onRecordAfterCreateSuccess((e) => {
  try {
    const c = e.record;
    const note = e.app.findRecordById("notes", c.get("note"));
    const act = new Record(e.app.findCollectionByNameOrId("activities"));
    act.set("workspace", note.get("workspace"));
    act.set("actor", c.get("author"));
    act.set("action", "comment.created");
    act.set("subject", note.get("title"));
    e.app.save(act);
  } catch (err) {
    e.app.logger().warn("comment hook failed", "error", String(err));
  }
  e.next();
}, "comments");

// ----------------------------------------------------------------------------
// 2) Custom-API: aggregierte Statistiken eines Workspaces.
//    GET /api/demo/stats/{workspace}  (nur für Mitglieder)
// ----------------------------------------------------------------------------
routerAdd(
  "GET",
  "/api/demo/stats/{workspace}",
  (e) => {
    const wsId = e.request.pathValue("workspace");
    const authId = e.auth ? e.auth.id : null;
    if (!authId) return e.json(401, { error: "unauthorized" });

    let membership = null;
    try {
      membership = e.app.findFirstRecordByFilter(
        "workspace_members",
        "workspace = {:w} && user = {:u}",
        { w: wsId, u: authId }
      );
    } catch (_) {
      /* none */
    }
    if (!membership) return e.json(403, { error: "not a member" });

    const count = (collection, filter, params) => {
      try {
        return e.app.findRecordsByFilter(collection, filter, "", 0, 0, params)
          .length;
      } catch (_) {
        return 0;
      }
    };

    const byStatus = {};
    for (const s of ["draft", "published", "archived"]) {
      byStatus[s] = count("notes", "workspace = {:w} && status = {:s}", {
        w: wsId,
        s: s,
      });
    }

    return e.json(200, {
      workspace: wsId,
      role: membership.get("role"),
      notes: {
        total: byStatus.draft + byStatus.published + byStatus.archived,
        byStatus: byStatus,
      },
      members: count("workspace_members", "workspace = {:w}", { w: wsId }),
      tags: count("tags", "workspace = {:w}", { w: wsId }),
      activities: count("activities", "workspace = {:w}", { w: wsId }),
    });
  },
  $apis.requireAuth()
);

// ----------------------------------------------------------------------------
// 3) Public-Info-Endpoint – ohne Auth.
//    GET /api/demo/info
// ----------------------------------------------------------------------------
routerAdd("GET", "/api/demo/info", (e) => {
  return e.json(200, {
    name: "PocketBase Collab Workspace Demo",
    status: "ok",
    time: new Date().toISOString(),
    features: [
      "auth",
      "membership-rls",
      "realtime",
      "file-uploads",
      "event-hooks",
      "custom-routes",
      "cron",
    ],
  });
});

// ----------------------------------------------------------------------------
// 4) Cron: nächtliches Housekeeping um 03:00 – Activities > 30 Tage löschen.
// ----------------------------------------------------------------------------
cronAdd("housekeeping", "0 3 * * *", () => {
  try {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .replace("T", " ");
    const old = $app.findRecordsByFilter(
      "activities",
      "created < {:c}",
      "created",
      500,
      0,
      { c: cutoff }
    );
    old.forEach((r) => $app.delete(r));
    $app.logger().info("housekeeping done", "prunedActivities", old.length);
  } catch (err) {
    $app.logger().error("housekeeping failed", "error", String(err));
  }
});
