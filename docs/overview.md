# Overview

## What this repository is

This repo is the codebase for **M-TETO**, a multi-app platform centered on child safety, guided information access, justice-system navigation, and service accountability.

The main experience is the learner-facing web app, supported by an API and separate operational portals for administrators and service providers.

## What it is trying to do

The product intent is to give children in South Africa a safer digital space where they can:

- search for age-appropriate information
- learn about their rights
- find support services and emergency contacts
- understand the justice process step by step
- track cases and escalation paths when appropriate

The surrounding portals exist to support operations, analytics, service-provider coordination, and accountability workflows.

## Monorepo shape

The repository is organized as a pnpm workspace with:

- **apps** in `artifacts/`
- **shared packages** in `lib/`
- **developer scripts** in `scripts/`

If you only need to understand the repo at a practical level, the next document to read is [`workspaces.md`](./workspaces.md).
