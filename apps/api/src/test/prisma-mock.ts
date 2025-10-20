// biome-ignore-all lint/suspicious/noExplicitAny: Mock functions need any for flexibility
// biome-ignore-all lint/style/useNamingConvention: Mock functions need any for flexibility
import { jest } from '@jest/globals'

export type MockedModel = {
  create: jest.MockedFunction<any>
  createMany: jest.MockedFunction<any>
  findFirst: jest.MockedFunction<any>
  findMany: jest.MockedFunction<any>
  findUnique?: jest.MockedFunction<any>
  update: jest.MockedFunction<any>
  updateMany?: jest.MockedFunction<any>
  delete: jest.MockedFunction<any>
  deleteMany: jest.MockedFunction<any>
  count: jest.MockedFunction<any>
}

export interface MockPrismaClient {
  $transaction: jest.MockedFunction<any>
  $connect: jest.MockedFunction<any>
  $disconnect: jest.MockedFunction<any>
  $executeRaw: jest.MockedFunction<any>
  customer: MockedModel
  geoLocation: MockedModel
  task: MockedModel & { findUnique: jest.MockedFunction<any> }
  activity: MockedModel
  attachment: MockedModel
}

function createModelMock(
  withFindUnique = false,
  withUpdateMany = false,
): MockedModel {
  const base: any = {
    create: jest.fn(),
    createMany: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  }
  if (withFindUnique) {
    base.findUnique = jest.fn()
  }
  if (withUpdateMany) {
    base.updateMany = jest.fn()
  }
  return base as MockedModel
}

export function createMockPrismaClient(): MockPrismaClient {
  const mockPrisma = {
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $executeRaw: jest.fn(),
    customer: createModelMock(),
    geoLocation: createModelMock(),
    task: { ...createModelMock(true, true), findUnique: jest.fn() },
    activity: createModelMock(),
    attachment: createModelMock(),
  } as MockPrismaClient

  // Setup default transaction behavior
  mockPrisma.$transaction.mockImplementation(async (callback: any) => {
    return await callback(mockPrisma)
  })

  return mockPrisma
}

export function resetPrismaMock(mockPrisma: MockPrismaClient) {
  // Reset all mocks
  Object.values(mockPrisma).forEach((value) => {
    if (typeof value === 'object' && value !== null) {
      Object.values(value).forEach((method) => {
        if (jest.isMockFunction(method)) {
          method.mockReset()
        }
      })
    } else if (jest.isMockFunction(value)) {
      value.mockReset()
    }
  })

  // Restore transaction behavior
  mockPrisma.$transaction.mockImplementation(async (callback: any) => {
    return await callback(mockPrisma)
  })
}
