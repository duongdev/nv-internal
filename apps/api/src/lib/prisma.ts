/** biome-ignore-all lint/style/useNamingConvention: <extend model name> */
import { withAccelerate } from '@prisma/extension-accelerate'
import { extendPrismaClient } from 'prisma-prefixed-ids'
import { type Prisma, PrismaClient } from '../../generated/prisma'

type ModelName = Prisma.ModelName

const prefixes: Partial<Record<ModelName, string>> = {
  Customer: 'cust',
  GeoLocation: 'geo',
  Activity: 'act',
}

export const getPrisma = (databaseUrl = process.env.DATABASE_URL) => {
  const prisma = new PrismaClient({
    datasourceUrl: databaseUrl,
  }).$extends(withAccelerate())
  return extendPrismaClient(prisma, {
    prefixes,
  }) as unknown as PrismaClient
}
