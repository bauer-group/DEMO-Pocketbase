# syntax=docker/dockerfile:1.6
# ----------------------------------------------------------------------------
# Frontend – Multi-Stage Build
#   Stage 1 (build):  installiert npm-Pakete, baut Production-Bundle mit Vite
#   Stage 2 (serve):  Nginx liefert das statische Bundle aus und proxied
#                     /api und /_ Anfragen an den PocketBase-Container weiter.
#                     Damit hat das Frontend immer die gleiche Origin wie das
#                     Backend → kein CORS erforderlich.
# ----------------------------------------------------------------------------

FROM node:24-alpine AS build

WORKDIR /app
ENV CI=1

# Erst nur die Manifeste kopieren → maximaler Layer-Cache.
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Restlicher Source
COPY . .

# VITE_PB_URL bleibt in diesem Setup absichtlich leer, damit der Client
# `location.origin` benutzt (wird vom Nginx-Proxy weitergereicht).
ARG VITE_PB_URL=""
ENV VITE_PB_URL=${VITE_PB_URL}

RUN npm run build

# ----------------------------------------------------------------------------

FROM nginx:1.31-alpine AS serve

# Eigene Nginx-Konfig
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Bundle einbinden
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
