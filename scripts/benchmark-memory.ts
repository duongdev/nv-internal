#!/usr/bin/env ts-node
/**
 * Memory Usage Benchmark Script
 *
 * Simulates 1000 requests to detect memory leaks
 * and ensure memory usage stays within Vercel limits (1024MB).
 */

import { performance } from 'perf_hooks'

interface MemorySnapshot {
  requestNumber: number
  heapUsed: number
  heapTotal: number
  external: number
  rss: number
}

async function simulateRequests(count: number): Promise<MemorySnapshot[]> {
  const snapshots: MemorySnapshot[] = []

  for (let i = 0; i < count; i++) {
    // Simulate request handling
    const { createRequestContainer } = await import(
      '../apps/api/src/container/request-container'
    )

    const mockContext = {
      get: (key: string) => {
        if (key === 'user') {
          return {
            id: 'usr_test',
            publicMetadata: { roles: ['nv_internal_worker'] }
          }
        }
        return undefined
      },
      set: () => {}
    } as any

    // Create container and use services
    const container = createRequestContainer(mockContext)
    const _ = container.taskService

    // Take memory snapshot every 50 requests
    if (i % 50 === 0) {
      const mem = process.memoryUsage()
      snapshots.push({
        requestNumber: i,
        heapUsed: mem.heapUsed / 1024 / 1024, // MB
        heapTotal: mem.heapTotal / 1024 / 1024,
        external: mem.external / 1024 / 1024,
        rss: mem.rss / 1024 / 1024
      })
    }

    // Force GC every 100 requests if available
    if (global.gc && i % 100 === 0) {
      global.gc()
    }
  }

  return snapshots
}

function detectMemoryLeak(snapshots: MemorySnapshot[]): boolean {
  // Check if memory continuously grows
  const heapGrowth = snapshots.map((s, i) => {
    if (i === 0) return 0
    return s.heapUsed - snapshots[0].heapUsed
  })

  // If heap grows more than 200MB over 1000 requests, likely a leak
  const totalGrowth = heapGrowth[heapGrowth.length - 1]
  const memoryLeak = totalGrowth > 200

  return memoryLeak
}

async function main() {
  console.log('💾 Memory Usage Benchmark\n')
  console.log('Target: <800MB peak, no memory leaks')
  console.log('Simulating 1000 requests...\n')

  const startMem = process.memoryUsage()
  console.log('Initial memory:')
  console.log(`  Heap Used:  ${(startMem.heapUsed / 1024 / 1024).toFixed(2)} MB`)
  console.log(`  Heap Total: ${(startMem.heapTotal / 1024 / 1024).toFixed(2)} MB`)
  console.log(`  RSS:        ${(startMem.rss / 1024 / 1024).toFixed(2)} MB\n`)

  const snapshots = await simulateRequests(1000)

  console.log('Memory snapshots (every 50 requests):')
  console.log('---------------------------------------')
  snapshots.forEach(s => {
    const status = s.heapUsed < 800 ? '✅' : '⚠️ '
    console.log(
      `${status} Request ${s.requestNumber.toString().padStart(4)}: ` +
      `Heap ${s.heapUsed.toFixed(2)} MB, ` +
      `RSS ${s.rss.toFixed(2)} MB`
    )
  })

  const finalMem = snapshots[snapshots.length - 1]
  const peakMem = Math.max(...snapshots.map(s => s.heapUsed))

  console.log('\nResults:')
  console.log('--------')
  console.log(`Peak heap usage: ${peakMem.toFixed(2)} MB ${peakMem < 800 ? '✅' : '❌'}`)
  console.log(`Final heap usage: ${finalMem.heapUsed.toFixed(2)} MB`)
  console.log(`Growth: ${(finalMem.heapUsed - snapshots[0].heapUsed).toFixed(2)} MB`)

  // Detect memory leak
  const hasLeak = detectMemoryLeak(snapshots)
  if (hasLeak) {
    console.error('\n❌ Memory leak detected! Heap grew >200MB over 1000 requests.')
    console.log('\nMemory growth pattern:')
    snapshots.forEach((s, i) => {
      if (i > 0) {
        const growth = s.heapUsed - snapshots[0].heapUsed
        console.log(`  Request ${s.requestNumber}: +${growth.toFixed(2)} MB`)
      }
    })
    process.exit(1)
  }

  if (peakMem > 800) {
    console.error('\n❌ Peak memory usage exceeds 800MB target!')
    process.exit(1)
  }

  console.log('\n✅ Memory benchmark passed! No leaks detected.')
  process.exit(0)
}

main().catch(error => {
  console.error('Benchmark failed:', error)
  process.exit(1)
})
