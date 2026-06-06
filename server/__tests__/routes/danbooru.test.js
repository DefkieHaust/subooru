import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import nock from 'nock'
import {
  initDanbooruClient,
  fetchDanbooru,
  listPosts,
  listTags,
  searchTags
} from '../../danbooru.js'

const DANBOORU = 'https://danbooru.donmai.us'

const mockPosts = [
  {
    id: 1,
    created_at: '2024-01-01T00:00:00.000-05:00',
    score: 10,
    rating: 's',
    source: 'https://example.com',
    uploader_name: 'user1',
    tag_string: 'cat black',
    preview_file_url: 'https://cdn.danbooru.donmai.us/preview/1.jpg',
    preview_file_width: 150,
    preview_file_height: 200,
    large_file_url: 'https://cdn.danbooru.donmai.us/large/1.jpg',
    large_file_width: 600,
    large_file_height: 800,
    file_url: 'https://cdn.danbooru.donmai.us/images/1.jpg',
    image_width: 1920,
    image_height: 1080
  },
  {
    id: 2,
    created_at: '2024-01-02T00:00:00.000-05:00',
    score: 5,
    rating: 'q',
    source: '',
    uploader_name: 'user2',
    tag_string: 'dog',
    preview_file_url: 'https://cdn.danbooru.donmai.us/preview/2.jpg',
    preview_file_width: 100,
    preview_file_height: 100,
    large_file_url: null,
    large_file_width: null,
    large_file_height: null,
    file_url: 'https://cdn.danbooru.donmai.us/images/2.jpg',
    image_width: 800,
    image_height: 600
  }
]

beforeAll(() => {
  nock.disableNetConnect()
  nock.enableNetConnect(/(localhost|127\.0\.0\.1)/)
})

afterAll(() => {
  nock.enableNetConnect()
})

beforeEach(() => {
  initDanbooruClient({
    enabled: true,
    endpoints: { posts: 60000, tags: 60000, tags_search: 60000 },
    default_ttl_ms: 60000
  })
})

describe('listPosts', () => {
  it('returns mapped posts with total count from counts endpoint', async () => {
    nock(DANBOORU)
      .get('/posts.json')
      .query({ tags: 'cat_header', page: '1', limit: '100' })
      .reply(200, mockPosts)
    nock(DANBOORU)
      .get('/counts/posts.json')
      .query({ tags: 'cat_header' })
      .reply(200, { counts: { posts: 50000 } })

    const result = await listPosts('cat_header', 1)

    expect(result.total_count).toBe(50000)
    expect(result.count_per_page).toBe(100)
    expect(result.results).toHaveLength(2)

    const post = result.results[0]
    expect(post.id).toBe(1)
    expect(post.image_url).toBe(mockPosts[0].file_url)
    expect(post.thumbnail_url).toBe(mockPosts[0].preview_file_url)
    expect(post.sample_url).toBe(mockPosts[0].large_file_url)
    expect(post.tags).toEqual(['cat', 'black'])
    expect(post.score).toBe(10)
    expect(post.rating).toBe('s')
    expect(post.width).toBe(1920)
    expect(post.height).toBe(1080)
    expect(post.source_url).toBe('https://example.com')
    expect(post.uploader).toBe('user1')

    const post2 = result.results[1]
    expect(post2.id).toBe(2)
    expect(post2.tags).toEqual(['dog'])
    expect(post2.sample_url).toBe('')
  })

  it('falls back to data.length when count endpoint fails', async () => {
    nock(DANBOORU)
      .get('/posts.json')
      .query({ tags: 'cat', page: '1', limit: '100' })
      .reply(200, mockPosts)
    nock(DANBOORU)
      .get('/counts/posts.json')
      .query({ tags: 'cat' })
      .reply(500)

    const result = await listPosts('cat', 1)

    expect(result.total_count).toBe(2)
    expect(result.results).toHaveLength(2)
  })
})

describe('listTags', () => {
  it('returns mapped tags', async () => {
    nock(DANBOORU)
      .get('/tags.json')
      .query({ 'search[name_matches]': 'cat' })
      .reply(200, [
        { name: 'cat', type: 0, post_count: 1000 }
      ])

    const result = await listTags('cat')

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      name: 'cat',
      type: 'general',
      count: 1000
    })
  })
})

describe('searchTags', () => {
  it('returns mapped autocomplete results', async () => {
    nock(DANBOORU)
      .get('/autocomplete.json')
      .query({ 'search[query]': 'cat', 'search[type]': 'tag' })
      .matchHeader('Accept', 'application/json')
      .reply(200, [
        { value: 'cat', category: 0, post_count: 1000 }
      ])

    const result = await searchTags('cat')

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      name: 'cat',
      type: 'general',
      count: 1000
    })
  })

  it('maps numeric category to tag type', async () => {
    nock(DANBOORU)
      .get('/autocomplete.json')
      .query({ 'search[query]': 'cat_artist', 'search[type]': 'tag' })
      .matchHeader('Accept', 'application/json')
      .reply(200, [
        { value: 'foo_(artist)', category: 1, post_count: 500 }
      ])

    const result = await searchTags('cat_artist')

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      name: 'foo_(artist)',
      type: 'artist',
      count: 500
    })
  })
})

describe('fetchDanbooru', () => {
  describe('with auth env vars set', () => {
    beforeEach(() => {
      process.env.DANBOORU_USERNAME = 'user'
      process.env.DANBOORU_API_KEY = 'key'
    })

    afterEach(() => {
      delete process.env.DANBOORU_USERNAME
      delete process.env.DANBOORU_API_KEY
    })

    it('sends Basic auth when env vars set', async () => {
      const scope = nock(DANBOORU)
        .get('/posts.json')
        .query(true)
        .matchHeader('Authorization', /^Basic /)
        .reply(200, [])

      const result = await fetchDanbooru('/posts.json', { tags: 'test' })

      expect(scope.isDone()).toBe(true)
      expect(result.data).toEqual([])
    })
  })

  it('throws on non-2xx', async () => {
    nock(DANBOORU)
      .get('/posts.json')
      .query(true)
      .reply(500)

    await expect(fetchDanbooru('/posts.json', {})).rejects.toThrow('Danbooru API error: 500')
  })

  it('caches responses', async () => {
    nock(DANBOORU)
      .get('/posts.json')
      .query({ tags: 'cache_test', page: '1', limit: '100' })
      .reply(200, [{ id: 1 }])

    const result1 = await fetchDanbooru('/posts.json', {
      tags: 'cache_test',
      page: '1',
      limit: '100'
    })

    // second call should come from cache, no nock mock needed
    const result2 = await fetchDanbooru('/posts.json', {
      tags: 'cache_test',
      page: '1',
      limit: '100'
    })

    // both responses are wrapped { data, headers }; cached has headers: null
    expect(result2).toEqual({ data: result1.data, headers: null })
  })
})
