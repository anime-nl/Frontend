import {appendResponseHeader} from 'h3'
import type {H3Event} from 'h3'

/**
 * Forwards a cookie an internal SSR-time fetch response set or deleted onto the real page
 * response. Nuxt/Nitro runs the internal fetch for a relative URL during SSR against its own
 * H3Event, separate from the page's own response event, so a cookie header set on it would
 * otherwise never reach the browser.
 * @param event The outer page's H3 event (from `useRequestEvent()`), or undefined on the client
 * @param response The Fetch API response from the internal call
 */
export function forwardSetCookie(event: H3Event | undefined, response: Response): void {
    if (!event) return

    const cookie = response.headers.get('set-cookie')
    if (cookie) appendResponseHeader(event, 'set-cookie', cookie)
}
