# NOVA production security checklist

This repository intentionally does not ship deployment secrets or a fake job feed.

Before public launch:

- Configure `DATABASE_URL` and `FRONTEND_ORIGIN` as deployment secrets.
- Configure an authorized `NOVA_JOB_FEED_URL`; the ingestion script refuses to run without it.
- Migrate bearer tokens from browser localStorage to Secure, HttpOnly, SameSite cookies with a CSRF strategy.
- Add verified-email flow and password reset before treating accounts as production-ready.
- Add durable abuse controls backed by the database or edge layer; the current in-process limiter is only a baseline.
- Add administrator authentication and an audit trail before approving employer verification or changing verification status.
- Review privacy retention and provide account/data deletion endpoints before public launch.
- Enable HTTPS everywhere and reject insecure external application destinations where appropriate.
- Run the repository CI checks (`npm ci`, `npm run typecheck`, `npm run build`, `node --check server/index.mjs`) on every change.
- Never seed fabricated vacancies into production.
