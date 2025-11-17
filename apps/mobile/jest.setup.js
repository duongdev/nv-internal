// Mock expo-router
jest.mock('expo-router', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
  useSegments: jest.fn(),
  useLocalSearchParams: jest.fn(),
}))

// Mock @clerk/clerk-expo
jest.mock('@clerk/clerk-expo', () => ({
  useUser: jest.fn(),
  useAuth: jest.fn(),
}))

// Mock @/utils/user-helper
jest.mock('@/utils/user-helper', () => ({
  isUserAdmin: jest.fn(),
  isUserWorker: jest.fn(),
  getUserRoles: jest.fn(),
  getUserPublicMetadata: jest.fn(),
  getUserPhoneNumber: jest.fn(),
  formatPhoneNumber: jest.fn(),
  getUserFullName: jest.fn(),
  getUserInitials: jest.fn(),
  getUserPrimaryEmail: jest.fn(),
  isUserBanned: jest.fn(),
}))

// Mock @/api/user/use-user-list
jest.mock('@/api/user/use-user-list', () => ({
  useUserList: jest.fn(),
  fetchUserList: jest.fn(),
  userListQueryOptions: {},
}))

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}
