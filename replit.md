# M-Teto Workspace

## Overview
M-TETO is an AI-powered search engine PWA for children in South Africa, designed to combat School-Related Gender-Based Violence (SRGBV). It offers age-appropriate content filtering, anonymous grade-based verification, and a Y2K/intergalactic aesthetic. The platform includes an AI search, an AI companion, an onboarding assessment wizard, a comprehensive service directory with an Uber-style accountability system, a case tracker, and an interactive "Accessing Justice Roadmap" tool. The project aims to provide a safe, engaging, and informative digital space for children, empowering them with knowledge about their rights and access to support services, while also providing valuable anonymous data for stakeholders to identify SRGBV hotspots and inform interventions.

## User Preferences
I want iterative development.
I prefer detailed explanations.
Ask before making major changes.
Do not make changes to the folder `artifacts/admin-portal/`.
Do not make changes to the file `artifacts/admin-portal/src/App.tsx`.

## System Architecture

### Monorepo Structure
The project uses a pnpm monorepo with the following main applications:
- `api-server`: Express 5 API backend.
- `m-teto`: React + Vite frontend PWA for child users.
- `admin-portal`: Separate React + Vite admin application, accessible only to authorized administrators.
- `service-provider`: Separate React + Vite portal for authorised public officials, NGOs and NPOs to track/update SA Justice Value Chain case progress, report non-compliance, and blow the whistle on corruption. Access PINs: `a PIN configured in the local environment` (SP) or `a PIN configured in the local environment` (Admin).

Shared libraries include API specifications, generated clients (React Query hooks, Zod schemas), Drizzle ORM schema, and Replit Auth hooks.

### Core Features & Technical Implementations

1.  **AI Search Engine**: Google-like interface with M-TETO branding, large search bar, tab navigation (All/University/Helpers/The Square/Tracker), popular search chips. Anonymous grade-based age verification. Utilizes OpenAI gpt-4o-mini for AI Answer cards in search results, with child-safe system prompts.
2.  **TETO AI Companion**: A floating, evolving baby bird character (appearance changes with grade level) providing AI-powered chat responses (gpt-4o-mini). It offers information on SA children's law, SRGBV, J88 forms, protection orders, and emergency numbers, always escalating to Childline/SAPS if a child is in danger. Responses are grade-appropriate.
3.  **Onboarding Assessment Wizard**: Multi-step anonymous assessment collecting demographics, knowledge quiz results on rights/SRGBV/consent, and safety/experience data. High-risk answers trigger emergency helpline banners. Data stored anonymously in `user_assessments` table for hotspot mapping.
4.  **Emergency Page**: Prominent red callouts for 1-tap calls to SAPS (10111) and Childline (116). Comprehensive directory of emergency numbers filtered by province, including Thuthuzela Care Centres (TCCs).
5.  **Service Directory (Helpers)**: Comprehensive database of service providers in Gauteng (Police Stations, TCCs, Hospitals, NGOs, etc.), including an "Uber-Style Accountability System" for officials. This system includes:
    *   `OfficialCard` component displaying official details, on-duty status, ratings, and misconduct flags.
    *   `On Duty Now` panel showing live official availability.
    *   `Escalation Chain` for hierarchical issue resolution.
    *   `Clock in/out API` for real-time duty status updates.
    *   `Uber-style ReviewFlow` for rating officials, selecting tags (positive/negative), and reporting misconduct.
    *   `Official Reviews API` for storing and tracking `officialReviews`, updating average scores, review counts, and flag counts.
6.  **Case Tracker**: Vertical timeline stepper for incident to sentencing, with checklists, auto-save, and overdue alerts. Includes a "Justice Roadmap" tab.
7.  **Accessing Justice Roadmap Tool**: Interactive multi-step tool guiding children through the SA justice system for various violation contexts and types. Provides age-appropriate step descriptions, timeline deadlines, document requirements, and contacts, based on SA law (Children's Act, Sexual Offences Act, etc.). Progress saved to localStorage and `justiceJourneys` table.
8.  **Gamification**: Points earned for engagement (reading, reviews, quizzes, checklists) with a points badge in the header. Points also redeemable for premium University content.
9.  **Age Verification Modal**: Anonymous grade-level picker (Gr 1–2 / Gr 3–5 / Gr 6–7 / Gr 8–12) stored in localStorage, used to filter AI content.
10. **M-TETO University** (`/university`): AI-driven open educational hub. AI search queries Open Library, Project Gutenberg, and Internet Archive in real-time. Three tabs: Discover (AI search + featured curated content), My Library (saved/bookmarked items per session), Premium (points-gated catalog). Content types: Videos (YouTube with CC), Books (Open Library/Gutenberg PDFs), Audiobooks (Internet Archive), Documents, Articles, Tutorials. Topics: Human Rights, SA Law, Children's Rights, SRGBV, International Law, Gender Rights, Online Safety, Disability Rights. Grade-appropriate filtering. Save/download/archive to personal library. Premium section: 5 seeded items unlockable with points or direct purchase.
11. **Global Accessibility System**: A ♿ (wheelchair) button in every page header opens the Accessibility Settings panel. Four one-tap disability profiles: Blind/Low Vision (TTS via Web Speech API, high contrast, large text, keyboard nav), Deaf/Hard of Hearing (always-on captions, visual alerts, CC badge on videos), Cognitive/Learning (simplified view, OpenDyslexic font, reduced motion), Motor/Physical (large targets, keyboard navigation). Individual toggles for each setting independently. TTS rate control slider with test button. High contrast CSS mode, 1.2× large text, OpenDyslexic @font-face, reduced motion for all animations, keyboard focus rings. Preferences saved in localStorage (`mteto_accessibility`), applied globally via `AccessibilityContext`. Profile active = violet header button indicator. Screen reader ARIA labels on all University content.

### UI/UX Decisions

#### M-Teto App (Child-facing PWA)
-   **Palette**: Hot Pink (`#E8215D`), Coral (`#F4826C`), Gold (`#F7B56A`).
-   **Fonts**: Fredoka (display/headings), Nunito (body).
-   **Aesthetic**: Y2K / intergalactic / retro high-school theme with animated stars, sparkle decorations, pill buttons, and cosmic gradients.

#### Admin Portal
-   **Design**: Professional, government-grade UI, distinct from the child-facing app.
-   **Palette**: Deep navy sidebar (`#0F172A`), light slate background (`#F8FAFC`), clean white cards. Active sidebar state uses M-TETO hot pink (`#E8215D`).
-   **Font**: Inter.
-   **Charts**: Recharts for data visualization, using a palette of pink/blue/purple/green.

12. **PWA / Offline Mode**: Full Progressive Web App setup — `manifest.json` with M-TETO branding, service worker (`sw.js`) with cache-first strategy for static assets and network-first with cache fallback for API routes. Works offline. Service worker registered via `index.html` script tag.
13. **Case Tracker Demo Mode**: Unauthenticated users can tap "Explore Demo Mode" to see 3 pre-loaded sample cases (School Assault, Sexual Harassment, Teacher SRGBV) with full stage timelines, checklists, CAS numbers, contacts, and corruption flags — all without login.
14. **Anti-Corruption Homepage Strip**: SearchHome.tsx displays a 4-button anti-corruption grid on the home page: Case Tracking, Rate Officials, Flag Corruption, Legal Docs — each linking to the relevant section.
15. **Session Event SQL Fix**: Fixed duplicate `total_events` column bug in `events.ts` — when an unknown event type maps to `total_events`, it no longer appears twice in the INSERT column list.
16. **SA Justice Value Chain Timeline Tracking System**: Full case tracking with Uber-style UI, showing "who has your file now", 15-step SA justice pipeline with legal deadlines, red/amber/green flag system, photo/document uploads (base64 in `case_documents.file_data`), two-way complainant ↔ official messaging (`case_messages`), and red-flag escalation up to CGE/SAHRC/Public Protector (`case_escalations`). Includes 100 seeded demo cases (user_id="demo") browseable without auth at `/demo-cases`, each with realistic CAS numbers, IO names, timeline events, delays, and escalations. API routes in `artifacts/api-server/src/routes/caseTracking.ts`. DB tables: `case_timeline_events`, `case_escalations`, `case_documents`, `case_messages`. SA Justice Steps constants in `lib/justice-timelines/src/index.ts` (15 steps, 8 escalation bodies). Admin portal Justice Timelines page enhanced with per-case drilldown, step status management, official message reply, and escalation status updates.
17. **Key imports**: `sql` must be imported from `drizzle-orm`, not `@workspace/db`. `@workspace/db` exports `db`, `casesTable` and all schema tables via `export * from "./schema"`.
18. **TETO-Led Onboarding Experience**: Full 10-screen onboarding in `artifacts/m-teto/src/components/TetoOnboarding.tsx`. Gate lives in `App.tsx` — if `localStorage.mteto_onboarding_done !== "true"`, the entire app is replaced by `TetoOnboarding`. Screens: (1) TETO splash auto-advance, (2) name entry, (3) grade selection, (4–8) 5 tutorial slides with phone mockups for Search/Helpers/Tracker/Learn/Square, (9) 3-question quiz with instant feedback, (10) celebration + 50 coins awarded. On complete, sets `mteto_grade`, `mteto_name`, `mteto_earned_coins=50`, `mteto_onboarding_done=true`. `SearchHome.tsx` removed duplicate `AgeVerificationModal`/`OnboardingWizard` triggers — now reads grade from localStorage only. Coins badge in header shows for both guest (from `mteto_earned_coins`) and authenticated users.

### Authentication
Replit Auth (OIDC + PKCE) is used. Guest mode allows browsing Directory and Learn. Authenticated users gain full Case Tracker access and can write reviews. The Admin Portal uses a PIN-protected session (`a PIN configured in the local environment`).

### Two Gateways
- **Learner Gateway**: M-TETO PWA at `/` (the m-teto artifact) — for children
- **Admin Gateway**: Admin Portal at `/admin-portal/` (PIN: `a PIN configured in the local environment`) — for Adv. Thando Gumede ZA only
- Both gateways are visible side by side on the canvas board with clear labels

### API Routes
All API routes are prefixed with `/api/`. They cover CRUD operations for providers, officials, cases, articles, and justice journeys, as well as AI search, TETO chat, anonymous search logging, and comprehensive admin analytics endpoints (requiring `X-Admin-Pin` header for admin routes).

## External Dependencies

*   **Monorepo Tool**: pnpm workspaces
*   **Node.js**: 24
*   **TypeScript**: 5.9
*   **API Framework**: Express 5
*   **Database**: PostgreSQL
*   **ORM**: Drizzle ORM
*   **Validation**: Zod (`zod/v4`), `drizzle-zod`
*   **API Codegen**: Orval (from OpenAPI spec)
*   **Build Tool**: esbuild (CJS bundle)
*   **Authentication**: Replit Auth (OIDC + PKCE)
*   **Frontend Framework**: React
*   **Frontend Build Tool**: Vite
*   **CSS Framework**: Tailwind CSS
*   **UI Components**: shadcn/ui
*   **AI Integration**: OpenAI gpt-4o-mini (via Replit AI Integrations proxy)
*   **Charting Library (Admin Portal)**: Recharts