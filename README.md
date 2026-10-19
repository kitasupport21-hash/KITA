# NOVA — Intelligent Career Platform

NOVA is a separate career platform built from scratch. It does not reuse the old KerjaKu/KITA product experience.

## Current product capabilities

- PostgreSQL-backed accounts and sessions
- Personalized career matching with explainable fit signals
- Job discovery, filters, saved roles, and application tracking
- Career insights, roadmap generation, and salary intelligence from available job-market rows
- CV text intelligence for TXT/Markdown input (PDF/DOCX extraction is not implemented)
- Interview practice and deterministic answer evaluation
- Job safety/fraud signal analysis and location-fit assessment without inventing commute times
- Employer verification submissions that remain pending until a reviewed operator/admin workflow exists
- Indonesia location filters covering 38 provinces and 514 kabupaten/kota
- Official-source job discovery for Pasker ID and government announcements from BKN RI and Kementerian Kesehatan
- Validated partner-feed import endpoint with transactional updates and stale-job expiry
- Scheduled sync runner code (`npm run sync:jobs`) for a trusted cron service

## Development

```bash
npm ci
npm run dev
```

API:

```bash
npm run dev:api
```

Production build and full verification:

```bash
npm run build
npm run check
npm audit --omit=dev --audit-level=high
npm start
```

## Validation status

The NOVA preflight branch's last confirmed verification run passed:

- TypeScript typecheck and production build
- 20 automated tests, including server smoke/security checks, official-source parser tests, regional dataset validation, and scheduled-sync runner tests
- Server syntax check
- Production dependency audit: 0 vulnerabilities at the last check

GitHub Actions run: https://github.com/kitasupport21-hash/KITA/actions/runs/39224315834

## Required configuration and work before public launch

- `DATABASE_URL` for the target PostgreSQL database, with migrations/schema creation verified on that exact instance
- `FRONTEND_ORIGIN` set to the actual public frontend origin
- A verified email provider and complete email-verification/password-recovery flow (not yet implemented end-to-end)
- An authorized real job-feed URL and credentials before automatic job imports can run
- `NOVA_SYNC_SECRET` set privately on the API and the scheduled runner
- A separate scheduled runner configured and tested; its code exists but the service has not been created
- Production HTTPS/domain, CORS, cookies, backups, monitoring, and rollback procedure verified
- A reviewed operator/admin workflow before employer verification can be approved
- Database-backed end-to-end tests against a disposable PostgreSQL instance
- Manual QA of signup/login, job discovery, saved jobs, applications, notifications, and employer submission on the actual target deployment

NOVA deliberately does not ship fabricated job listings or automatically mark employers as verified. Public-source discovery and imported database listings are presented separately. Government announcements are a monitored subset, not a complete feed for every Indonesian ministry and local government.

## Release policy

The preflight changes are kept on the draft pull request until launch blockers are resolved. The current Render services point at other branches, so the preflight changes have not been deployed to them. Do not merge or deploy without the owner's explicit approval and a verified rollback plan.
