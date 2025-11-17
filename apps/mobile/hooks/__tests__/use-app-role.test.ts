import { useUser } from '@clerk/clerk-expo'
import { UserRole } from '@nv-internal/validation'
import { renderHook } from '@testing-library/react-hooks'
import { usePathname } from 'expo-router'
import { isUserAdmin } from '@/utils/user-helper'
import { isInAdminApp, isInWorkerApp, useAppRole } from '../use-app-role'

// Mock dependencies
jest.mock('expo-router')
jest.mock('@clerk/clerk-expo')
jest.mock('@/utils/user-helper')

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>
const mockIsUserAdmin = isUserAdmin as jest.MockedFunction<typeof isUserAdmin>

describe('useAppRole', () => {
  // Helper to create mock user
  const createMockUser = (roles: UserRole[]): any => ({
    id: 'user_test123',
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    publicMetadata: { roles },
    banned: false,
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('pathname detection', () => {
    it('detects admin role from /admin pathname', () => {
      mockUsePathname.mockReturnValue('/admin')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalAdmin]),
        isSignedIn: true,
      } as any)

      const { result } = renderHook(() => useAppRole())

      expect(result.current).toBe('admin')
    })

    it('detects admin role from /admin/tasks/123/view pathname', () => {
      mockUsePathname.mockReturnValue('/admin/tasks/123/view')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalAdmin]),
        isSignedIn: true,
      } as any)

      const { result } = renderHook(() => useAppRole())

      expect(result.current).toBe('admin')
    })

    it('detects admin role from /admin/ pathname', () => {
      mockUsePathname.mockReturnValue('/admin/')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalAdmin]),
        isSignedIn: true,
      } as any)

      const { result } = renderHook(() => useAppRole())

      expect(result.current).toBe('admin')
    })

    it('detects worker role from /worker pathname', () => {
      mockUsePathname.mockReturnValue('/worker')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalWorker]),
        isSignedIn: true,
      } as any)

      const { result } = renderHook(() => useAppRole())

      expect(result.current).toBe('worker')
    })

    it('detects worker role from /worker/ pathname', () => {
      mockUsePathname.mockReturnValue('/worker/')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalWorker]),
        isSignedIn: true,
      } as any)

      const { result } = renderHook(() => useAppRole())

      expect(result.current).toBe('worker')
    })

    it('detects worker role from /worker/tasks/123/view AND user has admin role (bug fix verification)', () => {
      // This is the key test case for PSN-19 bug fix
      // Admin users should see 'worker' when in /worker routes
      mockUsePathname.mockReturnValue('/worker/tasks/123/view')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalAdmin]),
        isSignedIn: true,
      } as any)

      const { result } = renderHook(() => useAppRole())

      // Should return 'worker' based on pathname, NOT 'admin' based on permissions
      expect(result.current).toBe('worker')
    })

    it('detects worker role from /worker/tasks/new AND user has both roles', () => {
      mockUsePathname.mockReturnValue('/worker/tasks/new')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([
          UserRole.nvInternalAdmin,
          UserRole.nvInternalWorker,
        ]),
        isSignedIn: true,
      } as any)

      const { result } = renderHook(() => useAppRole())

      // Should return 'worker' based on pathname
      expect(result.current).toBe('worker')
    })
  })

  describe('permission fallback for shared routes', () => {
    it('falls back to admin permission for shared routes when user is admin', () => {
      mockUsePathname.mockReturnValue('/(inputs)/location-picker')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalAdmin]),
        isSignedIn: true,
      } as any)
      mockIsUserAdmin.mockReturnValue(true)

      const { result } = renderHook(() => useAppRole())

      expect(result.current).toBe('admin')
      expect(mockIsUserAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user_test123' }),
      )
    })

    it('falls back to worker permission for shared routes when user is worker', () => {
      mockUsePathname.mockReturnValue('/(inputs)/location-picker')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalWorker]),
        isSignedIn: true,
      } as any)
      mockIsUserAdmin.mockReturnValue(false)

      const { result } = renderHook(() => useAppRole())

      expect(result.current).toBe('worker')
      expect(mockIsUserAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user_test123' }),
      )
    })

    it('falls back to permissions for /module-transit route', () => {
      mockUsePathname.mockReturnValue('/module-transit')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalAdmin]),
        isSignedIn: true,
      } as any)
      mockIsUserAdmin.mockReturnValue(true)

      const { result } = renderHook(() => useAppRole())

      expect(result.current).toBe('admin')
      expect(mockIsUserAdmin).toHaveBeenCalled()
    })

    it('falls back to permissions for root route /', () => {
      mockUsePathname.mockReturnValue('/')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalWorker]),
        isSignedIn: true,
      } as any)
      mockIsUserAdmin.mockReturnValue(false)

      const { result } = renderHook(() => useAppRole())

      expect(result.current).toBe('worker')
      expect(mockIsUserAdmin).toHaveBeenCalled()
    })

    it('falls back to permissions for (inputs)/task-status-picker route', () => {
      mockUsePathname.mockReturnValue('/(inputs)/task-status-picker')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalAdmin]),
        isSignedIn: true,
      } as any)
      mockIsUserAdmin.mockReturnValue(true)

      const { result } = renderHook(() => useAppRole())

      expect(result.current).toBe('admin')
    })
  })

  describe('edge cases', () => {
    it('returns null when user is not loaded', () => {
      mockUsePathname.mockReturnValue('/admin/tasks')
      mockUseUser.mockReturnValue({
        isLoaded: false,
        user: null,
        isSignedIn: false,
      } as any)

      const { result } = renderHook(() => useAppRole())

      expect(result.current).toBeNull()
    })

    it('returns null when user is null', () => {
      mockUsePathname.mockReturnValue('/admin/tasks')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: null,
        isSignedIn: false,
      } as any)

      const { result } = renderHook(() => useAppRole())

      expect(result.current).toBeNull()
    })

    it('returns null when both isLoaded is false and user is null', () => {
      mockUsePathname.mockReturnValue('/worker/tasks')
      mockUseUser.mockReturnValue({
        isLoaded: false,
        user: null,
        isSignedIn: false,
      } as any)

      const { result } = renderHook(() => useAppRole())

      expect(result.current).toBeNull()
    })

    it('handles undefined pathname gracefully', () => {
      mockUsePathname.mockReturnValue(undefined as any)
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalAdmin]),
        isSignedIn: true,
      } as any)
      mockIsUserAdmin.mockReturnValue(true)

      const { result } = renderHook(() => useAppRole())

      // Should fall back to permission check
      expect(result.current).toBe('admin')
    })

    it('handles empty pathname gracefully', () => {
      mockUsePathname.mockReturnValue('')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalWorker]),
        isSignedIn: true,
      } as any)
      mockIsUserAdmin.mockReturnValue(false)

      const { result } = renderHook(() => useAppRole())

      // Should fall back to permission check
      expect(result.current).toBe('worker')
    })
  })

  describe('stability and memoization', () => {
    it('returns the same result when dependencies do not change', () => {
      mockUsePathname.mockReturnValue('/admin/tasks')
      const mockUserReturn = {
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalAdmin]),
        isSignedIn: true,
      }
      mockUseUser.mockReturnValue(mockUserReturn as any)

      const { result, rerender } = renderHook(() => useAppRole())

      const firstResult = result.current

      // Rerender without changing dependencies
      rerender()

      // Should return the same reference (memoized)
      expect(result.current).toBe(firstResult)
      expect(result.current).toBe('admin')
    })

    it('updates when pathname changes', () => {
      mockUsePathname.mockReturnValue('/admin/tasks')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalAdmin]),
        isSignedIn: true,
      } as any)

      const { result, rerender } = renderHook(() => useAppRole())

      expect(result.current).toBe('admin')

      // Change pathname to worker route
      mockUsePathname.mockReturnValue('/worker/tasks')
      rerender()

      expect(result.current).toBe('worker')
    })

    it('updates when user loading state changes', () => {
      mockUsePathname.mockReturnValue('/admin/tasks')
      mockUseUser.mockReturnValue({
        isLoaded: false,
        user: null,
        isSignedIn: false,
      } as any)

      const { result, rerender } = renderHook(() => useAppRole())

      expect(result.current).toBeNull()

      // User loaded
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalAdmin]),
        isSignedIn: true,
      } as any)
      rerender()

      expect(result.current).toBe('admin')
    })

    it('updates when user changes', () => {
      mockUsePathname.mockReturnValue('/(inputs)/location-picker')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalAdmin]),
        isSignedIn: true,
      } as any)
      mockIsUserAdmin.mockReturnValue(true)

      const { result, rerender } = renderHook(() => useAppRole())

      expect(result.current).toBe('admin')

      // Change user to worker
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalWorker]),
        isSignedIn: true,
      } as any)
      mockIsUserAdmin.mockReturnValue(false)
      rerender()

      expect(result.current).toBe('worker')
    })
  })

  describe('isInAdminApp helper', () => {
    it('returns true when role is admin', () => {
      mockUsePathname.mockReturnValue('/admin/tasks')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalAdmin]),
        isSignedIn: true,
      } as any)

      const { result } = renderHook(() => isInAdminApp())

      expect(result.current).toBe(true)
    })

    it('returns false when role is worker', () => {
      mockUsePathname.mockReturnValue('/worker/tasks')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalWorker]),
        isSignedIn: true,
      } as any)

      const { result } = renderHook(() => isInAdminApp())

      expect(result.current).toBe(false)
    })

    it('returns false when role is null (loading)', () => {
      mockUsePathname.mockReturnValue('/admin/tasks')
      mockUseUser.mockReturnValue({
        isLoaded: false,
        user: null,
        isSignedIn: false,
      } as any)

      const { result } = renderHook(() => isInAdminApp())

      expect(result.current).toBe(false)
    })
  })

  describe('isInWorkerApp helper', () => {
    it('returns true when role is worker', () => {
      mockUsePathname.mockReturnValue('/worker/tasks')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalWorker]),
        isSignedIn: true,
      } as any)

      const { result } = renderHook(() => isInWorkerApp())

      expect(result.current).toBe(true)
    })

    it('returns false when role is admin', () => {
      mockUsePathname.mockReturnValue('/admin/tasks')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalAdmin]),
        isSignedIn: true,
      } as any)

      const { result } = renderHook(() => isInWorkerApp())

      expect(result.current).toBe(false)
    })

    it('returns false when role is null (loading)', () => {
      mockUsePathname.mockReturnValue('/worker/tasks')
      mockUseUser.mockReturnValue({
        isLoaded: false,
        user: null,
        isSignedIn: false,
      } as any)

      const { result } = renderHook(() => isInWorkerApp())

      expect(result.current).toBe(false)
    })
  })

  describe('priority order verification', () => {
    it('pathname detection takes precedence over permissions', () => {
      // Admin user in worker route should return 'worker' (pathname wins)
      mockUsePathname.mockReturnValue('/worker/tasks')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalAdmin]),
        isSignedIn: true,
      } as any)
      mockIsUserAdmin.mockReturnValue(true)

      const { result } = renderHook(() => useAppRole())

      expect(result.current).toBe('worker')
      // isUserAdmin should NOT be called because pathname detection happens first
      expect(mockIsUserAdmin).not.toHaveBeenCalled()
    })

    it('worker user in admin route returns admin (pathname wins)', () => {
      // Worker user in admin route should return 'admin' (pathname wins)
      mockUsePathname.mockReturnValue('/admin/tasks')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalWorker]),
        isSignedIn: true,
      } as any)
      mockIsUserAdmin.mockReturnValue(false)

      const { result } = renderHook(() => useAppRole())

      expect(result.current).toBe('admin')
      // isUserAdmin should NOT be called because pathname detection happens first
      expect(mockIsUserAdmin).not.toHaveBeenCalled()
    })

    it('only calls isUserAdmin for non-module routes', () => {
      mockUsePathname.mockReturnValue('/(inputs)/location-picker')
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: createMockUser([UserRole.nvInternalAdmin]),
        isSignedIn: true,
      } as any)
      mockIsUserAdmin.mockReturnValue(true)

      const { result } = renderHook(() => useAppRole())

      expect(result.current).toBe('admin')
      // isUserAdmin SHOULD be called for shared routes
      expect(mockIsUserAdmin).toHaveBeenCalledTimes(1)
    })
  })
})
