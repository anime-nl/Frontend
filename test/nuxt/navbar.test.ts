import {describe, expect, it} from 'vitest'
import {mountSuspended} from '@nuxt/test-utils/runtime'
import Navbar from '~/components/navbar.vue'

describe('navbar', () => {
    it('links to the support page', async () => {
        const wrapper = await mountSuspended(Navbar)

        const link = wrapper.find('a[href="/support"]')
        expect(link.exists()).toBe(true)
        expect(link.text()).toBe('Support')
    })
})
