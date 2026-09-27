import {afterEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import ProductsIndexPage from '~/pages/products/index.vue'

registerEndpoint('/api/products', () => ({products: [{id: 'prod_1', title: 'Zhongli Keychain', thumbnail: null}]}))

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

afterEach(() => {
    wrapper?.unmount()
})

describe('products index page', () => {
    it('shows the products from the store API route', async () => {
        wrapper = await mountSuspended(ProductsIndexPage)

        expect(wrapper.text()).toContain('Zhongli Keychain')
    })

    it('keeps search engines from indexing this unlinked duplicate of /search', async () => {
        wrapper = await mountSuspended(ProductsIndexPage)

        await vi.waitFor(() =>
            expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex')
        )
    })
})
