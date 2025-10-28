# Route Organization Pattern

Follow RESTful principles with explicit mounting and clear resource boundaries.

## File Naming Convention

- All route files: `{resource}.route.ts` (e.g., `task.route.ts`, `payment.route.ts`)
- Service files: `{resource}.service.ts`
- Test files: `{resource}.route.test.ts`, `{resource}.service.test.ts`

## Route Mounting Pattern

```typescript
// apps/api/src/v1/index.ts
export const hono = new Hono()
  .use('*', authMiddleware)

  // Resource-specific routes
  .route('/task', taskApp)           // Task CRUD operations
  .route('/task', taskEventsApp)     // Task events (check-in/out)
  .route('/payment', paymentApp)     // Payment CRUD operations
  .route('/user', userApp)           // User operations
```

## Resource Scoping Rules

- Primary resource operations: Mount at `/{resource}` (e.g., `/payment/:id`)
- Sub-resource operations: Mount at parent resource (e.g., `/task/:id/payments`)
- Multiple mounts on same path are allowed for logical grouping (e.g., task and task-events)

## Example: Payment System Routes

```typescript
// payment.route.ts - mounted at /payment
PUT /v1/payment/:id                    // Update specific payment

// task.route.ts - mounted at /task
GET /v1/task/:id/payments              // List payments for task
PUT /v1/task/:id/expected-revenue      // Set expected revenue
```

## Anti-pattern

❌ Avoid implicit mounting (`.route('/', app)`) - always be explicit about path prefixes
