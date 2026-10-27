# M-TETO Search Engine

M-TETO is a monorepo for a child-focused, AI-assisted web platform built to help children in South Africa access safer, age-appropriate information about rights, support services, and the justice journey around school-related gender-based violence (SRGBV).

At a high level, this repo contains:

- the **learner-facing PWA** (`artifacts/m-teto`)
- the **API server** (`artifacts/api-server`)
- the **admin portal** (`artifacts/admin-portal`)
- the **service-provider portal** (`artifacts/service-provider`)
- shared libraries for API clients, database schema, auth, and justice timelines (`lib/*`)

## Intent

The project aims to combine:

- safer search and guidance for children
- support-service discovery and accountability tooling
- case and justice-journey tracking
- administrative and partner-facing operational views

## Run the learner web app locally

```bash
pnpm install && pnpm run dev:web
```

That command starts local Postgres in Docker if needed, applies the schema, launches the API and learner web app, and serves everything at `http://127.0.0.1:3000`.

## Read more

Start here and go deeper only if you need to:

1. [`docs/overview.md`](docs/overview.md) — product and repo in one page
2. [`docs/workspaces.md`](docs/workspaces.md) — what each app and library does
3. [`docs/local-development.md`](docs/local-development.md) — local setup, ports, and environment notes
4. [`docs/TODOS.md`](docs/TODOS.md) — what still needs to happen for production readiness

## Current state

This repository was initially scaffolded with Replit AI and is now being shaped into a more maintainable local-development monorepo. Some integrations need credentials supplied through local environment variables. See [local development](docs/local-development.md) for setup. VPS deployment examples use documentation-only addresses; pass the actual destination explicitly when running the bootstrap script.
