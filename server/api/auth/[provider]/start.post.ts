import {findOAuthProvider} from '#shared/utils/auth'

export default defineEventHandler(async (event) => {
    const provider = getRouterParam(event, 'provider')
    if (!findOAuthProvider(provider)) {
        throw createError({statusCode: 400, statusMessage: 'Unknown sign-in provider'})
    }

    return medusaFetch<{location: string}>(event, `customer/${provider}`, {method: 'POST', base: 'auth'})
})
