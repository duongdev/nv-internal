/**
 * Script to clean ALL task-related data from the database
 *
 * This script removes all task-related records to prepare for fresh screenshot data:
 * - All Activities (event logs)
 * - All Attachments (photos/files)
 * - All Payments
 * - All Tasks
 *
 * ✅ PRESERVED: Users, Customers, GeoLocations (reference data)
 *
 * ⚠️  WARNING: This operation is irreversible!
 * ⚠️  Use dry-run mode first to review what will be deleted!
 *
 * Usage:
 *   # Dry run (show what would be deleted)
 *   npx tsx scripts/clean-task-data.ts --dry-run
 *
 *   # Actually delete the data
 *   npx tsx scripts/clean-task-data.ts --confirm
 */

import { getPrisma } from '../src/lib/prisma'

const prisma = getPrisma()

const isDryRun = process.argv.includes('--dry-run')
const isConfirmed = process.argv.includes('--confirm')

async function cleanTaskData() {
  if (!isDryRun && !isConfirmed) {
    console.error('❌ Error: You must specify either --dry-run or --confirm\n')
    console.log('Usage:')
    console.log(
      '  npx tsx scripts/clean-task-data.ts --dry-run   # Show what would be deleted',
    )
    console.log(
      '  npx tsx scripts/clean-task-data.ts --confirm   # Actually delete the data',
    )
    process.exit(1)
  }

  console.log('═══════════════════════════════════════════════════════')
  console.log('  TASK DATA CLEANUP SCRIPT')
  console.log('═══════════════════════════════════════════════════════')
  console.log()

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No data will be deleted\n')
  } else {
    console.log('⚠️  DELETION MODE - Data will be permanently removed\n')
  }

  try {
    // Count all records to be deleted
    console.log('📊 Analyzing database...\n')

    const [activityCount, attachmentCount, paymentCount, taskCount] =
      await Promise.all([
        prisma.activity.count(),
        prisma.attachment.count(),
        prisma.payment.count(),
        prisma.task.count(),
      ])

    // Show breakdown
    console.log('Records to be deleted:')
    console.log(`  📝 Activities:  ${activityCount.toLocaleString()}`)
    console.log(`  📎 Attachments: ${attachmentCount.toLocaleString()}`)
    console.log(`  💰 Payments:    ${paymentCount.toLocaleString()}`)
    console.log(`  ✅ Tasks:       ${taskCount.toLocaleString()}`)
    console.log()

    const totalRecords =
      activityCount + attachmentCount + paymentCount + taskCount

    console.log(`📊 Total records: ${totalRecords.toLocaleString()}\n`)

    // Show what will be preserved
    const [customerCount, geoLocationCount] = await Promise.all([
      prisma.customer.count(),
      prisma.geoLocation.count(),
    ])

    console.log('Records to be PRESERVED:')
    console.log(`  👤 Customers:     ${customerCount.toLocaleString()}`)
    console.log(`  📍 GeoLocations:  ${geoLocationCount.toLocaleString()}`)
    console.log()

    if (totalRecords === 0) {
      console.log('✅ No task data found. Database is already clean!')
      return
    }

    if (isDryRun) {
      console.log('═══════════════════════════════════════════════════════')
      console.log('  DRY RUN SUMMARY')
      console.log('═══════════════════════════════════════════════════════')
      console.log()
      console.log('🔍 Would delete:')
      console.log(`   ✓ ${activityCount.toLocaleString()} activity records`)
      console.log(`   ✓ ${attachmentCount.toLocaleString()} attachments`)
      console.log(`   ✓ ${paymentCount.toLocaleString()} payments`)
      console.log(`   ✓ ${taskCount.toLocaleString()} tasks`)
      console.log()
      console.log('🔒 Would preserve:')
      console.log(`   ✓ ${customerCount.toLocaleString()} customers`)
      console.log(`   ✓ ${geoLocationCount.toLocaleString()} geo locations`)
      console.log('   ✓ All user accounts')
      console.log()
      console.log('💡 Run with --confirm to actually delete this data')
      return
    }

    // Confirmation prompt for deletion mode
    console.log('═══════════════════════════════════════════════════════')
    console.log('  ⚠️  DELETING DATA - This cannot be undone!')
    console.log('═══════════════════════════════════════════════════════')
    console.log()

    // Use transaction for atomic deletion
    const deletionResults = await prisma.$transaction(async (tx) => {
      console.log('🔄 Starting deletion in transaction...\n')

      // Delete in correct order to respect foreign key constraints

      // 1. Delete all activities
      console.log('  [1/4] Deleting activities...')
      const deletedActivities = await tx.activity.deleteMany({})
      console.log(
        `        ✅ Deleted ${deletedActivities.count} activity record(s)`,
      )

      // 2. Delete all attachments
      console.log('  [2/4] Deleting attachments...')
      const deletedAttachments = await tx.attachment.deleteMany({})
      console.log(
        `        ✅ Deleted ${deletedAttachments.count} attachment(s)`,
      )

      // 3. Delete all payments (must be before tasks due to foreign key)
      console.log('  [3/4] Deleting payments...')
      const deletedPayments = await tx.payment.deleteMany({})
      console.log(`        ✅ Deleted ${deletedPayments.count} payment(s)`)

      // 4. Delete all tasks (must be last due to foreign key dependencies)
      console.log('  [4/4] Deleting tasks...')
      const deletedTasks = await tx.task.deleteMany({})
      console.log(`        ✅ Deleted ${deletedTasks.count} task(s)`)

      return {
        activities: deletedActivities.count,
        attachments: deletedAttachments.count,
        payments: deletedPayments.count,
        tasks: deletedTasks.count,
      }
    })

    console.log()
    console.log('═══════════════════════════════════════════════════════')
    console.log('  ✅ CLEANUP COMPLETE')
    console.log('═══════════════════════════════════════════════════════')
    console.log()
    console.log('Deletion Summary:')
    console.log(
      `  ✅ Activities:  ${deletionResults.activities.toLocaleString()}`,
    )
    console.log(
      `  ✅ Attachments: ${deletionResults.attachments.toLocaleString()}`,
    )
    console.log(
      `  ✅ Payments:    ${deletionResults.payments.toLocaleString()}`,
    )
    console.log(`  ✅ Tasks:       ${deletionResults.tasks.toLocaleString()}`)
    console.log()
    console.log('Preserved Data:')
    console.log(`  ✓ Customers:    ${customerCount.toLocaleString()}`)
    console.log(`  ✓ GeoLocations: ${geoLocationCount.toLocaleString()}`)
    console.log('  ✓ Users:        (unchanged)')
    console.log()
    console.log('🎉 Database is ready for fresh screenshot data!')
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error)
    throw error
  }
}

// Run the cleanup
cleanTaskData()
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
