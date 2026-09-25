# Known issues

Bugs and gaps that were found while working on something else. Fix them in their own change, with a test, and move the entry to "Fixed" (or delete it).

Format: **title** (where): what is wrong. Mark anything not yet reproduced as _unverified_.

## Open

- **Navbar links to pages that do not exist** (`app/components/navbar.vue`): only `/products`, `/products/tcg`, `/search`, `/product/[id]` and `/support` exist. Links such as `/products/tcg/singles`, `/products/figures/*`, `/products/plush` and `/products/keychains/*` give a 404 (Vue Router warns "No match found" in the dev log).
- **Most icons load from the Iconify API at runtime** (`app/components/navbar.vue`): only the `lucide` and `flat-color-icons` collections are installed. `mdi`, `game-icons`, `material-symbols`, `simple-icons`, `pinhead` and `at-icons` are fetched from the internet by the visitor's browser. That is slow, breaks offline, and sends visitor requests to a third party. Install the `@iconify-json/*` packages that are used.
- **Medusa module debug logging is always on** (`nuxt.config.ts`, `medusa.debug: true`): production logs full request details. Make it depend on the environment.
- **Secrets are baked into the build** (`nuxt.config.ts`): `runtimeConfig` reads `process.env` at build time, so `SMTP_PASS` and the Medusa key end up in `.output`, and every change needs a rebuild. Nuxt supports `NUXT_*` variables at runtime as an alternative.
- **No rate limit on `POST /api/support`** (`server/api/support.post.ts`): only a honeypot field protects it, and every request sends an email through Brevo (free plan has a daily limit).
- **Trustpilot score is hardcoded** (`app/components/navbar.vue`, `badge: '4.0'`): it will go out of date.
- **Support page copy needs a check by the shop owner** (`app/pages/support/index.vue`, `shared/utils/support.ts`): "2 to 3 days" does not say whether it means business days or delivery versus dispatch, and the return text does not cover who pays for return shipping or the condition of returned items.
- **Product cards never show a price** (`app/components/productCarousel.vue`, `app/pages/products/tcg/index.vue`): the list requests `variants.prices.*`, but `productCard` reads `variants[0].calculated_price`, which needs a `region_id`. _Unverified in the browser._
- **Backorderable items in stock are capped at the stock quantity** (`app/pages/product/[id]/index.vue`, the `stock` computed): when `inventory_quantity > 0` it sets `max` to the quantity even if `allow_backorder` is true, so the visitor cannot order more than what is in stock. Only items that are fully out of stock get an unlimited quantity. A backorderable item should have no maximum, whatever its stock.
- **Test debt**: no tests yet for `server/api/{categories,collections,products,regions}.ts`, `app/pages/{index,search,products}`, and the components `productCard`, `productPageHeader` and `showcaseCarousel`.

## Fixed

- **"By series" links in the navbar did not work** (`app/components/navbar.vue`, `app/pages/search/index.vue`): the links passed a category _handle_ (`?category=tcg`) but the search page used it as a category _id_, so nothing was selected. The search page now accepts an id or a handle, and the links (`bySeriesLink`) also focus the Collection dropdown so the visitor picks the series. The Plush link used the handle `plushies`, which does not exist in the seed data; it is now `plush`. Handles in production must match `tcg`, `figures`, `plush` and `keychains`.

- **`bun run typecheck` failed with circular type errors** in `server/utils/medusa.ts` and every API route that uses it. Fixed by typing `medusaFetch` and the routes with `@medusajs/types`.
- **Support form let line breaks through into the email body** (`normalizeSupportRequest`). Fixed by collapsing line breaks in every field except the message.
