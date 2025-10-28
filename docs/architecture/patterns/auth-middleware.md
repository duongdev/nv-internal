# Authentication Middleware Pattern

**CRITICAL**: Never silently handle authentication failures - always throw proper errors.

## Correct Implementation

```typescript
// ✅ GOOD - Throw on Clerk API failure
try {
  const user = await clerkClient.users.getUser(auth.userId)
  c.set('user', user)
  c.header('x-user-id', auth.userId)
} catch (error) {
  logger.error({ error, userId: auth.userId }, 'Failed to fetch user from Clerk')
  throw new HTTPException(401, {
    message: 'Không thể xác thực người dùng. Vui lòng đăng nhập lại.',
    cause: error
  })
}
```

## Anti-pattern

```typescript
// ❌ BAD - Silent fallback creates security vulnerability
try {
  const user = await clerkClient.users.getUser(auth.userId)
  c.set('user', user)
} catch (error) {
  // DANGER: Empty publicMetadata means no roles!
  c.set('user', { id: auth.userId, publicMetadata: {} })
}
```

## Security Risk

Empty `publicMetadata` means no roles, which could bypass authorization checks!

## Related

See also: [Authentication Performance Optimization](./auth-optimization.md)
