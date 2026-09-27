/**
 * Dutch-formatted currency, used everywhere a price is shown to the customer.
 * @param amount Amount in the currency's major unit (e.g. euros, not cents)
 * @param currency ISO 4217 currency code, any case
 * @returns The amount formatted for the nl-NL locale, e.g. "€ 12,34"
 */
export function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('nl-NL', {style: 'currency', currency: currency.toUpperCase()}).format(amount)
}
