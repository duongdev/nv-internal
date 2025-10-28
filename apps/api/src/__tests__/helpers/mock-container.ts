/**
 * Mock Container Factory for Testing
 *
 * Provides pre-configured mock implementations of services
 * to simplify unit testing with dependency injection.
 */

import type { PrismaClient } from '@nv-internal/prisma-client'
import type { Container } from '@/container/request-container'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

/**
 * Create a fully mocked container for unit tests
 *
 * Example usage:
 * ```typescript
 * describe('TaskService', () => {
 *   let container: MockContainer
 *   let taskService: TaskService
 *
 *   beforeEach(() => {
 *     container = createMockContainer()
 *     taskService = new TaskService(container)
 *   })
 *
 *   it('should create task', async () => {
 *     // Configure mocks
 *     container.taskRepository.create.mockResolvedValue(mockTask)
 *
 *     // Test
 *     const result = await taskService.createTask(input)
 *     expect(result).toEqual(expectedDto)
 *   })
 * })
 * ```
 */
export type MockContainer = DeepMockProxy<Container>

export function createMockContainer(): MockContainer {
  return mockDeep<Container>()
}

/**
 * Reset all mocks in the container
 */
export function resetMockContainer(container: MockContainer): void {
  mockReset(container)
}

/**
 * Create a mock Prisma client for integration tests
 */
export function createMockPrisma(): DeepMockProxy<PrismaClient> {
  return mockDeep<PrismaClient>()
}

/**
 * Test Data Builders
 */

import type { Task, Customer, User } from '@nv-internal/prisma-client'

export class TaskBuilder {
  private data: Partial<Task> = {
    id: 1,
    title: 'Test Task',
    status: 'READY',
    createdAt: new Date(),
    updatedAt: new Date(),
    assigneeIds: []
  }

  withId(id: number): this {
    this.data.id = id
    return this
  }

  withStatus(status: Task['status']): this {
    this.data.status = status
    return this
  }

  withTitle(title: string): this {
    this.data.title = title
    return this
  }

  withAssignee(userId: string): this {
    this.data.assigneeIds = [userId]
    return this
  }

  withCustomer(customerId: string): this {
    this.data.customerId = customerId
    return this
  }

  build(): Task {
    return this.data as Task
  }
}

export class CustomerBuilder {
  private data: Partial<Customer> = {
    id: 'cust_test',
    name: 'Test Customer',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  withId(id: string): this {
    this.data.id = id
    return this
  }

  withName(name: string): this {
    this.data.name = name
    return this
  }

  withPhone(phone: string): this {
    this.data.phone = phone
    return this
  }

  build(): Customer {
    return this.data as Customer
  }
}

export class UserBuilder {
  private data: Partial<User> = {
    id: 'usr_test',
    publicMetadata: {
      roles: ['nv_internal_worker'],
      defaultPasswordChanged: true
    }
  }

  withId(id: string): this {
    this.data.id = id
    return this
  }

  withRole(role: string): this {
    this.data.publicMetadata = {
      ...this.data.publicMetadata,
      roles: [role]
    }
    return this
  }

  asAdmin(): this {
    return this.withRole('nv_internal_admin')
  }

  asWorker(): this {
    return this.withRole('nv_internal_worker')
  }

  build(): User {
    return this.data as User
  }
}

/**
 * Common test scenarios
 */

export function createAdminUser(): User {
  return new UserBuilder().asAdmin().build()
}

export function createWorkerUser(): User {
  return new UserBuilder().asWorker().build()
}

export function createInProgressTask(): Task {
  return new TaskBuilder()
    .withStatus('IN_PROGRESS')
    .withAssignee('usr_worker')
    .build()
}

export function createCompletedTask(): Task {
  return new TaskBuilder()
    .withStatus('COMPLETED')
    .build()
}

/**
 * Assertion helpers for tests
 */

export function expectTaskToMatchInput(
  task: Task,
  input: { title?: string; description?: string }
): void {
  if (input.title) {
    expect(task.title).toBe(input.title)
  }
  if (input.description) {
    expect(task.description).toBe(input.description)
  }
}

export function expectValidTaskResponse(data: unknown): void {
  expect(data).toMatchObject({
    id: expect.any(Number),
    title: expect.any(String),
    status: expect.stringMatching(/^(PREPARING|READY|IN_PROGRESS|ON_HOLD|COMPLETED)$/),
    createdAt: expect.any(String),
    updatedAt: expect.any(String)
  })
}
