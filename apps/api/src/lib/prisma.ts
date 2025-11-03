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
  Payment: 'payment',
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
    // Query timeout configuration
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  }

  if (isVercelRuntime) {
    // Use the PrismaNeon adapter in Vercel serverless environment.
    // IMPORTANT: Use the unpooled (direct) connection string for the adapter
    // When using a driver adapter, do NOT set datasources - the adapter handles the connection
    const unpooledUrl =
      process.env.POSTGRES_DATABASE_URL_UNPOOLED ||
      process.env.POSTGRES_POSTGRES_URL_NON_POOLING ||
      databaseUrl?.replace(/-pooler\./, '.')

    // Remove channel_binding parameter as it's not supported by the serverless driver
    const serverlessUrl = unpooledUrl?.replace(/[?&]channel_binding=require/, '')

    options.adapter = new PrismaNeon({ connectionString: serverlessUrl })
    // Do NOT set options.datasources when using adapter - it causes conflict
  } else {
    // Non-serverless: use standard connection
    options.datasources = {
      db: {
        url: databaseUrl,
      },
    }
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
