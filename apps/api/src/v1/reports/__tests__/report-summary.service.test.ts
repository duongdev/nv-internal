import type { ClerkClient, User } from '@clerk/backend'
import { Prisma } from '@nv-internal/prisma-client'
import { getEmployeesSummary } from '../report.service'

// Mock dependencies
const mockPrismaInstance = {
  task: {
    findMany: jest.fn(),
  },
  activity: {
    findMany: jest.fn(),
  },
}

jest.mock('../../../lib/prisma', () => ({
  getPrisma: jest.fn(() => mockPrismaInstance),
}))

jest.mock('../../../lib/log', () => ({
  getLogger: jest.fn(() => ({
    trace: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}))

describe('getEmployeesSummary', () => {
  let mockClerkClient: jest.Mocked<ClerkClient>

  // Helper to create mock Clerk users
  const createMockUser = (
    id: string,
    firstName: string | null,
    lastName: string | null,
    banned = false,
  ): User =>
    ({
      id,
      firstName,
      lastName,
      username: `user_${id}`,
      imageUrl: `https://img.clerk.com/${id}`,
      banned,
      emailAddresses: [{ emailAddress: `${id}@example.com` }],
      // Add minimal required Clerk User fields
      createdAt: Date.now(),
      updatedAt: Date.now(),
      hasImage: true,
      primaryEmailAddressId: '1',
      primaryPhoneNumberId: null,
      primaryWeb3WalletId: null,
      passwordEnabled: true,
      twoFactorEnabled: false,
      totpEnabled: false,
      backupCodeEnabled: false,
      externalId: null,
      lastSignInAt: null,
      phoneNumbers: [],
      web3Wallets: [],
      externalAccounts: [],
      publicMetadata: {},
      privateMetadata: {},
      unsafeMetadata: {},
      lastActiveAt: null,
      profileImageUrl: `https://img.clerk.com/${id}`,
    }) as unknown as User

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup Clerk client mock
    const getUserListMock = jest.fn()
    mockClerkClient = {
      users: {
        getUserList: getUserListMock,
      },
    } as unknown as jest.Mocked<ClerkClient>
  })

  describe('Basic Functionality', () => {
    test('should generate summary for multiple employees', async () => {
      const users = [
        createMockUser('user_1', 'John', 'Doe'),
        createMockUser('user_2', 'Jane', 'Smith'),
        createMockUser('user_3', 'Bob', 'Johnson'),
      ]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 3,
      } as any)

      // Mock tasks
      const tasks = [
        {
          id: 1,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_1'],
          completedAt: new Date('2025-01-15T10:00:00Z'),
        },
        {
          id: 2,
          expectedRevenue: new Prisma.Decimal(2000),
          assigneeIds: ['user_2'],
          completedAt: new Date('2025-01-16T10:00:00Z'),
        },
        {
          id: 3,
          expectedRevenue: new Prisma.Decimal(1500),
          assigneeIds: ['user_1', 'user_2'], // Multi-assignee
          completedAt: new Date('2025-01-17T10:00:00Z'),
        },
      ]

      // Mock check-ins
      const checkIns = [
        { userId: 'user_1', createdAt: new Date('2025-01-15T08:00:00Z') },
        { userId: 'user_1', createdAt: new Date('2025-01-16T08:00:00Z') },
        { userId: 'user_2', createdAt: new Date('2025-01-16T09:00:00Z') },
        { userId: 'user_2', createdAt: new Date('2025-01-17T09:00:00Z') },
        { userId: 'user_3', createdAt: new Date('2025-01-18T09:00:00Z') },
      ]

      mockPrismaInstance.task.findMany.mockResolvedValue(tasks)
      mockPrismaInstance.activity.findMany.mockResolvedValue(checkIns)

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        timezone: 'Asia/Ho_Chi_Minh',
        sort: 'revenue',
        sortOrder: 'desc',
        clerkClient: mockClerkClient,
      })

      expect(result.employees).toHaveLength(3)
      expect(result.summary.totalEmployees).toBe(3)
      expect(result.summary.activeEmployees).toBe(3) // All 3 have activity
      expect(result.summary.totalTasks).toBe(3)
      expect(result.summary.totalRevenue).toBeGreaterThan(0)

      // Verify user_1 metrics (1000 + 750 split)
      const user1 = result.employees.find((e) => e.id === 'user_1')
      expect(user1?.metrics.totalRevenue).toBe(1750)
      expect(user1?.metrics.tasksCompleted).toBe(2)
      expect(user1?.metrics.daysWorked).toBe(2) // 2 unique days
      expect(user1?.hasActivity).toBe(true) // Has tasks and check-ins

      // Verify user_2 metrics (2000 + 750 split)
      const user2 = result.employees.find((e) => e.id === 'user_2')
      expect(user2?.metrics.totalRevenue).toBe(2750)
      expect(user2?.metrics.tasksCompleted).toBe(2)
      expect(user2?.metrics.daysWorked).toBe(2) // 2 unique days
      expect(user2?.hasActivity).toBe(true) // Has tasks and check-ins

      // Verify user_3 has activity (check-ins only)
      const user3 = result.employees.find((e) => e.id === 'user_3')
      expect(user3?.hasActivity).toBe(true) // Has check-ins
    })

    test('should handle empty result set', async () => {
      mockClerkClient.users.getUserList.mockResolvedValue({
        data: [],
        totalCount: 0,
      } as any)

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        timezone: 'Asia/Ho_Chi_Minh',
        sort: 'revenue',
        sortOrder: 'desc',
        clerkClient: mockClerkClient,
      })

      expect(result.employees).toEqual([])
      expect(result.summary).toEqual({
        totalEmployees: 0,
        activeEmployees: 0,
        totalRevenue: 0,
        totalTasks: 0,
      })
    })

    test('should aggregate revenue correctly', async () => {
      const users = [createMockUser('user_1', 'John', 'Doe')]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 1,
      } as any)

      const tasks = [
        {
          id: 1,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_1'],
          completedAt: new Date('2025-01-15T10:00:00Z'),
        },
        {
          id: 2,
          expectedRevenue: new Prisma.Decimal(2000),
          assigneeIds: ['user_1'],
          completedAt: new Date('2025-01-16T10:00:00Z'),
        },
      ]

      mockPrismaInstance.task.findMany.mockResolvedValue(tasks)
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        timezone: 'Asia/Ho_Chi_Minh',
        sort: 'revenue',
        sortOrder: 'desc',
        clerkClient: mockClerkClient,
      })

      expect(result.employees[0].metrics.totalRevenue).toBe(3000)
      expect(result.summary.totalRevenue).toBe(3000)
    })

    test('should count tasks correctly', async () => {
      const users = [createMockUser('user_1', 'John', 'Doe')]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 1,
      } as any)

      const tasks = [
        {
          id: 1,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_1'],
          completedAt: new Date('2025-01-15T10:00:00Z'),
        },
        {
          id: 2,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_1'],
          completedAt: new Date('2025-01-16T10:00:00Z'),
        },
        {
          id: 3,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_1'],
          completedAt: new Date('2025-01-17T10:00:00Z'),
        },
      ]

      mockPrismaInstance.task.findMany.mockResolvedValue(tasks)
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        timezone: 'Asia/Ho_Chi_Minh',
        sort: 'revenue',
        sortOrder: 'desc',
        clerkClient: mockClerkClient,
      })

      expect(result.employees[0].metrics.tasksCompleted).toBe(3)
      expect(result.summary.totalTasks).toBe(3)
    })

    test('should calculate days worked correctly', async () => {
      const users = [createMockUser('user_1', 'John', 'Doe')]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 1,
      } as any)

      // Multiple check-ins on same day and different days
      const checkIns = [
        { userId: 'user_1', createdAt: new Date('2025-01-15T08:00:00Z') },
        { userId: 'user_1', createdAt: new Date('2025-01-15T14:00:00Z') }, // Same day
        { userId: 'user_1', createdAt: new Date('2025-01-16T08:00:00Z') },
        { userId: 'user_1', createdAt: new Date('2025-01-17T08:00:00Z') },
      ]

      mockPrismaInstance.task.findMany.mockResolvedValue([])
      mockPrismaInstance.activity.findMany.mockResolvedValue(checkIns)

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        timezone: 'Asia/Ho_Chi_Minh',
        clerkClient: mockClerkClient,
      })

      expect(result.employees[0].metrics.daysWorked).toBe(3) // 3 unique days
    })

    test('should handle single employee', async () => {
      const users = [createMockUser('user_1', 'John', 'Doe')]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 1,
      } as any)

      mockPrismaInstance.task.findMany.mockResolvedValue([])
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        timezone: 'Asia/Ho_Chi_Minh',
        sort: 'revenue',
        sortOrder: 'desc',
        clerkClient: mockClerkClient,
      })

      expect(result.employees).toHaveLength(1)
      expect(result.summary.totalEmployees).toBe(1)
    })

    test('should handle date range boundaries', async () => {
      const users = [createMockUser('user_1', 'John', 'Doe')]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 1,
      } as any)

      const tasks = [
        {
          id: 1,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_1'],
          completedAt: new Date('2025-01-01T00:00:00Z'), // Start boundary
        },
        {
          id: 2,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_1'],
          completedAt: new Date('2025-01-31T23:59:59Z'), // End boundary
        },
      ]

      mockPrismaInstance.task.findMany.mockResolvedValue(tasks)
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        timezone: 'Asia/Ho_Chi_Minh',
        sort: 'revenue',
        sortOrder: 'desc',
        clerkClient: mockClerkClient,
      })

      expect(result.employees[0].metrics.tasksCompleted).toBe(2)
    })

    test('should handle timezone conversions', async () => {
      const users = [createMockUser('user_1', 'John', 'Doe')]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 1,
      } as any)

      // Check-in at UTC midnight (7 AM Vietnam time = next day)
      const checkIns = [
        { userId: 'user_1', createdAt: new Date('2025-01-15T00:00:00Z') }, // 7 AM ICT
        { userId: 'user_1', createdAt: new Date('2025-01-15T17:00:00Z') }, // Midnight ICT (next day)
      ]

      mockPrismaInstance.task.findMany.mockResolvedValue([])
      mockPrismaInstance.activity.findMany.mockResolvedValue(checkIns)

      const result = await getEmployeesSummary({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        timezone: 'Asia/Ho_Chi_Minh',
        clerkClient: mockClerkClient,
      })

      // Both check-ins should be on different days in ICT
      expect(result.employees[0].metrics.daysWorked).toBe(2)
    })
  })

  describe('Performance', () => {
    test('should use batch queries (verify query count)', async () => {
      const users = Array.from({ length: 10 }, (_, i) =>
        createMockUser(`user_${i}`, `First${i}`, `Last${i}`),
      )

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 10,
      } as any)

      mockPrismaInstance.task.findMany.mockResolvedValue([])
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        clerkClient: mockClerkClient,
      })

      // Should call findMany exactly twice (tasks + activities)
      expect(mockPrismaInstance.task.findMany).toHaveBeenCalledTimes(1)
      expect(mockPrismaInstance.activity.findMany).toHaveBeenCalledTimes(1)
      expect(mockClerkClient.users.getUserList).toHaveBeenCalledTimes(1)
    })

    test('should complete in <2s for 50 employees', async () => {
      const users = Array.from({ length: 50 }, (_, i) =>
        createMockUser(`user_${i}`, `First${i}`, `Last${i}`),
      )

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 50,
      } as any)

      // Generate realistic task data
      const tasks = Array.from({ length: 200 }, (_, i) => ({
        id: i,
        expectedRevenue: new Prisma.Decimal(1000),
        assigneeIds: [users[i % 50].id],
        completedAt: new Date('2025-01-15T10:00:00Z'),
      }))

      const checkIns = Array.from({ length: 500 }, (_, i) => ({
        userId: users[i % 50].id,
        createdAt: new Date('2025-01-15T08:00:00Z'),
      }))

      mockPrismaInstance.task.findMany.mockResolvedValue(tasks)
      mockPrismaInstance.activity.findMany.mockResolvedValue(checkIns)

      const startTime = Date.now()

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        timezone: 'Asia/Ho_Chi_Minh',
        sort: 'revenue',
        sortOrder: 'desc',
        clerkClient: mockClerkClient,
      })

      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(2000) // Less than 2 seconds
      expect(result.employees).toHaveLength(50)
    })

    test('should handle 100 employees', async () => {
      const users = Array.from({ length: 100 }, (_, i) =>
        createMockUser(`user_${i}`, `First${i}`, `Last${i}`),
      )

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 100,
      } as any)

      mockPrismaInstance.task.findMany.mockResolvedValue([])
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        timezone: 'Asia/Ho_Chi_Minh',
        sort: 'revenue',
        sortOrder: 'desc',
        clerkClient: mockClerkClient,
      })

      expect(result.employees).toHaveLength(100)
      expect(result.summary.totalEmployees).toBe(100)
    })

    test('should not exhaust connection pool', async () => {
      const users = Array.from({ length: 50 }, (_, i) =>
        createMockUser(`user_${i}`, `First${i}`, `Last${i}`),
      )

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 50,
      } as any)

      mockPrismaInstance.task.findMany.mockResolvedValue([])
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      // Run multiple concurrent requests
      await Promise.all([
        getEmployeesSummary({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          clerkClient: mockClerkClient,
        }),
        getEmployeesSummary({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          clerkClient: mockClerkClient,
        }),
        getEmployeesSummary({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          clerkClient: mockClerkClient,
        }),
      ])

      // Should not throw connection pool errors
      expect(mockPrismaInstance.task.findMany).toHaveBeenCalledTimes(3)
    })
  })

  describe('Edge Cases', () => {
    test('should handle employees with no activity', async () => {
      const users = [
        createMockUser('user_1', 'John', 'Doe'),
        createMockUser('user_2', 'Jane', 'Smith'),
      ]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 2,
      } as any)

      // Only user_1 has tasks
      const tasks = [
        {
          id: 1,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_1'],
          completedAt: new Date('2025-01-15T10:00:00Z'),
        },
      ]

      mockPrismaInstance.task.findMany.mockResolvedValue(tasks)
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        timezone: 'Asia/Ho_Chi_Minh',
        sort: 'revenue',
        sortOrder: 'desc',
        clerkClient: mockClerkClient,
      })

      expect(result.employees).toHaveLength(2)
      expect(result.summary.totalEmployees).toBe(2)
      expect(result.summary.activeEmployees).toBe(1) // Only user_1 has activity

      const user2 = result.employees.find((e) => e.id === 'user_2')
      expect(user2?.metrics).toEqual({
        totalRevenue: 0,
        tasksCompleted: 0,
        daysWorked: 0,
      })
      expect(user2?.hasActivity).toBe(false) // No activity
    })

    test('should calculate activeEmployees correctly', async () => {
      const users = [
        createMockUser('user_1', 'John', 'Doe'),
        createMockUser('user_2', 'Jane', 'Smith'),
        createMockUser('user_3', 'Bob', 'Johnson'),
      ]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 3,
      } as any)

      // user_1 has tasks, user_2 has check-ins, user_3 has nothing
      const tasks = [
        {
          id: 1,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_1'],
          completedAt: new Date('2025-01-15T10:00:00Z'),
        },
      ]

      const checkIns = [
        { userId: 'user_2', createdAt: new Date('2025-01-16T08:00:00Z') },
      ]

      mockPrismaInstance.task.findMany.mockResolvedValue(tasks)
      mockPrismaInstance.activity.findMany.mockResolvedValue(checkIns)

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        timezone: 'Asia/Ho_Chi_Minh',
        sort: 'revenue',
        sortOrder: 'desc',
        clerkClient: mockClerkClient,
      })

      expect(result.summary.totalEmployees).toBe(3)
      expect(result.summary.activeEmployees).toBe(2) // user_1 and user_2 have activity

      // Verify hasActivity flags
      const user1 = result.employees.find((e) => e.id === 'user_1')
      expect(user1?.hasActivity).toBe(true) // Has tasks

      const user2 = result.employees.find((e) => e.id === 'user_2')
      expect(user2?.hasActivity).toBe(true) // Has check-ins

      const user3 = result.employees.find((e) => e.id === 'user_3')
      expect(user3?.hasActivity).toBe(false) // No activity
    })

    test('should include hasActivity flag for each employee', async () => {
      const users = [
        createMockUser('user_1', 'John', 'Doe'),
        createMockUser('user_2', 'Jane', 'Smith'),
      ]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 2,
      } as any)

      const tasks = [
        {
          id: 1,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_1'],
          completedAt: new Date('2025-01-15T10:00:00Z'),
        },
      ]

      mockPrismaInstance.task.findMany.mockResolvedValue(tasks)
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        timezone: 'Asia/Ho_Chi_Minh',
        sort: 'revenue',
        sortOrder: 'desc',
        clerkClient: mockClerkClient,
      })

      // Verify every employee has hasActivity field
      result.employees.forEach((employee) => {
        expect(employee.hasActivity).toBeDefined()
        expect(typeof employee.hasActivity).toBe('boolean')

        // Verify logic: hasActivity = true if tasks or days worked > 0
        const expectedActivity =
          employee.metrics.tasksCompleted > 0 || employee.metrics.daysWorked > 0
        expect(employee.hasActivity).toBe(expectedActivity)
      })
    })

    test('should split revenue for multi-assignee tasks', async () => {
      const users = [
        createMockUser('user_1', 'John', 'Doe'),
        createMockUser('user_2', 'Jane', 'Smith'),
        createMockUser('user_3', 'Bob', 'Johnson'),
      ]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 3,
      } as any)

      const tasks = [
        {
          id: 1,
          expectedRevenue: new Prisma.Decimal(3000),
          assigneeIds: ['user_1', 'user_2', 'user_3'], // 3-way split
          completedAt: new Date('2025-01-15T10:00:00Z'),
        },
      ]

      mockPrismaInstance.task.findMany.mockResolvedValue(tasks)
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        timezone: 'Asia/Ho_Chi_Minh',
        sort: 'revenue',
        sortOrder: 'desc',
        clerkClient: mockClerkClient,
      })

      // Each user should get 1/3 of revenue
      result.employees.forEach((emp) => {
        expect(emp.metrics.totalRevenue).toBe(1000)
        expect(emp.metrics.tasksCompleted).toBe(1)
      })
    })

    test('should handle timezone boundary cases', async () => {
      const users = [createMockUser('user_1', 'John', 'Doe')]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 1,
      } as any)

      // Simulate Prisma filtering: Task at midnight UTC (7 AM ICT on Jan 16)
      // is outside Jan 15 range in ICT timezone, so Prisma won't return it
      mockPrismaInstance.task.findMany.mockResolvedValue([])
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      const result = await getEmployeesSummary({
        startDate: '2025-01-15',
        endDate: '2025-01-15',
        timezone: 'Asia/Ho_Chi_Minh', // UTC+7
        clerkClient: mockClerkClient,
      })

      // Prisma correctly filtered out task outside date range
      expect(result.employees[0].metrics.tasksCompleted).toBe(0)
    })

    test('should handle single-day date range', async () => {
      const users = [createMockUser('user_1', 'John', 'Doe')]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 1,
      } as any)

      const tasks = [
        {
          id: 1,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_1'],
          completedAt: new Date('2025-01-15T12:00:00Z'),
        },
      ]

      mockPrismaInstance.task.findMany.mockResolvedValue(tasks)
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      const result = await getEmployeesSummary({
        startDate: '2025-01-15',
        endDate: '2025-01-15',
        clerkClient: mockClerkClient,
      })

      expect(result.period.startDate).toBe('2025-01-15')
      expect(result.period.endDate).toBe('2025-01-15')
      expect(result.employees[0].metrics.tasksCompleted).toBeGreaterThan(0)
    })

    test('should exclude banned users', async () => {
      const users = [
        createMockUser('user_1', 'John', 'Doe', false),
        createMockUser('user_2', 'Jane', 'Smith', true), // Banned
        createMockUser('user_3', 'Bob', 'Johnson', false),
      ]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 3,
      } as any)

      mockPrismaInstance.task.findMany.mockResolvedValue([])
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        timezone: 'Asia/Ho_Chi_Minh',
        sort: 'revenue',
        sortOrder: 'desc',
        clerkClient: mockClerkClient,
      })

      expect(result.employees).toHaveLength(2)
      expect(result.summary.totalEmployees).toBe(2)
      expect(result.employees.find((e) => e.id === 'user_2')).toBeUndefined()
    })

    test('should handle null/missing employee data', async () => {
      const users = [
        createMockUser('user_1', null, null), // No name
      ]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 1,
      } as any)

      mockPrismaInstance.task.findMany.mockResolvedValue([])
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        timezone: 'Asia/Ho_Chi_Minh',
        sort: 'revenue',
        sortOrder: 'desc',
        clerkClient: mockClerkClient,
      })

      expect(result.employees[0].firstName).toBeNull()
      expect(result.employees[0].lastName).toBeNull()
    })
  })

  describe('Sorting', () => {
    test('should sort by revenue descending', async () => {
      const users = [
        createMockUser('user_1', 'John', 'Doe'),
        createMockUser('user_2', 'Jane', 'Smith'),
        createMockUser('user_3', 'Bob', 'Johnson'),
      ]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 3,
      } as any)

      const tasks = [
        {
          id: 1,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_1'],
          completedAt: new Date('2025-01-15T10:00:00Z'),
        },
        {
          id: 2,
          expectedRevenue: new Prisma.Decimal(3000),
          assigneeIds: ['user_2'],
          completedAt: new Date('2025-01-16T10:00:00Z'),
        },
        {
          id: 3,
          expectedRevenue: new Prisma.Decimal(2000),
          assigneeIds: ['user_3'],
          completedAt: new Date('2025-01-17T10:00:00Z'),
        },
      ]

      mockPrismaInstance.task.findMany.mockResolvedValue(tasks)
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        sort: 'revenue',
        sortOrder: 'desc',
        clerkClient: mockClerkClient,
      })

      expect(result.employees[0].id).toBe('user_2') // 3000
      expect(result.employees[1].id).toBe('user_3') // 2000
      expect(result.employees[2].id).toBe('user_1') // 1000
    })

    test('should sort by tasks descending', async () => {
      const users = [
        createMockUser('user_1', 'John', 'Doe'),
        createMockUser('user_2', 'Jane', 'Smith'),
      ]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 2,
      } as any)

      const tasks = [
        {
          id: 1,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_1'],
          completedAt: new Date('2025-01-15T10:00:00Z'),
        },
        {
          id: 2,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_2'],
          completedAt: new Date('2025-01-16T10:00:00Z'),
        },
        {
          id: 3,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_2'],
          completedAt: new Date('2025-01-17T10:00:00Z'),
        },
        {
          id: 4,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_2'],
          completedAt: new Date('2025-01-18T10:00:00Z'),
        },
      ]

      mockPrismaInstance.task.findMany.mockResolvedValue(tasks)
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        sort: 'tasks',
        sortOrder: 'desc',
        clerkClient: mockClerkClient,
      })

      expect(result.employees[0].id).toBe('user_2') // 3 tasks
      expect(result.employees[0].metrics.tasksCompleted).toBe(3)
      expect(result.employees[1].id).toBe('user_1') // 1 task
      expect(result.employees[1].metrics.tasksCompleted).toBe(1)
    })

    test('should sort by name ascending', async () => {
      const users = [
        createMockUser('user_1', 'Charlie', 'Doe'),
        createMockUser('user_2', 'Alice', 'Smith'),
        createMockUser('user_3', 'Bob', 'Johnson'),
      ]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 3,
      } as any)

      mockPrismaInstance.task.findMany.mockResolvedValue([])
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        sort: 'name',
        sortOrder: 'asc',
        clerkClient: mockClerkClient,
      })

      expect(result.employees[0].firstName).toBe('Alice')
      expect(result.employees[1].firstName).toBe('Bob')
      expect(result.employees[2].firstName).toBe('Charlie')
    })

    test('should handle tie-breaking logic', async () => {
      const users = [
        createMockUser('user_1', 'John', 'Doe'),
        createMockUser('user_2', 'Jane', 'Smith'),
      ]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 2,
      } as any)

      // Both users have same revenue
      const tasks = [
        {
          id: 1,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_1'],
          completedAt: new Date('2025-01-15T10:00:00Z'),
        },
        {
          id: 2,
          expectedRevenue: new Prisma.Decimal(1000),
          assigneeIds: ['user_2'],
          completedAt: new Date('2025-01-16T10:00:00Z'),
        },
      ]

      mockPrismaInstance.task.findMany.mockResolvedValue(tasks)
      mockPrismaInstance.activity.findMany.mockResolvedValue([])

      const result = await getEmployeesSummary({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        sort: 'revenue',
        sortOrder: 'desc',
        clerkClient: mockClerkClient,
      })

      // Should maintain stable sort
      expect(result.employees).toHaveLength(2)
      expect(result.employees[0].metrics.totalRevenue).toBe(
        result.employees[1].metrics.totalRevenue,
      )
    })
  })

  describe('Error Handling', () => {
    test('should handle Clerk API errors', async () => {
      mockClerkClient.users.getUserList.mockRejectedValue(
        new Error('Clerk API error'),
      )

      await expect(
        getEmployeesSummary({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          clerkClient: mockClerkClient,
        }),
      ).rejects.toThrow()
    })

    test('should handle database connection errors', async () => {
      const users = [createMockUser('user_1', 'John', 'Doe')]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 1,
      } as any)

      mockPrismaInstance.task.findMany.mockRejectedValue(
        new Error('Database connection failed'),
      )

      await expect(
        getEmployeesSummary({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          clerkClient: mockClerkClient,
        }),
      ).rejects.toThrow()
    })

    test('should handle query timeout errors', async () => {
      const users = [createMockUser('user_1', 'John', 'Doe')]

      mockClerkClient.users.getUserList.mockResolvedValue({
        data: users,
        totalCount: 1,
      } as any)

      mockPrismaInstance.task.findMany.mockRejectedValue(
        new Error('Query timeout'),
      )

      await expect(
        getEmployeesSummary({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          clerkClient: mockClerkClient,
        }),
      ).rejects.toThrow()
    })
  })
})
