// Simple smoke test that requires the built prisma-client dist file and logs shape info.
try {
  // Require the built CommonJS bundle
  const pkg = require('../packages/prisma-client/dist')
  process.stdout.write(
    'Loaded @nv-internal/prisma-client keys:',
    Object.keys(pkg).slice(0, 20),
  )
  process.stdout.write(
    `Has PrismaClient: ${typeof pkg.PrismaClient !== 'undefined'}\n`,
  )
  if (pkg.TaskStatus) {
    process.stdout.write(
      `TaskStatus keys: ${Object.keys(pkg.TaskStatus).join(', ')}\n`,
    )
  }
  process.exit(0)
} catch (err) {
  process.stderr.write(`Require failed: ${err && err.message}\n`)
  if (err && err.stack) {
    process.stderr.write(`${err.stack}\n`)
  }
  process.exit(2)
}
