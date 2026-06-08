import { describe, it, expect } from 'vitest'
import supertest from 'supertest'
import app from '../../app.js'

describe('GET /api/config', () => {
  it('returns 200 with expected fields', async () => {
    const res = await supertest(app).get('/api/config')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('include')
    expect(res.body).toHaveProperty('blacklist')
    expect(res.body).toHaveProperty('worker_base')
    expect(res.body).toHaveProperty('server_proxy')
    expect(res.body).toHaveProperty('proxy_thumbnails')
  })

  it('returns server_proxy as boolean', async () => {
    const res = await supertest(app).get('/api/config')
    expect(typeof res.body.server_proxy).toBe('boolean')
  })

  it('returns sources array', async () => {
    const res = await supertest(app).get('/api/config')
    expect(Array.isArray(res.body.sources)).toBe(true)
    expect(res.body.sources.length).toBeGreaterThan(0)
  })
})
