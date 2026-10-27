# Workspaces

## Primary applications

### `artifacts/m-teto`

The learner-facing React + Vite PWA.

This is the main web experience for children and includes search, onboarding, helpers/service discovery, educational content, accessibility features, and justice-related flows.

### `artifacts/api-server`

The Express API backend.

It exposes routes under `/api`, talks to PostgreSQL through Drizzle, runs seed logic on startup, and acts as the backend for the learner app and related portals.

### `artifacts/admin-portal`

A separate React + Vite admin application.

This is intended for admin-only workflows such as analytics, oversight, and platform management.

### `artifacts/service-provider`

A separate React + Vite portal for service providers and officials.

This is intended for case progress, provider-side workflows, and accountability operations.

## Shared libraries

### `lib/db`

Database connection, Drizzle config, and schema definitions.

### `lib/api-spec`

The OpenAPI source used to generate API clients and validation artifacts.

### `lib/api-client-react`

Generated React Query client code that the frontends use to talk to the API.

### `lib/api-zod`

Generated Zod schemas and types that support request/response validation.

### `lib/replit-auth-web`

Auth-related client-side helpers for the Replit-auth-based flow.

### `lib/justice-timelines`

Shared justice-step definitions and related constants used across the product.

## Support code

### `scripts`

Developer automation scripts.

This now includes the local launcher used by `pnpm run dev:web`.

If you want setup and runtime details next, read [`local-development.md`](./local-development.md).
