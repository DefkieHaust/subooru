import { describe, it, expect } from 'vitest'
import { withSourceFallback } from '../../source-fallback.js'

describe('withSourceFallback', () => {
  it('returns data from primary source on success', async () => {
    const result = await withSourceFallback('gelbooru', (s) =>
      Promise.resolve({ items: [1] })
    )

    expect(result).toEqual({
      data: { items: [1] },
      source: 'gelbooru'
    })
  })

  it('falls back to secondary when primary fails', async () => {
    const result = await withSourceFallback('gelbooru', (s) =>
      s === 'gelbooru'
        ? Promise.reject(new Error('fail'))
        : Promise.resolve({ items: [2] })
    )

    expect(result).toEqual({
      data: { items: [2] },
      source: 'danbooru'
    })
  })

  it('throws when both sources fail', async () => {
    const promise = withSourceFallback('gelbooru', (s) =>
      Promise.reject(new Error('fail'))
    )

    await expect(promise).rejects.toThrow('fail')
  })

  it('works in reverse (primary danbooru falls back to gelbooru)', async () => {
    const result = await withSourceFallback('danbooru', (s) =>
      s === 'danbooru'
        ? Promise.reject(new Error('fail'))
        : Promise.resolve({ items: [3] })
    )

    expect(result).toEqual({
      data: { items: [3] },
      source: 'gelbooru'
    })
  })
})
