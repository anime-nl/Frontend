import {afterEach, describe, expect, it} from 'vitest'
import {mountSuspended} from '@nuxt/test-utils/runtime'
import ShowcaseCarousel from '~/components/showcaseCarousel.vue'

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

afterEach(() => {
    wrapper?.unmount()
})

describe('showcase carousel', () => {
    it('shows every showcase image', async () => {
        wrapper = await mountSuspended(ShowcaseCarousel, {attachTo: document.body})

        const images = wrapper.findAll('img')
        expect(images.length).toBeGreaterThan(0)
        for (const image of images) {
            expect(image.attributes('src')).toMatch(/^https:\/\/picsum\.photos\//)
        }
    })
})
