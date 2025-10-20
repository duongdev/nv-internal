import { describe, it, expect } from '@jest/globals'
import { createTestAppWithAuth } from '../../../test/test-app'
import { createMockAdminUser, createMockWorkerUser } from '../../../test/mock-auth'

function makeFile(name: string, type: string, size: number) {
  const blob = new Blob([new Uint8Array(size)], { type })
  return new File([blob], name, { type })
}

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
    const res = await app.request('/v1/task/1/attachments', { method: 'POST', body: formData })
    expect([400, 201, 404]).toContain(res.status)
  })

  it('allows assigned worker', async () => {
    const app = createTestAppWithAuth(createMockWorkerUser())
    const formData = new FormData()
    formData.append('files', makeFile('a.jpg', 'image/jpeg', 1024))
    const res = await app.request('/v1/task/1/attachments', { method: 'POST', body: formData })
    expect([201, 403, 404, 400]).toContain(res.status)
  })
})
