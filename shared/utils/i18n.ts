import de from '../../i18n/locales/de.json'
import en from '../../i18n/locales/en.json'
import nl from '../../i18n/locales/nl.json'

export const SUPPORTED_LOCALES = ['nl', 'en', 'de'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: SupportedLocale = 'nl'

const catalogs: Record<SupportedLocale, Record<string, unknown>> = {nl, en, de}

function lookup(catalog: Record<string, unknown>, key: string): string | undefined {
    const value = key.split('.').reduce<unknown>((node, segment) => {
        if (typeof node !== 'object' || node === null) return undefined
        return (node as Record<string, unknown>)[segment]
    }, catalog)

    return typeof value === 'string' ? value : undefined
}

/**
 * Narrows an unknown value to one of the site's supported locale codes.
 * @param value Candidate locale code, typically from an untrusted header or query param
 * @returns Whether value is one of SUPPORTED_LOCALES
 */
export function isSupportedLocale(value: unknown): value is SupportedLocale {
    return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

/**
 * Translates a key against the site's locale catalogs, for server-side code that has no vue-i18n
 * runtime available. Falls back to DEFAULT_LOCALE when the key is missing from the requested locale.
 * @param locale Site locale to translate into
 * @param key Dot-separated path into the locale catalog, e.g. "support.email.subject"
 * @param params Named values substituted for "{name}"-style placeholders in the template
 * @returns The translated, interpolated string
 */
export function translate(locale: SupportedLocale, key: string, params?: Record<string, string | number>): string {
    const template = lookup(catalogs[locale], key) ?? lookup(catalogs[DEFAULT_LOCALE], key)
    if (template === undefined) throw new Error(`Missing translation key: ${key}`)

    return params ? template.replace(/\{(\w+)\}/g, (match, name) => String(params[name] ?? match)) : template
}
