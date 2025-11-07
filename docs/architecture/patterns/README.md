# Architecture Patterns

This directory contains detailed implementation patterns and best practices for the NV Internal codebase.

## 🆕 Recent Additions

See **[CHANGELOG.md](./CHANGELOG.md)** for recently established patterns and updates.

**Latest patterns** (as of 2025-11-07):
- Feature Flags Pattern (PostHog)
- PostHog Provider Initialization Pattern
- Mobile Accessibility Pattern
- OTA Updates Pattern
- SearchableText Pattern

## API Patterns

### Core Patterns

- **[Route Organization](./route-organization.md)** - RESTful route structure, mounting, and file naming conventions
- **[Error Handling](./error-handling.md)** - HTTPException usage for consistent, type-safe error handling
- **[Authentication Middleware](./auth-middleware.md)** - Security best practices and proper error handling
- **[Authentication Optimization](./auth-optimization.md)** - JWT claims for performance improvement
- **[Logger Pattern](./logger.md)** - Lazy logger instantiation and naming conventions

### Data Patterns

- **[GPS Verification](./gps-verification.md)** - Accurate distance calculations using Haversine formula
- **[Activity-Based Events](./activity-event.md)** - Unified event logging with flexible JSON payloads
- **[Payment Transactions](./payment-transactions.md)** - Serverless-safe transaction pattern with file uploads
- **[FormData Validation](./formdata-validation.md)** - Zod schemas for multipart/form-data handling
- **[Timezone Handling](./timezone-handling.md)** - Modern timezone-aware date operations with TZDate
- **[Vietnamese Search](./vietnamese-search.md)** - Accent-insensitive search for Vietnamese text

### Utilities

- **[Reusable Utilities](./reusable-utilities.md)** - DRY principle with factories and helpers

## Mobile Patterns

- **[File Upload Limitations](./file-upload.md)** - Hono RPC limitations and workarounds for React Native
- **[Cache Invalidation](./cache-invalidation.md)** - TanStack Query patterns for mutations
- **[OTA Updates](./ota-updates.md)** - Hook-Only pattern for Expo Updates with graceful degradation

## Pattern Selection Guide

### When implementing new API endpoints:
1. Follow [Route Organization](./route-organization.md)
2. Use [Error Handling](./error-handling.md) for exceptions
3. Apply [Authentication Middleware](./auth-middleware.md) patterns
4. Use [Logger Pattern](./logger.md) for logging

### When working with location data:
- Use [GPS Verification](./gps-verification.md) pattern

### When implementing task events:
- Follow [Activity-Based Events](./activity-event.md) pattern

### When handling file uploads:
- API: Follow [Payment Transactions](./payment-transactions.md) for serverless safety
- Mobile: Use [File Upload Limitations](./file-upload.md) workarounds

### When working with forms:
- Use [FormData Validation](./formdata-validation.md) for proper Zod schemas

### When working with dates and timezones:
- Use [Timezone Handling](./timezone-handling.md) for accurate date boundaries

### When implementing search:
- Use [Vietnamese Search](./vietnamese-search.md) for accent-insensitive text search

### When implementing OTA updates:
- Use [OTA Updates](./ota-updates.md) for Expo Updates with Hook-Only pattern

## Adding New Patterns

When documenting a new pattern:

1. Create a new `.md` file in this directory
2. Follow this structure:
   ```markdown
   # Pattern Name

   Brief description of when to use this pattern.

   ## The Problem
   What issue does this pattern solve?

   ## The Solution
   Detailed implementation with code examples

   ## Anti-pattern
   What NOT to do

   ## Benefits
   Why this approach is better

   ## Reference
   Links to task documentation or implementations
   ```
3. Add it to this README under the appropriate category
4. Reference it from CLAUDE.md if it's a core pattern
