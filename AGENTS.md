# AnimeNL website

Webshop for anime merchandise (TCG, figures, plushies, keychains) for the Dutch market. Nuxt 4 + Nuxt UI frontend on a Medusa v2 store backend. Deployed with Nixpacks on a VPS running Coolify.

## Rules

1. **Everything must be tested.** New code comes with tests, and a bug fix starts with a test that fails without the fix. Test at the lowest level that proves the behavior (see [Testing](#testing)).
2. **Everything must be formatted.** Prettier is the only authority. Run `bun run format` before you finish; never hand-format or fight the formatter.
3. **Optimize for readability, not speed.** Prefer the obvious, boring solution with clear names and small functions. Only trade readability for performance in genuinely complex logic where the slowdown would be noticeable, and say why in a comment.
4. **No useless comments.** A comment must explain something the code cannot say by itself, such as why something is done or a non-obvious constraint. Never restate what the code does, and never leave commented-out code or change-log comments. If a comment feels necessary to explain _what_, rename or restructure instead.
5. **Bugs: note them, and fix them only when in scope.** If a bug is in the way of the task, fix it (with a test). If it is outside the task, do not fix it silently: add it to [docs/known-issues.md](docs/known-issues.md) and mention it in your answer.

A task is done when `bun run check` passes (formatting, type check and all tests).

## Commands

Uses [Bun](https://bun.sh). Run everything from the repo root.

```bash
bun install          # install dependencies
bun run dev          # dev server on http://localhost:3000
bun run build        # production build
bun run start        # run the production build (Nixpacks start command)

bun run test         # all tests, once
bun run test:watch   # tests in watch mode
bunx vitest run --project unit   # one project: unit, nuxt or e2e
bun run typecheck    # nuxt typecheck (vue-tsc)
bun run format       # format everything
bun run check        # format check + typecheck + tests
```

## Layout

| Path                   | What lives there                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `app/`                 | Nuxt app: `pages/`, `components/`, `assets/css/main.css`, `app.vue`                   |
| `server/api/`          | Nitro API routes. The browser never talks to Medusa; it calls these routes            |
| `server/utils/`        | Server helpers such as `medusaFetch`                                                  |
| `shared/utils/`        | Code used by both app and server (for example the support form topics and validation) |
| `test/`                | `unit/`, `nuxt/`, `e2e/` and `helpers/`. Tests never live next to source files        |
| `medusa/`              | The Medusa backend used for local development. Not part of the production deployment  |
| `.devcontainer/`       | Local dev stack: Nuxt, Medusa, Postgres, SeaweedFS (S3), Mailpit (catches emails)     |
| `docs/known-issues.md` | Bugs and test debt that were found but not fixed yet                                  |

Pages are file-based routes (`app/pages/support/[topic].vue` is `/support/:topic`), so anything that is not a page must stay out of `app/pages/`.

## Conventions

- Vue: `<script setup lang="ts">`, Nuxt UI components (`UButton`, `UForm`, `UCard`, ...) and Tailwind classes. The theme is dark; colors come from `app/assets/css/main.css`.
- TypeScript: no `any` unless there is no alternative (and then say why). API routes and helpers are typed with `@medusajs/types`.
- Imports from `shared/utils` are explicit (`import {x} from '#shared/utils/support'`). Nuxt's auto-import missed one of the functions there.
- Environment variables are read in `nuxt.config.ts` with `process.env` at **build time**. On Coolify they must be available at build time, and changing one needs a redeploy. Add new ones to `.env.example`, `runtimeConfig` and the README.
- The Nuxt server reaches Medusa through `medusaFetch` and `MEDUSA_SERVER_URL`. The browser uses `MEDUSA_URL`. Inside the dev container these differ.
- Do not commit unless asked. The repo owner commits themselves. Do not install dependencies without a reason that fits the task.

## Testing

Vitest, with three projects (`vitest.config.ts`):

- **`test/unit/`** (Node): pure logic and server helpers. Globals such as `$fetch` and `useRuntimeConfig` are stubbed with `vi.stubGlobal`. Fast, use this first.
- **`test/nuxt/`** (Nuxt environment): components and pages with `mountSuspended`. API calls are faked with `registerEndpoint`. Wait for async UI with `vi.waitFor`.
- **`test/e2e/`**: builds the real app with `setup()` from `@nuxt/test-utils/e2e` (about a minute per file). Use it for server routes and server-side rendering. `test/helpers/smtpSink.ts` is a fake SMTP server, so emails are tested for real without a mail service.

Test names describe behavior ("rejects a reason that belongs to another topic"), and one test checks one behavior.

## Support forms

`/support` lists four topics (orders, shipping, returns, payments). Each opens `/support/[topic]`, one form with topic-specific reasons, sent to `POST /api/support` and emailed to `info@animenl.nl` through SMTP (Mailpit locally, Brevo in production). Topics, reasons and validation live in `shared/utils/support.ts` and are shared by the form and the server.

## Shop facts

Use these in customer-facing copy; do not invent other policies.

- Dutch webshop, so EU rules apply: 14-day return period.
- Shipping takes 2 to 3 days.
- Payments go through Mollie: iDEAL, credit card and every other method Mollie supports.
- Support address: `info@animenl.nl`. Trustpilot: https://www.trustpilot.com/review/animenl.nl
