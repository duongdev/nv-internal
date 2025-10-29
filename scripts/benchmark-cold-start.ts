#!/usr/bin/env ts-node
/**
 * Cold Start Benchmark Script
 *
 * Measures container initialization time to ensure
 * refactored architecture meets <200ms cold start target.
 */

import { performance } from 'perf_hooks'

interface BenchmarkResult {
  iteration: number
  duration: number
  memoryUsed: number
}

async function measureColdStart(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = []

  for (let i = 0; i < 10; i++) {
    // Simulate fresh container creation (cold start)
    const memBefore = process.memoryUsage().heapUsed

    const start = performance.now()

    // Lazy import to simulate serverless cold start
    const { createRequestContainer } = await import(
      '../apps/api/src/container/request-container'
    )

    // Mock Hono context
    const mockContext = {
      get: (key: string) => {
        if (key === 'user') {
          return {
            id: 'usr_test',
            publicMetadata: { roles: ['nv_internal_worker'] },
          }
        }
        return undefined
      },
      set: () => {},
    } as any

    const container = createRequestContainer(mockContext)

    // Access one service to trigger lazy initialization
    const _ = container.taskService

    const duration = performance.now() - start
    const memAfter = process.memoryUsage().heapUsed
    const memoryUsed = (memAfter - memBefore) / 1024 / 1024 // MB

    results.push({
      iteration: i + 1,
      duration,
      memoryUsed,
    })

    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }

    // Wait 100ms between iterations
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return results
}

async function main() {
  console.log('🚀 Cold Start Benchmark\n')
  console.log('Target: <200ms (p95)')
  console.log('Running 10 iterations...\n')

  const results = await measureColdStart()

  // Calculate statistics
  const durations = results.map((r) => r.duration)
  const memories = results.map((r) => r.memoryUsed)

  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
  const p95Duration = durations.sort((a, b) => a - b)[
    Math.floor(durations.length * 0.95)
  ]
  const maxDuration = Math.max(...durations)
  const minDuration = Math.min(...durations)

  const avgMemory = memories.reduce((a, b) => a + b, 0) / memories.length
  const maxMemory = Math.max(...memories)

  // Print results
  console.log('Results:')
  console.log('--------')
  results.forEach((r) => {
    const status = r.duration < 200 ? '✅' : '❌'
    console.log(
      `${status} Iteration ${r.iteration}: ${r.duration.toFixed(2)}ms (${r.memoryUsed.toFixed(2)} MB)`,
    )
  })

  console.log('\nStatistics:')
  console.log('------------')
  console.log(`Average:     ${avgDuration.toFixed(2)}ms`)
  console.log(
    `p95:         ${p95Duration.toFixed(2)}ms ${p95Duration < 200 ? '✅' : '❌'}`,
  )
  console.log(`Min:         ${minDuration.toFixed(2)}ms`)
  console.log(`Max:         ${maxDuration.toFixed(2)}ms`)
  console.log(`\nMemory:`)
  console.log(`Average:     ${avgMemory.toFixed(2)} MB`)
  console.log(`Max:         ${maxMemory.toFixed(2)} MB`)

  // Exit with error if p95 exceeds target
  if (p95Duration > 200) {
    console.error('\n❌ Cold start benchmark failed! p95 exceeds 200ms target.')
    process.exit(1)
  }

  console.log('\n✅ Cold start benchmark passed!')
  process.exit(0)
}

main().catch((error) => {
  console.error('Benchmark failed:', error)
  process.exit(1)
})
