# Implementation status

## Phase 1 — Foundation

- [x] Reviewed the available website SRS.
- [x] React, TypeScript, Vite and Cloudflare Pages Functions structure established.
- [x] Temporary SolarWorks Uganda logo and design tokens created.
- [x] Preview and production D1 resources created and migrations applied.
- [x] GitHub repository created at https://github.com/francis-projects/solarworks-uganda-website; 57 source files committed to `main`, excluding `sources/`, `AGENTS.md`, local secrets, and build output.

## Phase 2 — Public website

- [x] Home, services, backup, solar, commercial/industrial, how it works, projects, about, FAQ, estimator, assessment, contact, privacy, terms and 404 pages.
- [x] Responsive layouts, keyboard focus, form labels, inline errors, reduced-motion handling, concept illustration and transcript/caption files.
- [x] PPA stays unavailable; project list is empty until verified records are approved.

## Phase 3 — Enquiries and data

- [x] D1 tables for enquiries, consent, events, assessment requests, estimates, payments/receipts, fee credits and rate limits.
- [x] Pages Functions for form validation, duplicate protection, fee lookup, estimate saving, event logging and health checks.
- [x] Turnstile server verification and optional email notifications implemented.
- [ ] Configure production/preview Turnstile keys, rate-limit secrets and email provider.
- [ ] Authenticated internal tool is outside this project mirror; its SRS was not available.

## Phase 4 — Estimator

- [x] Backup and hybrid calculation paths, UGX price range logic and estimate records.
- [x] Price, battery and solar assumptions remain unset and are editable in `shared/business.ts`.
- [ ] Populate engineering assumptions and approved cost inputs before public price ranges are enabled.

## Phase 5 — Physical assessment

- [x] Fee lookup, fee disclosure, payment preference capture, appointment/payment states and fee-credit/receipt schema.
- [ ] Add owner-confirmed base location, distance mappings, fee bands, exceptional charges and cancellation terms.
- [ ] Connect a payment gateway if online collection is desired. No payments are currently taken.

## Phase 6 — Verification and release

- [x] Production build and Worker type checks pass; all 9 automated tests pass. SQLite migration validated. GitHub Actions build and test step passed. Axe checks found no serious or critical WCAG 2.1 A/AA issues on the home, assessment and contact pages; jsdom does not evaluate color contrast.
- [x] Cloudflare Pages preview deployed at https://preview.solarworks-uganda-website.pages.dev and verified: home, /backup, /solar and health endpoints return 200, unmapped assessment fee returns unavailable, `/ppa` returns 404, `robots.txt` disallows crawling, and all three submission APIs fail closed with 503 while configuration is missing.
- [x] Desktop and mobile visual review of the Backup and Solar pages; direct preview routes verified.
- [ ] Verify remaining page layouts and interactions in real browsers/devices and deploy a public release only after business/legal configuration is complete.
- [ ] Add custom domain, production Turnstile, analytics, email notifications and legal approvals.
- [ ] Run browser/device and performance checks in a real browser.

## Missing project references

Only `sources/1_Website_SRS.pdf` is available in this project mirror. The internal-tool SRS, animation instructions/voice-over script and anti-AI design checklist were not present. No files under `sources/` were modified.
