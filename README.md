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
- The browser reaches Medusa at `http://medusa.localhost:9000` (browsers resolve `*.localhost` to your machine). Inside a container `*.localhost` always resolves to loopback, so the Nuxt server uses `MEDUSA_SERVER_URL=http://medusa:9000/` instead.
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
bun run check    # format check, type check and tests
```

## Production

Only the Nuxt app is deployed (Nixpacks: `bun run build`, `bun run start`). The `.devcontainer/` services (Medusa, Postgres, SeaweedFS, Mailpit) are for local development, so production needs its own Medusa backend.

`nuxt.config.ts` reads these variables at build time, so they must be available at build time (in Coolify: "Available at Buildtime") and changing one needs a redeploy:

| Variable                                           | Value                                                     |
| -------------------------------------------------- | --------------------------------------------------------- |
| `MEDUSA_URL`                                       | Medusa URL as the browser reaches it                      |
| `MEDUSA_SERVER_URL`                                | Medusa URL for the Nuxt server (defaults to `MEDUSA_URL`) |
| `MEDUSA_PUBLISHABLE_KEY`                           | Publishable API key from the Medusa admin                 |
| `MEDUSA_SALES_CHANNEL_ID`                          | Sales channel id, if used                                 |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | SMTP server for the support forms, see below              |

Nuxt needs Node 22.19 or newer. If the build complains about the Node version, set `NIXPACKS_NODE_VERSION=24`.

### Support emails

The forms on `/support` are emailed to `info@animenl.nl`. Locally they end up in Mailpit (http://localhost:8025) and are never delivered.

Production sends them through [Brevo](https://www.brevo.com):

1. Add `animenl.nl` as a sending domain in Brevo, add the DNS records it shows, and add `info@animenl.nl` as a sender.
2. Create an SMTP key under SMTP & API.
3. Set `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, `SMTP_USER` to the SMTP login and `SMTP_PASS` to the SMTP key.
4. Submit a form on the live site and check that the email arrives and is not marked as spam.

Brevo handles the name, email address and message of every submission, so mention it in the privacy policy.
