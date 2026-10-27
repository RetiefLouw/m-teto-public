# Local development

## One-command startup

The learner app can be started without creating a `.env` file or configuring API keys. From the repository root, run:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm run dev:web
```

That command will:

1. ensure Docker is available
2. start or reuse a local PostgreSQL 16 container named `mteto-postgres`
3. apply the Drizzle schema from `lib/db`
4. launch the API on port `5555`
5. launch the learner frontend on port `5173`
6. expose both behind a local-only proxy on port `3000`

Use `http://127.0.0.1:3000` in the browser.

The launcher stops with an error if a required local port is already occupied. You can choose another frontend or browser port without setting environment variables, for example:

```bash
corepack pnpm --dir scripts exec tsx src/dev-web.ts --frontend-port=5174 --web-port=3001
```

Then open `http://127.0.0.1:3001`.

## Why the proxy exists

The frontend uses relative `/api` calls. In Replit, routing hid that detail. Locally, the proxy keeps the web app and API on the same origin so the learner app behaves as expected.

## Prerequisites

You will need:

- Node.js 24 with Corepack enabled (the repo pins pnpm 10.34.9)
- Docker

## Environment notes

The learner preview uses local defaults and does not need `.env`, API keys, or environment variables. On first start the API seeds the local database with learning content and South African service-provider directory data. The seed data is not user-submitted case data.

Admin and service-provider PIN-protected actions and external sign-in are unavailable until their credentials are configured. Keep any credentials in a local `.env` file; `.env` is ignored by Git. `.env.example` documents optional integrations.

## Ports used locally

- `3000` — local proxy / browser entrypoint
- `5555` — API server
- `5173` — learner frontend Vite dev server
- `5432` — PostgreSQL Docker container

## Stopping the stack

Press `Ctrl+C` in the launcher process to stop the API, frontend, and proxy.

The Docker Postgres container is intentionally left running so that the next local startup is faster. To reset the seeded database, remove it with `docker rm -f mteto-postgres` before starting again.
