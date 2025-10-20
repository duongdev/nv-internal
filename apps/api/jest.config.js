module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/types/**",
    "!src/index.ts",
    "!src/test/**",
  ],
  moduleNameMapper: {
    "^@nv-internal/prisma-client$":
      "<rootDir>/../../packages/prisma-client/dist",
    "^@nv-internal/validation$": "<rootDir>/../../packages/validation/dist",
  },
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  testTimeout: 5000,
  // Reduce logging output
  verbose: false,
  silent: false,
  // Custom test reporter to reduce output
  reporters: ["default"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { useESM: false }],
  },
};
