import { neonConfig } from '@neondatabase/serverless'
import { type Prisma, PrismaClient } from '@nv-internal/prisma-client'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'
import { extendPrismaClient } from './prisma-prefixed-ids'

// Only configure the Neon adapter when running on Vercel's serverless runtime.
// This avoids requiring the Neon adapter locally during development.
const isVercelRuntime =
  Boolean(process.env.VERCEL) ||
  process.env.VERCEL === '1' ||
  process.env.VERCEL === 'true' ||
  Boolean(process.env.VERCEL_ENV)

if (isVercelRuntime) {
  neonConfig.webSocketConstructor = ws
  neonConfig.poolQueryViaFetch = true
}

type ModelName = Prisma.ModelName

const prefixes: Partial<Record<ModelName, string>> = {
  /** biome-ignore-start lint/style/useNamingConvention: <extend model name> */
  Customer: 'cust',
  GeoLocation: 'geo',
  Activity: 'act',
  Attachment: 'att',
  /** biome-ignore-end lint/style/useNamingConvention: <extend model name> */
}

// Global Prisma instance cache for serverless optimization
let prismaInstance: PrismaClient | null = null

export const getPrisma = (databaseUrl = process.env.DATABASE_URL) => {
  // Return cached instance if available (singleton pattern for serverless)
  if (prismaInstance) {
    return prismaInstance
  }

  const options: ConstructorParameters<typeof PrismaClient>[0] = {
    // Connection pool configuration for serverless
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    // Query timeout configuration
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  }

  if (isVercelRuntime) {
    // Use the PrismaNeon adapter in Vercel serverless environment.
    options.adapter = new PrismaNeon({
      connectionString: databaseUrl,
    })
  }

  const prisma = new PrismaClient(options)
  const extendedPrisma = extendPrismaClient(prisma, {
    prefixes,
  }) as unknown as PrismaClient

  // Cache the instance for reuse
  prismaInstance = extendedPrisma

  return prismaInstance
}

// Graceful disconnect utility for serverless cleanup
export const disconnectPrisma = async () => {
  if (prismaInstance) {
    try {
      await prismaInstance.$disconnect()
      prismaInstance = null
    } catch (error) {
      // Use proper logging instead of console
      if (process.env.NODE_ENV === 'development') {
        console.error('Error disconnecting Prisma:', error)
      }
    }
  }
}

// Handle process termination gracefully
if (typeof process !== 'undefined') {
  process.on('SIGINT', disconnectPrisma)
  process.on('SIGTERM', disconnectPrisma)
  process.on('beforeExit', disconnectPrisma)
}
