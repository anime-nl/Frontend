import type {StoreProduct, StoreRegion} from "@medusajs/types"

const PRODUCT_FIELDS = [
    '+variants.inventory_quantity',
    '*variants.calculated_price',
    '*variants.options',
    '*options',
    '*options.values',
    '*images',
    '*collection',
    '*categories',
    '*tags',
    '*type',
].join(',')

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const id = getRouterParam(event, 'id')
    const salesChannelId = config.medusaSalesChannelId || undefined
    const headers = {'x-publishable-api-key': config.medusaPublishableKey}

    if (!id) {
        throw createError({statusCode: 400, statusMessage: 'Missing product id'})
    }

    let regionId = getQuery(event).region_id as string | undefined

    if (!regionId) {
        const {regions} = await $fetch<{ regions: StoreRegion[] }>(`${config.medusaUrl}store/regions`, {headers})
            .catch(() => ({regions: []}))
        regionId = regions[0]?.id
    }

    try {
        const {product} = await $fetch<{ product: StoreProduct }>(`${config.medusaUrl}store/products/${id}`, {
            headers,
            query: {
                fields: PRODUCT_FIELDS,
                region_id: regionId,
                sales_channel_id: salesChannelId
            }
        })

        return {product, region_id: regionId, sales_channel_id: salesChannelId}
    } catch (error: any) {
        if (error?.statusCode === 404 || error?.response?.status === 404) {
            throw createError({statusCode: 404, statusMessage: 'Product not found'})
        }
        throw createError({statusCode: 500, statusMessage: 'Could not fetch product'})
    }
})
