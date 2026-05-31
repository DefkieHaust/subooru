import { describe, it, expect } from 'vitest'
import { resolveTagType, tagBadgeColor, tagTextColor } from '../utils.js'

describe('utils.js', () => {
  describe('resolveTagType', () => {
    it('returns metadata for colon-prefixed tags', () => {
      expect(resolveTagType({ name: 'rating:general', type: 'general' })).toBe('metadata')
    })

    it('returns the tag type for regular tags', () => {
      expect(resolveTagType({ name: 'cat', type: 'general' })).toBe('general')
      expect(resolveTagType({ name: 'hakurei_reimu', type: 'character' })).toBe('character')
    })
  })

  describe('tagBadgeColor', () => {
    it('returns bg-info for artist', () => {
      expect(tagBadgeColor('artist')).toContain('bg-info')
    })

    it('returns bg-success for character', () => {
      expect(tagBadgeColor('character')).toContain('bg-success')
    })

    it('returns bg-warning for copyright', () => {
      expect(tagBadgeColor('copyright')).toContain('bg-warning')
    })

    it('returns bg-secondary for metadata', () => {
      expect(tagBadgeColor('metadata')).toContain('bg-secondary')
    })

    it('returns bg-primary as default', () => {
      expect(tagBadgeColor('general')).toContain('bg-primary')
    })

    it('respects overrides via name parameter', () => {
      expect(tagBadgeColor('artist', 'artist_name')).toContain('bg-info')
    })
  })

  describe('tagTextColor', () => {
    it('returns text-info for artist', () => {
      expect(tagTextColor('artist')).toContain('text-info')
    })

    it('returns text-success for character', () => {
      expect(tagTextColor('character')).toContain('text-success')
    })

    it('returns empty string as default', () => {
      expect(tagTextColor('general')).toBe('')
    })
  })
})
