import {isProductionEnv} from '#shared/utils/env'

export const SESSION_COOKIE = 'medusa_session'

export const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProductionEnv(process.env.NODE_ENV),
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
}

/**
 * Reads the actor id and metadata out of a Medusa JWT without verifying its signature: the token
 * only ever reaches this function right after Medusa itself issued it, over a server-to-server call.
 */
export function decodeJwtPayload(token: string): {actor_id?: string; user_metadata?: Record<string, unknown>} {
    const payload = token.split('.')[1]
    if (!payload) return {}

    try {
        return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    } catch {
        return {}
    }
}
