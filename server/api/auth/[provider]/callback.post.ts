import {findOAuthProvider} from '#shared/utils/auth'
import {CART_ID_COOKIE} from '../../../utils/cart'
import {SESSION_COOKIE, SESSION_COOKIE_OPTIONS, decodeJwtPayload} from '../../../utils/session'

export default defineEventHandler(async (event) => {
    const provider = getRouterParam(event, 'provider')
    if (!findOAuthProvider(provider)) {
        throw createError({statusCode: 400, statusMessage: 'Unknown sign-in provider'})
    }

    const query = (await readBody<Record<string, unknown>>(event)) ?? {}

    let token: string
    try {
        const result = await medusaFetch<{token: string}>(event, `customer/${provider}/callback`, {
            method: 'POST',
            base: 'auth',
            query
        })
        token = result.token
    } catch {
        throw createError({statusCode: 401, statusMessage: 'Sign-in failed'})
    }

    const decoded = decodeJwtPayload(token)

    // An empty actor_id means Google authenticated a new identity that has no customer record yet
    if (!decoded.actor_id) {
        await medusaFetch(event, 'customers', {method: 'POST', token, body: {email: decoded.user_metadata?.email}})
        const refreshed = await medusaFetch<{token: string}>(event, 'token/refresh', {
            method: 'POST',
            base: 'auth',
            token
        })
        token = refreshed.token
    }

    setCookie(event, SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS)

    const cartId = getCookie(event, CART_ID_COOKIE)
    if (cartId) {
        // Best-effort: a guest keeps their cart as a guest cart if this fails, sign-in still succeeds
        await medusaFetch(event, `carts/${cartId}/customer`, {method: 'POST', token}).catch(() => {})
    }

    return {ok: true}
})
