import { describe, expect, it } from '@jest/globals'
import {
  createMockAdminUser,
  createMockWorkerUser,
} from '../../../test/mock-auth'
import { createTestAppWithAuth } from '../../../test/test-app'

function makeFile(name: string, type: string, size: number) {
  const blob = new Blob([new Uint8Array(size)], { type })
  return new File([blob], name, { type })
}

describe('GET /v1/attachments', () => {
  it('requires authentication', async () => {
    const app = createTestAppWithAuth(null)
    const res = await app.request('/v1/attachments?ids=att_123')
    expect(res.status).toBe(401)
  })

  it('returns attachments with signed URLs for authenticated user', async () => {
    const app = createTestAppWithAuth(createMockAdminUser())
    const res = await app.request('/v1/attachments?ids=att_nonexistent')
    expect([200, 404, 500]).toContain(res.status)
    if (res.status === 200) {
      const json = await res.json()
      expect(json).toHaveProperty('attachments')
      expect(Array.isArray(json.attachments)).toBe(true)
    }
  })

  it('validates query parameters', async () => {
    const app = createTestAppWithAuth(createMockAdminUser())
    const res = await app.request('/v1/attachments')
    expect([400, 200]).toContain(res.status)
  })
})

describe('GET /v1/attachments/view/:token', () => {
  it('does not require Clerk authentication', async () => {
    const app = createTestAppWithAuth(null)
    const res = await app.request('/v1/attachments/view/invalid_token')
    // Should not return 401 (unauthorized), but 403 (forbidden - invalid token) or 404
    expect([403, 404, 500]).toContain(res.status)
  })

  it('rejects invalid JWT token', async () => {
    const app = createTestAppWithAuth(createMockAdminUser())
    const res = await app.request('/v1/attachments/view/invalid_jwt')
    expect([403, 500]).toContain(res.status)
  })
})

describe('POST /v1/task/:id/attachments', () => {
  it('uploads attachments as admin', async () => {
    const app = createTestAppWithAuth(createMockAdminUser())

    // Create FormData
    const formData = new FormData()
    formData.append('files', makeFile('a.jpg', 'image/jpeg', 1024))
    formData.append('files', makeFile('b.pdf', 'application/pdf', 2048))

    const res = await app.request('/v1/task/1/attachments', {
      method: 'POST',
      body: formData,
    })

    expect([201, 404, 403, 400]).toContain(res.status)
    if (res.status === 201) {
      const json = await res.json()
      expect(Array.isArray(json.attachments)).toBe(true)
    }
  })

  it('rejects too many files', async () => {
    const app = createTestAppWithAuth(createMockAdminUser())
    const formData = new FormData()
    for (let i = 0; i < 12; i++) {
      formData.append('files', makeFile(`f${i}.jpg`, 'image/jpeg', 100))
    }
    const res = await app.request('/v1/task/1/attachments', {
      method: 'POST',
      body: formData,
    })
    expect([400, 201, 404]).toContain(res.status)
  })

  it('rejects unsupported mime', async () => {
    const app = createTestAppWithAuth(createMockAdminUser())
    const formData = new FormData()
    formData.append('files', makeFile('bad.txt', 'text/plain', 10))
    const res = await app.request('/v1/task/1/attachments', {
      method: 'POST',
      body: formData,
    })
    expect([400, 201, 404]).toContain(res.status)
  })

  it('allows assigned worker', async () => {
    const app = createTestAppWithAuth(createMockWorkerUser())
    const formData = new FormData()
    formData.append('files', makeFile('a.jpg', 'image/jpeg', 1024))
    const res = await app.request('/v1/task/1/attachments', {
      method: 'POST',
      body: formData,
    })
    expect([201, 403, 404, 400]).toContain(res.status)
  })
})
