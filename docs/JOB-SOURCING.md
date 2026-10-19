# NOVA Indonesia job sourcing

## Current no-key discovery mode

NOVA includes a local reference list of all 38 provinces and 514 kabupaten/kota (regencies/cities). Users can filter imported NOVA records by province and kabupaten/kota, or open location-specific search results from Pasker ID/Karirhub, HiredToday, Toploker, Redy, Glints, Jobstreet, LinkedIn, and Indeed. Search URLs are generated from the selected location and role keywords at click time so users reach the providers' current search pages.

These external search results are not represented as jobs stored in NOVA. The UI explicitly identifies them as external, and users are told to verify posting dates, employers, and apply URLs. NOVA must not invent employer names, salaries, dates, vacancies, or individual application URLs.

## Official job import

The backend's authenticated import endpoint is `POST /api/admin/jobs/sync`. Configure `NOVA_SYNC_SECRET` and `NOVA_JOB_FEED_URL` only when an authorized JSON feed is available. The feed must be HTTPS and return either a JSON array or `{ "jobs": [...] }`. Records should include stable `externalId`, title, company, a province and kabupaten/kota, a real individual source/apply URL, and a trustworthy posting date. Feed adapters should validate required fields, cap result counts, deduplicate by source and external ID, and expire stale jobs.

The Pasker ID public homepage currently displays a handful of recent jobs but points those cards to the generic Karirhub homepage rather than each vacancy's individual detail page. Those cards are therefore unsuitable for automatic import as application-ready NOVA records. Karirhub's employer/API integration requires an authorized integration; NOVA must not bypass access controls or scrape portals that disallow it.

## Future-role search families

The regional fallback includes role families for AI/data, software/cybersecurity/cloud, renewable energy/electric vehicles, healthcare, logistics/supply chain, digital business, manufacturing/technical trades, and agriculture/food. These are search shortcuts, not claims that a specific opening exists in every district.

## Regional reference data

`src/data/indonesia-regions.json` includes 38 provinces and 514 kabupaten/kota, with province parent IDs. Upstream source: `https://github.com/izzulabadi/api-wilayah-indonesia-2026`. Check upstream updates and verify regional names before changing the dataset.
