# AnimeNL Website

## Local development environment

The dev container starts a complete local stack with Docker Compose (`.devcontainer/docker-compose.yml`), so nothing you do touches production:

| Service     | Purpose                                                           | URL                                                      |
| ----------- | ----------------------------------------------------------------- | -------------------------------------------------------- |
| `app`       | Nuxt dev container (this workspace)                               | http://localhost:3000                                    |
| `medusa`    | Medusa v2 backend built from `./medusa`, with the admin dashboard | http://localhost:9000 (admin: http://localhost:9000/app) |
| `postgres`  | Medusa database                                                   | internal                                                 |
| `seaweedfs` | S3-compatible storage for product images                          | S3 API http://localhost:9100                             |
| `mailpit`   | Catches the emails the site sends (support forms)                 | Inbox: http://localhost:8025                             |

On first start the `medusa` service installs its dependencies, runs migrations, and seeds sample data: two regions (Netherlands, Belgium), the Webshop / Physical / Bol.com sales channels, and about 30 products covering in stock, low stock, backorder, out of stock, sale prices and multi-variant items. Product images are generated and uploaded to SeaweedFS. Seeding is skipped when the database already has products.

- Admin login: `admin@animenl.local` / `supersecret`
- File storage is SeaweedFS (S3 API on `localhost:9100`, no login needed; any credentials work). Medusa's bucket is `medusa`, created by `medusa/start.sh`.
- The Nuxt environment (`MEDUSA_URL`, `MEDUSA_SERVER_URL`, `MEDUSA_PUBLISHABLE_KEY`, `MEDUSA_SALES_CHANNEL_ID`) is set by the compose file and overrides any local `.env`. Copy `.env.example` to `.env` to run Nuxt outside the container.
- Seeding also logs the ids of the Brievenbus and Pakket shipping profiles it creates. Copy `.env.example` to `.env` and set `MEDUSA_BRIEVENBUS_SHIPPING_PROFILE_ID`/`MEDUSA_PAKKET_SHIPPING_PROFILE_ID` to those values so checkout can group shipping options by profile locally; the compose file does not set them since they are regenerated on every reseed.
- The browser never talks to Medusa directly; only the Nuxt server does, through `server/api/*` routes. Inside a container, `*.localhost` hostnames resolve to loopback rather than to other containers, so the Nuxt server uses `MEDUSA_SERVER_URL=http://medusa:9000/` (the compose service name) to reach Medusa; `medusa.localhost` is still how your host browser reaches the Medusa **admin dashboard** directly.
- Google sign-in needs a Google OAuth client: copy `.devcontainer/.env.example` to `.devcontainer/.env` (gitignored, never commit real credentials) and fill in `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` from a Google Cloud Console Web application client whose Authorized redirect URIs include `http://localhost:3000/account/callback/google`. Without it, `medusa`'s `auth-google` provider fails to register and sign-in shows an error, but the rest of the site still works.
- The `app` service depends on `medusa`, so opening the dev container starts the whole stack. The first start takes a few minutes while Medusa installs dependencies, migrates and seeds; follow it with `docker compose -f .devcontainer/docker-compose.yml logs -f medusa`.
- To reset all data and reseed: `docker compose -f .devcontainer/docker-compose.yml down -v`, then rebuild the container.

## Commands

Uses [Nuxt](https://nuxt.com/docs/getting-started/introduction) and [Bun](https://bun.sh).

```bash
bun install      # install dependencies
bun run dev      # dev server on http://localhost:3000
bun run build    # production build
bun run preview  # preview the production build
bun run test     # unit, component and end-to-end tests
bun run lint     # eslint
bun run check    # format check, lint, type check and tests
```

## Production

Only the Nuxt app is deployed (Nixpacks: `bun run build`, `bun run start`). The `.devcontainer/` services (Medusa, Postgres, SeaweedFS, Mailpit) are for local development, so production needs its own Medusa backend.

`nuxt.config.ts` reads these variables at build time, so they must be available at build time (in Coolify: "Available at Buildtime") and changing one needs a redeploy:

| Variable                                           | Value                                                                                              |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `MEDUSA_URL`                                       | Medusa URL for the Nuxt server, used when `MEDUSA_SERVER_URL` is not set                           |
| `MEDUSA_SERVER_URL`                                | Medusa URL for the Nuxt server (defaults to `MEDUSA_URL`)                                          |
| `MEDUSA_PUBLISHABLE_KEY`                           | Publishable API key from the Medusa admin                                                          |
| `MEDUSA_SALES_CHANNEL_ID`                          | Sales channel id, if used                                                                          |
| `MEDUSA_BRIEVENBUS_SHIPPING_PROFILE_ID`            | Id of the Brievenbus shipping profile in the Medusa admin                                          |
| `MEDUSA_PAKKET_SHIPPING_PROFILE_ID`                | Id of the Pakket shipping profile in the Medusa admin                                              |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | SMTP server for the support forms, see below                                                       |
| `ORDER_LINK_SECRET`                                | Secret signing order page links for guests; set the same value on Medusa, see "Order confirmation" |
| `SITE_URL`                                         | Public URL of the site, used to build `/sitemap.xml` (defaults to `https://animenl.nl`)            |
| `GA_MEASUREMENT_ID`                                | Google Analytics measurement id (e.g. `G-XXXXXXXXXX`); leave unset to disable analytics            |

Nuxt needs Node 22.19 or newer. If the build complains about the Node version, set `NIXPACKS_NODE_VERSION=24`.

`public/robots.txt` points to `https://animenl.nl/sitemap.xml` directly, since it is a static file and cannot read `SITE_URL`. Update it by hand if the production domain ever changes.

Google Analytics only loads when `GA_MEASUREMENT_ID` is set and only in a production build (`NODE_ENV=production`), so it never runs in the dev container. Even then, it stays off until a visitor accepts the cookie consent banner (`app/components/cookieConsentBanner.vue`).

### Rotating a secret without a rebuild

`SMTP_PASS` and `MEDUSA_PUBLISHABLE_KEY` above are read at build time, so the values above get baked into `.output`. To change one of them without a redeploy, set the Nuxt-prefixed equivalent (`NUXT_SMTP_PASS`, `NUXT_MEDUSA_PUBLISHABLE_KEY`, ...) as a normal **runtime** environment variable (in Coolify: not "Available at Buildtime") — Nuxt reads `NUXT_*` variables again every time the server starts and lets them override the value baked in at build time. This only applies to `runtimeConfig` keys (everything in the table above except `SITE_URL`, which configures the `@nuxtjs/sitemap` module directly and is only ever read at build time).

### Support emails

The forms on `/support` are emailed to `info@animenl.nl`. Locally they end up in Mailpit (http://localhost:8025) and are never delivered.

Production sends them through [Brevo](https://www.brevo.com):

1. Add `animenl.nl` as a sending domain in Brevo, add the DNS records it shows, and add `info@animenl.nl` as a sender.
2. Create an SMTP key under SMTP & API.
3. Set `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, `SMTP_USER` to the SMTP login and `SMTP_PASS` to the SMTP key.
4. Submit a form on the live site and check that the email arrives and is not marked as spam.

Brevo handles the name, email address and message of every submission, so mention it in the privacy policy.

### Enabling Google sign-in

Customers sign in with Google only — the store never collects or stores a password. This is configured on **Medusa**, not on the Nuxt app, and production's Medusa instance is a separate deployment outside this repo (see "Production" above), so enabling it there is a manual step this repo cannot do or verify:

1. In Google Cloud Console, open **APIs & Services → OAuth consent screen** for the project tied to `GOOGLE_CLIENT_ID` and confirm **Audience** is set to **External**, with the app **Published** (not stuck in "Testing" — Testing mode only allows sign-in from accounts explicitly added as test users, and shows "access blocked: can only be used within the organization" for anyone else, including "Internal" audience apps outside that one Workspace org).
2. In Google Cloud Console, create (or reuse) an OAuth 2.0 **Web application** client. Add the production callback URL to its Authorized redirect URIs: `https://animenl.nl/account/callback/google` (alongside the local dev one, `http://localhost:3000/account/callback/google`, if the same client is reused). "Authorized JavaScript origins" is not needed — sign-in is a server-side redirect, not a client-side flow.
3. On production's Medusa instance, set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `GOOGLE_CALLBACK_URL=https://animenl.nl/account/callback/google`, and make sure its `medusa-config.ts` registers the `@medusajs/medusa/auth-google` provider (see `medusa/medusa-config.ts` in this repo for the shape local dev uses).
4. Sign in on the live site and confirm the customer appears in the Medusa admin.

### Enabling Mollie payments

Payments go through [Mollie](https://www.mollie.com) (iDEAL, credit card and everything else Mollie supports), using the [`@variablevic/mollie-payments-medusa`](https://github.com/variablevic/mollie-payments-medusa) community plugin's hosted-checkout provider. This is configured on **Medusa**, not on the Nuxt app, and production's Medusa instance is a separate deployment outside this repo (see "Production" above), so enabling it there is a manual step this repo cannot do or verify.

**Local dev works without a Mollie key** — `medusa/medusa-config.ts` only registers the Mollie provider when `MOLLIE_API_KEY` is set (it throws and crashes Medusa's entire startup otherwise, unlike `auth-google`, which just fails to register on its own), and `medusa/src/scripts/seed.ts` only adds `pp_mollie-hosted-checkout_mollie` to a region's `payment_providers` when a key is present. Without one, checkout only offers `pp_system_default` (a no-op).

To enable it:

1. Create a Mollie account and, for local dev, grab a test API key from the Mollie dashboard (Developers > API keys, starts with `test_`); production needs a live key (starts with `live_`) once the account is verified.
2. Set `MOLLIE_API_KEY` (in `.devcontainer/.env` locally, see `.devcontainer/.env.example`), `MOLLIE_REDIRECT_URL` (the page customers land on after paying, `https://animenl.nl/checkout/return` in production) and `MEDUSA_URL` (Medusa's own public base URL, used to build the webhook Mollie calls back — `https://<production-medusa-host>` in production).
3. Re-seed (`bun run --cwd medusa seed`, or reset the dev database per the "Local development environment" section above) so the region picks up `pp_mollie-hosted-checkout_mollie` — or add it to an existing region's `payment_providers` in the Medusa admin.
4. Pay for a test order in Mollie's sandbox mode and confirm the order and payment appear in the Medusa admin.

The plugin's `package.json` pins its `@medusajs/*` peer dependencies to `2.5.1`, well behind the `2.21.1` this repo runs — there is an [open upstream issue](https://github.com/variablevic/mollie-payments-medusa/issues/7) reporting a provider-not-found error on 2.7.0 because of it. Verified locally against a throwaway Medusa 2.21.1 instance that the provider still registers correctly and reaches Mollie's real API (see `docs/known-issues.md`), but re-check `GET /store/payment-providers?region_id=<id>` after any Medusa or plugin version bump.
