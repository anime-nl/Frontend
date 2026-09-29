export type CookieConsent = 'granted' | 'denied'

const storageKey = 'cookie-consent'

/**
 * Reads the visitor's stored cookie consent choice
 * @returns 'granted' or 'denied' if the visitor already chose, otherwise null
 */
export function getCookieConsent(): CookieConsent | null {
    const value = localStorage.getItem(storageKey)
    return value === 'granted' || value === 'denied' ? value : null
}

/**
 * Stores the visitor's cookie consent choice
 * @param consent 'granted' or 'denied'
 */
export function setCookieConsent(consent: CookieConsent): void {
    localStorage.setItem(storageKey, consent)
}

/**
 * Checks the browser's Do Not Track preference
 * @param doNotTrack Value of navigator.doNotTrack
 * @returns True when the visitor has asked not to be tracked
 */
export function isDoNotTrackEnabled(doNotTrack: string | null): boolean {
    return doNotTrack === '1'
}
