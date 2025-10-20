// Simple smoke test that requires the built prisma-client dist file and logs shape info.
try {
  // Require the built CommonJS bundle
  const pkg = require('../packages/prisma-client/dist')
  console.log(
    'Loaded @nv-internal/prisma-client keys:',
    Object.keys(pkg).slice(0, 20),
  )
  console.log('Has PrismaClient:', typeof pkg.PrismaClient !== 'undefined')
  if (pkg.TaskStatus) {
    console.log('TaskStatus keys:', Object.keys(pkg.TaskStatus))
  }
  process.exit(0)
} catch (err) {
  console.error('Require failed:', err && err.message)
  if (err && err.stack) {
    console.error(err.stack)
  }
  process.exit(2)
}
