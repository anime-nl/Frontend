import {afterEach, describe, expect, it} from 'vitest'
import {mountSuspended} from '@nuxt/test-utils/runtime'
import SearchBar from '~/components/searchBar.vue'

const mountSearchBar = () => mountSuspended(SearchBar, {attachTo: document.body})

let wrapper: Awaited<ReturnType<typeof mountSearchBar>> | undefined

afterEach(() => {
    wrapper?.unmount()
})

describe('search bar', () => {
    it('links to the blank search page before typing anything', async () => {
        wrapper = await mountSearchBar()

        expect(wrapper.find('a').attributes('href')).toBe('/search')
    })

    it('links to the search page with the typed query', async () => {
        wrapper = await mountSearchBar()

        await wrapper.find('input').setValue('Zhongli')

        expect(wrapper.find('a').attributes('href')).toBe('/search?q=Zhongli')
    })

    it('trims whitespace from the query', async () => {
        wrapper = await mountSearchBar()

        await wrapper.find('input').setValue('  Zhongli  ')

        expect(wrapper.find('a').attributes('href')).toBe('/search?q=Zhongli')
    })

    it('links to the blank search page when the query is only whitespace', async () => {
        wrapper = await mountSearchBar()

        await wrapper.find('input').setValue('   ')

        expect(wrapper.find('a').attributes('href')).toBe('/search')
    })
})
