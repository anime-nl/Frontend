/** Dutch-formatted currency, used everywhere a price is shown to the customer. */
export function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('nl-NL', {style: 'currency', currency: currency.toUpperCase()}).format(amount)
}
