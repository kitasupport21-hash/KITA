# NOVA — Intelligent Career Platform

NOVA is a new career-product foundation built from scratch as a separate experience from the previous KITA/KerjaKu interface.

## Product direction

- AI-style career matching and opportunity scoring
- Skill, goal and preference signals
- Smart search and fast filters
- Saved opportunities and application workspace
- Profile-readiness insights
- Future-ready architecture for recommendations, verification, alerts and a separate operator/control product

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm start
```

The current repository intentionally starts with the new NOVA frontend foundation. Real authentication, persistent profiles, verified job feeds, applications, notifications and the separate control system should be connected as the next product modules rather than carried over from the legacy implementation.
