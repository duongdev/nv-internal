import { Hono } from 'hono'
import { authMiddleware } from './middlewares/auth'
import taskApp from './task/task.route'
import userApp from './user/user.route'

export const hono = new Hono()
  .get('/health', (c) => c.text('ok'))
  .use('*', authMiddleware)

  .route('/user', userApp)
  .route('/task', taskApp)
