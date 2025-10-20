import { afterAll, beforeAll, beforeEach, jest } from '@jest/globals'

// Suppress console logs during tests to reduce output
// biome-ignore lint/suspicious/noConsole: Suppressing console logs during tests
const originalConsoleLog = console.log
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

// Global setup/teardown
beforeAll(async () => {
  // Suppress most console output during tests
  console.log = jest.fn()
  console.warn = jest.fn()
  console.error = jest.fn()
})

afterAll(async () => {
  // Restore console functions
  console.log = originalConsoleLog
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

// Per-test cleanup
beforeEach(async () => {
  // Clear all mocks before each test
  jest.clearAllMocks()
})
