import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {createError} from 'h3'
import ProductsIndexPage from '~/pages/products/index.vue'

let shouldFail = false

registerEndpoint('/api/products', () => {
    if (shouldFail) throw createError({statusCode: 500})
    return {products: [{id: 'prod_1', title: 'Zhongli Keychain', thumbnail: null}]}
})

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

beforeEach(() => {
    shouldFail = false
})

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

    it('shows an error message when the products request fails, in the default (Dutch) locale', async () => {
        shouldFail = true
        wrapper = await mountSuspended(ProductsIndexPage)

        expect(wrapper.text()).toContain('Er ging iets mis bij het laden van de producten')
    })
})
