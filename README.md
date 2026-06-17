# PocketBase Collab Workspace — Demo

Eine **produktionsnahe Demo**, die die volle Bandbreite von
[PocketBase](https://pocketbase.io) demonstriert: relationale Datenmodelle,
membership-basierte Zugriffskontrolle (RLS), Realtime, Datei-Uploads,
serverseitige **Event-Hooks**, **Custom-API-Endpoints** und **Cron-Jobs** —
alles aus einer einzigen Binary. Dazu ein modernes Frontend mit
**React + Vite + TypeScript + TailwindCSS v4 + Radix UI**.

> Architektur, Designentscheidungen und Deployment im Detail:
> siehe [`docs/Technische-Ausarbeitung.md`](docs/Technische-Ausarbeitung.md).

![Stack](https://img.shields.io/badge/PocketBase-0.39.x-blue) ![Frontend](https://img.shields.io/badge/React%2019-Vite%208-149eca) ![Node](https://img.shields.io/badge/Node-24%20LTS-339933) ![Style](https://img.shields.io/badge/Tailwind-v4-38bdf8) ![License](https://img.shields.io/badge/license-MIT-green)

---

## Was die Demo zeigt

| Feature | Umsetzung |
| ------- | --------- |
| **Auth** | E-Mail/Passwort, Registrierung, reaktiver Auth-State |
| **Relationen** | Workspaces ↔ Members ↔ Notes ↔ Tags ↔ Comments |
| **Membership-RLS** | Zugriff via `@collection.workspace_members`-Join statt „Owner == ich" |
| **Realtime** | Live-Notizen, -Kommentare und -Activity über WebSocket |
| **Datei-Uploads** | Bilder & PDF an Notizen, serverseitige Thumbnails |
| **Event-Hooks** | Fälschungssicherer Activity-Feed, Auto-Owner-Mitgliedschaft |
| **Custom-API** | `GET /api/demo/stats/{workspace}` (aggregierte Statistiken) |
| **Cron** | Nächtliches Housekeeping (alte Activities prunen) |
| **Frontend** | Dark-Mode, Toasts, Skeletons, Suche/Filter, Command-feel UI |
| **Security** | HTML-Sanitisierung (DOMPurify), CORS, Security-Header |

---

## Routing-Modell (einheitlich über alle Hosting-Typen)

```text
Browser ─▶ Frontend-Nginx ─▶ /api, /_/ ─▶ PocketBase (intern)
```

Nginx ist **überall** der einzige Eingang und proxied `/api` (REST + Realtime)
sowie `/_/` (Admin) intern an PocketBase — gleiche Origin, **kein CORS**.
Das gilt für `development`, `coolify`/standalone und `traefik` gleichermaßen;
es gibt nur **einen** Hostname.

### PocketBase-Pfade (was nginx weiterleitet)

| Pfad | Zweck |
| ---- | ----- |
| `/api/…` | REST-API (CRUD, Auth) **und** Realtime über `/api/realtime` (WebSocket/SSE) |
| `/api/files/…` | Datei-Downloads & Thumbnails |
| `/_/` | Admin-Dashboard (eingebettete Superuser-SPA: Collections, Records, Settings, Logs, Backups) |
| sonst | SPA-Fallback → `index.html` (Vite-Bundle) |

## Quickstart

### Variante A — Frontend lokal via `vite dev` (Hot Reload, empfohlen)

```bash
cp .env.example .env

# Backend im Container
docker compose -f docker-compose.development.yml up -d pocketbase

# Frontend lokal
cd frontend
npm install
npm run dev
```

- App:            http://localhost:5173
- PocketBase API: http://localhost:8090
- Admin-UI:       http://localhost:8090/_/
- Demo-Login:     `demo@example.com` / `demo1234` (vorausgefüllt)

> Beim allerersten Start legen die Migrationen Schema **und** einen kompletten
> Demo-Datenstand an (2 User, Workspace, Tags, Notizen, Kommentare).
> Den ersten Admin (Superuser) legst du selbst über die Admin-UI an.

### Variante B — Alles containerisiert (Production-nah)

```bash
docker compose -f docker-compose.development.yml up -d --build
```

- App: http://localhost:8080  (Nginx serviert Bundle + proxied `/api` und `/_/`)

### Variante C — Production hinter EXTERNEM Traefik

```bash
cp .env.example .env   # SERVICE_HOSTNAME, PROXY_NETWORK, TLS_CERTRESOLVER setzen
docker compose -f docker-compose.traefik.yml up -d --build
```

Voraussetzung: Ein **bereits laufender Traefik** im externen Netz
`${PROXY_NETWORK}` (Default `EDGEPROXY`), mit Entrypoints `http`/`https`,
einem ACME-`certresolver` und der Middleware `https-redirect@file`.
Ein DNS-A-Record für `${SERVICE_HOSTNAME}` zeigt auf den Server.

```text
https://<SERVICE_HOSTNAME>/       →  Frontend (SPA)
https://<SERVICE_HOSTNAME>/api/   →  PocketBase REST + Realtime
https://<SERVICE_HOSTNAME>/_/     →  PocketBase Admin
```

### Variante D — Coolify / Standalone

```bash
docker compose -f docker-compose.coolify.yml up -d --build
```

Veröffentlicht das Frontend auf `APP_PORT`; Coolifys Proxy terminiert TLS davor.

---

## Projektstruktur

```text
pocketbase-collab/
├── docker-compose.development.yml # Lokal/Dev (Nginx + PB, PB-Port offen)
├── docker-compose.coolify.yml     # Coolify / Standalone (Nginx exponiert)
├── docker-compose.traefik.yml     # Production hinter EXTERNEM Traefik
├── .env.example  Makefile  CHANGELOG.md
├── .github/                       # Docker-Release, Maintenance, AI-Summary, Teams, Dependabot
├── docs/Technische-Ausarbeitung.md
├── pocketbase/
│   ├── Dockerfile                 # Alpine + gepinnte PB-Binary (v0.39.x)
│   ├── pb_migrations/             # Schema + Seed (neue JSVM-API)
│   └── pb_hooks/main.pb.js        # Event-Hooks, Custom-Routes, Cron
└── frontend/
    ├── Dockerfile                 # Multi-Stage: Node-Build → Nginx
    ├── nginx.conf                 # SPA + Reverse-Proxy + PWA-Header
    ├── vite.config.ts             # Tailwind v4 + PWA + Dev-Proxy
    └── src/
        ├── lib/        # pb-Client, Typen, sanitize, cn, format
        ├── hooks/      # useAuth/Workspaces/Notes/Comments/Activity/Stats
        ├── providers/  # Theme + Toast
        └── components/ # ui/ (Primitives) + Feature-Komponenten
```

---

## Wichtigste Makefile-Targets

```text
make dev         # nur PocketBase (für vite dev daneben)
make up          # alles containerisiert
make prod        # Production hinter externem Traefik
make typecheck   # Frontend tsc --noEmit
make fe-build    # Frontend Production-Build
make clean       # Container + Volume (löscht pb_data!)
```

---

## Custom-API ausprobieren

```bash
# Public-Info (ohne Auth)
curl http://localhost:8090/api/demo/info

# Aggregierte Stats (Auth-Token nötig – aus der Admin-UI oder via SDK)
curl -H "Authorization: TOKEN" \
  http://localhost:8090/api/demo/stats/<workspace-id>
```

---

## Lizenz

MIT — siehe [LICENSE](LICENSE).
