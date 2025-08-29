import { Hono } from 'hono'
import { compress } from 'hono/compress'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'
import { trimTrailingSlash } from 'hono/trailing-slash'
import { hono as appV1 } from './v1/index'

const _IS_VERCEL = process.env.VERCEL === '1'

const app = new Hono({ strict: true })
  // * Global middlewares
  .use(logger())
  .use(compress())
  .use(requestId())
  .use(trimTrailingSlash())
  .use(prettyJSON({ space: 2 }))
  // .use(except(() => IS_VERCEL, logger(log.info.bind(log))))

  // * Mounting versioned APIs
  .route('/v1', appV1)

export { app }
export type AppType = typeof app
export default app

// Shared exports
// export * from './lib/zod'
// export * from './v1/validators/user.zod'
