module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/index.ts',
    '!src/test/**',
  ],
  moduleNameMapper: {
    '^@nv-internal/prisma-client$':
      '<rootDir>/../../packages/prisma-client/dist',
    '^@nv-internal/validation$': '<rootDir>/../../packages/validation/dist',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  modulePaths: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testTimeout: 5000,
  // Reduce logging output
  verbose: false,
  silent: false,
  // Custom test reporter to reduce output
  reporters: ['default'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: false,
        tsconfig: {
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          module: 'CommonJS',
          target: 'ES2020',
          skipLibCheck: true,
          strict: false,
          // Allow module resolution without file extensions
          moduleResolution: 'node',
          allowJs: true,
        },
      },
    ],
  },
  // Make sure Jest can resolve TypeScript files directly
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // Allow imports from test files
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  // Ensure Jest resolves .ts files without extension
  resolver: undefined,
  extensionsToTreatAsEsm: [],
}
