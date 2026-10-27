# Local development

## One-command startup

To run the learner web app locally:

```bash
pnpm run dev:web
```

That command will:

1. ensure Docker is available
2. start or reuse a local PostgreSQL 16 container named `mteto-postgres`
3. apply the Drizzle schema from `lib/db`
4. launch the API on port `5000`
5. launch the learner frontend on port `5173`
6. expose both behind a small local proxy on port `3000`

Use `http://127.0.0.1:3000` in the browser.

## Why the proxy exists

The frontend uses relative `/api` calls. In Replit, routing hid that detail. Locally, the proxy keeps the web app and API on the same origin so the learner app behaves as expected.

## Prerequisites

You will need:

- `pnpm`
- Node.js (the repo targets Node 24)
- Docker

## Environment notes

No real environment file or credentials are included. Copy `.env.example` to `.env` and supply values from a secure source. Keep `.env` local; it is ignored by Git. Admin and service-provider PINs must be configured with `ADMIN_PIN` and `SP_PIN`. The API rejects PIN-protected requests when those values are missing.

## Ports used locally

- `3000` — local proxy / browser entrypoint
- `5000` — API server
- `5173` — learner frontend Vite dev server
- `5432` — PostgreSQL Docker container

## Stopping the stack

Press `Ctrl+C` in the launcher process to stop the API, frontend, and proxy.

The Docker Postgres container is intentionally left running so that the next local startup is faster.
