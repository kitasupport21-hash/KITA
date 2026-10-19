# NOVA Indonesia job sourcing

## Current no-key discovery mode

NOVA now includes a server-side public-source reader at `GET /api/public/jobs/pasker`. It reads the public, robots-allowed Pasker ID miniJobi listing page, keeps only entries with a direct official detail URL and a future application deadline, and links applications back to Pasker ID. It does not bypass sign-in, scrape private endpoints, or import expired listings. The current public miniJobi page returned no unexpired listings at the last verification on 19 October 2026; NOVA displays that honestly and links to the official portal rather than inventing openings. The endpoint refreshes on request and advertises a five-minute cache window.

NOVA includes a local reference list of all 38 provinces and 514 kabupaten/kota (regencies/cities). Users can filter imported NOVA records by province and kabupaten/kota, or open location-specific search results from Pasker ID/Karirhub, HiredToday, Toploker, Redy, Glints, Jobstreet, LinkedIn, and Indeed. Search URLs are generated from the selected location and role keywords at click time so users reach the providers' current search pages.

These external search results are not represented as jobs stored in NOVA. The UI explicitly identifies them as external, and users are told to verify posting dates, employers, and apply URLs. NOVA must not invent employer names, salaries, dates, vacancies, or individual application URLs.

## Official job import

The backend's authenticated import endpoint is `POST /api/admin/jobs/sync`. Configure `NOVA_SYNC_SECRET` and `NOVA_JOB_FEED_URL` only when an authorized JSON feed is available. The feed must be HTTPS and return either a JSON array or `{ "jobs": [...] }`. Records must include stable `externalId`, title, company, province and kabupaten/kota, a direct HTTPS detail/apply URL, and a trustworthy posting date no older than 60 days. Expired or future-dated records, invalid salary ranges, generic homepage URLs, and missing locations are rejected. Optional expiry/closing dates are honored; active records older than 60 days or past their expiry are marked inactive. Feed adapters should validate required fields, cap result counts, deduplicate by source and external ID, and expire stale jobs.

The Pasker ID public homepage currently displays a handful of recent jobs but points those cards to the generic Karirhub homepage rather than each vacancy's individual detail page. The separate public miniJobi listing page does expose individual detail URLs; its current visible examples have passed their deadlines, so the NOVA adapter excludes them. Those cards are therefore unsuitable for automatic import as application-ready NOVA records. Karirhub's employer/API integration requires an authorized integration; NOVA must not bypass access controls or scrape portals that disallow it.

## Future-role search families

The regional fallback includes role families for AI/data, software/cybersecurity/cloud, renewable energy/electric vehicles, healthcare, logistics/supply chain, digital business, manufacturing/technical trades, and agriculture/food. These are search shortcuts, not claims that a specific opening exists in every district.

## Regional reference data

`src/data/indonesia-provinces.json` and three chunked `src/data/indonesia-regencies-*.json` files include 38 provinces and 514 kabupaten/kota, with province parent IDs. Upstream source: `https://github.com/izzulabadi/api-wilayah-indonesia-2026`. Check upstream updates and verify regional names before changing the dataset.


## City-specific freshness and government announcements

- The region picker covers all 38 provinces and 514 kabupaten/kota. Choosing a city/regency builds source searches with that city and its parent province instead of searching Indonesia generically. Jobstreet, LinkedIn, Indeed, and Glints shortcuts request newest/listed-date sorting where supported; generic search-engine shortcuts limit results to the last month. External search results are not imported into NOVA's database and still need source/date/employer verification.
- `GET /api/public/government-jobs` reads BKN RI's public announcement archive, keeps recent dated entries, validates that article links stay on the official `bkn.go.id` HTTPS domain, and labels recruitment notices separately from results/administrative announcements. The app also links directly to the official SSCASN portal and Pasker ID. The BKN archive is not a complete API of all 514 local governments or every ministry, so NOVA does not claim comprehensive nationwide agency coverage until authorized feeds/official sources for those agencies are added.
- Government notice data shows source, publication date, title, summary and official article link. It does not infer an open deadline or guarantee that an announcement is still accepting applications. The user must confirm the official document and current deadline before applying.

- The official government-announcement endpoint also checks the Ministry of Health's public announcement archive (`kemkes.go.id`) in addition to BKN, accepts only official HTTPS article links, filters dated recruitment/selection notices, and merges/deduplicates them by date. Source availability is tracked separately so one unavailable agency does not hide the other. This is still a monitored subset of government sources, not a complete feed for every Indonesian ministry/local government.


## Authorized source integration blocker

Kemnaker's JOSS documentation describes an official create/update vacancy API and a lookup-by-ID endpoint; both show request-signing headers (`Client-Id`, `Request-Id`, `Request-Timestamp`, and `Signature`): https://joss.docs.kemnaker.go.id/put-job-vacancy-13014910e0 and https://joss.docs.kemnaker.go.id/find-job-vacancy-13014939e0. I did not find a documented anonymous list/search endpoint in the public API docs. This is an authenticated integration interface, not a ready-to-use public vacancy feed. NOVA must only connect to it after the owner obtains approved API access and the required credentials/signing specification from Kemnaker. Do not put those credentials in frontend code or commit them to the repository. Until access is supplied, the app uses public, attributable discovery links and does not fabricate database records. The sync endpoint now commits each accepted feed refresh as one database transaction, so a failed write rolls the whole refresh back instead of leaving a partial catalogue.
