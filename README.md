# NOVA — Intelligent Career Platform

NOVA is a separate career platform built from scratch. It does not reuse the old KerjaKu/KITA product experience.

## Current product capabilities

- Persistent account authentication and PostgreSQL-backed sessions
- Personalized career matching with explainable fit signals
- Opportunity search, filters and saved jobs
- Application tracking
- Career insights and roadmap generation
- Salary intelligence from available job-market rows
- CV text intelligence for TXT/Markdown input
- Interview practice and deterministic answer evaluation
- Job safety/fraud signal analysis
- Location-fit assessment without inventing commute times
- Employer verification submissions with explicit pending review status
- Production-oriented job ingestion boundary that refuses to seed fabricated vacancies
- Security checklist and automated CI for typecheck, production build and server syntax

## Development

```bash
npm install
npm run dev
```

API:

```bash
npm run dev:api
```

Production build:

```bash
npm run build
npm start
```

## Required real-world configuration before public launch

- `DATABASE_URL` for PostgreSQL
- `FRONTEND_ORIGIN` set to the actual frontend origin
- `NOVA_JOB_FEED_URL` pointing to an authorized real job feed
- Production HTTPS/domain configuration
- A verified email provider for email verification/password recovery
- A reviewed operator/admin workflow before employer verification can be approved

NOVA deliberately does not ship fabricated job listings or automatically mark employers as verified.

## Validation

GitHub Actions runs:

```bash
npm install
npm run typecheck
npm run build
node --check server/index.mjs
```

Deployment is intentionally not performed as part of development work.