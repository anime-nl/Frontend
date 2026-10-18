export const PREORDER_RELEASE_DATE_KEY = 'preorder_release_date'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Reads the release date a product is pre-ordered until. Shop owners set it as the product metadata
 * `preorder_release_date` (YYYY-MM-DD) in the Medusa admin; the product counts as a pre-order until that day starts (UTC).
 * @param product Anything with Medusa product metadata
 * @param now The moment to compare against, injectable for tests
 * @returns The release date as YYYY-MM-DD, or null when the product has no valid date or it has already passed
 */
export function getPreorderReleaseDate(
    product: {metadata?: Record<string, unknown> | null},
    now: Date = new Date()
): string | null {
    const value = product.metadata?.[PREORDER_RELEASE_DATE_KEY]
    if (typeof value !== 'string' || !ISO_DATE.test(value)) return null

    const release = new Date(`${value}T00:00:00Z`)
    if (Number.isNaN(release.getTime()) || release.getTime() <= now.getTime()) return null
    return value
}

/**
 * @param releaseDate A release date as returned by `getPreorderReleaseDate`
 * @param locale BCP-47 locale tag, e.g. "nl"
 * @returns The date written out for the locale, e.g. "1 december 2026"
 */
export const formatReleaseDate = (releaseDate: string, locale: string) =>
    new Intl.DateTimeFormat(locale, {dateStyle: 'long', timeZone: 'UTC'}).format(new Date(`${releaseDate}T00:00:00Z`))
