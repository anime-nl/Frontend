import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {getCookieConsent, isDoNotTrackEnabled, setCookieConsent} from '../../shared/utils/cookieConsent'

/** Minimal in-memory stand-in for the browser's localStorage, since the unit test environment is plain Node */
function createLocalStorageStub() {
    const store = new Map<string, string>()
    return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
        clear: () => store.clear()
    }
}

describe('cookie consent storage', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', createLocalStorageStub())
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('returns null when no choice has been stored', () => {
        expect(getCookieConsent()).toBeNull()
    })

    it('returns the stored choice after it is set to granted', () => {
        setCookieConsent('granted')
        expect(getCookieConsent()).toBe('granted')
    })

    it('returns the stored choice after it is set to denied', () => {
        setCookieConsent('denied')
        expect(getCookieConsent()).toBe('denied')
    })
})

describe('isDoNotTrackEnabled', () => {
    it('is true when the browser sends "1"', () => {
        expect(isDoNotTrackEnabled('1')).toBe(true)
    })

    it('is false when the browser sends "0"', () => {
        expect(isDoNotTrackEnabled('0')).toBe(false)
    })

    it('is false when the browser does not send a preference', () => {
        expect(isDoNotTrackEnabled(null)).toBe(false)
    })
})
