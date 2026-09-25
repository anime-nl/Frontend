# AnimeNL Website

## Local development environment

The dev container starts a complete local stack with Docker Compose (`.devcontainer/docker-compose.yml`), so nothing you do touches production:

| Service | Purpose | URL |
|---|---|---|
| `app` | Nuxt dev container (this workspace) | http://localhost:3000 |
| `medusa` | Medusa v2 backend built from `./medusa`, with the admin dashboard | http://localhost:9000 (admin: http://localhost:9000/app) |
| `postgres` | Medusa database | internal |
| `minio` | S3-compatible storage for product images | API http://localhost:9100, console http://localhost:9101 |

On first start the `medusa` service installs its dependencies, runs migrations, and seeds sample data: two regions (Netherlands, Belgium), the Webshop / Physical / Bol.com sales channels, and about 30 products covering in stock, low stock, backorder, out of stock, sale prices and multi-variant items. Product images are generated and uploaded to MinIO. Seeding is skipped when the database already has products.

- Admin login: `admin@animenl.local` / `supersecret`
- MinIO login: `minioadmin` / `minioadmin`
- The Nuxt environment (`MEDUSA_URL`, `MEDUSA_PUBLISHABLE_KEY`, `MEDUSA_SALES_CHANNEL_ID`) is set by the compose file and overrides any local `.env`. Copy `.env.example` to `.env` to run Nuxt outside the container.
- The Nuxt server and the browser both reach Medusa at `http://medusa.localhost:9000`: the compose network gives the `medusa` container that alias, and browsers resolve `*.localhost` to your machine.
- To reset all data and reseed: `docker compose -f .devcontainer/docker-compose.yml down -v`, then rebuild the container.

# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
