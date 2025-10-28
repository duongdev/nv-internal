# Testing Guide

Testing strategies and patterns for the NV Internal project.

## Testing Overview

### API Testing
- **Framework**: Jest with ts-jest
- **Location**: `__tests__/` directories alongside source files
- **Naming**: `*.test.ts` files
- **Environment**: Node environment with TypeScript support

### Mobile Testing
- **Manual Testing**: Expo Go for rapid development
- **Automated Testing**: Mobile-MCP tools for UI automation
- **Accessibility**: All interactive elements have proper testID and accessibility props

## Testing Guides

### Mobile-MCP Testing Pattern
- **[Mobile-MCP Testing Pattern](./mobile-mcp.md)** - Accessibility-first testing for React Native components

This guide covers:
- Adding accessibility properties to components
- testID naming conventions
- Improving automated test success rates
- Screen reader support

## API Testing Guide

### Running Tests

```bash
# Run all API tests
pnpm --filter @nv-internal/api test

# Run specific test file
pnpm --filter @nv-internal/api test task.route.test.ts

# Run with verbose output
pnpm --filter @nv-internal/api test:verbose

# Run in watch mode (during development)
pnpm --filter @nv-internal/api test:watch

# Generate coverage report
pnpm --filter @nv-internal/api test:coverage
```

### Test Structure

```typescript
// apps/api/src/v1/task/__tests__/task.route.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals'

describe('Task Routes', () => {
  describe('GET /v1/task/:id', () => {
    it('should return task details', async () => {
      // Arrange
      // Act
      // Assert
    })

    it('should return 404 for non-existent task', async () => {
      // Test error cases
    })
  })
})
```

### Best Practices

1. **Test Organization**: Group related tests with `describe` blocks
2. **Clear Test Names**: Use descriptive names that explain what is being tested
3. **Arrange-Act-Assert**: Follow AAA pattern for test structure
4. **Mock External Services**: Mock Clerk, Prisma, storage providers
5. **Test Error Cases**: Don't just test happy paths

## Mobile Testing Best Practices

### Accessibility Properties

Every interactive element should have:
```tsx
<Button
  accessibilityLabel="Descriptive label"
  accessibilityHint="What happens when pressed"
  testID="screen-component-action"
  onPress={handlePress}
/>
```

### testID Naming Convention

Format: `{screen}-{component}-{action}`

Examples:
- `sign-in-username-input`
- `task-list-item-12345`
- `task-details-check-in-button`

### Testing With Mobile-MCP

See [Mobile-MCP Testing Pattern](./mobile-mcp.md) for complete guide on:
- Using mobile-mcp tools for automation
- Element selection strategies
- Troubleshooting test failures

## Coverage Goals

- **Critical Paths**: 100% coverage
- **Business Logic**: 80%+ coverage
- **Overall API**: Target 60-70%
- **Mobile**: Manual testing + key user flows with mobile-mcp

## CI/CD Integration

Tests run automatically on:
- Every pull request
- Before merging to main
- As part of deployment pipeline

See `.github/workflows/` for CI configuration.

## Additional Testing Resources

- **API Testing Examples**: `apps/api/src/v1/**/__tests__/`
- **Mobile Testing Docs**: `apps/mobile/MOBILE-MCP-TESTING.md`
- **Quick Test Reference**: `apps/mobile/QUICK-TEST-REFERENCE.md`
