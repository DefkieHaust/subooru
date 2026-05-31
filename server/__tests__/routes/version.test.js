import { describe, it, expect } from 'vitest'
import supertest from 'supertest'
import app from '../../app.js'

describe('GET /api/version', () => {
  it('returns version string', async () => {
    const res = await supertest(app).get('/api/version')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('version')
    expect(typeof res.body.version).toBe('string')
  })
})
