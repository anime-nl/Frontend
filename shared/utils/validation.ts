/**
 * A loose email shape check, not a deliverability check. Shared so the support and checkout forms
 * can't drift into two different definitions of "valid".
 * @param email Email address to check
 * @returns Whether the address has a plausible local-part@domain.tld shape
 */
export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
