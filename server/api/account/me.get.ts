import type {StoreCustomer} from '@medusajs/types'
import {SESSION_COOKIE} from '../../utils/session'

/**
 * GET /api/account/me - the signed-in customer.
 * @returns The current customer
 */
export default defineEventHandler(async (event) => {
    const token = getCookie(event, SESSION_COOKIE)
    if (!token) {
        throw createError({statusCode: 401, statusMessage: 'Not signed in'})
    }

    try {
        return await medusaFetch<{customer: StoreCustomer}>(event, 'customers/me', {token})
    } catch (error) {
        const {statusCode, response} = error as {statusCode?: number; response?: {status?: number}}
        if (statusCode === 401 || response?.status === 401) {
            deleteCookie(event, SESSION_COOKIE, {path: '/'})
        }
        throw createError({statusCode: 401, statusMessage: 'Not signed in'})
    }
})
