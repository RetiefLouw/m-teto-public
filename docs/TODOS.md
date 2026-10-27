# Production readiness TODOs

## Platform and infrastructure

- [ ] Replace the ad hoc local proxy story with a committed, environment-specific web/API routing strategy
- [ ] Define production deployment topology for learner app, API, admin portal, and service-provider portal
- [ ] Add environment-specific configuration management for local, staging, and production
- [ ] Define secrets management for auth, OpenAI, database credentials, and admin access
- [ ] Add backup and restore procedures for PostgreSQL

## Authentication and authorization

- [ ] Replace placeholder auth configuration with verified production OIDC settings
- [ ] Review role separation across learner, admin, and service-provider experiences
- [ ] Harden admin and provider access controls beyond PIN-style gating where applicable
- [ ] Add session expiry, revocation, and auditability requirements

## Database and data lifecycle

- [ ] Move from schema push-only workflows to versioned migrations with promotion discipline
- [ ] Review seed behavior so demo data does not run automatically in production
- [ ] Add retention and deletion policies for sensitive records, uploads, and message data
- [ ] Define PII handling rules and data classification across tables and logs

## API hardening

- [ ] Add structured error handling and request validation coverage across all routes
- [ ] Add rate limiting, abuse protection, and bot mitigation for public endpoints
- [ ] Add payload-size, file-upload, and timeout policies appropriate for production
- [ ] Add integration tests for critical user journeys and admin/provider flows

## Frontend quality

- [ ] Add smoke tests for the learner web app, admin portal, and service-provider portal
- [ ] Verify accessibility behavior with real assistive-technology testing, not just implementation intent
- [ ] Confirm offline/PWA behavior with production cache invalidation and upgrade flows
- [ ] Review copy and safety escalation flows with domain stakeholders

## Observability and operations

- [ ] Add centralized logging, metrics, and alerting for API and app health
- [ ] Define incident response and on-call expectations
- [ ] Add health checks and readiness checks for all deployable services
- [ ] Track background seeding, startup failures, and third-party dependency failures explicitly

## Delivery workflow

- [ ] Add CI for typechecking, tests, linting, and build verification
- [ ] Add CD gates for staging and production promotion
- [ ] Document release procedures, rollback steps, and environment ownership
- [ ] Add dependency update and vulnerability management practices

## Product and governance

- [ ] Validate legal, privacy, and safeguarding requirements for child-focused workflows
- [ ] Review AI outputs, escalation logic, and moderation policies for safety and compliance
- [ ] Confirm content provenance and editorial review for rights, justice, and emergency guidance
- [ ] Define ownership for support data, provider accountability data, and reporting analytics
