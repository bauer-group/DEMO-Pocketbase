/// <reference path="../pb_data/types.d.ts" />

// ----------------------------------------------------------------------------
// Seed-Migration: legt einen sofort erlebbaren Demo-Datenstand an.
//
//   - 2 Demo-User (Kollaboration: Owner + Editor)
//   - 1 Workspace ("Produktlaunch")
//   - Mitgliedschaften, Tags, Notizen (verschiedene Status), Kommentare
//
// Vollständig idempotent: existiert der Workspace bereits, passiert nichts.
// Werte über Env beim allerersten Start überschreibbar.
// ----------------------------------------------------------------------------

migrate(
  (app) => {
    const SLUG = "produktlaunch";

    // Idempotenz: bereits geseedet? -> abbrechen.
    try {
      if (app.findFirstRecordByFilter("workspaces", "slug = {:slug}", { slug: SLUG })) {
        return;
      }
    } catch (_) {
      // not found -> weiter
    }

    const usersCol = app.findCollectionByNameOrId("users");

    // --- Hilfsfunktion: User idempotent anlegen/finden -----------------------
    const upsertUser = (email, name, password) => {
      try {
        const existing = app.findFirstRecordByFilter(
          "users",
          "email = {:email}",
          { email }
        );
        if (existing) return existing;
      } catch (_) {
        /* not found */
      }
      const rec = new Record(usersCol);
      rec.set("email", email);
      rec.set("name", name);
      rec.set("emailVisibility", true);
      rec.set("verified", true);
      rec.setPassword(password);
      app.save(rec);
      return rec;
    };

    const demoEmail = $os.getenv("DEMO_USER_EMAIL") || "demo@example.com";
    const demoPass = $os.getenv("DEMO_USER_PASSWORD") || "demo1234";

    const owner = upsertUser(demoEmail, "Demo User", demoPass);
    const editor = upsertUser("alex@example.com", "Alex Kollege", demoPass);

    // --- Workspace -----------------------------------------------------------
    const wsCol = app.findCollectionByNameOrId("workspaces");
    const ws = new Record(wsCol);
    ws.set("name", "Produktlaunch");
    ws.set("slug", SLUG);
    ws.set("description", "Alles rund um den Launch der neuen Plattform.");
    ws.set("color", "#6366f1");
    ws.set("owner", owner.id);
    app.save(ws);
    // (Der Hook legt die Owner-Mitgliedschaft idempotent an – hier nur Editor.)

    // --- Mitgliedschaften ----------------------------------------------------
    const memCol = app.findCollectionByNameOrId("workspace_members");
    const addMember = (userId, role) => {
      const m = new Record(memCol);
      m.set("workspace", ws.id);
      m.set("user", userId);
      m.set("role", role);
      app.save(m);
    };
    addMember(owner.id, "owner");
    addMember(editor.id, "editor");

    // --- Tags ----------------------------------------------------------------
    const tagCol = app.findCollectionByNameOrId("tags");
    const mkTag = (name, color) => {
      const t = new Record(tagCol);
      t.set("workspace", ws.id);
      t.set("name", name);
      t.set("color", color);
      app.save(t);
      return t.id;
    };
    const tIdee = mkTag("Idee", "#22c55e");
    const tBug = mkTag("Bug", "#ef4444");
    const tWichtig = mkTag("Wichtig", "#f59e0b");

    // --- Notizen -------------------------------------------------------------
    const noteCol = app.findCollectionByNameOrId("notes");
    const mkNote = (author, title, content, status, pinned, tagIds) => {
      const n = new Record(noteCol);
      n.set("workspace", ws.id);
      n.set("author", author);
      n.set("title", title);
      n.set("content", content);
      n.set("status", status);
      n.set("pinned", pinned);
      if (tagIds && tagIds.length) n.set("tags", tagIds);
      app.save(n);
      return n;
    };

    const n1 = mkNote(
      owner.id,
      "Launch-Checkliste",
      "<p>Finale Schritte vor dem Go-Live: Domains, Monitoring, Backups, Rollback-Plan.</p>",
      "published",
      true,
      [tWichtig]
    );
    mkNote(
      editor.id,
      "Idee: Onboarding-Tour",
      "<p>Interaktive Produkttour beim ersten Login – erhöht Aktivierung messbar.</p>",
      "draft",
      false,
      [tIdee]
    );
    mkNote(
      owner.id,
      "Bug: Realtime-Reconnect",
      "<p>WebSocket verliert nach Standby die Verbindung – Auto-Reconnect prüfen.</p>",
      "published",
      false,
      [tBug, tWichtig]
    );
    mkNote(
      editor.id,
      "Archiv: alte Roadmap Q1",
      "<p>Historischer Stand, nur zur Referenz.</p>",
      "archived",
      false,
      []
    );

    // --- Kommentare ----------------------------------------------------------
    const comCol = app.findCollectionByNameOrId("comments");
    const mkComment = (author, body) => {
      const c = new Record(comCol);
      c.set("note", n1.id);
      c.set("author", author);
      c.set("body", body);
      app.save(c);
    };
    mkComment(editor.id, "Top, ich übernehme das Monitoring-Setup.");
    mkComment(owner.id, "Perfekt – Backups teste ich heute noch.");
  },

  // --- Rollback ------------------------------------------------------------
  (app) => {
    try {
      const ws = app.findFirstRecordByFilter("workspaces", "slug = {:slug}", {
        slug: "produktlaunch",
      });
      // cascadeDelete räumt members/notes/tags/comments/activities mit auf.
      app.delete(ws);
    } catch (_) {
      /* nichts zu tun */
    }
  }
);
