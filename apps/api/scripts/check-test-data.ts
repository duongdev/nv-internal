/**
 * Script to check for potential test/dummy data in the database
 *
 * This script identifies records that might be test data based on patterns:
 * - Customers named "Nguyễn Văn A" or "Trần Thị B" (test names from test suite)
 * - Phone numbers "0987654321" or "0123456789" (test phones from test suite)
 * - Geo locations named "Hà Nội" with exact test coordinates
 * - Tasks with Vietnamese test titles like "Sửa điều hòa", "Vệ sinh máy lạnh"
 *
 * Usage:
 *   npx tsx scripts/check-test-data.ts
 */

import { getPrisma } from '../src/lib/prisma'

const prisma = getPrisma()

// biome-ignore lint/suspicious/noConsole: This is a CLI script that needs console output
async function checkForTestData() {
  console.log('🔍 Checking for potential test/dummy data in database...\n')

  // Check for test customers
  const testCustomers = await prisma.customer.findMany({
    where: {
      // biome-ignore lint/style/useNamingConvention: Prisma query syntax
      OR: [
        { name: { contains: 'Nguyễn Văn A', mode: 'insensitive' } },
        { name: { contains: 'Trần Thị B', mode: 'insensitive' } },
        { phone: { in: ['0987654321', '0123456789'] } },
      ],
    },
  })

  if (testCustomers.length > 0) {
    console.log(`⚠️  Found ${testCustomers.length} potential test customer(s):`)
    for (const customer of testCustomers) {
      console.log(
        `   - ID: ${customer.id}, Name: ${customer.name}, Phone: ${customer.phone}`,
      )
    }
    console.log()
  } else {
    console.log('✅ No test customers found\n')
  }

  // Check for test geo locations
  const testGeoLocations = await prisma.geoLocation.findMany({
    where: {
      // biome-ignore lint/style/useNamingConvention: Prisma query syntax
      OR: [
        {
          // biome-ignore lint/style/useNamingConvention: Prisma query syntax
          AND: [{ name: 'Hà Nội' }, { lat: 21.0285 }, { lng: 105.8542 }],
        },
        { address: { contains: 'Số 123, Đường Láng', mode: 'insensitive' } },
      ],
    },
  })

  if (testGeoLocations.length > 0) {
    console.log(
      `⚠️  Found ${testGeoLocations.length} potential test geo location(s):`,
    )
    for (const geo of testGeoLocations) {
      console.log(
        `   - ID: ${geo.id}, Name: ${geo.name}, Address: ${geo.address}`,
      )
    }
    console.log()
  } else {
    console.log('✅ No test geo locations found\n')
  }

  // Check for test tasks (with specific test titles)
  const testTasks = await prisma.task.findMany({
    where: {
      // biome-ignore lint/style/useNamingConvention: Prisma query syntax
      OR: [
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
    include: {
      customer: true,
      geoLocation: true,
    },
  })

  if (testTasks.length > 0) {
    console.log(`⚠️  Found ${testTasks.length} potential test task(s):`)
    for (const task of testTasks) {
      console.log(`   - ID: ${task.id}, Title: ${task.title}`)
      console.log(`     Customer: ${task.customer?.name || 'N/A'}`)
      console.log(`     Location: ${task.geoLocation?.name || 'N/A'}`)
      console.log(`     Created: ${task.createdAt.toISOString()}`)
    }
    console.log()
  } else {
    console.log('✅ No test tasks found\n')
  }

  // Summary
  const totalTestData =
    testCustomers.length + testGeoLocations.length + testTasks.length

  if (totalTestData > 0) {
    console.log('\n📊 Summary:')
    console.log(`   Total potential test records: ${totalTestData}`)
    console.log(`   - Test customers: ${testCustomers.length}`)
    console.log(`   - Test geo locations: ${testGeoLocations.length}`)
    console.log(`   - Test tasks: ${testTasks.length}`)
    console.log(
      '\n⚠️  These records might be test data. Review before cleaning.',
    )
    console.log('   To clean up, run: npx tsx scripts/clean-test-data.ts')
  } else {
    console.log('\n✅ No test data found in the database!')
    console.log('   Your database appears clean.')
  }
}

// Run the check
checkForTestData()
  .catch((error) => {
    console.error('❌ Error checking for test data:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
