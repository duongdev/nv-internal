import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { extendPrismaClient } from 'prisma-prefixed-ids'
import ws from 'ws'
import { type Prisma, PrismaClient } from '../../generated/prisma'

neonConfig.webSocketConstructor = ws
neonConfig.poolQueryViaFetch = true

type ModelName = Prisma.ModelName

const prefixes: Partial<Record<ModelName, string>> = {
  /** biome-ignore-start lint/style/useNamingConvention: <extend model name> */
  Customer: 'cust',
  GeoLocation: 'geo',
  Activity: 'act',
  /** biome-ignore-end lint/style/useNamingConvention: <extend model name> */
}

export const getPrisma = (databaseUrl = process.env.DATABASE_URL) => {
  const adapter = new PrismaNeon({ connectionString: databaseUrl })
  const prisma = new PrismaClient({
    adapter,
  })
  return extendPrismaClient(prisma, {
    prefixes,
  }) as unknown as PrismaClient
}
