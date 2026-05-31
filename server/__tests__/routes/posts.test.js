import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import nock from 'nock'
import app from '../../app.js'

const GELBOORU = 'https://gelbooru.com'

function mockGelbooru(tags, posts = [], count = 0) {
  nock(GELBOORU)
    .get('/index.php')
    .query(q => q.tags === tags)
    .reply(200, {
      '@attributes': { count },
      post: posts,
    })
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
    mockGelbooru('rating:general -real_life', [
      { id: 1, file_url: 'https://img.example.com/1.jpg', preview_url: 'https://img.example.com/1p.jpg', tags: 'tag1 tag2', score: 10, rating: 's', width: 100, height: 200, owner: 'user', creator_id: '1', source: 'https://src', created_at: '2024-01-01', sample_url: 'https://img.example.com/1s.jpg', sample_width: 50, sample_height: 100, preview_width: 25, preview_height: 50 },
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
    mockGelbooru('rating:general cat -real_life', [], 0)

    const res = await supertest(app).get('/api/posts?page=1&q=cat')
    expect(res.status).toBe(200)
  })

  it('strips blacklisted tags', async () => {
    mockGelbooru('rating:general -real_life', [
      { id: 2, file_url: 'https://img.example.com/2.jpg', preview_url: '', tags: 'a b', score: 5, rating: 'q', width: 50, height: 50, owner: '', creator_id: '', source: '', created_at: '', sample_url: '', sample_width: 0, sample_height: 0, preview_width: 0, preview_height: 0 },
    ], 1)

    const res = await supertest(app).get('/api/posts?page=1&q=real_life')
    expect(res.status).toBe(200)
    // real_life is in conf.json.server.blacklist so it should be stripped
    // and the query sent to Gelbooru should be 'rating:general -real_life'
  })

  it('rejects pages over 200', async () => {
    const res = await supertest(app).get('/api/posts?page=201')
    expect(res.status).toBe(400)
  })

  it('treats page < 0 as page 1', async () => {
    mockGelbooru('rating:general -real_life', [], 0)

    const res = await supertest(app).get('/api/posts?page=0')
    expect(res.status).toBe(200)
  })
})
