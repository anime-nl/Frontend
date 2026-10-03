import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {createError, readBody} from 'h3'
import ProductPage from '~/pages/product/[id]/index.vue'
import product from '../fixtures/product.json'

const backorderableInStock = structuredClone(product.product)
backorderableInStock.variants[0]!.allow_backorder = true
backorderableInStock.variants[0]!.inventory_quantity = 5

const outOfStock = structuredClone(product.product)
outOfStock.variants[0]!.inventory_quantity = 0
outOfStock.variants[0]!.allow_backorder = false

const onBackorder = structuredClone(product.product)
onBackorder.variants[0]!.inventory_quantity = 0
onBackorder.variants[0]!.allow_backorder = true

const unlimitedStock = structuredClone(product.product)
unlimitedStock.variants[0]!.manage_inventory = false

const discounted = structuredClone(product.product)
discounted.variants[0]!.calculated_price!.original_amount = 15.9

const singleImage = structuredClone(product.product)
singleImage.images = [product.product.images[0]!]

const noImages = structuredClone(product.product)
noImages.images = []
noImages.thumbnail = null as unknown as string

const sizeOption = structuredClone(product.product.options[0]!)
sizeOption.values = [sizeOption.values[0]!, {...sizeOption.values[0]!, id: 'optval_large', value: 'Large'}]
const largeVariant = structuredClone(product.product.variants[0]!)
largeVariant.id = 'variant_large'
largeVariant.sku = '6974096538769'
largeVariant.options = [{...largeVariant.options[0]!, id: 'optval_large', value: 'Large'}]
largeVariant.calculated_price!.calculated_amount = 15.9
largeVariant.calculated_price!.original_amount = 15.9
const multiVariant = structuredClone(product.product)
multiVariant.options = [sizeOption]
multiVariant.variants = [product.product.variants[0]!, largeVariant]

const noCollectionWithTags = structuredClone(product.product)
noCollectionWithTags.collection = null as unknown as typeof product.product.collection
;(noCollectionWithTags as {tags: {id: string; value: string}[]}).tags = [{id: 'tag_1', value: 'Rare'}]

registerEndpoint('/api/products/prod_1', () => ({product: product.product, region_id: 'reg_nl'}))
registerEndpoint('/api/products/prod_missing', () => {
    throw createError({statusCode: 404, statusMessage: 'Product not found'})
})
registerEndpoint('/api/products/prod_no_collection', () => ({product: noCollectionWithTags, region_id: 'reg_nl'}))
registerEndpoint('/api/products/prod_backorder', () => ({product: backorderableInStock, region_id: 'reg_nl'}))
registerEndpoint('/api/products/prod_out_of_stock', () => ({product: outOfStock, region_id: 'reg_nl'}))
registerEndpoint('/api/products/prod_on_backorder', () => ({product: onBackorder, region_id: 'reg_nl'}))
registerEndpoint('/api/products/prod_unlimited', () => ({product: unlimitedStock, region_id: 'reg_nl'}))
registerEndpoint('/api/products/prod_discounted', () => ({product: discounted, region_id: 'reg_nl'}))
registerEndpoint('/api/products/prod_single_image', () => ({product: singleImage, region_id: 'reg_nl'}))
registerEndpoint('/api/products/prod_no_images', () => ({product: noImages, region_id: 'reg_nl'}))
registerEndpoint('/api/products/prod_multi_variant', () => ({product: multiVariant, region_id: 'reg_nl'}))
registerEndpoint('/api/cart', () => ({cart: null}))

let lastCartItemsBody: unknown
let itemsShouldFail = false

registerEndpoint('/api/cart/items', {
    method: 'POST',
    handler: async (event) => {
        lastCartItemsBody = await readBody(event)
        if (itemsShouldFail) throw createError({statusCode: 500})
        return {cart: {id: 'cart_1', items: [], currency_code: 'eur', subtotal: 0, total: 0}}
    }
})

let wrapper: Awaited<ReturnType<typeof mountProduct>> | undefined

const mountProduct = (id = 'prod_1') => mountSuspended(ProductPage, {route: `/product/${id}`, attachTo: document.body})

const addToCartButton = () =>
    wrapper!.findAllComponents({name: 'UButton'}).find((button) => button.props('icon') === 'i-lucide-shopping-cart')

beforeEach(() => {
    lastCartItemsBody = undefined
    itemsShouldFail = false
})

afterEach(() => {
    wrapper?.unmount()
})

describe('product page', () => {
    it('shows the product title', async () => {
        wrapper = await mountProduct()

        expect(wrapper.find('h1').text()).toBe(product.product.title)
    })

    it('shows the product image scaled to fit and centered in a fixed-size box', async () => {
        wrapper = await mountProduct()

        const img = wrapper.find('img')
        expect(img.classes()).toContain('h-160')
        expect(img.classes()).toContain('object-contain')
        expect(img.classes()).toContain('object-center')
    })

    it('has no maximum quantity for a variant that is in stock and backorderable', async () => {
        wrapper = await mountProduct('prod_backorder')

        const quantityInput = wrapper.findComponent({name: 'UInputNumber'})
        expect(quantityInput.props('max')).toBeUndefined()
    })

    it('caps the maximum quantity to the stock of a variant that is not backorderable', async () => {
        wrapper = await mountProduct()

        const quantityInput = wrapper.findComponent({name: 'UInputNumber'})
        expect(quantityInput.props('max')).toBe(25)
    })

    it('adds the selected variant and quantity to the cart', async () => {
        wrapper = await mountProduct()

        await addToCartButton()!.trigger('click')
        await vi.waitFor(() => expect(lastCartItemsBody).toBeDefined())

        expect(lastCartItemsBody).toEqual({variant_id: product.product.variants[0]!.id, quantity: 1})
    })

    it('adds the chosen quantity to the cart', async () => {
        wrapper = await mountProduct()

        await wrapper.findComponent({name: 'UInputNumber'}).vm.$emit('update:modelValue', 3)
        await addToCartButton()!.trigger('click')
        await vi.waitFor(() => expect(lastCartItemsBody).toBeDefined())

        expect(lastCartItemsBody).toEqual({variant_id: product.product.variants[0]!.id, quantity: 3})
    })

    it('stops showing a loading button when adding to the cart fails', async () => {
        itemsShouldFail = true
        wrapper = await mountProduct()

        await addToCartButton()!.trigger('click')
        await vi.waitFor(() => expect(lastCartItemsBody).toBeDefined())
        await vi.waitFor(() => expect(addToCartButton()!.props('loading')).toBe(false))
    })

    it('shows unlimited stock as in stock with no maximum quantity, in the default (Dutch) locale', async () => {
        wrapper = await mountProduct('prod_unlimited')

        expect(wrapper.text()).toContain('Op voorraad')
        const quantityInput = wrapper.findComponent({name: 'UInputNumber'})
        expect(quantityInput.props('max')).toBeUndefined()
    })

    it('shows the original price struck through when the variant is discounted', async () => {
        wrapper = await mountProduct('prod_discounted')

        const eur = (amount: number) =>
            new Intl.NumberFormat('nl-NL', {style: 'currency', currency: 'EUR'}).format(amount)
        expect(wrapper.text()).toContain(eur(10.9))
        expect(wrapper.text()).toContain(eur(15.9))
    })

    it('shows a single image without a carousel', async () => {
        wrapper = await mountProduct('prod_single_image')

        expect(wrapper.findAllComponents({name: 'UCarousel'})).toHaveLength(0)
        expect(wrapper.find('img').exists()).toBe(true)
    })

    it('shows a placeholder icon when the product has no images', async () => {
        wrapper = await mountProduct('prod_no_images')

        expect(wrapper.find('img').exists()).toBe(false)
        const icons = wrapper.findAllComponents({name: 'UIcon'}).map((icon) => icon.props('name'))
        expect(icons).toContain('i-lucide-image-off')
    })

    it('shows an option selector for a product with more than one variant', async () => {
        wrapper = await mountProduct('prod_multi_variant')

        expect(wrapper.text()).toContain('Large')
    })

    it('switches the selected variant and price when choosing a different option', async () => {
        wrapper = await mountProduct('prod_multi_variant')

        const eur = (amount: number) =>
            new Intl.NumberFormat('nl-NL', {style: 'currency', currency: 'EUR'}).format(amount)
        expect(wrapper.text()).toContain(eur(10.9))

        const largeOption = wrapper
            .findAllComponents({name: 'UButton'})
            .find((button) => button.props('label') === 'Large')
        await largeOption!.trigger('click')

        expect(wrapper.text()).toContain(eur(15.9))

        await addToCartButton()!.trigger('click')
        await vi.waitFor(() => expect(lastCartItemsBody).toEqual({variant_id: 'variant_large', quantity: 1}))
    })

    it('shows a 404 for a product the store does not have', async () => {
        await expect(mountProduct('prod_missing')).rejects.toThrow()
    })

    it('shows a tag badge for a product with no collection', async () => {
        wrapper = await mountProduct('prod_no_collection')

        expect(wrapper.text()).toContain('Rare')
        expect(wrapper.findAllComponents({name: 'UBadge'}).some((badge) => badge.props('label') === 'Rare')).toBe(true)
    })

    it('disables adding to cart for a variant that is out of stock', async () => {
        wrapper = await mountProduct('prod_out_of_stock')

        const quantityInput = wrapper.findComponent({name: 'UInputNumber'})
        expect(quantityInput.props('disabled')).toBe(true)
        expect(addToCartButton()!.props('disabled')).toBe(true)
    })

    describe('Product structured data', () => {
        const productJsonLd = async () => {
            await vi.waitFor(() => expect(document.querySelector('script[type="application/ld+json"]')).not.toBeNull())
            const script = document.querySelector('script[type="application/ld+json"]')!
            return JSON.parse(script.innerHTML)
        }

        it('describes an in-stock product with its price and availability', async () => {
            wrapper = await mountProduct()

            expect(await productJsonLd()).toEqual({
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: product.product.title,
                description: product.product.description,
                image: [product.product.images[0]!.url, product.product.images[1]!.url],
                sku: product.product.variants[0]!.sku,
                offers: {
                    '@type': 'Offer',
                    price: 10.9,
                    priceCurrency: 'EUR',
                    availability: 'https://schema.org/InStock',
                    url: 'http://localhost:3000/product/prod_1'
                }
            })
        })

        it('marks an out-of-stock product as OutOfStock', async () => {
            wrapper = await mountProduct('prod_out_of_stock')

            expect((await productJsonLd()).offers.availability).toBe('https://schema.org/OutOfStock')
        })

        it('marks a backorderable, out-of-stock product as BackOrder', async () => {
            wrapper = await mountProduct('prod_on_backorder')

            expect((await productJsonLd()).offers.availability).toBe('https://schema.org/BackOrder')
        })
    })
})
