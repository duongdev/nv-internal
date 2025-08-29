import { Hono } from 'hono'

export const hono = new Hono().get('/health', (c) => c.text('ok'))
