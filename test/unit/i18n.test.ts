import {describe, expect, it, vi} from 'vitest'
import {DEFAULT_LOCALE, SUPPORTED_LOCALES, isSupportedLocale, translate} from '../../shared/utils/i18n'

describe('isSupportedLocale', () => {
    it('accepts every configured locale code', () => {
        for (const locale of SUPPORTED_LOCALES) {
            expect(isSupportedLocale(locale)).toBe(true)
        }
    })

    it('rejects a locale code that is not configured', () => {
        expect(isSupportedLocale('fr')).toBe(false)
    })

    it('rejects non-string values', () => {
        expect(isSupportedLocale(undefined)).toBe(false)
        expect(isSupportedLocale(null)).toBe(false)
        expect(isSupportedLocale(42)).toBe(false)
    })
})

describe('translate', () => {
    it('looks up a nested key in the requested locale', () => {
        expect(translate('nl', 'common.appName')).toBe('AnimeNL')
        expect(translate('en', 'common.appName')).toBe('AnimeNL')
    })

    it('substitutes named params into the template', () => {
        expect(translate('nl', 'common.greeting', {name: 'Alex'})).toBe('Hallo Alex')
        expect(translate('en', 'common.greeting', {name: 'Alex'})).toBe('Hello Alex')
    })

    it('leaves an unmatched placeholder untouched when its param is missing', () => {
        expect(translate('nl', 'common.greeting')).toBe('Hallo {name}')
    })

    it('throws when the key exists in no catalog', () => {
        expect(() => translate('nl', 'nothing.here')).toThrow('Missing translation key: nothing.here')
    })

    it('falls back to the default locale when the key is missing from the requested locale', async () => {
        vi.resetModules()
        vi.doMock('../../i18n/locales/en.json', () => ({default: {}}))

        const {translate: translateWithMock} = await import('../../shared/utils/i18n')

        expect(translateWithMock('en', 'common.appName')).toBe('AnimeNL')

        vi.doUnmock('../../i18n/locales/en.json')
        vi.resetModules()
    })
})

describe('DEFAULT_LOCALE', () => {
    it('is one of the supported locales', () => {
        expect(SUPPORTED_LOCALES).toContain(DEFAULT_LOCALE)
    })
})
