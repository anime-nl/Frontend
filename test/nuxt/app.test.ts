import {afterEach, describe, expect, it} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {createError} from 'h3'
import App from '~/app.vue'

registerEndpoint('/api/cart', () => ({cart: null}))
registerEndpoint('/api/account/me', () => {
    throw createError({statusCode: 401})
})
registerEndpoint('/api/regions', () => ({regions: [{id: 'reg_nl'}]}))
registerEndpoint('/api/products', () => ({products: [], count: 0}))

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

afterEach(() => {
    wrapper?.unmount()
})

describe('app', () => {
    it('shows the navbar and the under-construction banner', async () => {
        wrapper = await mountSuspended(App, {attachTo: document.body, route: '/'})

        expect(wrapper.find('a[href="/support"]').exists()).toBe(true)
        expect(wrapper.text()).toContain('nog in ontwikkeling')
    })
})
