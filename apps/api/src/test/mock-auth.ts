import type { User } from '@clerk/backend'
import type { Context, Next } from 'hono'

export interface MockUser
  extends Omit<
    Partial<User>,
    'emailAddresses' | 'passwordEnabled' | 'totpEnabled'
  > {
  id: string
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  emailAddresses?: Array<{
    id: string
    emailAddress: string
    verification: {
      status: 'verified' | 'unverified'
    }
  }>
  publicMetadata?: Record<string, unknown>
  privateMetadata?: Record<string, unknown>
  _raw?: unknown
  passwordEnabled: boolean
  totpEnabled: boolean
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user_123',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [
      {
        id: 'email_123',
        emailAddress: 'test@example.com',
        verification: {
          status: 'verified',
        },
      },
    ],
    publicMetadata: {},
    privateMetadata: {},
    passwordEnabled: true,
    totpEnabled: false,
    ...overrides,
  }
}

export function createMockAdminUser(
  overrides: Partial<MockUser> = {},
): MockUser {
  return createMockUser({
    id: 'admin_123',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    emailAddresses: [
      {
        id: 'email_admin',
        emailAddress: 'admin@example.com',
        verification: {
          status: 'verified',
        },
      },
    ],
    publicMetadata: {
      roles: ['nv_internal_admin'],
    },
    ...overrides,
  })
}

export function createMockWorkerUser(
  overrides: Partial<MockUser> = {},
): MockUser {
  return createMockUser({
    id: 'worker_123',
    username: 'worker',
    firstName: 'Worker',
    lastName: 'User',
    emailAddresses: [
      {
        id: 'email_worker',
        emailAddress: 'worker@example.com',
        verification: {
          status: 'verified',
        },
      },
    ],
    publicMetadata: {
      roles: ['nv_internal_worker'],
    },
    ...overrides,
  })
}

export function mockAuthMiddleware(mockUser: MockUser) {
  return async (c: Context, next: Next) => {
    // Set the user in the context
    c.set('user', mockUser)
    await next()
  }
}
