import { withAccelerate } from '@prisma/extension-accelerate'
import { PrismaClient } from '../../generated/prisma'

export const getPrisma = (databaseUrl = process.env.DATABASE_URL) => {
  const prisma = new PrismaClient({
    datasourceUrl: databaseUrl,
  }).$extends(withAccelerate())
  return prisma
}
