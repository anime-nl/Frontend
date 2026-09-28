import {findOAuthProvider} from '#shared/utils/auth'

/**
 * POST /api/auth/:provider/start - starts an OAuth sign-in flow.
 * @returns The provider URL to redirect the visitor to
 */
export default defineEventHandler(async (event) => {
    const provider = getRouterParam(event, 'provider')
    if (!findOAuthProvider(provider)) {
        throw createError({statusCode: 400, statusMessage: 'Unknown sign-in provider'})
    }

    return medusaFetch<{location: string}>(event, `customer/${provider}`, {method: 'POST', base: 'auth'})
})
