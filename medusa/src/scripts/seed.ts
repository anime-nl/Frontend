import { CreateInventoryLevelInput, ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules, ProductStatus } from '@medusajs/framework/utils'
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createPriceListsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
  uploadFilesWorkflow,
} from '@medusajs/medusa/core-flows'

const PUBLISHABLE_KEY = process.env.PUBLISHABLE_API_KEY
const COUNTRIES = ['nl', 'be']

type Group = 'Keychains' | 'Figures' | 'Plushies' | 'TCG' | 'Misc'
type Stock = number | 'backorder' | 'unmanaged'

interface VariantSeed {
  title: string
  sku: string
  price: number
  stock: Stock
  options: Record<string, string>
  salePrice?: number
}

interface ProductSeed {
  title: string
  subtitle: string
  description?: string
  /** The series or franchise, stored as a product tag like in production. */
  series: string
  /** Becomes both the product's collection and its type, like in production. See GROUPS. */
  group: Group
  /** Handle of the product's single category. See CATEGORIES. */
  category: string
  material: string
  weight: number
  size: [number, number, number]
  hue: number
  images: number
  variants: VariantSeed[]
  optionTitle?: string
}

const single = (sku: string, price: number, stock: Stock, salePrice?: number): VariantSeed[] => [
  { title: 'Default', sku, price, stock, salePrice, options: { Size: 'Default' } },
]

const keychain = (
  name: string,
  series: string,
  sku: string,
  stock: Stock,
  hue: number,
  material = 'Acrylic',
  salePrice?: number,
): ProductSeed => ({
  title: `${material} ${name} Keychain`,
  subtitle: '6 cm',
  description: `Official ${material.toLowerCase()} keychain of ${name}, with a sturdy metal clasp.`,
  series,
  group: 'Keychains',
  category: material === 'Metal' ? 'metal-keychains' : 'acrylic-keychains',
  material,
  weight: 16,
  size: [90, 73, 7],
  hue,
  images: 2,
  variants: single(sku, 10.9, stock, salePrice),
})

const PRODUCTS: ProductSeed[] = [
  keychain('Qiqi', 'Genshin Impact', '6974096538799', 12, 270),
  keychain('Keqing', 'Genshin Impact', '6974096538775', 40, 285, 'Metal'),
  keychain('Venti', 'Genshin Impact', '6974096538751', 'backorder', 160),
  keychain('Zhongli', 'Genshin Impact', '6974096538768', 25, 40),
  keychain('Hu Tao', 'Genshin Impact', '6974096538782', 3, 5, 'Acrylic', 7.9),
  keychain('Raiden Shogun', 'Genshin Impact', '6974096538805', 18, 275),
  keychain('Hitori Gotoh', 'Bocchi the Rock!', '4571598660001', 30, 340),
  keychain('Nijika Ijichi', 'Bocchi the Rock!', '4571598660002', 30, 50),
  keychain('Ryo Yamada', 'Bocchi the Rock!', '4571598660003', 0, 200),
  keychain('Ikuyo Kita', 'Bocchi the Rock!', '4571598660004', 22, 10),
  keychain('Gawr Gura', 'Hololive', '4589000000011', 15, 205),
  keychain('Mori Calliope', 'Hololive', '4589000000012', 'backorder', 345),
  {
    title: 'Bushiroad Hitori Gotoh PalVerse Statue',
    subtitle: '11 cm',
    description:
      'A detailed PVC statue of Hitori Gotoh in her iconic pink tracksuit.\n\nComes in a collector box with display base.',
    series: 'Bocchi the Rock!',
    group: 'Figures',
    category: 'prize-figures',
    material: 'PVC',
    weight: 187,
    size: [120, 120, 150],
    hue: 340,
    images: 2,
    variants: single('4571598667877', 39.99, 0),
  },
  {
    title: 'Raiden Shogun 1/7 Scale Figure',
    subtitle: '26 cm',
    description: 'A premium 1/7 scale figure of the Raiden Shogun from Genshin Impact.',
    series: 'Genshin Impact',
    group: 'Figures',
    category: 'scale-figures',
    material: 'PVC',
    weight: 780,
    size: [180, 160, 260],
    hue: 275,
    images: 2,
    variants: single('6974096540001', 149.95, 3, 129.95),
  },
  {
    title: 'Nendoroid Gawr Gura',
    subtitle: '10 cm',
    description: 'Poseable Nendoroid with three faceplates and a trident accessory.',
    series: 'Hololive',
    group: 'Figures',
    category: 'nendoroids',    material: 'ABS',
    weight: 210,
    size: [110, 110, 160],
    hue: 205,
    images: 1,
    variants: single('4580590000123', 64.5, 'backorder'),
  },
  {
    title: 'Hu Tao Nendoroid',
    subtitle: '10 cm',
    description: 'Poseable Nendoroid of Hu Tao with Boo Tao accessory.',
    series: 'Genshin Impact',
    group: 'Figures',
    category: 'nendoroids',    material: 'ABS',
    weight: 205,
    size: [110, 110, 160],
    hue: 5,
    images: 2,
    variants: single('4580590000124', 59.99, 8),
  },
  {
    title: 'Hololive Gawr Gura Plush',
    subtitle: 'Sitting plush',
    description: 'A soft plush of Gawr Gura. Available in three sizes.',
    series: 'Hololive',
    group: 'Plushies',
    category: 'plush-toys',    material: 'Polyester',
    weight: 250,
    size: [200, 150, 200],
    hue: 210,
    images: 2,
    optionTitle: 'Size',
    variants: [
      { title: 'S', sku: 'PLUSH-GURA-S', price: 19.95, stock: 10, options: { Size: 'S' } },
      { title: 'M', sku: 'PLUSH-GURA-M', price: 29.95, stock: 4, options: { Size: 'M' } },
      { title: 'L', sku: 'PLUSH-GURA-L', price: 44.95, stock: 0, options: { Size: 'L' } },
    ],
  },
  {
    title: 'Pikachu Plush',
    subtitle: 'Pokémon Center original',
    description: 'A classic Pikachu plush in three sizes and two colours.',
    series: 'Pokémon TCG',
    group: 'Plushies',
    category: 'plush-toys',    material: 'Polyester',
    weight: 300,
    size: [220, 160, 220],
    hue: 50,
    images: 2,
    optionTitle: 'Size',
    variants: [
      { title: 'S / Classic', sku: 'PLUSH-PIKA-S-C', price: 17.95, stock: 20, options: { Size: 'S', Colour: 'Classic' } },
      { title: 'S / Shiny', sku: 'PLUSH-PIKA-S-S', price: 19.95, stock: 'backorder', options: { Size: 'S', Colour: 'Shiny' } },
      { title: 'L / Classic', sku: 'PLUSH-PIKA-L-C', price: 39.95, stock: 6, options: { Size: 'L', Colour: 'Classic' } },
      { title: 'L / Shiny', sku: 'PLUSH-PIKA-L-S', price: 44.95, stock: 0, options: { Size: 'L', Colour: 'Shiny' } },
    ],
  },
  {
    title: 'Bocchi Plush Set',
    subtitle: 'Set of 4',
    series: 'Bocchi the Rock!',
    group: 'Plushies',
    category: 'plush-toys',    material: 'Polyester',
    weight: 400,
    size: [250, 200, 120],
    hue: 320,
    images: 0,
    variants: single('4571598660100', 54.9, 'unmanaged'),
  },
  {
    title: 'Pokémon Scarlet & Violet Booster Pack',
    subtitle: '10 cards',
    description: 'A single booster pack from the Scarlet & Violet series.',
    series: 'Pokémon TCG',
    group: 'TCG',
    category: 'packs',
    material: 'Paper',
    weight: 25,
    size: [70, 5, 120],
    hue: 20,
    images: 1,
    variants: single('820650000001', 4.49, 'unmanaged'),
  },
  {
    title: 'Pokémon Scarlet & Violet Booster Box',
    subtitle: '36 packs',
    description: 'A sealed display box with 36 booster packs.',
    series: 'Pokémon TCG',
    group: 'TCG',
    category: 'boosters',
    material: 'Paper',
    weight: 900,
    size: [200, 130, 90],
    hue: 15,
    images: 1,
    variants: single('820650000036', 149.99, 'backorder'),
  },
  {
    title: 'Pokémon Charizard ex Single Card',
    subtitle: 'Ultra Rare',
    series: 'Pokémon TCG',
    group: 'TCG',
    category: 'singles',
    material: 'Paper',
    weight: 2,
    size: [63, 1, 88],
    hue: 25,
    images: 1,
    variants: single('820650000099', 12.5, 2),
  },
  ...Array.from({ length: 6 }, (_, i): ProductSeed => ({
    title: `Genshin Impact Mug Vol. ${i + 1}`,
    subtitle: '350 ml',
    series: 'Genshin Impact',
    group: 'Misc',
    category: 'mugs',
    material: 'Ceramic',
    weight: 350,
    size: [120, 90, 95],
    hue: (i * 55 + 90) % 360,
    images: 1,
    variants: single(`MUG-GI-${i + 1}`, 12.95, 100),
  })),
]

// Production uses the same five groups as collections and as product types
const GROUPS: Group[] = ['Keychains', 'Figures', 'Plushies', 'TCG', 'Misc']
// Categories thin/small enough to ship in a Brievenbus (letterbox parcel); everything else ships as a Pakket.
const BRIEVENBUS_GROUPS: Group[] = ['Keychains', 'TCG']

// Production's categories: one flat list, every product in exactly one. The handles are what the Nuxt app links to (e.g. /products/tcg/singles)
const CATEGORIES = [
  { handle: 'singles', name: 'Singles' },
  { handle: 'packs', name: 'Packs' },
  { handle: 'boosters', name: 'Booster Boxes' },
  { handle: 'prize-figures', name: 'Prize Figures' },
  { handle: 'scale-figures', name: 'Scale figures' },
  { handle: 'noodle-stoppers', name: 'Noodle Stoppers' },
  { handle: 'acrylic-keychains', name: 'Acrylic Keychains' },
  { handle: 'metal-keychains', name: 'Metal Keychains' },
  { handle: 'plush-toys', name: 'Plush Toys' },
  { handle: 'pop-up-parade', name: 'Pop Up Parade Figures' },
  { handle: 'chibi-figures', name: 'Chibi Figures' },
  { handle: 'action-figures', name: 'Action Figures' },
  { handle: '2d-plush', name: '2D Plush' },
  { handle: 'nendoroids', name: 'Nendoroids' },
  { handle: 'pocket-plush', name: 'Pocket Plush' },
  { handle: 'mascot-keychains', name: 'Mascot Keychains' },
  { handle: 'acrylic-stands', name: 'Acrylic Stands' },
  { handle: 'mugs', name: 'Mugs' },
]
const SALES_CHANNELS = ['Webshop', 'Physical', 'Bol.com']

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const placeholderSvg = (title: string, hue: number, index: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue}, 70%, 55%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 40) % 360}, 70%, 25%)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <circle cx="400" cy="330" r="150" fill="rgba(255,255,255,0.18)"/>
  <text x="400" y="600" font-family="sans-serif" font-size="40" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(title.slice(0, 32))}</text>
  <text x="400" y="660" font-family="sans-serif" font-size="28" fill="rgba(255,255,255,0.8)" text-anchor="middle">Image ${index + 1}</text>
</svg>`

export default async function seed({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const productModule = container.resolve(Modules.PRODUCT)
  const storeModule = container.resolve(Modules.STORE)

  if (!PUBLISHABLE_KEY) {
    throw new Error('PUBLISHABLE_API_KEY must be set')
  }

  const [existing] = await productModule.listProducts({}, { take: 1 })
  if (existing) {
    logger.info('Database already contains products, skipping seed. Remove the database volume to reseed.')
    return
  }

  logger.info('Seeding sales channels...')
  const { result: channels } = await createSalesChannelsWorkflow(container).run({
    input: { salesChannelsData: SALES_CHANNELS.map((name) => ({ name })) },
  })
  const webshop = channels.find((channel) => channel.name === 'Webshop')!

  const [store] = await storeModule.listStores()
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [{ currency_code: 'eur', is_default: true }],
        default_sales_channel_id: webshop.id,
      },
    },
  })

  logger.info('Seeding regions and taxes...')
  // medusa-config.ts only registers the Mollie payment provider when MOLLIE_API_KEY is set (it
  // crashes Medusa's startup otherwise), so seeding it into a region without that would fail too.
  const paymentProviders = process.env.MOLLIE_API_KEY
    ? ['pp_system_default', 'pp_mollie-hosted-checkout_mollie']
    : ['pp_system_default']
  const regions = [
    { name: 'Netherlands', countries: ['nl'] },
    { name: 'Belgium', countries: ['be'] },
  ]
  for (const region of regions) {
    await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            ...region,
            currency_code: 'eur',
            payment_providers: paymentProviders,
          },
        ],
      },
    })
  }
  await createTaxRegionsWorkflow(container).run({
    input: COUNTRIES.map((country_code) => ({ country_code, provider_id: 'tp_system' })),
  })

  logger.info('Seeding stock location and fulfillment...')
  const {
    result: [stockLocation],
  } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [{ name: 'Warehouse', address: { city: 'Amsterdam', country_code: 'NL', address_1: '' } }],
    },
  })
  await updateStoresWorkflow(container).run({
    input: { selector: { id: store.id }, update: { default_location_id: stockLocation.id } },
  })
  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: 'manual_manual' },
  })

  let [brievenbusProfile] = await fulfillmentModule.listShippingProfiles({ name: 'Brievenbus' })
  if (!brievenbusProfile) {
    ;[brievenbusProfile] = (
      await createShippingProfilesWorkflow(container).run({
        input: { data: [{ name: 'Brievenbus', type: 'default' }] },
      })
    ).result
  }

  let [pakketProfile] = await fulfillmentModule.listShippingProfiles({ name: 'Pakket' })
  if (!pakketProfile) {
    ;[pakketProfile] = (
      await createShippingProfilesWorkflow(container).run({
        input: { data: [{ name: 'Pakket', type: 'default' }] },
      })
    ).result
  }
  logger.info(
    `Shipping profiles: Brievenbus=${brievenbusProfile.id} Pakket=${pakketProfile.id} ` +
      '(set MEDUSA_BRIEVENBUS_SHIPPING_PROFILE_ID / MEDUSA_PAKKET_SHIPPING_PROFILE_ID to these in .env)',
  )

  const fulfillmentSet = await fulfillmentModule.createFulfillmentSets({
    name: 'Warehouse delivery',
    type: 'shipping',
    service_zones: [
      {
        name: 'Benelux',
        geo_zones: COUNTRIES.map((country_code) => ({ country_code, type: 'country' as const })),
      },
    ],
  })
  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  })

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: 'PostNL Brievenbuspakje',
        code: 'postnl-brievenbuspakje',
        description: 'Ship in 2-3 days.',
        amount: 3.95,
        shipping_profile_id: brievenbusProfile.id,
      },
      {
        name: 'PostNL Pakket',
        code: 'postnl-pakket',
        description: 'Ship in 2-3 days.',
        amount: 4.95,
        shipping_profile_id: pakketProfile.id,
      },
      {
        name: 'DPD',
        code: 'dpd',
        description: 'Ship in 2-3 days.',
        amount: 5.45,
        shipping_profile_id: pakketProfile.id,
      },
      {
        name: 'DHL',
        code: 'dhl',
        description: 'Ship in 24 hours.',
        amount: 8.95,
        shipping_profile_id: pakketProfile.id,
      },
    ].map((option) => ({
      name: option.name,
      price_type: 'flat' as const,
      provider_id: 'manual_manual',
      service_zone_id: fulfillmentSet.service_zones[0].id,
      shipping_profile_id: option.shipping_profile_id,
      type: { label: option.name, description: option.description, code: option.code },
      prices: [{ currency_code: 'eur', amount: option.amount }],
      rules: [
        { attribute: 'enabled_in_store', value: 'true', operator: 'eq' as const },
        { attribute: 'is_return', value: 'false', operator: 'eq' as const },
      ],
    })),
  })

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocation.id, add: channels.map((channel) => channel.id) },
  })

  logger.info('Seeding publishable API key...')
  const {
    result: [apiKey],
  } = await createApiKeysWorkflow(container).run({
    input: { api_keys: [{ title: 'Webshop', type: 'publishable', created_by: '' }] },
  })
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: apiKey.id, add: [webshop.id] },
  })
  await pg('api_key')
    .where({ id: apiKey.id })
    .update({ token: PUBLISHABLE_KEY, redacted: `${PUBLISHABLE_KEY.slice(0, 3)}***${PUBLISHABLE_KEY.slice(-3)}` })

  logger.info('Seeding catalog...')
  const collections = await productModule.createProductCollections(
    GROUPS.map((title) => ({ title, handle: title.toLowerCase() })),
  )
  const { result: categories } = await createProductCategoriesWorkflow(container).run({
    input: { product_categories: CATEGORIES.map((category) => ({ ...category, is_active: true })) },
  })
  const types = await productModule.createProductTypes(GROUPS.map((value) => ({ value })))
  const tags = await productModule.createProductTags(
    [...new Set(PRODUCTS.map((product) => product.series))].map((value) => ({ value })),
  )

  logger.info('Uploading product images...')
  const uploads = PRODUCTS.map((product) =>
    Array.from({ length: product.images }, (_, index) => ({
      filename: `${product.variants[0].sku}-${index + 1}.svg`.toLowerCase(),
      mimeType: 'image/svg+xml',
      content: placeholderSvg(product.title, product.hue, index),
      access: 'public' as const,
    })),
  )
  const { result: uploaded } = await uploadFilesWorkflow(container).run({
    input: { files: uploads.flat() },
  })
  let uploadIndex = 0
  const imageUrls = uploads.map((files) => files.map(() => uploaded[uploadIndex++].url))

  const skuOf = (variant: VariantSeed) => variant.sku
  const { result: products } = await createProductsWorkflow(container).run({
    input: {
      products: PRODUCTS.map((product, index) => {
        const optionNames = Object.keys(product.variants[0].options)
        return {
          title: product.title,
          subtitle: product.subtitle,
          description: product.description,
          handle: product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          status: ProductStatus.PUBLISHED,
          material: product.material,
          origin_country: 'cn',
          weight: product.weight,
          length: product.size[0],
          width: product.size[1],
          height: product.size[2],
          collection_id: collections.find((collection) => collection.title === product.group)!.id,
          category_ids: [categories.find((category) => category.handle === product.category)!.id],
          type_id: types.find((type) => type.value === product.group)!.id,
          tags: [{ id: tags.find((tag) => tag.value === product.series)!.id }],
          shipping_profile_id: BRIEVENBUS_GROUPS.includes(product.group)
            ? brievenbusProfile.id
            : pakketProfile.id,
          thumbnail: imageUrls[index][0],
          images: imageUrls[index].map((url) => ({ url })),
          options: optionNames.map((title) => ({
            title,
            values: [...new Set(product.variants.map((variant) => variant.options[title]))],
          })),
          variants: product.variants.map((variant) => ({
            title: variant.title,
            sku: skuOf(variant),
            options: variant.options,
            manage_inventory: variant.stock !== 'unmanaged',
            allow_backorder: variant.stock === 'backorder',
            prices: [{ amount: variant.price, currency_code: 'eur' }],
          })),
          sales_channels: [{ id: webshop.id }],
        }
      }),
    },
  })

  const salePrices = PRODUCTS.flatMap((product, index) =>
    product.variants
      .filter((variant) => variant.salePrice)
      .map((variant) => ({
        variant_id: products[index].variants.find((created) => created.sku === variant.sku)!.id,
        amount: variant.salePrice!,
        currency_code: 'eur',
      })),
  )
  if (salePrices.length) {
    await createPriceListsWorkflow(container).run({
      input: {
        price_lists_data: [
          {
            title: 'Sale',
            description: 'Sample sale prices',
            status: 'active' as const,
            type: 'sale' as const,
            prices: salePrices,
          },
        ],
      },
    })
  }

  logger.info('Seeding inventory levels...')
  const stockBySku = new Map(
    PRODUCTS.flatMap((product) =>
      product.variants
        .filter((variant) => variant.stock !== 'unmanaged')
        .map((variant) => [variant.sku, typeof variant.stock === 'number' ? variant.stock : 0] as const),
    ),
  )
  const { data: inventoryItems } = await query.graph({
    entity: 'inventory_item',
    fields: ['id', 'sku'],
  })
  const levels: CreateInventoryLevelInput[] = inventoryItems
    .filter((item) => stockBySku.has(item.sku!))
    .map((item) => ({
      location_id: stockLocation.id,
      inventory_item_id: item.id,
      stocked_quantity: stockBySku.get(item.sku!)!,
    }))
  await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: levels } })

  logger.info(`Seeded ${products.length} products.`)
}
