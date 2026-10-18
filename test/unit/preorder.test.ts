import {describe, expect, it} from 'vitest'
import {formatReleaseDate, getPreorderReleaseDate} from '#shared/utils/preorder'

const now = new Date('2026-10-18T12:00:00Z')

describe('getPreorderReleaseDate', () => {
    it('returns the release date while it is in the future', () => {
        expect(getPreorderReleaseDate({metadata: {preorder_release_date: '2026-12-01'}}, now)).toBe('2026-12-01')
    })

    it('returns null once the release day has started', () => {
        expect(getPreorderReleaseDate({metadata: {preorder_release_date: '2026-10-18'}}, now)).toBeNull()
        expect(getPreorderReleaseDate({metadata: {preorder_release_date: '2026-01-01'}}, now)).toBeNull()
    })

    it('returns null without metadata or without the key', () => {
        expect(getPreorderReleaseDate({}, now)).toBeNull()
        expect(getPreorderReleaseDate({metadata: null}, now)).toBeNull()
        expect(getPreorderReleaseDate({metadata: {other: 'x'}}, now)).toBeNull()
    })

    it.each(['soon', '2026-13-45', '01-12-2026', 20261201, ''])('ignores the invalid value %j', (value) => {
        expect(getPreorderReleaseDate({metadata: {preorder_release_date: value}}, now)).toBeNull()
    })
})

describe('formatReleaseDate', () => {
    it('writes the date out in the given locale without shifting it by time zone', () => {
        expect(formatReleaseDate('2026-12-01', 'nl')).toBe('1 december 2026')
        expect(formatReleaseDate('2026-12-01', 'en')).toBe('December 1, 2026')
    })
})
