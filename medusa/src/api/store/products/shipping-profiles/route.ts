import type {MedusaRequest, MedusaResponse} from '@medusajs/framework/http'
import {ContainerRegistrationKeys} from '@medusajs/framework/utils'

interface ProductWithShippingProfile {
    id: string
    shipping_profile: {id: string} | null
}

/**
 * GET /store/products/shipping-profiles - each requested product's shipping profile id. The
 * default Store API product and cart endpoints never expose `shipping_profile` (it is not in
 * their field allowlist, only `shipping_profile_id` on shipping options is), so the storefront
 * has no other way to learn which fulfillment profile a product needs.
 * @param req Query param `id`: one or more product ids to look up
 * @param res `shipping_profiles`: each product id paired with its `shipping_profile_id`, `null` when unassigned
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const {id} = req.query
    const productIds = Array.isArray(id) ? (id as string[]) : id ? [id as string] : []

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const {data: products} = (await query.graph({
        entity: 'product',
        filters: {id: productIds},
        fields: ['id', 'shipping_profile.id']
    })) as {data: ProductWithShippingProfile[]}

    res.json({
        shipping_profiles: products.map((product) => ({
            product_id: product.id,
            shipping_profile_id: product.shipping_profile?.id ?? null
        }))
    })
}
