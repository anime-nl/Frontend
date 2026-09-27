import {SESSION_COOKIE, SESSION_COOKIE_OPTIONS} from '../../utils/session'

export default defineEventHandler((event) => {
    // Only the session is cleared; a signed-out visitor keeps their cart_id cookie and can keep
    // shopping as a guest
    deleteCookie(event, SESSION_COOKIE, {path: SESSION_COOKIE_OPTIONS.path})
    return {ok: true}
})
