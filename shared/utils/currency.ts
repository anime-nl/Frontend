const formatters = new Map<string, Intl.NumberFormat>()

/**
 * Locale-formatted currency, used everywhere a price is shown to the customer.
 * @param amount Amount in the currency's major unit (e.g. euros, not cents)
 * @param currency ISO 4217 currency code, any case
 * @param localeTag BCP-47 locale tag controlling number formatting (grouping/decimal separators);
 *   the currency itself stays whatever `currency` says regardless of locale
 * @returns The amount formatted for localeTag, e.g. "€ 12,34"
 */
export function formatCurrency(amount: number, currency: string, localeTag: string): string {
    const currencyCode = currency.toUpperCase()
    const key = `${localeTag}:${currencyCode}`

    // Called once per product card and per cart total on every render, so a fresh Intl.NumberFormat
    // per call is wasteful - every (locale, currency) pair reuses the same formatter instance.
    let formatter = formatters.get(key)
    if (!formatter) {
        formatter = new Intl.NumberFormat(localeTag, {style: 'currency', currency: currencyCode})
        formatters.set(key, formatter)
    }

    return formatter.format(amount)
}
