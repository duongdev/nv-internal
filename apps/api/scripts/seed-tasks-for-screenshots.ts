/**
 * Script to seed task data for App Store screenshots
 *
 * Creates 4 realistic tasks with Vietnamese data:
 * 1. "Lắp đặt điều hòa 2 chiều 12000 BTU" - READY status (already exists)
 * 2. "Bảo trì điều hòa định kỳ" - PREPARING
 * 3. "Sửa chữa điều hòa không lạnh" - PREPARING
 * 4. "Vệ sinh điều hòa" - PREPARING
 *
 * Usage:
 *   npx tsx scripts/seed-tasks-for-screenshots.ts
 */

import { getPrisma } from '../src/lib/prisma'
import { normalizeForSearch } from '../src/lib/text-utils'

const prisma = getPrisma()

async function seedTasks() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  SEED TASKS FOR SCREENSHOTS')
  console.log('═══════════════════════════════════════════════════════')
  console.log()

  try {
    // Get the user (Dustin Do)
    const user = await prisma.user.findFirst({
      where: {
        email: 'duong.do@hyperzod.dev',
      },
    })

    if (!user) {
      console.error('❌ User not found')
      process.exit(1)
    }

    console.log(`✅ Found user: ${user.firstName} ${user.lastName}\n`)

    // Define tasks to create
    const tasksToCreate = [
      {
        title: 'Bảo trì điều hòa định kỳ',
        customerName: 'Trần Thị Bình',
        customerPhone: '0912345678',
        revenue: 2000000,
      },
      {
        title: 'Sửa chữa điều hòa không lạnh',
        customerName: 'Lê Văn Cường',
        customerPhone: '0923456789',
        revenue: 3500000,
      },
      {
        title: 'Vệ sinh điều hòa',
        customerName: 'Phạm Thị Dung',
        customerPhone: '0934567890',
        revenue: 1500000,
      },
    ]

    console.log('📝 Creating tasks...\n')

    for (const taskData of tasksToCreate) {
      // Build searchable text
      const searchParts = [
        taskData.title,
        taskData.customerName,
        taskData.customerPhone,
      ].filter(Boolean)

      const searchableText = searchParts
        .map((part) => normalizeForSearch(part.trim().replace(/\s+/g, ' ')))
        .join(' ')

      const task = await prisma.task.create({
        data: {
          title: taskData.title,
          status: 'PREPARING',
          expectedRevenue: taskData.revenue,
          customer: {
            create: {
              name: taskData.customerName,
              phone: taskData.customerPhone,
            },
          },
          searchableText,
        },
        include: {
          customer: true,
        },
      })

      console.log(`  ✅ Created: ${task.title}`)
      console.log(`     ID: ${task.id}`)
      console.log(`     Customer: ${task.customer.name}`)
      console.log(`     Phone: ${task.customer.phone}`)
      console.log(`     Revenue: ${task.expectedRevenue?.toLocaleString()} VNĐ`)
      console.log()
    }

    console.log('═══════════════════════════════════════════════════════')
    console.log('  ✅ SEEDING COMPLETE')
    console.log('═══════════════════════════════════════════════════════')
    console.log()
    console.log(`🎉 Created ${tasksToCreate.length} new tasks`)
    console.log('📱 Ready for screenshot capture!')
  } catch (error) {
    console.error('\n❌ Error during seeding:', error)
    throw error
  }
}

// Run the seeding
seedTasks()
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
