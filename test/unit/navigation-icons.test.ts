import {createRequire} from 'node:module'
import {describe, expect, it} from 'vitest'
import {navigationItems} from '../../app/utils/navigation'

const require = createRequire(import.meta.url)

// Collections installed as @iconify-json/* dev dependencies, longest name first so hyphenated
// icon strings (e.g. "i-material-symbols-light:x") are not mistaken for a shorter collection.
const COLLECTIONS = [
    'material-symbols-light',
    'flat-color-icons',
    'material-symbols',
    'game-icons',
    'simple-icons',
    'at-icons',
    'pinhead',
    'mdi',
    'lucide'
].sort((a, b) => b.length - a.length)

function collectIcons(items: {icon?: string; children?: unknown[]}[], icons: string[] = []) {
    for (const item of items) {
        if (item.icon) icons.push(item.icon)
        if (item.children) collectIcons(item.children as typeof items, icons)
    }
    return icons
}

/** Splits "i-<collection><:|-><name>" into its collection and icon name, using the known collection list. */
function parseIcon(icon: string) {
    const withoutPrefix = icon.replace(/^i-/, '')
    const collection = COLLECTIONS.find(
        (c) => withoutPrefix === c || withoutPrefix.startsWith(`${c}:`) || withoutPrefix.startsWith(`${c}-`)
    )
    if (!collection) throw new Error(`Unknown icon collection for "${icon}"`)

    const name = withoutPrefix.slice(collection.length + 1)
    return {collection, name}
}

describe('navbar icons', () => {
    const icons = collectIcons(navigationItems)

    it('references at least one icon', () => {
        expect(icons.length).toBeGreaterThan(0)
    })

    it.each(icons)('%s exists in its locally installed collection', (icon) => {
        const {collection, name} = parseIcon(icon)
        const {icons: collectionIcons} = require(`@iconify-json/${collection}/icons.json`)

        expect(Object.keys(collectionIcons)).toContain(name)
    })
})
