# ----------------------------------------------------------------------------
# Komfort-Targets für den Alltag. Standard ist `make help`.
# Einheitliches Routing über alle Hosting-Typen: Nginx -> /api -> PocketBase.
# ----------------------------------------------------------------------------

COMPOSE_DEV     ?= docker compose -f docker-compose.development.yml
COMPOSE_TRAEFIK ?= docker compose -f docker-compose.traefik.yml

.DEFAULT_GOAL := help

.PHONY: help dev up down logs build rebuild prod prod-down clean \
        install fe-dev fe-build typecheck

help: ## Diese Übersicht anzeigen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

dev: ## Nur PocketBase starten (für `vite dev` lokal daneben)
	$(COMPOSE_DEV) up -d pocketbase
	@echo "PocketBase: http://localhost:8090  (Admin: /_/)"

up: ## Alles containerisiert starten (Nginx serviert App + /api)
	$(COMPOSE_DEV) up -d --build
	@echo "App: http://localhost:8080"

down: ## Container stoppen
	$(COMPOSE_DEV) down

logs: ## PocketBase-Logs folgen
	$(COMPOSE_DEV) logs -f pocketbase

build: ## Images bauen ohne Start
	$(COMPOSE_DEV) build

rebuild: ## Alles neu bauen (no-cache) und hochfahren
	$(COMPOSE_DEV) build --no-cache
	$(COMPOSE_DEV) up -d

prod: ## Production-Stack hinter EXTERNEM Traefik starten
	$(COMPOSE_TRAEFIK) up -d --build

prod-down: ## Production-Stack stoppen
	$(COMPOSE_TRAEFIK) down

clean: ## Container + Volume (pb_data!) entfernen
	$(COMPOSE_DEV) down -v

install: ## Frontend-Dependencies installieren
	cd frontend && npm install

fe-dev: ## Frontend-Dev-Server starten (Vite)
	cd frontend && npm run dev

fe-build: ## Frontend Production-Build (statisch)
	cd frontend && npm run build

typecheck: ## TS-Typecheck im Frontend
	cd frontend && npm run typecheck
