import { Hono } from 'hono'
import activityApp from './activity/activity.route'
import { authMiddleware } from './middlewares/auth'
import taskApp from './task/task.route'
import userApp from './user/user.route'

export const hono = new Hono()
  .get('/health', (c) => c.text('ok'))
  .use('*', authMiddleware)

  .route('/activity', activityApp)
  .route('/task', taskApp)
  .route('/user', userApp)
