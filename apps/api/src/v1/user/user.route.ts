import { Hono } from 'hono'
import { getAuthUserStrict } from '../middlewares/auth'

const router = new Hono().get('/me', (c) => {
  const user = getAuthUserStrict(c)
  return c.json(user)
})

export default router
