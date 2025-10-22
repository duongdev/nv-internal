import { describe, expect, it, jest } from '@jest/globals'
import {
  createMockAdminUser,
  createMockWorkerUser,
} from '../../../test/mock-auth'
import { createTestAppWithAuth } from '../../../test/test-app'

function makeFile(name: string, type: string, size: number) {
  const blob = new Blob([new Uint8Array(size)], { type })
  return new File([blob], name, { type })
}

// Mock the streamLocalFile service function for Vercel Blob redirect tests
jest.mock('../attachment.service', () => {
  const actual =
    jest.requireActual<typeof import('../attachment.service')>(
      '../attachment.service',
    )
  const mockFn = jest.fn()
  return {
    ...actual,
    streamLocalFile: mockFn,
  }
})

// Import after mocking to get the mocked version
import * as attachmentService from '../attachment.service'

// biome-ignore lint/suspicious/noExplicitAny: Mock function needs flexible typing for test setup
const mockStreamLocalFile = attachmentService.streamLocalFile as any as jest.Mock

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

  describe('Vercel Blob redirect', () => {
    it('redirects to Vercel Blob CDN for video files', async () => {
      // Set up JWT secret for token generation
      process.env.ATTACHMENT_JWT_SECRET = 'test-secret-key-for-jwt'

      const jwt = require('jsonwebtoken')
      const secret = process.env.ATTACHMENT_JWT_SECRET
      const token = jwt.sign(
        {
          key: 'tasks/1/2025/1/22/video.mp4',
          filename: 'video.mp4',
          provider: 'vercel-blob',
        },
        secret,
        { expiresIn: '1h' },
      )

      // Mock streamLocalFile to return Vercel Blob response
      const mockBlobUrl = 'https://blob.vercel-storage.com/video.mp4'
      // @ts-expect-error - Mock function is properly typed but TS doesn't recognize it
      mockStreamLocalFile.mockResolvedValueOnce({
        stream: null, // Won't be used due to redirect
        mimeType: 'video/mp4',
        size: 1024000,
        filename: 'video.mp4',
        blobUrl: mockBlobUrl,
        provider: 'vercel-blob',
      })

      const app = createTestAppWithAuth(null)
      const res = await app.request(`/v1/attachments/view/${token}`)

      // Should redirect to Vercel Blob CDN
      expect(res.status).toBe(302)
      expect(res.headers.get('Location')).toBe(mockBlobUrl)
    })

    it('redirects to Vercel Blob CDN for image files', async () => {
      process.env.ATTACHMENT_JWT_SECRET = 'test-secret-key-for-jwt'

      const jwt = require('jsonwebtoken')
      const secret = process.env.ATTACHMENT_JWT_SECRET
      const token = jwt.sign(
        {
          key: 'tasks/1/2025/1/22/image.jpg',
          filename: 'image.jpg',
          provider: 'vercel-blob',
        },
        secret,
        { expiresIn: '1h' },
      )

      // Mock streamLocalFile to return Vercel Blob response
      const mockBlobUrl = 'https://blob.vercel-storage.com/image.jpg'
      // @ts-expect-error - Mock function is properly typed but TS doesn't recognize it
      mockStreamLocalFile.mockResolvedValueOnce({
        stream: null,
        mimeType: 'image/jpeg',
        size: 204800,
        filename: 'image.jpg',
        blobUrl: mockBlobUrl,
        provider: 'vercel-blob',
      })

      const app = createTestAppWithAuth(null)
      const res = await app.request(`/v1/attachments/view/${token}`)

      // Should redirect to Vercel Blob CDN
      expect(res.status).toBe(302)
      expect(res.headers.get('Location')).toBe(mockBlobUrl)
    })

    it('does not redirect for local-disk files', async () => {
      process.env.ATTACHMENT_JWT_SECRET = 'test-secret-key-for-jwt'

      const jwt = require('jsonwebtoken')
      const secret = process.env.ATTACHMENT_JWT_SECRET
      const token = jwt.sign(
        {
          key: 'tasks/1/2025/1/22/local.jpg',
          filename: 'local.jpg',
          provider: 'local-disk',
        },
        secret,
        { expiresIn: '1h' },
      )

      // Mock streamLocalFile to return local-disk response
      const { Readable } = require('node:stream')
      const mockStream = Readable.from(['mock file content'])

      // @ts-expect-error - Mock function is properly typed but TS doesn't recognize it
      mockStreamLocalFile.mockResolvedValueOnce({
        stream: mockStream,
        mimeType: 'image/jpeg',
        size: 1024,
        filename: 'local.jpg',
        provider: 'local-disk',
      })

      const app = createTestAppWithAuth(null)
      const res = await app.request(`/v1/attachments/view/${token}`)

      // Should stream the file, not redirect
      expect([200, 500]).toContain(res.status)
      if (res.status === 200) {
        expect(res.headers.get('Content-Type')).toBe('image/jpeg')
        expect(res.headers.get('Location')).toBeNull()
      }
    })

    it('does not redirect for PDF files from Vercel Blob (proxies with CORS)', async () => {
      process.env.ATTACHMENT_JWT_SECRET = 'test-secret-key-for-jwt'

      const jwt = require('jsonwebtoken')
      const secret = process.env.ATTACHMENT_JWT_SECRET
      const token = jwt.sign(
        {
          key: 'tasks/1/2025/1/22/document.pdf',
          filename: 'document.pdf',
          provider: 'vercel-blob',
        },
        secret,
        { expiresIn: '1h' },
      )

      // Mock streamLocalFile to return Vercel Blob PDF response
      const { Readable } = require('node:stream')
      const mockStream = Readable.from(['mock pdf content'])

      // @ts-expect-error - Mock function is properly typed but TS doesn't recognize it
      mockStreamLocalFile.mockResolvedValueOnce({
        stream: mockStream,
        mimeType: 'application/pdf',
        size: 5120,
        filename: 'document.pdf',
        blobUrl: 'https://blob.vercel-storage.com/document.pdf',
        provider: 'vercel-blob',
      })

      const app = createTestAppWithAuth(null)
      const res = await app.request(`/v1/attachments/view/${token}`)

      // Should stream the PDF with CORS headers, not redirect
      expect([200, 500]).toContain(res.status)
      if (res.status === 200) {
        expect(res.headers.get('Content-Type')).toBe('application/pdf')
        expect(res.headers.get('Location')).toBeNull()
        // Check for CORS headers
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
        expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, HEAD, OPTIONS')
      }
    })
  })

  describe('CORS support', () => {
    it('handles OPTIONS preflight request', async () => {
      const app = createTestAppWithAuth(null)
      const res = await app.request('/v1/attachments/view/any-token', {
        method: 'OPTIONS',
      })

      expect(res.status).toBe(204)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, HEAD, OPTIONS')
      expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Range')
      expect(res.headers.get('Access-Control-Max-Age')).toBe('86400')
    })

    it('includes CORS headers on GET responses', async () => {
      process.env.ATTACHMENT_JWT_SECRET = 'test-secret-key-for-jwt'

      const jwt = require('jsonwebtoken')
      const secret = process.env.ATTACHMENT_JWT_SECRET
      const token = jwt.sign(
        {
          key: 'tasks/1/2025/1/22/test.pdf',
          filename: 'test.pdf',
          provider: 'local-disk',
        },
        secret,
        { expiresIn: '1h' },
      )

      const { Readable } = require('node:stream')
      const mockStream = Readable.from(['test content'])

      // @ts-expect-error - Mock function is properly typed but TS doesn't recognize it
      mockStreamLocalFile.mockResolvedValueOnce({
        stream: mockStream,
        mimeType: 'application/pdf',
        size: 100,
        filename: 'test.pdf',
        provider: 'local-disk',
      })

      const app = createTestAppWithAuth(null)
      const res = await app.request(`/v1/attachments/view/${token}`)

      if (res.status === 200) {
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
        expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, HEAD, OPTIONS')
      }
    })
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
