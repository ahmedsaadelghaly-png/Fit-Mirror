# Multi-stage Dockerfile for the FitMirror AI frontend.
#
# The `dev` stage is what docker-compose.dev.yml uses (bind-mounted source,
# hot reload via `next dev`). The `builder`/`runner` stages produce a
# production build, used by docker-compose.prod.yml's `frontend` service —
# see docs/DEPLOYMENT_FRONTEND.md.

FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./

# --- dev: installs all deps, runs `next dev` with hot reload ---
FROM base AS dev
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# --- builder: production build ---
# `next.config.mjs`'s `output: "standalone"` makes this produce a minimal
# self-contained server bundle (`.next/standalone`) with only the
# node_modules actually required at runtime traced in — the `runner` stage
# below copies just that, not the full `node_modules` tree, for a much
# smaller final image than a plain `next build` + `npm ci --omit=dev`
# would give.
FROM base AS builder
RUN npm ci
COPY . .
# Build-time-only public env vars — see docs/DEPLOYMENT_FRONTEND.md
# "Build-time vs runtime environment variables" for why these must be
# ARGs (baked into the client bundle at build time), not just runtime
# environment variables like every other setting in this file.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_APP_ENV=production
ARG NEXT_PUBLIC_S3_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}
ENV NEXT_PUBLIC_S3_PUBLIC_BASE_URL=${NEXT_PUBLIC_S3_PUBLIC_BASE_URL}
ENV NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL=${NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL}
RUN npm run build

# --- runner: minimal production image ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone output already includes a pruned node_modules and a
# `server.js` entrypoint — no `npm install`/`npm ci` needed in this stage
# at all.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
# GET /api/health — see app/api/health/route.ts and docs/DEPLOYMENT_FRONTEND.md.
HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=15s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "server.js"]
