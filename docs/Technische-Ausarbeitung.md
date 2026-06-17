# Technische Ausarbeitung — PocketBase Collab Workspace

Dieses Dokument beschreibt Architektur, Designentscheidungen und Betrieb der
Demo. Ziel der Demo ist es, die **gesamte Leistungsfähigkeit** von PocketBase
an einem realistischen, kollaborativen Anwendungsfall zu zeigen — und das in
einer für BAUER-GROUP-Projekte üblichen, sauberen Hosting-/CI-CD-Struktur.

---

## 1. Überblick

PocketBase ist ein **Single-File-Backend** (Go): SQLite-Datenbank, REST-API,
Realtime über WebSocket, Auth, Datei-Storage, Admin-UI und ein eingebetteter
JavaScript-VM für Migrationen und Hooks — alles in einer Binary.

Die Demo besteht aus zwei Deployment-Einheiten:

```
┌────────────┐    REST / WSS / Files    ┌──────────────────────────┐
│  Frontend  │ ───────────────────────▶ │  PocketBase (eine Binary) │
│ React/Vite │ ◀─────────────────────── │  SQLite · Auth · Realtime │
│  (Nginx)   │     Realtime-Events       │  Hooks · Cron · Storage   │
└────────────┘                          └──────────────────────────┘
```

Nginx (bzw. der Vite-Dev-Proxy) leitet folgende Pfade an PocketBase weiter –
Frontend und Backend teilen sich damit dieselbe Origin, **keine
CORS-Sonderbehandlung** nötig:

| Pfad | Zweck |
| ---- | ----- |
| `/api/…` | REST-API (CRUD, Auth) und Realtime über `/api/realtime` (WebSocket/SSE) |
| `/api/files/…` | Datei-Downloads & Thumbnails |
| `/_/` | Admin-Dashboard – eingebettete Superuser-SPA (Collections, Records, Settings, Logs, Backups) |
| sonst | SPA-Fallback → `index.html` |

---

## 2. Datenmodell

Sechs Collections modellieren einen kollaborativen Workspace
(siehe `pocketbase/pb_migrations/1735000000_collections.js`):

| Collection | Zweck | Wichtige Felder |
| ---------- | ----- | --------------- |
| `users` (system, auth) | Konten | email, name, avatar |
| `workspaces` | Container | name, slug (unique), color, **owner** → users |
| `workspace_members` | m:n User↔Workspace | workspace, user, **role** (owner/editor/viewer) |
| `tags` | Labels je Workspace | workspace, name, color |
| `notes` | Inhalte | workspace, author, title, **content** (editor/HTML), **status**, pinned, **tags** (m:n), **attachments** (file[]) |
| `comments` | Diskussion an Note | note, author, body |
| `activities` | Audit-/Activity-Feed | workspace, actor, action, subject, meta (json) |

Relationen nutzen `cascadeDelete`, sodass das Löschen eines Workspaces
automatisch Members, Notes, Tags, Comments und Activities aufräumt.

### Migrations-API (PocketBase ≥ 0.23)

Die Migrationen verwenden die **neue JSVM-API**:

```js
migrate((app) => {
  const notes = new Collection({
    type: "base",
    name: "notes",
    fields: [
      { type: "relation", name: "workspace", required: true,
        collectionId: workspaces.id, cascadeDelete: true, maxSelect: 1 },
      { type: "select", name: "status", values: ["draft","published","archived"] },
      { type: "file", name: "attachments", maxSelect: 5, maxSize: 5242880,
        mimeTypes: ["image/png","image/jpeg","application/pdf"], thumbs: ["100x100","600x0"] },
      // …
    ],
    indexes: ["CREATE INDEX idx_notes_status ON notes (status)"],
  });
  app.save(notes);
}, (app) => { /* rollback */ });
```

> Hinweis: Frühere PocketBase-Versionen (≤ 0.22) nutzten `Dao`/`schema`. Die
> Demo wurde bewusst auf die aktuelle API portiert, damit sie langfristig
> wartbar bleibt.

---

## 3. Membership-basierte Zugriffskontrolle (das Kernstück)

Klassische Demos beschränken Zugriff auf „Owner == eingeloggter User".
Hier entscheidet stattdessen die **Mitgliedschaft** — echte Mehrbenutzer-
Kollaboration, vollständig deklarativ in den API-Rules:

```text
@request.auth.id != ""
  && @collection.workspace_members.workspace ?= workspace
  && @collection.workspace_members.user      ?= @request.auth.id
```

PocketBase erzeugt je `@collection`-Referenz **einen** JOIN auf
`workspace_members`; beide Bedingungen korrelieren damit auf dieselbe Zeile.
Übersetzt: „Zeige/erlaube den Datensatz nur, wenn der Anfragende Mitglied des
zugehörigen Workspaces ist." Für `comments` reicht die Regel sogar über zwei
Ebenen (`note.workspace`).

Der `activities`-Feed ist **read-only**: `createRule/updateRule/deleteRule`
sind `null` (nur Superuser/Hooks dürfen schreiben). So kann der Client den
Audit-Trail nicht fälschen.

---

## 4. Serverseitige Logik: `pb_hooks/main.pb.js`

PocketBase lädt `*.pb.js` automatisch (Hot-Reload). Die Demo nutzt drei
Mechanismen, die über reines CRUD hinausgehen:

1. **Event-Hooks** (`onRecordAfterCreateSuccess`)
   - Neuer Workspace → Owner wird **idempotent** als Mitglied (`role=owner`)
     eingetragen + Activity.
   - Neue Notiz / neuer Kommentar → Activity-Eintrag.
   - Dadurch ist der Feed serverseitig autoritativ.

2. **Custom-API-Routen** (`routerAdd`)
   - `GET /api/demo/stats/{workspace}` — aggregierte Statistiken
     (Notizen nach Status, Mitglieder, Tags, Activities), geschützt per
     `$apis.requireAuth()` und zusätzlicher Membership-Prüfung.
   - `GET /api/demo/info` — öffentlicher Info-/Feature-Endpoint.

3. **Cron** (`cronAdd`)
   - `housekeeping` um 03:00 — Activities älter als 30 Tage werden geprunt.
     Demonstriert geplante Jobs ohne externen Scheduler.

---

## 5. Frontend-Architektur

```
src/
├── lib/        pb (Client), types, errors, sanitize, cn, format
├── hooks/      useAuth, useWorkspaces, useNotes, useComments,
│               useActivity, useStats, useTags, useRealtimeList
├── providers/  ThemeProvider (Dark-Mode), ToastProvider (Radix)
└── components/ ui/ (Button, Card, Dialog, Avatar, Toast, …)
                + Feature-Komponenten (AppShell, Sidebar, NotesBoard, …)
```

### Realtime-Strategie

Ein generischer Hook `useRealtimeList<T>` kapselt das Muster
„initialer `getFullList` + `subscribe('*')`". Entscheidend: PocketBase
filtert und expandiert Realtime-Events **serverseitig**:

```ts
pb.collection("notes").subscribe("*", handler, { filter, expand: "author,tags" });
```

Damit kommen nur relevante Events an — bereits mit aufgelösten Relationen.
Der Hook merged `create`/`update`/`delete` lokal und hält die Sortierung.
`useNotes`, `useComments`, `useActivity` und `useTags` bauen darauf auf (DRY).

### State & Datenfluss

- Auth-State spiegelt `pb.authStore.onChange()` reaktiv nach React.
- `AppShell` hält den selektierten Workspace und Filter (Status/Tag/Suche)
  und verteilt sie an die Daten-Hooks; Filter werden als PocketBase-
  Filter-Strings (`pb.filter`, parametrisiert) gebaut.
- Mutationen schreiben nur über die API — die UI aktualisiert sich über das
  zurückkommende Realtime-Event (Single Source of Truth).

### UI/UX

TailwindCSS v4 (Plugin `@tailwindcss/vite`, kein PostCSS-Config) mit
Design-Tokens via `@theme`. Radix-Primitives liefern barrierefreie
Dialog/Dropdown/Toast/Tooltip/Tabs. Dark-Mode als Klassen-Variante mit
Früh-Init im `<head>` gegen FOUC. PWA via `vite-plugin-pwa`.

---

## 6. Sicherheit

- **XSS**: Notiz-Inhalte sind HTML (editor-Feld) und stammen von anderen
  Mitgliedern → werden vor jeder Ausgabe mit **DOMPurify** auf eine schmale
  Tag-Whitelist reduziert (`lib/sanitize.ts`).
- **Zugriff**: Membership-RLS (Abschnitt 3) — Defense-in-depth zusätzlich in
  der Stats-Route.
- **Transport**: In Production erzwingt Traefik HTTPS (HSTS, Security-Header);
  CORS ist über `--origins` exakt auf das Frontend-Origin beschränkt.
- **Secrets**: keine im Code; Demo-Credentials nur als Env-Defaults.
- **Container**: PocketBase läuft als non-root `pb`-User, gepinnte Binary.

---

## 7. Deployment — einheitliches Routing

**Über alle Hosting-Typen identisch**: Nginx (Frontend) ist der einzige
Eingang und proxied `/api` + `/_/` intern an PocketBase. PocketBase wird nie
direkt am Edge exponiert — gleiche Origin, kein CORS, ein Hostname.

```text
Browser ─▶ Frontend-Nginx ─▶ /api, /_/ ─▶ PocketBase (internes Netz)
```

Drei Compose-Dateien, gleiche Topologie, nur unterschiedlicher Edge:

| Datei | Edge / Zweck |
| ----- | ------------ |
| `docker-compose.development.yml` | Lokal; Frontend auf `APP_PORT`, PocketBase zusätzlich auf `PB_PORT` (für `vite dev`) |
| `docker-compose.coolify.yml` | Coolify/Standalone; Frontend auf `APP_PORT`, Coolifys Proxy terminiert TLS |
| `docker-compose.traefik.yml` | EXTERNES Traefik; nur das Frontend hängt am `${PROXY_NETWORK}` |

In allen Fällen liegt PocketBase im `internal`-Bridge-Netz und ist über den
Service-Namen `pocketbase:8090` aus dem Nginx erreichbar.

### Production — EXTERNES Traefik

Gemäß BAUER-GROUP-Standard ist Traefik **nicht** Teil des Stacks:

- Nur das Frontend bekommt Traefik-Labels; PocketBase nutzt `expose` und
  bleibt intern.
- EIN `SERVICE_HOSTNAME`; Routing/TLS/Security-Header über **Labels**,
  HTTP→HTTPS via `https-redirect@file`, Zertifikate über den vorhandenen
  `certresolver`.
- `networks.proxy.external: true` — das Netz wird hier **nicht** erzeugt.

```text
                 ┌──────── internes Netz ────────┐
SERVICE_HOSTNAME │  Frontend-Nginx ──▶ PocketBase │
   ──▶ Traefik ──┘  (/api, /_/ proxy)             │
   (ACME, HTTPS)    └───────────────────────────────┘
```

---

## 8. CI/CD

`.github/` nutzt durchgängig die **Reusable-Workflows aus
`bauer-group/automation-templates`** (kein inline nachgebautes CI):

| Workflow | Reusable-Modul | Zweck |
| -------- | -------------- | ----- |
| `docker-release.yml` | `modules-validate-compose`, `modules-semantic-release`, `docker-build` | Compose validieren → Release → beide Images (PocketBase + Frontend) nach GHCR; PR baut ohne Push |
| `docker-maintenance.yml` | `docker-maintenance-dependabot` | Auto-Merge von Dependabot-Docker-PRs |
| `ai-issue-summary.yml` | `modules-ai-issue-summary` | KI-Zusammenfassung neuer Issues/PRs |
| `teams-notifications.yml` | `teams-notifications` | Microsoft-Teams-Benachrichtigungen |
| `dependabot.yml` | — | npm (`/frontend`) + Docker (`/pocketbase`, `/frontend`) + GitHub-Actions |

Konventionen: `runs-on: '["self-hosted", "linux"]'` (Runner-Flex), interne
Reusable-Workflows mit `@main` + `secrets: inherit`, explizite `permissions`
je Workflow. Das Frontend-Image baut auf **Node 24 LTS**.

---

## 9. Versionierung & Reproduzierbarkeit

- PocketBase-Binary ist im Dockerfile per `PB_VERSION` (Default `0.39.4`)
  gepinnt und wird direkt von GitHub-Releases geladen.
- Frontend-Dependencies über `package-lock.json` + `npm ci` in CI.
- Migrationen sind versioniert und idempotent (Seed bricht ab, wenn bereits
  vorhanden) — ein frischer Start liefert deterministisch denselben
  Demo-Datenstand.
