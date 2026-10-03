import {describe, expect, it, vi} from 'vitest'
import {mountSuspended} from '@nuxt/test-utils/runtime'
import SupportIndex from '~/pages/support/index.vue'
import {supportTopics} from '#shared/utils/support'

describe('support overview page', () => {
    it('sets a page title and meta description for search engines', async () => {
        await mountSuspended(SupportIndex)

        await vi.waitFor(() => expect(document.title).toBe('Support | AnimeNL'))
        expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain(
            'bestellingen, verzending, retourneren en producten'
        )
    })

    it('links to a form for every topic', async () => {
        const wrapper = await mountSuspended(SupportIndex)

        const expectedTitles: Record<string, string> = {
            orders: 'Bestellingen',
            shipping: 'Verzending',
            returns: 'Retourneren & terugbetalen',
            payments: 'Betalingen'
        }

        for (const topic of supportTopics) {
            expect(wrapper.find(`a[href="/support/${topic.slug}"]`).exists(), topic.slug).toBe(true)
            expect(wrapper.text()).toContain(expectedTitles[topic.slug])
        }
    })

    it('shows the frequently asked questions', async () => {
        const wrapper = await mountSuspended(SupportIndex)

        expect(wrapper.text()).toContain('Hoe lang duurt de verzending?')
        expect(wrapper.text()).toContain('Wat is jullie retourbeleid?')
    })

    it('offers to email the support address', async () => {
        const wrapper = await mountSuspended(SupportIndex)

        expect(wrapper.find('a[href="mailto:info@animenl.nl"]').exists()).toBe(true)
    })
})
