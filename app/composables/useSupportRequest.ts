import type {SupportRequest} from '#shared/utils/support'

/**
 * Submits a support request, emailed to the store's support address.
 * @param request Support form fields to send
 * @param locale Site locale, used to send the notification email in the right language
 */
export async function submitSupportRequest(request: SupportRequest, locale: string): Promise<void> {
    await $fetch('/api/support', {method: 'POST', body: request, headers: {'x-site-locale': locale}})
}
