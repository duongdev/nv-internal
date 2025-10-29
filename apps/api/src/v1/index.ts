import { Hono } from 'hono'
import activityApp from './activity/activity.route'
import attachmentApp from './attachment/attachment.route'
import { authMiddleware } from './middlewares/auth'
import paymentApp from './payment/payment.route'
import reportApp from './reports/report.route'
import taskApp from './task/task.route'
import taskEventsApp from './task-events/task-event.route'
import userApp from './user/user.route'

export const hono = new Hono()
  .get('/health', (c) => c.text('ok'))
  .use('*', authMiddleware)

  .route('/activity', activityApp)
  .route('/task', taskApp)
  .route('/task', taskEventsApp)
  .route('/payment', paymentApp)
  .route('/user', userApp)
  .route('/attachments', attachmentApp)
  .route('/reports', reportApp)
