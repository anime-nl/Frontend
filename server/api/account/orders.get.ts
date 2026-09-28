import type {StoreOrder} from '@medusajs/types'
import {SESSION_COOKIE} from '../../utils/session'

/**
 * GET /api/account/orders - the signed-in customer's 20 most recent orders.
 * @returns The customer's orders, newest first
 */
export default defineEventHandler(async (event) => {
    const token = getCookie(event, SESSION_COOKIE)
    if (!token) {
        throw createError({statusCode: 401, statusMessage: 'Not signed in'})
    }

    return medusaFetch<{orders: StoreOrder[]}>(event, 'orders', {token, query: {limit: 20, order: '-created_at'}})
})
