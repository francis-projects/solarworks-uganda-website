# SolarWorks Uganda website

React and TypeScript public website with Cloudflare Pages Functions and D1. The public site does not provide staff login or read access to lead records. A future authenticated internal application can use the D1 schema described below.

## Pages

| Path | Purpose |
| --- | --- |
| `/` | Home and service overview |
| `/services` | Assessment, advice, installation and maintenance |
| `/backup` | Battery backup without solar panels |
| `/solar` | Hybrid solar and battery systems |
| `/commercial` | Commercial and industrial site planning |
| `/how-it-works` | Assessment and installation process |
| `/projects` | Permission-gated case studies; empty until approved examples are added |
| `/about` | Company information without unverified credentials |
| `/faq` | Common customer questions |
| `/estimator` | Preliminary energy sizing and optional anonymous record saving |
| `/assessment` | Fee-disclosed physical assessment request |
| `/contact` | Enquiry form and direct contact options |
| `/privacy`, `/terms` | Draft legal pages for review |

PPA is not offered or linked from navigation. `/ppa` is not a public service page.

## Local development

Requirements: Node.js 22 and npm. Wrangler 4.162.0 is pinned in `package.json`.

```powershell
npm ci
Copy-Item .env.example .env.local
Copy-Item .dev.vars.example .dev.vars
npm run check
npm run build
npx wrangler d1 migrations apply solarworks-uganda-leads-preview --local --env preview
npm run cf:dev
```

The example Turnstile keys are Cloudflare test credentials for local use only. Replace `RATE_LIMIT_SECRET` in `.dev.vars` with a random local value. Do not deploy the test Turnstile keys. Plain `npm run dev` serves the static React app; use `npm run cf:dev` to exercise Pages Functions and the local D1 binding.

`npm run check` runs the production build, Worker type check and Vitest suite. `npm run cf:types` regenerates Cloudflare binding types after a Wrangler configuration change.

## Cloudflare environments

`wrangler.jsonc` binds the Pages Functions to separate D1 databases:

| Environment | Database | Database ID | Region |
| --- | --- | --- | --- |
| Production | `solarworks-uganda-leads` | `58706fca-f651-4604-8ebb-7e1ff0fb1b44` | WEUR |
| Preview | `solarworks-uganda-leads-preview` | `b6463bbc-e757-44d8-bbd6-20838d849e08` | WEUR |

The `0001_initial.sql` migration is applied to both databases. The Cloudflare account selected WEUR when the databases were created; confirm data-location suitability with the business owner and legal adviser before real customer data is accepted.

Pages project name: `solarworks-uganda-website`. Deploy a preview build with:

```powershell
npm run build
npm run cf:deploy:preview
```

Current preview: [https://preview.solarworks-uganda-website.pages.dev](https://preview.solarworks-uganda-website.pages.dev). It is marked `noindex`; `robots.txt` disallows crawling. Deployed smoke checks returned HTTP 200 for `/` and `/api/health`, reported unmapped Mukono assessment fees as unavailable, returned HTTP 404 for `/ppa`, and returned HTTP 503 for all three submission APIs because the rate-limit secret is not configured. Keep it as a review preview: forms cannot accept real submissions.

Deploy production only after the launch configuration is complete:

```powershell
npm run build
npm run cf:deploy:production
```

The GitHub repository is [francis-projects/solarworks-uganda-website](https://github.com/francis-projects/solarworks-uganda-website). Its Actions workflow runs `npm run check` on pushes and pull requests. Production deployment remains a separate manual step after business and legal configuration is complete.

## Environment configuration

Public build variables:

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_URL` | Canonical URL and sitemap base. Leave unset until the stable public host is known. |
| `VITE_TURNSTILE_SITE_KEY` | Public Turnstile site key. Configure a production widget for the Pages hostname and later the custom domain. |
| `VITE_ANALYTICS_TOKEN` | Optional Cloudflare Web Analytics token. |

Pages Function secrets/variables, configured separately for Preview and Production in Cloudflare:

| Name | Purpose |
| --- | --- |
| `TURNSTILE_SECRET_KEY` | Server-side Turnstile Siteverify secret. Required for contact, assessment and estimate-record submissions. |
| `RATE_LIMIT_SECRET` | HMAC key used to store short-lived hashed IP rate-limit keys. Required for public API requests. |
| `RESEND_API_KEY` | Optional transactional email credential. |
| `EMAIL_FROM` | Verified sender address for the transactional email provider. |
| `ALERT_EMAIL_TO` | Company inbox for new enquiries and assessment requests. |

Without Turnstile and rate-limit secrets, public forms remain disabled or return a service-unavailable response. Without transactional email configuration, submissions are not emailed; the on-page acknowledgement still works. Use a verified sender domain for outgoing mail. Never commit secret values.

## Owner configuration before public launch

1. **Business identity:** confirm the registered name, logo, physical address, opening hours, registration number and TIN. The provided phone and email are already in `src/config/site.ts`.
2. **Assessment fees:** in `shared/business.ts`, set `assessment.baseLocationLabel`, `locationDistanceKm`, `distanceBands` and `exceptionalTravelChargeUgx`. Use the owner-approved distance method and exact UGX fees. Until then, the physical assessment submit button is disabled and customers are directed to call or WhatsApp.
3. **Estimator assumptions and prices:** set the battery usable fraction, inverter efficiency, peak sun hour assumption and each equipment/labour input only after engineering and procurement review. Price ranges remain hidden until every required value is present. No equipment prices are included by default.
4. **Payment:** `onlineCollectionEnabled` is false and no gateway is integrated. An assessment payment preference is recorded as unpaid; the site never claims to collect money. Payment recording, receipts and assessment-fee credits are represented in D1 for the authenticated internal tool.
5. **Notifications:** configure email provider credentials and a verified sender. The website sends an owner alert and, when an email address is provided, an acknowledgement only after the provider is configured.
6. **Legal review:** the privacy notice and terms are drafts. Confirm the data retention period, deletion process, assessment cancellation/rescheduling terms, payment terms and Uganda data protection requirements with a Ugandan legal adviser.
7. **Proof and media:** add only approved project records to `src/content/projects.json` with `permissionToPublish: true`. The current case-study list is empty. Replace illustrations with licensed or company-approved imagery as available. Approved voice-over recordings and the supplied animation brief are not present in the project mirror.
8. **Public host:** set `VITE_SITE_URL` to the final canonical hostname, rebuild to generate `sitemap.xml`, configure the domain in Cloudflare Pages, then update the Turnstile widget domain list.

### Assessment fee configuration shape

Use only owner-confirmed distances and prices. The example below shows field names, not usable values:

```ts
assessment: {
  baseLocationLabel: "<confirmed company base>",
  locationDistanceKm: {
    "<district or town>": <approved road distance in km>
  },
  distanceBands: [
    { minKm: <minimum>, maxKm: <maximum>, feeUgx: <approved fee> },
    { minKm: <next band>, maxKm: null, feeUgx: <approved fee> }
  ],
  exceptionalTravelChargeUgx: <approved exceptional charge>
}
```

The client and Worker import the same configuration and calculate the fee independently. The Worker verifies the fee again before storing an assessment request. Unmapped locations cannot submit an online assessment request.

### Estimator behavior

The calculator derives delivered energy from entered running load and backup hours. Battery capacity, hybrid array size and UGX price ranges remain unavailable until their corresponding assumptions and price inputs are configured. A saved estimate contains no name, phone, email or location; the visitor receives an estimate reference.

## API and data boundaries

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/health` | GET | Health check only |
| `/api/assessment-fee?location=...` | GET | Return the configured fee for a mapped location, or `available: false` |
| `/api/enquiries` | POST | Validate Turnstile and create/update an enquiry |
| `/api/assessments` | POST | Recalculate the exact fee, then save a pending appointment request |
| `/api/estimates` | POST | Validate and save a preliminary estimate without contact details |
| `/api/events` | POST | Store a small allowlisted set of cookie-free event counts |

No public API endpoint reads or returns customer records. Public requests are size-limited, same-origin checked, rate-limited and validated in the Worker. Enquiry duplicates with the same phone and interest within 24 hours update the existing lead. Rate-limit keys are HMAC-hashed and expired during later requests; aggregate event rows are pruned after 90 days.

The D1 schema includes enquiries, assessment requests, consent records, preliminary estimates, payment records, receipt numbers, appointment statuses, fee-credit records, private event history and rate limits. It does not expose staff functions. The internal-tool SRS and authenticated application were not included in the project mirror, so staff-side payment recording, receipt issuance, appointment management and credit application are not exposed by this public site.

## Content editing

- Navigation and service content: `src/content/site-content.json`
- FAQs: `src/content/faqs.json`
- Permission-gated case studies: `src/content/projects.json`
- Contact details, PPA feature flag and company placeholders: `src/config/site.ts`
- Brand colours and layout styles: CSS custom properties at the top of `src/styles.css`
- Assessment and pricing configuration: `shared/business.ts`
- Database changes: add numbered files under `migrations/`, then apply to preview before production.

The synced `sources/` directory is excluded from Git and must remain read-only.

## Security notes

- HSTS, CSP, frame protection, no-sniff, referrer, permissions and cache-control headers are configured in `public/_headers` and API responses.
- No public endpoint returns leads. Database writes use prepared statements.
- Turnstile is validated server-side at Cloudflare Siteverify.
- `site_events` contains only allowlisted event names, page paths and timestamps. It does not store an analytics cookie or client identifier.
- Legal, privacy, data residency and operational access settings require owner review before production leads are accepted.
