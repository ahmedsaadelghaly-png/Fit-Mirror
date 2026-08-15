import { NextResponse } from "next/server";

/**
 * Frontend container healthcheck — mirrors the backend's `GET /health`
 * shape (`{status, service}`) for consistency, but this is the Next.js
 * server process's own liveness, unrelated to the backend API. Used by
 * `frontend/Dockerfile`'s `HEALTHCHECK` and
 * `docker-compose.prod.yml`'s `frontend` service healthcheck — see
 * docs/DEPLOYMENT_FRONTEND.md "Healthcheck endpoint". No auth, no
 * dependency on the backend being reachable — a load balancer should be
 * able to tell "is this Next.js process alive" independent of anything
 * downstream.
 */
export function GET() {
  return NextResponse.json({ status: "ok", service: "fitmirror-frontend" });
}
