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
  /** biome-ignore-end lint/style/useNamingConvention: <extend model name> */
}

export const getPrisma = (databaseUrl = process.env.DATABASE_URL) => {
  const options: ConstructorParameters<typeof PrismaClient>[0] = {}

  if (isVercelRuntime) {
    // Use the PrismaNeon adapter in Vercel serverless environment.
    options.adapter = new PrismaNeon({ connectionString: databaseUrl })
  }

  const prisma = new PrismaClient(options)
  return extendPrismaClient(prisma, {
    prefixes,
  }) as unknown as PrismaClient
}
