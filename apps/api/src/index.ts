import { Hono } from 'hono'
import { compress } from 'hono/compress'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'
import { trimTrailingSlash } from 'hono/trailing-slash'
import privacyPolicyRouter from './public/privacy-policy.route'
import { hono as appV1 } from './v1/index'

const app = new Hono({ strict: true })
  // * Global middlewares
  .use(logger())
  .use(compress())
  .use(requestId())
  .use(trimTrailingSlash())
  .use(prettyJSON({ space: 2 }))
  // .use(except(() => IS_VERCEL, logger(log.info.bind(log))))

  // * Public routes (no authentication required)
  .route('/privacy-policy', privacyPolicyRouter)

  // * Mounting versioned APIs
  .route('/v1', appV1)

export { app }
export type AppType = typeof app
export default app
