import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const mainCss = readFileSync('app/assets/css/main.css', 'utf8')

describe('main.css', () => {
    it('sets the brand colors', () => {
        expect(mainCss).toContain('--ui-primary:')
        expect(mainCss).toContain('--ui-bg:')
    })

    it('does not reference the --ui-color-* properties, which Nuxt UI only generates in the browser', () => {
        expect(mainCss).not.toContain('--ui-color-')
    })
})
