import {afterEach, describe, expect, it} from 'vitest'
import {mountSuspended} from '@nuxt/test-utils/runtime'
import ProductPageHeader from '~/components/productPageHeader.vue'

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

afterEach(() => {
    wrapper?.unmount()
})

describe('product page header', () => {
    it('shows the title', async () => {
        wrapper = await mountSuspended(ProductPageHeader, {props: {title: 'Trading Card Game (TCG) Collection'}})

        expect(wrapper.find('h1').text()).toBe('Trading Card Game (TCG) Collection')
    })

    it('shows the badge and description when given', async () => {
        wrapper = await mountSuspended(ProductPageHeader, {
            props: {title: 'TCG Collection', badge: 'TCG', description: 'Browse our catalog.'}
        })

        expect(wrapper.text()).toContain('TCG')
        expect(wrapper.text()).toContain('Browse our catalog.')
    })

    it('shows no badge when none is given', async () => {
        wrapper = await mountSuspended(ProductPageHeader, {props: {title: 'TCG Collection'}})

        expect(wrapper.find('span').exists()).toBe(false)
    })
})
