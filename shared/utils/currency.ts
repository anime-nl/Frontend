/**
 * Locale-formatted currency, used everywhere a price is shown to the customer.
 * @param amount Amount in the currency's major unit (e.g. euros, not cents)
 * @param currency ISO 4217 currency code, any case
 * @param localeTag BCP-47 locale tag controlling number formatting (grouping/decimal separators);
 *   the currency itself stays whatever `currency` says regardless of locale
 * @returns The amount formatted for localeTag, e.g. "€ 12,34"
 */
export function formatCurrency(amount: number, currency: string, localeTag: string): string {
    return new Intl.NumberFormat(localeTag, {style: 'currency', currency: currency.toUpperCase()}).format(amount)
}
