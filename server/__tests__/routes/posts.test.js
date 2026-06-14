import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import nock from 'nock'
import app from '../../app.js'

const DANBOORU = 'https://danbooru.donmai.us'

function mockDanbooru(tags, exclude, posts = [], totalCount = 0) {
  nock(DANBOORU)
    .persist()
    .get('/posts.json')
    .query(q => q.tags === tags && q.exclude_tags === exclude)
    .reply(200, posts)
  nock(DANBOORU)
    .persist()
    .get('/counts/posts.json')
    .query(q => q.tags === tags)
    .reply(200, { counts: { posts: totalCount } })
}

beforeAll(() => {
  nock.disableNetConnect()
  nock.enableNetConnect(/(localhost|127\.0\.0\.1)/)
})

afterAll(() => {
  nock.enableNetConnect()
})

describe('GET /api/posts', () => {
  it('returns posts with valid response', async () => {
    mockDanbooru('rating:general', 'real_life', [
      { id: 1, file_url: 'https://img.example.com/1.jpg', preview_file_url: 'https://img.example.com/1p.jpg', tag_string: 'tag1 tag2', score: 10, rating: 's', image_width: 100, image_height: 200, uploader_name: 'user', source: 'https://src', created_at: '2024-01-01T00:00:00.000Z', large_file_url: 'https://img.example.com/1s.jpg', large_file_width: 50, large_file_height: 100, preview_file_width: 25, preview_file_height: 50 },
    ], 1)

    const res = await supertest(app).get('/api/posts?page=1')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('results')
    expect(res.body.results).toHaveLength(1)
    expect(res.body.results[0].id).toBe(1)
    expect(res.body.results[0].image_url).toBe('https://img.example.com/1.jpg')
    expect(res.body.results[0].tags).toEqual(['tag1', 'tag2'])
    expect(res.body.total_count).toBe(1)
  })

  it('passes user tags through', async () => {
    mockDanbooru('rating:general cat', 'real_life', [], 0)

    const res = await supertest(app).get('/api/posts?page=1&q=cat')
    expect(res.status).toBe(200)
  })

  it('strips blacklisted tags', async () => {
    mockDanbooru('rating:general', 'real_life', [
      { id: 2, file_url: 'https://img.example.com/2.jpg', preview_file_url: '', tag_string: 'a b', score: 5, rating: 'q', image_width: 50, image_height: 50, uploader_name: '', source: '', created_at: '', large_file_url: null, large_file_width: null, large_file_height: null, preview_file_width: 0, preview_file_height: 0 },
    ], 1)

    const res = await supertest(app).get('/api/posts?page=1&q=real_life')
    expect(res.status).toBe(200)
    // real_life is in conf.yml.server.blacklist so it should be stripped
    // and the query sent to Danbooru should be 'rating:general'
  })

  it('rejects pages over 200', async () => {
    const res = await supertest(app).get('/api/posts?page=201')
    expect(res.status).toBe(400)
  })

  it('treats page < 0 as page 1', async () => {
    mockDanbooru('rating:general', 'real_life', [], 0)

    const res = await supertest(app).get('/api/posts?page=0')
    expect(res.status).toBe(200)
  })
})
