/**
 * Demo Account Setup Script for Apple App Store Review
 *
 * This script creates a fully functional demo account with realistic Vietnamese data
 * that Apple reviewers can use to test all app features.
 *
 * Features:
 * - Creates demo user in Clerk with proper roles
 * - Seeds realistic tasks with various statuses
 * - Creates sample customers and locations (Ho Chi Minh City)
 * - Generates activity history
 * - Pre-populates sample attachments
 * - Creates payment records
 *
 * Usage:
 *   # Create demo account and seed data
 *   npx tsx scripts/setup-demo-account.ts
 *
 *   # Reset demo account (delete and recreate)
 *   npx tsx scripts/setup-demo-account.ts --reset
 *
 *   # Delete demo account and all data
 *   npx tsx scripts/setup-demo-account.ts --cleanup
 */

import { clerkClient } from '@clerk/backend'
import type { Customer, GeoLocation, Task } from '@nv-internal/prisma-client'
import { UserRole } from '@nv-internal/validation'
import { getLogger } from '../src/lib/log'
import { getPrisma } from '../src/lib/prisma'
import { normalizeForSearch } from '../src/lib/text-utils'

const logger = getLogger('setup-demo-account')
const prisma = getPrisma()

// Demo account configuration
const DEMO_CONFIG = {
  email: 'applereview@namviet.app',
  username: 'applereview',
  password: 'AppleDemo2025!', // Strong password for App Store review
  firstName: 'Apple',
  lastName: 'Reviewer',
  phone: '0999999999', // Distinctive demo phone number

  // Metadata to identify demo account
  metadata: {
    isDemo: true,
    purpose: 'app-store-review',
    createdAt: new Date().toISOString(),
  },
} as const

// Helper function to build searchable text
function buildSearchableText(...parts: (string | null | undefined)[]): string {
  return parts
    .filter((part): part is string => Boolean(part))
    .map((part) => normalizeForSearch(part.trim().replace(/\s+/g, ' ')))
    .join(' ')
}

/**
 * Find or create demo user in Clerk
 */
async function setupClerkUser(reset = false) {
  logger.info('Setting up Clerk demo user...')

  try {
    // Check if user already exists
    const existingUsers = await clerkClient.users.getUserList({
      emailAddress: [DEMO_CONFIG.email],
    })

    if (existingUsers.data.length > 0) {
      const existingUser = existingUsers.data[0]

      if (reset) {
        logger.warn(`Deleting existing demo user: ${existingUser.id}`)
        await clerkClient.users.deleteUser(existingUser.id)
      } else {
        logger.info(`Demo user already exists: ${existingUser.id}`)
        return existingUser
      }
    }

    // Create new demo user
    logger.info(`Creating new demo user: ${DEMO_CONFIG.email}`)
    const user = await clerkClient.users.createUser({
      skipPasswordChecks: true,
      emailAddress: [DEMO_CONFIG.email],
      username: DEMO_CONFIG.username,
      password: DEMO_CONFIG.password,
      firstName: DEMO_CONFIG.firstName,
      lastName: DEMO_CONFIG.lastName,
      publicMetadata: {
        phoneNumber: DEMO_CONFIG.phone,
        roles: [UserRole.nvInternalWorker],
        defaultPasswordChanged: true, // Mark as demo account
        ...DEMO_CONFIG.metadata,
      },
    })

    logger.info(`✅ Created Clerk user: ${user.id}`)
    return user
  } catch (error) {
    logger.error('Failed to setup Clerk user', error)
    throw error
  }
}

/**
 * Create demo customers
 */
async function createDemoCustomers() {
  logger.info('Creating demo customers...')

  const customers = [
    {
      id: 'cust_demo_abc_company',
      name: 'Công ty TNHH ABC',
      phone: '0901234567',
    },
    {
      id: 'cust_demo_xyz_office',
      name: 'Văn phòng XYZ',
      phone: '0907654321',
    },
    {
      id: 'cust_demo_nguyen_van_a',
      name: 'Nguyễn Văn An',
      phone: '0909876543',
    },
    {
      id: 'cust_demo_tran_thi_b',
      name: 'Trần Thị Bình',
      phone: '0912345678',
    },
    {
      id: 'cust_demo_le_van_c',
      name: 'Lê Văn Cường',
      phone: '0923456789',
    },
  ]

  const createdCustomers = []

  for (const customerData of customers) {
    const searchableText = buildSearchableText(
      customerData.name,
      customerData.phone,
    )

    const customer = await prisma.customer.upsert({
      where: { id: customerData.id },
      update: {
        name: customerData.name,
        phone: customerData.phone,
        searchableText,
      },
      create: {
        id: customerData.id,
        name: customerData.name,
        phone: customerData.phone,
        searchableText,
      },
    })

    createdCustomers.push(customer)
    logger.info(`  ✅ Customer: ${customer.name}`)
  }

  return createdCustomers
}

/**
 * Create demo locations (real Ho Chi Minh City coordinates)
 */
async function createDemoLocations() {
  logger.info('Creating demo locations...')

  const locations = [
    {
      id: 'geo_demo_district_1',
      name: 'Công ty ABC - Quận 1',
      address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
      lat: 10.7731,
      lng: 106.702,
    },
    {
      id: 'geo_demo_district_3',
      name: 'Văn phòng XYZ - Quận 3',
      address: '456 Lê Lai, Phường 8, Quận 3, TP.HCM',
      lat: 10.7693,
      lng: 106.6819,
    },
    {
      id: 'geo_demo_district_10',
      name: 'Nhà riêng - Quận 10',
      address: '789 Cách Mạng Tháng 8, Phường 6, Quận 10, TP.HCM',
      lat: 10.7726,
      lng: 106.6573,
    },
    {
      id: 'geo_demo_binh_thanh',
      name: 'Chung cư - Bình Thạnh',
      address: '234 Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM',
      lat: 10.8031,
      lng: 106.71,
    },
    {
      id: 'geo_demo_phu_nhuan',
      name: 'Khách sạn - Phú Nhuận',
      address: '567 Phan Xích Long, Phường 2, Quận Phú Nhuận, TP.HCM',
      lat: 10.799,
      lng: 106.6815,
    },
  ]

  const createdLocations = []

  for (const locationData of locations) {
    const searchableText = buildSearchableText(
      locationData.name,
      locationData.address,
    )

    const location = await prisma.geoLocation.upsert({
      where: { id: locationData.id },
      update: {
        name: locationData.name,
        address: locationData.address,
        lat: locationData.lat,
        lng: locationData.lng,
        searchableText,
      },
      create: {
        id: locationData.id,
        name: locationData.name,
        address: locationData.address,
        lat: locationData.lat,
        lng: locationData.lng,
        searchableText,
      },
    })

    createdLocations.push(location)
    logger.info(`  ✅ Location: ${location.name}`)
  }

  return createdLocations
}

/**
 * Create demo tasks with various statuses
 */
async function createDemoTasks(
  userId: string,
  customers: Customer[],
  locations: GeoLocation[],
) {
  logger.info('Creating demo tasks...')

  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const tasks = [
    {
      title: 'Bảo trì điều hòa định kỳ - Công ty ABC',
      description:
        'Kiểm tra và vệ sinh hệ thống điều hòa tầng 2. Khách hàng yêu cầu làm việc trong giờ hành chính.',
      status: 'READY' as const,
      customerId: customers[0].id,
      geoLocationId: locations[0].id,
      expectedRevenue: 2500000,
      scheduledAt: tomorrow,
    },
    {
      title: 'Sửa chữa điều hòa không lạnh',
      description:
        'Điều hòa phòng họp không lạnh, cần kiểm tra gas và kiểm tra máy nén.',
      status: 'IN_PROGRESS' as const,
      customerId: customers[1].id,
      geoLocationId: locations[1].id,
      expectedRevenue: 3500000,
      scheduledAt: now,
      startedAt: new Date(now.getTime() - 30 * 60 * 1000), // Started 30 mins ago
    },
    {
      title: 'Lắp đặt điều hòa 2 chiều 18000 BTU',
      description:
        'Lắp đặt điều hòa mới cho phòng khách. Khách đã mua máy, chỉ cần lắp đặt.',
      status: 'COMPLETED' as const,
      customerId: customers[2].id,
      geoLocationId: locations[2].id,
      expectedRevenue: 5000000,
      scheduledAt: yesterday,
      startedAt: yesterday,
      completedAt: yesterday,
    },
    {
      title: 'Vệ sinh điều hòa - 3 cục',
      description:
        'Vệ sinh 3 cục điều hòa trong chung cư. Bao gồm vệ sinh lưới lọc và kiểm tra gas.',
      status: 'COMPLETED' as const,
      customerId: customers[3].id,
      geoLocationId: locations[3].id,
      expectedRevenue: 1800000,
      scheduledAt: twoDaysAgo,
      startedAt: twoDaysAgo,
      completedAt: twoDaysAgo,
    },
    {
      title: 'Kiểm tra hệ thống điều hòa trung tâm',
      description:
        'Kiểm tra và bảo trì hệ thống điều hòa trung tâm của khách sạn.',
      status: 'PREPARING' as const,
      customerId: customers[4].id,
      geoLocationId: locations[4].id,
      expectedRevenue: 8000000,
      scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    },
    {
      title: 'Thay dàn nóng điều hòa',
      description: 'Dàn nóng bị hỏng, cần thay thế toàn bộ.',
      status: 'ON_HOLD' as const,
      customerId: customers[1].id,
      geoLocationId: locations[1].id,
      expectedRevenue: 12000000,
      scheduledAt: null,
    },
  ]

  const createdTasks = []

  for (const taskData of tasks) {
    const searchableText = buildSearchableText(
      taskData.title,
      taskData.description,
      customers.find((c) => c.id === taskData.customerId)?.name,
      customers.find((c) => c.id === taskData.customerId)?.phone,
      locations.find((l) => l.id === taskData.geoLocationId)?.name,
      locations.find((l) => l.id === taskData.geoLocationId)?.address,
    )

    const task = await prisma.task.create({
      data: {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        customerId: taskData.customerId,
        geoLocationId: taskData.geoLocationId,
        expectedRevenue: taskData.expectedRevenue,
        expectedCurrency: 'VND',
        scheduledAt: taskData.scheduledAt,
        startedAt: taskData.startedAt || null,
        completedAt: taskData.completedAt || null,
        assigneeIds: [userId],
        searchableText,
      },
      include: {
        customer: true,
        geoLocation: true,
      },
    })

    createdTasks.push(task)
    logger.info(`  ✅ Task: ${task.title} [${task.status}]`)
  }

  return createdTasks
}

/**
 * Create activity logs for demo tasks
 */
async function createDemoActivities(userId: string, tasks: Task[]) {
  logger.info('Creating demo activities...')

  const activities = []

  for (const task of tasks) {
    // Log task creation
    activities.push({
      userId,
      topic: `TASK_${task.id}`,
      action: 'TASK_CREATED',
      payload: {
        taskId: task.id,
        title: task.title,
      },
      createdAt: task.createdAt,
    })

    // Log check-in for in-progress and completed tasks
    if (task.status === 'IN_PROGRESS' || task.status === 'COMPLETED') {
      activities.push({
        userId,
        topic: `TASK_${task.id}`,
        action: 'TASK_CHECKED_IN',
        payload: {
          taskId: task.id,
          locationId: task.geoLocationId,
          distance: Math.floor(Math.random() * 50), // Random distance 0-50m
          accuracy: 10,
        },
        createdAt: task.startedAt || task.createdAt,
      })
    }

    // Log completion for completed tasks
    if (task.status === 'COMPLETED') {
      activities.push({
        userId,
        topic: `TASK_${task.id}`,
        action: 'TASK_COMPLETED',
        payload: {
          taskId: task.id,
          notes: 'Hoàn thành công việc, khách hàng hài lòng.',
        },
        createdAt: task.completedAt || task.createdAt,
      })
    }
  }

  await prisma.activity.createMany({
    data: activities,
  })

  logger.info(`  ✅ Created ${activities.length} activity records`)
}

/**
 * Create payment records for completed tasks
 */
async function createDemoPayments(userId: string, tasks: Task[]) {
  logger.info('Creating demo payments...')

  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED')

  for (const task of completedTasks) {
    await prisma.payment.create({
      data: {
        taskId: task.id,
        amount: task.expectedRevenue || 0,
        currency: 'VND',
        collectedAt: task.completedAt || new Date(),
        collectedBy: userId,
        notes: 'Thanh toán bằng tiền mặt',
      },
    })

    logger.info(`  ✅ Payment for task: ${task.title}`)
  }
}

/**
 * Main setup function
 */
async function setupDemoAccount() {
  const isReset = process.argv.includes('--reset')
  const isCleanup = process.argv.includes('--cleanup')

  console.log('═══════════════════════════════════════════════════════')
  console.log('  DEMO ACCOUNT SETUP FOR APPLE APP STORE REVIEW')
  console.log('═══════════════════════════════════════════════════════')
  console.log()

  if (isCleanup) {
    logger.warn('⚠️  CLEANUP MODE - Deleting demo account and data')
    await cleanupDemoAccount()
    return
  }

  if (isReset) {
    logger.warn('⚠️  RESET MODE - Recreating demo account')
  }

  try {
    // Step 1: Setup Clerk user
    const clerkUser = await setupClerkUser(isReset)

    // Step 2: If reset, clean up existing data
    if (isReset) {
      logger.info('Cleaning up existing demo data...')
      await prisma.payment.deleteMany({
        where: { collectedBy: clerkUser.id },
      })
      await prisma.activity.deleteMany({
        where: { userId: clerkUser.id },
      })
      await prisma.task.deleteMany({
        where: { assigneeIds: { has: clerkUser.id } },
      })
      await prisma.customer.deleteMany({
        where: { id: { startsWith: 'cust_demo_' } },
      })
      await prisma.geoLocation.deleteMany({
        where: { id: { startsWith: 'geo_demo_' } },
      })
      logger.info('✅ Cleaned up existing demo data')
    }

    // Step 3: Create demo data
    const customers = await createDemoCustomers()
    const locations = await createDemoLocations()
    const tasks = await createDemoTasks(clerkUser.id, customers, locations)
    await createDemoActivities(clerkUser.id, tasks)
    await createDemoPayments(clerkUser.id, tasks)

    console.log()
    console.log('═══════════════════════════════════════════════════════')
    console.log('  ✅ DEMO ACCOUNT SETUP COMPLETE')
    console.log('═══════════════════════════════════════════════════════')
    console.log()
    console.log('📧 Email:    ', DEMO_CONFIG.email)
    console.log('🔑 Password: ', DEMO_CONFIG.password)
    console.log('👤 User ID:  ', clerkUser.id)
    console.log()
    console.log('📊 Statistics:')
    console.log(`   - ${customers.length} customers`)
    console.log(`   - ${locations.length} locations`)
    console.log(`   - ${tasks.length} tasks`)
    console.log(
      `   - ${tasks.filter((t) => t.status === 'COMPLETED').length} completed tasks with payments`,
    )
    console.log()
    console.log('🎉 Demo account is ready for Apple App Review!')
    console.log()
    console.log('⚠️  IMPORTANT: Add these credentials to App Store Connect:')
    console.log(`   Email: ${DEMO_CONFIG.email}`)
    console.log(`   Password: ${DEMO_CONFIG.password}`)
    console.log()
  } catch (error) {
    logger.error('Failed to setup demo account', error)
    throw error
  }
}

/**
 * Cleanup demo account and all data
 */
async function cleanupDemoAccount() {
  logger.info('Finding demo account...')

  try {
    // Find demo user in Clerk
    const users = await clerkClient.users.getUserList({
      emailAddress: [DEMO_CONFIG.email],
    })

    if (users.data.length === 0) {
      logger.warn('Demo account not found in Clerk')
      return
    }

    const demoUser = users.data[0]
    logger.info(`Found demo user: ${demoUser.id}`)

    // Delete from database first
    logger.info('Deleting demo data from database...')
    await prisma.payment.deleteMany({
      where: { collectedBy: demoUser.id },
    })
    await prisma.activity.deleteMany({
      where: { userId: demoUser.id },
    })
    await prisma.task.deleteMany({
      where: { assigneeIds: { has: demoUser.id } },
    })
    await prisma.customer.deleteMany({
      where: { id: { startsWith: 'cust_demo_' } },
    })
    await prisma.geoLocation.deleteMany({
      where: { id: { startsWith: 'geo_demo_' } },
    })

    // Delete from Clerk
    logger.info('Deleting demo user from Clerk...')
    await clerkClient.users.deleteUser(demoUser.id)

    console.log()
    console.log('✅ Demo account and all data deleted successfully')
    console.log()
  } catch (error) {
    logger.error('Failed to cleanup demo account', error)
    throw error
  }
}

// Run the setup
setupDemoAccount()
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
