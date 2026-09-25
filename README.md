# AnimeNL Website

## Local development environment

The dev container starts a complete local stack with Docker Compose (`.devcontainer/docker-compose.yml`), so nothing you do touches production:

| Service | Purpose | URL |
|---|---|---|
| `app` | Nuxt dev container (this workspace) | http://localhost:3000 |
| `medusa` | Medusa v2 backend built from `./medusa`, with the admin dashboard | http://localhost:9000 (admin: http://localhost:9000/app) |
| `postgres` | Medusa database | internal |
| `seaweedfs` | S3-compatible storage for product images | S3 API http://localhost:9100 |

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
```
