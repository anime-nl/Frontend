import {SESSION_COOKIE, SESSION_COOKIE_OPTIONS} from '../../utils/session'

/**
 * POST /api/account/logout - clears the session cookie.
 * @returns Confirmation that the visitor is signed out
 */
export default defineEventHandler((event) => {
    // Only the session is cleared; a signed-out visitor keeps their cart_id cookie and can keep
    // shopping as a guest
    deleteCookie(event, SESSION_COOKIE, {path: SESSION_COOKIE_OPTIONS.path})
    return {ok: true}
})
