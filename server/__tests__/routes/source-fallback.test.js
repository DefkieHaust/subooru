import { describe, it, expect } from 'vitest'
import { withSourceFallback } from '../../source-fallback.js'

describe('withSourceFallback', () => {
  it('returns data from first source on success', async () => {
    const result = await withSourceFallback(['gelbooru', 'danbooru'], (s) =>
      Promise.resolve({ items: [1] })
    )

    expect(result).toEqual({
      data: { items: [1] },
      source: 'gelbooru'
    })
  })

  it('falls back to next source when first fails', async () => {
    const result = await withSourceFallback(['gelbooru', 'danbooru'], (s) =>
      s === 'gelbooru'
        ? Promise.reject(new Error('fail'))
        : Promise.resolve({ items: [2] })
    )

    expect(result).toEqual({
      data: { items: [2] },
      source: 'danbooru'
    })
  })

  it('throws when all sources fail', async () => {
    const promise = withSourceFallback(['gelbooru', 'danbooru'], (s) =>
      Promise.reject(new Error('fail'))
    )

    await expect(promise).rejects.toThrow('fail')
  })

  it('respects array order (danbooru first falls back to gelbooru)', async () => {
    const result = await withSourceFallback(['danbooru', 'gelbooru'], (s) =>
      s === 'danbooru'
        ? Promise.reject(new Error('fail'))
        : Promise.resolve({ items: [3] })
    )

    expect(result).toEqual({
      data: { items: [3] },
      source: 'gelbooru'
    })
  })

  it('works with single source in array', async () => {
    const result = await withSourceFallback(['gelbooru'], (s) =>
      Promise.resolve({ items: [4] })
    )

    expect(result).toEqual({
      data: { items: [4] },
      source: 'gelbooru'
    })
  })

  it('throws when single source fails', async () => {
    const promise = withSourceFallback(['danbooru'], (s) =>
      Promise.reject(new Error('fail'))
    )

    await expect(promise).rejects.toThrow('fail')
  })
})
