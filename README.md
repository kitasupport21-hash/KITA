# PerkBridge — India & Indonesia Rewards Demo

**Status: Interactive demo / test mode only.** This branch is isolated from `main`; it does not replace or change the main app.

PerkBridge is a mobile-first, single-file HTML prototype for a gift-card catalogue and rewards experience focused on India and Indonesia.

## What works in this demo

- Country switcher for India (INR) and Indonesia (IDR), with separate sample balances.
- Language selector with English, Hindi and Bahasa Indonesia labels for the primary screens.
- Searchable sample catalogue, category filters and card detail modal.
- Simulated order flow: records a demo order only; no payment is taken.
- Simulated redemption flow: uses fictional demo credits and records a pending request; no real code is issued.
- Sample reward tasks and a fictional referral code.
- Activity history, filters and CSV export.
- Profile/preferences, sample policy drafts, client-side admin preview and local demo reset.
- Browser `localStorage` remembers the demo state on that device.

## Run it

The app is self-contained in `index.html`. Open the file in a browser to preview it. It does not require npm, an API key, a payment provider or a database.

### Optional: publish as a free GitHub Pages preview

1. Open this repository on GitHub using the `perkbridge-demo` branch.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch **`perkbridge-demo`** and folder **`/ (root)`**, then save.
5. When GitHub Pages reports that the site is published, open: https://kitasupport21-hash.github.io/KITA/

Pages may take a little time to publish. If the Pages setting is unavailable, check repository/account Pages eligibility.

## Important limitations

- All balances, reward credits, catalogue entries, orders, activity and redemption requests are illustrative demo data.
- No real payments, gift-card codes, cash payouts, user authentication, real supplier integrations or server-side ledger exist.
- The demo admin panel is client-side only and is **not security**.
- The displayed 0% user redemption fee is a UX demo label, not a statement that supplier, payment processing, tax or operating costs are zero.
- This repository branch is under `kitasupport21-hash/KITA` because no separate repository-creation action was available in the connected GitHub tools. The `main` branch remains unchanged. A dedicated PerkBridge repository can be created/moved later.

## Before any real launch

- Create a dedicated production repository and set up reviewed deployments.
- Contract an authorised gift-card supplier/distributor for each brand and each country; verify denominations, inventory, terms, region locks, delivery and refunds.
- Establish committed funding from the operator, sponsors or verified revenue. Demo credits are not money and cannot fund real rewards.
- Implement server-side authentication, an append-only ledger, access controls, fraud/abuse limits, secrets management, monitoring, backups and automated tests.
- Integrate a compliant payment provider only after checking country eligibility, fees, chargebacks, refunds and reconciliation.
- Obtain professional advice on payment-instrument rules, tax, consumer protection, privacy and app-store requirements in India and Indonesia.
- Publish final terms, privacy notice, refund/redemption policy, customer-support contacts and real service availability before accepting users or payments.

## Tech

Plain HTML, CSS and JavaScript; no external runtime dependencies.
