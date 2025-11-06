/**
 * Script to safely remove test/dummy data from the database
 *
 * This script removes records identified as test data:
 * - Test customers (Nguyễn Văn A, Trần Thị B, etc.)
 * - Test geo locations (test coordinates)
 * - Test tasks (with test titles)
 * - Related activity records
 * - Related attachments
 * - Related payments
 *
 * ⚠️  WARNING: This operation is irreversible!
 * ⚠️  Review the data with check-test-data.ts first!
 *
 * Usage:
 *   # Dry run (show what would be deleted)
 *   npx tsx scripts/clean-test-data.ts --dry-run
 *
 *   # Actually delete the data
 *   npx tsx scripts/clean-test-data.ts --confirm
 */

import { getPrisma } from '../src/lib/prisma'

const prisma = getPrisma()

const isDryRun = process.argv.includes('--dry-run')
const isConfirmed = process.argv.includes('--confirm')

async function cleanTestData() {
  if (!isDryRun && !isConfirmed) {
    console.error('❌ Error: You must specify either --dry-run or --confirm\n')
    console.log('Usage:')
    console.log(
      '  npx tsx scripts/clean-test-data.ts --dry-run   # Show what would be deleted',
    )
    console.log(
      '  npx tsx scripts/clean-test-data.ts --confirm   # Actually delete the data',
    )
    process.exit(1)
  }

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No data will be deleted\n')
  } else {
    console.log('⚠️  DELETION MODE - Data will be permanently removed\n')
  }

  // Step 1: Find test customers
  const testCustomers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: 'Nguyễn Văn A', mode: 'insensitive' } },
        { name: { contains: 'Trần Thị B', mode: 'insensitive' } },
        { phone: { in: ['0987654321', '0123456789'] } },
      ],
    },
  })

  const testCustomerIds = testCustomers.map((c) => c.id)
  console.log(`📋 Found ${testCustomers.length} test customer(s)`)

  // Step 2: Find test geo locations
  const testGeoLocations = await prisma.geoLocation.findMany({
    where: {
      OR: [
        {
          AND: [{ name: 'Hà Nội' }, { lat: 21.0285 }, { lng: 105.8542 }],
        },
        { address: { contains: 'Số 123, Đường Láng', mode: 'insensitive' } },
      ],
    },
  })

  const testGeoLocationIds = testGeoLocations.map((g) => g.id)
  console.log(`📋 Found ${testGeoLocations.length} test geo location(s)`)

  // Step 3: Find test tasks
  const testTasks = await prisma.task.findMany({
    where: {
      OR: [
        { customerId: { in: testCustomerIds } },
        { geoLocationId: { in: testGeoLocationIds } },
        { title: { contains: 'Sửa điều hòa', mode: 'insensitive' } },
        { title: { contains: 'Lắp đặt máy lạnh mới', mode: 'insensitive' } },
        { title: { contains: 'Vệ sinh máy lạnh', mode: 'insensitive' } },
        { title: { contains: 'Kiểm tra hệ thống', mode: 'insensitive' } },
        {
          description: {
            contains: 'Khách hàng cần sửa điều hòa gấp',
            mode: 'insensitive',
          },
        },
      ],
    },
  })

  const testTaskIds = testTasks.map((t) => t.id)
  console.log(`📋 Found ${testTasks.length} test task(s)`)

  // Step 4: Find related records
  // Activities use topic pattern: "TASK_{taskId}"
  const activityTopics = testTaskIds.map((id) => `TASK_${id}`)
  const relatedActivities = await prisma.activity.count({
    where: { topic: { in: activityTopics } },
  })

  const relatedAttachments = await prisma.attachment.count({
    where: { taskId: { in: testTaskIds } },
  })

  const relatedPayments = await prisma.payment.count({
    where: { taskId: { in: testTaskIds } },
  })

  console.log(`📋 Found ${relatedActivities} related activity record(s)`)
  console.log(`📋 Found ${relatedAttachments} related attachment(s)`)
  console.log(`📋 Found ${relatedPayments} related payment(s)\n`)

  const totalRecords =
    testCustomers.length +
    testGeoLocations.length +
    testTasks.length +
    relatedActivities +
    relatedAttachments +
    relatedPayments

  console.log(`📊 Total records to delete: ${totalRecords}\n`)

  if (totalRecords === 0) {
    console.log('✅ No test data found. Database is clean!')
    return
  }

  if (isDryRun) {
    console.log('🔍 DRY RUN - Would delete:')
    console.log(`   - ${relatedActivities} activity records`)
    console.log(`   - ${relatedAttachments} attachments`)
    console.log(`   - ${relatedPayments} payments`)
    console.log(`   - ${testTasks.length} tasks`)
    console.log(`   - ${testCustomers.length} customers`)
    console.log(`   - ${testGeoLocations.length} geo locations`)
    console.log('\n💡 Run with --confirm to actually delete this data')
    return
  }

  // Confirm deletion
  console.log('⚠️  DELETING DATA - This cannot be undone!\n')

  try {
    // Use transaction for atomic deletion
    await prisma.$transaction(async (tx) => {
      // Delete in correct order to respect foreign key constraints

      // 1. Delete activities (references tasks via topic pattern)
      if (testTaskIds.length > 0) {
        const activityTopics = testTaskIds.map((id) => `TASK_${id}`)
        const deletedActivities = await tx.activity.deleteMany({
          where: { topic: { in: activityTopics } },
        })
        console.log(`✅ Deleted ${deletedActivities.count} activity record(s)`)
      }

      // 2. Delete attachments (references tasks)
      if (testTaskIds.length > 0) {
        const deletedAttachments = await tx.attachment.deleteMany({
          where: { taskId: { in: testTaskIds } },
        })
        console.log(`✅ Deleted ${deletedAttachments.count} attachment(s)`)
      }

      // 3. Delete payments (references tasks)
      if (testTaskIds.length > 0) {
        const deletedPayments = await tx.payment.deleteMany({
          where: { taskId: { in: testTaskIds } },
        })
        console.log(`✅ Deleted ${deletedPayments.count} payment(s)`)
      }

      // 4. Delete tasks
      if (testTaskIds.length > 0) {
        const deletedTasks = await tx.task.deleteMany({
          where: { id: { in: testTaskIds } },
        })
        console.log(`✅ Deleted ${deletedTasks.count} task(s)`)
      }

      // 5. Delete customers
      if (testCustomerIds.length > 0) {
        const deletedCustomers = await tx.customer.deleteMany({
          where: { id: { in: testCustomerIds } },
        })
        console.log(`✅ Deleted ${deletedCustomers.count} customer(s)`)
      }

      // 6. Delete geo locations
      if (testGeoLocationIds.length > 0) {
        const deletedGeoLocations = await tx.geoLocation.deleteMany({
          where: { id: { in: testGeoLocationIds } },
        })
        console.log(`✅ Deleted ${deletedGeoLocations.count} geo location(s)`)
      }
    })

    console.log('\n✅ Successfully cleaned test data from database!')
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error)
    throw error
  }
}

// Run the cleanup
cleanTestData()
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
