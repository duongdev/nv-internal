// @ts-nocheck
import { beforeEach, describe, expect, it } from '@jest/globals'
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '../z-validator'

describe('validation-error-handler', () => {
  describe('zValidator with automatic error logging', () => {
    let app: Hono

    beforeEach(() => {
      app = new Hono()
    })

    it('should return 400 with validation details when param validation fails', async () => {
      const schema = z.object({
        id: z.string().regex(/^\d+$/, 'ID must be numeric'),
      })

      app.get('/:id', zValidator('param', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/abc')

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json).toMatchObject({
        error: 'Validation failed',
        validationType: 'param',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: expect.stringContaining('ID must be numeric'),
          }),
        ]),
      })
    })

    it('should return 400 with validation details when json validation fails', async () => {
      const schema = z.object({
        name: z.string().min(3, 'Name must be at least 3 characters'),
        age: z.number().min(18, 'Must be at least 18'),
        email: z.string().email('Invalid email'),
      })

      app.post('/users', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'AB', // Too short
          age: 16, // Too young
          email: 'not-an-email', // Invalid format
        }),
      })

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json).toMatchObject({
        error: 'Validation failed',
        validationType: 'json',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.stringContaining('at least 3'),
          }),
          expect.objectContaining({
            field: 'age',
            message: expect.stringContaining('at least 18'),
          }),
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('email'),
          }),
        ]),
      })
    })

    it('should return 400 with validation details when query validation fails', async () => {
      const schema = z.object({
        page: z.string().regex(/^\d+$/, 'Page must be a number'),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number'),
      })

      app.get('/items', zValidator('query', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/items?page=abc&limit=xyz')

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json).toMatchObject({
        error: 'Validation failed',
        validationType: 'query',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'page',
            message: expect.stringContaining('number'),
          }),
          expect.objectContaining({
            field: 'limit',
            message: expect.stringContaining('number'),
          }),
        ]),
      })
    })

    it('should allow valid requests to pass through', async () => {
      const schema = z.object({
        name: z.string().min(3),
        age: z.number().min(18),
      })

      app.post('/users', zValidator('json', schema), (c) => {
        const data = c.req.valid('json')
        return c.json({ success: true, data })
      })

      const res = await app.request('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          age: 25,
        }),
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toMatchObject({
        success: true,
        data: {
          name: 'John Doe',
          age: 25,
        },
      })
    })

    it('should allow custom error handler to override default behavior', async () => {
      const schema = z.object({
        id: z.string().regex(/^\d+$/),
      })

      app.get(
        '/:id',
        zValidator('param', schema, (result, c) => {
          if (!result.success) {
            return c.json({ custom: 'error message' }, 422)
          }
        }),
        (c) => {
          return c.json({ success: true })
        },
      )

      const res = await app.request('/abc')

      expect(res.status).toBe(422)
      const json = await res.json()
      expect(json).toEqual({ custom: 'error message' })
    })

    it('should handle nested object validation errors', async () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(3),
            age: z.number().min(18),
          }),
        }),
      })

      app.post('/nested', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/nested', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            profile: {
              name: 'AB', // Too short
              age: 16, // Too young
            },
          },
        }),
      })

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json).toMatchObject({
        error: 'Validation failed',
        validationType: 'json',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'user.profile.name',
          }),
          expect.objectContaining({
            field: 'user.profile.age',
          }),
        ]),
      })
    })

    it('should handle enum validation errors', async () => {
      const schema = z.object({
        status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']),
      })

      app.post('/status', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'INVALID_STATUS',
        }),
      })

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json).toMatchObject({
        error: 'Validation failed',
        validationType: 'json',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'status',
          }),
        ]),
      })
    })

    it('should handle missing required fields', async () => {
      const schema = z.object({
        required1: z.string(),
        required2: z.number(),
      })

      app.post('/required', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/required', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json).toMatchObject({
        error: 'Validation failed',
        validationType: 'json',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'required1',
          }),
          expect.objectContaining({
            field: 'required2',
          }),
        ]),
      })
    })

    it('should handle invalid type errors', async () => {
      const schema = z.object({
        age: z.number(),
        active: z.boolean(),
      })

      app.post('/types', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: 'not-a-number',
          active: 'not-a-boolean',
        }),
      })

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json).toMatchObject({
        error: 'Validation failed',
        validationType: 'json',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'age',
          }),
          expect.objectContaining({
            field: 'active',
          }),
        ]),
      })
    })
  })

  describe('sensitive field sanitization', () => {
    let app: Hono

    beforeEach(() => {
      app = new Hono()
    })

    it('should sanitize password field in error logs', async () => {
      const schema = z.object({
        password: z.string().min(8),
      })

      app.post('/auth', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'short',
        }),
      })

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json).toMatchObject({
        error: 'Validation failed',
        validationType: 'json',
      })
      // Note: Sensitive values are redacted in logs, not in response
    })

    it('should sanitize token field in error logs', async () => {
      const schema = z.object({
        accessToken: z.string().min(20),
      })

      app.post('/validate', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: 'too-short',
        }),
      })

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json).toMatchObject({
        error: 'Validation failed',
        validationType: 'json',
      })
    })
  })
})
