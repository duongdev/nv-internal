/**
 * Script to backfill searchableText field for existing database records
 *
 * This script populates the searchableText field for:
 * - Tasks (id, title, description, customer name/phone, location name/address)
 * - Customers (name, phone)
 * - GeoLocations (name, address)
 *
 * The searchableText field enables efficient Vietnamese accent-insensitive search.
 *
 * Usage:
 *   npx tsx scripts/backfill-searchable-text.ts
 */

import { getPrisma } from '../src/lib/prisma'
import { normalizeForSearch } from '../src/lib/text-utils'

const prisma = getPrisma()

async function backfillSearchableText() {
  console.log('🔄 Starting searchableText backfill...\n')

  try {
    // ===== Backfill Customer searchableText =====
    console.log('📋 Backfilling Customer searchableText...')
    const customers = await prisma.customer.findMany()

    let customerCount = 0
    for (const customer of customers) {
      const searchableText = normalizeForSearch(
        [customer.name, customer.phone].filter(Boolean).join(' '),
      )
        .replace(/\s+/g, ' ')
        .trim()

      await prisma.customer.update({
        where: { id: customer.id },
        data: { searchableText },
      })
      customerCount++
    }

    console.log(`✅ Backfilled ${customerCount} customers\n`)

    // ===== Backfill GeoLocation searchableText =====
    console.log('📋 Backfilling GeoLocation searchableText...')
    const locations = await prisma.geoLocation.findMany()

    let locationCount = 0
    for (const location of locations) {
      const searchableText = normalizeForSearch(
        [location.name, location.address].filter(Boolean).join(' '),
      )
        .replace(/\s+/g, ' ')
        .trim()

      await prisma.geoLocation.update({
        where: { id: location.id },
        data: { searchableText },
      })
      locationCount++
    }

    console.log(`✅ Backfilled ${locationCount} locations\n`)

    // ===== Backfill Task searchableText =====
    console.log('📋 Backfilling Task searchableText...')
    const tasks = await prisma.task.findMany({
      include: { customer: true, geoLocation: true },
    })

    let taskCount = 0
    for (const task of tasks) {
      const parts = [
        task.id.toString(),
        task.title,
        task.description,
        task.customer?.name,
        task.customer?.phone,
        task.geoLocation?.address,
        task.geoLocation?.name,
      ].filter(Boolean) as string[]

      const searchableText = normalizeForSearch(parts.join(' '))
        .replace(/\s+/g, ' ')
        .trim()

      await prisma.task.update({
        where: { id: task.id },
        data: { searchableText },
      })
      taskCount++
    }

    console.log(`✅ Backfilled ${taskCount} tasks\n`)

    // ===== Summary =====
    console.log('✅ Backfill complete!')
    console.log(`   - ${customerCount} customers updated`)
    console.log(`   - ${locationCount} locations updated`)
    console.log(`   - ${taskCount} tasks updated`)
    console.log(
      `   - Total: ${customerCount + locationCount + taskCount} records\n`,
    )
  } catch (error) {
    console.error('❌ Error during backfill:', error)
    throw error
  }
}

// Run the backfill
backfillSearchableText()
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
