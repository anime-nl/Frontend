import {describe, expect, it} from 'vitest'
import {mountSuspended} from '@nuxt/test-utils/runtime'
import SupportIndex from '~/pages/support/index.vue'
import {supportTopics} from '#shared/utils/support'

describe('support overview page', () => {
    it('links to a form for every topic', async () => {
        const wrapper = await mountSuspended(SupportIndex)

        for (const topic of supportTopics) {
            expect(wrapper.find(`a[href="/support/${topic.slug}"]`).exists(), topic.slug).toBe(true)
            expect(wrapper.text()).toContain(topic.title)
        }
    })

    it('shows the frequently asked questions', async () => {
        const wrapper = await mountSuspended(SupportIndex)

        expect(wrapper.text()).toContain('How long does shipping take?')
        expect(wrapper.text()).toContain('What is your return policy?')
    })

    it('offers to email the support address', async () => {
        const wrapper = await mountSuspended(SupportIndex)

        expect(wrapper.find('a[href="mailto:info@animenl.nl"]').exists()).toBe(true)
    })
})
