# PostHog Observability Implementation Plan

## Overview

Implement PostHog for comprehensive observability across both mobile and API, replacing Sentry and providing better analytics, feature flags, and error tracking capabilities. PostHog offers a unified platform for all observability needs with generous free tier limits that fit our project scale perfectly.

**Status**: 📋 Planned
**Priority**: High
**Estimated Effort**: 2-3 days
**Cost Impact**: $0/month (free tier: 1M events + 5k replays)
**Created**: 2025-10-31
**Updated**: 2025-10-31 - ✅ UPDATED with expert review feedback
**Compatibility**: ✅ **Works with Expo Go** - No development builds required!

## Problem Statement

Currently, the project has limited observability:
- Sentry is installed in mobile but not configured properly
- No analytics to understand user behavior
- No feature flag system for gradual rollouts
- Limited error tracking and debugging capabilities
- No way to track API performance or errors systematically
- No proper error context (user, screen, action) for debugging

## Solution Architecture

### 1. Remove Sentry
- **Mobile App**: Uninstall `@sentry/react-native` and all related configuration
- **Rationale**: PostHog provides better error tracking with more context and unified platform

### 2. Mobile Implementation (Feature Flags + Analytics + Errors)
- **SDK**: `posthog-react-native`
- **✅ Expo Go Compatible**: Uses only Expo-supported modules, no native code required
- **Capabilities**:
  - Feature flags for gradual feature rollouts with caching
  - User analytics and behavior tracking
  - Custom events for business metrics
  - Comprehensive error tracking with full context
  - Performance monitoring
  - ~~Session replay~~ (Skip - BETA, not production-ready)
  - Native crash reporting integration
  - Offline support with event queuing

### 3. API Implementation (Error Tracking + Performance)
- **SDK**: `posthog-node`
- **Architecture**: Root-level error handler, not middleware (serverless-optimized)
- **Capabilities**:
  - Error and exception tracking with context
  - API performance metrics
  - Database query performance tracking
  - Request/response sanitization (security)
  - Stack trace scrubbing for sensitive data
  - Immediate event flushing for serverless
  - Cold start optimization with singleton pattern

### 4. Shared Configuration
- **Project API Key**: Environment variable `POSTHOG_API_KEY`
- **Host**: `https://app.posthog.com` (US Cloud)
- **User Identification**: Use Clerk user IDs for consistent tracking
- **Error Grouping**: Configure smart grouping by error type and location
- **Feature Flag**: `posthog_enabled` for gradual rollout

## Implementation Plan

### Phase 1: Setup & Configuration (Day 1)

#### 1.1 Create PostHog Account
- [ ] Sign up for PostHog Cloud (free tier)
- [ ] Create project for NV Internal
- [ ] Obtain API keys (separate for dev/prod)
- [ ] Configure project settings
- [ ] Set up error grouping rules
- [ ] Configure data retention policies

#### 1.2 Remove Sentry
```bash
# Mobile app
cd apps/mobile
pnpm remove @sentry/react-native
# Remove Sentry initialization code from app/_layout.tsx
# Remove Sentry configuration files
# Remove any Sentry-specific error handlers
```

#### 1.3 Install PostHog SDKs
```bash
# Mobile app
cd apps/mobile
pnpm add posthog-react-native @react-native-async-storage/async-storage

# API
cd apps/api
pnpm add posthog-node

# Dev dependencies for better error handling
pnpm add -D source-map-support
```

### Phase 2: Mobile Error Tracking Implementation (Day 1-2)

#### 2.1 Initialize PostHog with Error Handling ✅ UPDATED

Create `apps/mobile/lib/posthog.ts`:
```typescript
import PostHog from 'posthog-react-native';
import { POSTHOG_API_KEY, APP_VERSION } from '@/config';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize PostHog instance (but not connected yet)
export let posthog: PostHog | null = null;

// Error queue for capturing errors before PostHog is ready
const errorQueue: Array<{error: any; context: any}> = [];

// Initialize PostHog asynchronously (CRITICAL for proper setup)
export async function initializePostHog() {
  try {
    posthog = new PostHog(POSTHOG_API_KEY, {
      host: 'https://app.posthog.com',
      // Use AsyncStorage for persistence
      persistor: AsyncStorage,
      // Disable automatic screen tracking (we'll do it manually)
      captureScreens: false,
      captureApplicationLifecycleEvents: true,
      captureDeepLinks: true,
      debug: __DEV__,
      // Feature flag settings
      sendFeatureFlagEvents: true,
      preloadFeatureFlags: true,
      // Performance optimizations
      flushAt: 20, // Batch events
      flushInterval: 30000, // Flush every 30 seconds
      // Add app context to all events
      defaultProperties: {
        app_version: APP_VERSION,
        platform: Platform.OS,
        platform_version: Platform.Version,
      },
    });

    // Initialize async (IMPORTANT)
    await posthog.initAsync();

    // Process queued errors
    while (errorQueue.length > 0) {
      const { error, context } = errorQueue.shift()!;
      captureException(error, context);
    }

    return posthog;
  } catch (error) {
    console.error('Failed to initialize PostHog:', error);
    return null;
  }
}

// Global error handler for unhandled rejections (FIXED async handling)
export function setupGlobalErrorHandler() {
  const originalHandler = global.ErrorUtils?.getGlobalHandler();

  global.ErrorUtils?.setGlobalHandler((error, isFatal) => {
    // Queue error if PostHog not ready, otherwise capture immediately
    if (!posthog) {
      errorQueue.push({
        error,
        context: { fatal: isFatal, mechanism: 'global_error_handler' }
      });
    } else {
      // Use sync capture for global handler (can't await here)
      try {
        captureException(error, {
          fatal: isFatal,
          mechanism: 'global_error_handler',
        });
      } catch (captureError) {
        console.error('Failed to capture exception:', captureError);
      }
    }

    // Call original handler
    originalHandler?.(error, isFatal);
  });
}

// Helper function to capture exceptions with context
export function captureException(
  error: Error | unknown,
  context?: {
    fatal?: boolean;
    mechanism?: string;
    screen?: string;
    action?: string;
    metadata?: Record<string, any>;
  }
) {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  posthog.capture('$exception', {
    $exception_message: errorObj.message,
    $exception_stack: errorObj.stack,
    $exception_type: errorObj.name,
    $exception_fatal: context?.fatal || false,
    $exception_mechanism: context?.mechanism || 'manual',
    // Additional context
    screen: context?.screen,
    action: context?.action,
    metadata: context?.metadata,
    // Error fingerprinting for better grouping
    $exception_fingerprint: generateErrorFingerprint(errorObj),
  });
}

// Generate consistent fingerprint for error grouping
function generateErrorFingerprint(error: Error): string {
  const type = error.name || 'Error';
  const message = error.message?.replace(/\d+/g, 'N') || ''; // Normalize numbers
  const stack = error.stack?.split('\n')[0] || '';
  return `${type}-${message}-${stack}`.slice(0, 100);
}
```

#### 2.2 Enhanced User Identification with Error Context ✅ UPDATED

In `apps/mobile/app/_layout.tsx`:
```typescript
import { initializePostHog, setupGlobalErrorHandler, captureException, posthog } from '@/lib/posthog';
import { useUser } from '@clerk/clerk-expo';
import { ErrorBoundary } from 'react-error-boundary';
import { usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { PostHogProvider } from 'posthog-react-native';

function ErrorFallback({ error, resetErrorBoundary }) {
  const pathname = usePathname();

  // Capture error with full context
  captureException(error, {
    fatal: false,
    mechanism: 'error_boundary',
    screen: pathname,
    metadata: {
      component: 'RootLayout',
      boundary: 'app_root',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Đã xảy ra lỗi</Text>
      <Text style={styles.message}>{error.message}</Text>
      <Button onPress={resetErrorBoundary} title="Thử lại" />
    </SafeAreaView>
  );
}

function RootLayout() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const [posthogReady, setPosthogReady] = useState(false);

  // Initialize PostHog on app start
  useEffect(() => {
    async function init() {
      await initializePostHog();
      setupGlobalErrorHandler();
      setPosthogReady(true);
    }
    init();
  }, []);

  // User identification
  useEffect(() => {
    if (posthogReady && isLoaded && user && posthog) {
      // Identify user in PostHog with comprehensive context
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        role: user.publicMetadata?.role as string,
        created_at: user.createdAt,
        // Add custom attributes for better error context
        organization: user.publicMetadata?.organization as string,
        locale: 'vi-VN',
      });

      // Set super properties that will be sent with every event
      posthog.register({
        user_role: user.publicMetadata?.role,
        user_id: user.id,
      });
    } else if (posthogReady && isLoaded && !user && posthog) {
      // Reset on logout
      posthog.reset();
    }
  }, [user, isLoaded, posthogReady]);

  // Manual screen tracking with semantic names
  useEffect(() => {
    if (posthogReady && posthog) {
      // Convert path to semantic screen name
      const screenName = pathname
        .split('/')
        .filter(Boolean)
        .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ') || 'Home';

      posthog.screen(screenName, {
        path: pathname,
        timestamp: new Date().toISOString(),
      });
    }
  }, [pathname, posthogReady]);

  // Wrap with PostHogProvider for feature flags
  if (!posthogReady || !posthog) {
    return <LoadingScreen />; // Show loading while PostHog initializes
  }

  return (
    <PostHogProvider client={posthog}>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          // Track error recovery
          posthog.capture('error_recovery', { screen: pathname });
        }}
      >
        {/* App content */}
      </ErrorBoundary>
    </PostHogProvider>
  );
}
```

#### 2.3 API Call Error Tracking

Update `apps/mobile/lib/api.ts`:
```typescript
import { captureException } from '@/lib/posthog';

export async function callHonoApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options?.headers,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();

      // Capture API errors with context
      captureException(new Error(error.message || 'API Error'), {
        mechanism: 'api_call',
        metadata: {
          endpoint,
          method: options?.method || 'GET',
          status: response.status,
          response_time: Date.now() - startTime,
          error_code: error.code,
        },
      });

      throw new Error(error.message);
    }

    return response.json();
  } catch (error) {
    // Capture network errors
    if (error instanceof TypeError && error.message === 'Network request failed') {
      captureException(error, {
        mechanism: 'network_error',
        metadata: {
          endpoint,
          method: options?.method || 'GET',
          type: 'network_failure',
        },
      });
    }
    throw error;
  }
}
```

#### 2.4 React Query Error Tracking ✅ UPDATED

Create `apps/mobile/lib/query-error-handler.ts`:
```typescript
import { captureException } from '@/lib/posthog';
import type { Query, Mutation } from '@tanstack/react-query';

// TanStack Query v5 error handler signature
export const queryErrorHandler = (error: Error, query: Query) => {
  captureException(error, {
    mechanism: 'react_query',
    metadata: {
      queryKey: query.queryKey,
      queryHash: query.queryHash,
      state: query.state.status,
      retryCount: query.state.failureCount,
    },
  });
};

// In your QueryClient setup (v5 API)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // v5 uses throwOnError instead of onError
      throwOnError: (error, query) => {
        // Capture error but don't throw (return false)
        queryErrorHandler(error as Error, query);
        return false; // Don't throw, let query handle it
      },
      // Standard retry logic
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if ((error as any)?.status >= 400 && (error as any)?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      // v5 mutations also use throwOnError
      throwOnError: (error, variables, context, mutation) => {
        captureException(error, {
          mechanism: 'react_query_mutation',
          metadata: {
            mutationKey: (mutation as any).options?.mutationKey,
            variables,
          },
        });
        return false; // Don't throw
      },
    },
  },
});
```

### Phase 3: API Error Tracking Implementation (Day 2)

#### 3.1 Initialize PostHog with Enhanced Error Context ✅ UPDATED

Create `apps/api/src/lib/posthog.ts`:
```typescript
import { PostHog } from 'posthog-node';

// Singleton pattern for serverless (cold start optimization)
let posthogInstance: PostHog | null = null;

export function getPostHog(): PostHog {
  if (!posthogInstance) {
    // Check if PostHog is enabled via feature flag
    if (process.env.POSTHOG_ENABLED !== 'true') {
      // Return a mock instance that does nothing
      return {
        capture: () => {},
        captureImmediate: () => Promise.resolve(),
        shutdown: () => Promise.resolve(),
      } as any;
    }

    posthogInstance = new PostHog(process.env.POSTHOG_API_KEY!, {
      host: 'https://app.posthog.com',
      flushAt: 1, // Send events immediately in serverless
      flushInterval: 0, // Disable time-based flushing
      // Don't set personalApiKey - not needed for backend
    });
  }
  return posthogInstance;
}

// Helper to sanitize request body (remove sensitive data)
export function sanitizeRequestBody(body: any): any {
  if (!body) return body;

  const sensitive = ['password', 'token', 'secret', 'apiKey', 'authorization'];
  const sanitized = { ...body };

  for (const key of Object.keys(sanitized)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeRequestBody(sanitized[key]);
    }
  }

  return sanitized;
}

// Helper to scrub stack traces
export function scrubStackTrace(stack: string | undefined): string | undefined {
  if (!stack) return stack;

  // Remove absolute paths and sensitive patterns
  return stack
    .replace(/\/Users\/[^/]+/g, '/[USER]')
    .replace(/\/home\/[^/]+/g, '/[HOME]')
    .replace(/Bearer [^ ]+/g, 'Bearer [REDACTED]')
    .replace(/password=([^&\s]+)/g, 'password=[REDACTED]')
    .replace(/apikey=([^&\s]+)/g, 'apikey=[REDACTED]');
}

// Helper to safely serialize errors for PostHog
export function serializeError(error: any): Record<string, any> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: scrubStackTrace(error.stack),
      // Include custom properties if they exist
      ...(error as any).statusCode && { statusCode: (error as any).statusCode },
      ...(error as any).code && { code: (error as any).code },
    };
  }

  // Handle non-Error objects
  return {
    message: String(error),
    type: typeof error,
    value: JSON.stringify(error).slice(0, 1000), // Limit size
  };
}

// Ensure events are flushed in serverless (CRITICAL)
export async function captureAndFlush(event: string, properties: any) {
  const posthog = getPostHog();

  // Use captureImmediate for serverless environments
  await posthog.captureImmediate({
    distinctId: properties.distinctId || 'system',
    event,
    properties,
  });
}
```

#### 3.2 Root-Level Error Handler (Not Middleware) ✅ UPDATED

In `apps/api/src/index.ts` or main app file:
```typescript
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { captureAndFlush, serializeError, sanitizeRequestBody } from '@/lib/posthog';

const app = new Hono();

// Root-level error handler (CRITICAL: Use onError, not middleware)
app.onError(async (err, c) => {
  const startTime = c.get('requestStartTime') || Date.now();
  const duration = Date.now() - startTime;
  const method = c.req.method;
  const path = c.req.path;

  // Get user context from JWT claims (already validated)
  const userId = c.get('userId');
  const userRole = c.get('userRole');

  // Determine error properties
  const isHTTPException = err instanceof HTTPException;
  const statusCode = isHTTPException ? err.status : 500;
  const errorType = isHTTPException ? 'http_exception' : 'unhandled_error';

  // Prepare error properties
  const errorProperties = {
    // Standard exception properties
    $exception_message: err.message,
    $exception_stack: scrubStackTrace(err.stack),
    $exception_type: err.name || 'Error',

    // API-specific context
    path,
    method,
    statusCode,
    errorType,
    duration,

    // User context (no PII in message/stack)
    userId: userId || null,
    userRole: userRole || null,

    // Sanitized request context
    query: c.req.query(),
    body: sanitizeRequestBody(await c.req.raw.clone().json().catch(() => null)),
    headers: {
      'user-agent': c.req.header('user-agent'),
      'x-forwarded-for': c.req.header('x-forwarded-for'),
      // Don't log authorization headers
    },

    // Environment context
    environment: process.env.NODE_ENV,
    deployment: process.env.VERCEL_ENV || 'local',
    region: process.env.VERCEL_REGION || 'unknown',

    // Error details
    error: serializeError(err),

    // Error grouping hint
    $exception_fingerprint: `${errorType}-${path}-${err.name}`,

    // Distinct ID for PostHog
    distinctId: userId || 'anonymous',
  };

  // Capture error with immediate flush (serverless)
  try {
    await captureAndFlush('$exception', errorProperties);
  } catch (captureError) {
    // Don't let PostHog errors break the app
    console.error('Failed to capture error to PostHog:', captureError);
  } finally {
    // IMPORTANT: Always return response even if PostHog fails

    // For HTTPException, return the status and message
    if (isHTTPException) {
      return c.json(
        { error: err.message },
        statusCode
      );
    }

    // For other errors, return generic 500
    return c.json(
      { error: 'Internal Server Error' },
      500
    );
  }
});

// Optional: Add request timing middleware
app.use('*', async (c, next) => {
  c.set('requestStartTime', Date.now());
  await next();
});
```

#### 3.3 Database Error Tracking ✅ UPDATED

Update existing service files to track Prisma errors:
```typescript
import { captureAndFlush } from '@/lib/posthog';
import { Prisma } from '@prisma/client';
import { HTTPException } from 'hono/http-exception';

// In service layer (e.g., apps/api/src/v1/task/task.service.ts)
export async function createTask(data: CreateTaskInput, userId: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Your existing transaction logic
      const task = await tx.task.create({ data });
      // ... more operations
      return task;
    });

    return result;
  } catch (error) {
    // Handle Prisma errors with specific tracking
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Track database error
      await captureAndFlush('database_error', {
        distinctId: userId,
        error_code: error.code,
        error_meta: error.meta,
        operation: 'TaskService.create',
        model: 'Task',
        type: 'prisma_known_error',
        explanation: getPrismaErrorExplanation(error.code),
      });

      // Convert to HTTP exception with user-friendly message
      if (error.code === 'P2002') {
        throw new HTTPException(409, { message: 'Duplicate entry' });
      } else if (error.code === 'P2025') {
        throw new HTTPException(404, { message: 'Record not found' });
      }
    }

    // Re-throw for root error handler
    throw error;
  }
}

// Helper for common Prisma errors
function getPrismaErrorExplanation(code: string): string {
  const explanations: Record<string, string> = {
    'P2002': 'Unique constraint violation',
    'P2003': 'Foreign key constraint violation',
    'P2025': 'Record not found',
    'P2021': 'Table does not exist',
    'P2022': 'Column does not exist',
  };
  return explanations[code] || 'Unknown database error';
}

// Alternative: Wrapper pattern for existing services (NOT RECOMMENDED)
// Keep existing service layer architecture, just add error tracking
```

#### 3.4 Transaction Error Tracking ✅ UPDATED

For complex transactions with multiple operations:
```typescript
// Track transaction failures with context
export async function processPayment(paymentData: PaymentInput, userId: string) {
  const transactionId = `tx_${Date.now()}`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Track transaction start
      await captureAndFlush('transaction_started', {
        distinctId: userId,
        transactionId,
        operation: 'processPayment',
        steps: ['createPayment', 'updateTask', 'logActivity'],
      });

      const payment = await tx.payment.create({ data: paymentData });
      const task = await tx.task.update({ ... });
      const activity = await tx.activity.create({ ... });

      return { payment, task, activity };
    }, {
      timeout: 10000, // 10 seconds timeout
    });

    // Track successful transaction
    await captureAndFlush('transaction_completed', {
      distinctId: userId,
      transactionId,
      operation: 'processPayment',
      duration: Date.now() - parseInt(transactionId.split('_')[1]),
    });

    return result;
  } catch (error) {
    // Track transaction failure
    await captureAndFlush('transaction_failed', {
      distinctId: userId,
      transactionId,
      operation: 'processPayment',
      error: serializeError(error),
      duration: Date.now() - parseInt(transactionId.split('_')[1]),
    });

    throw error;
  }
}
```

### Phase 4: Mobile Analytics & Feature Flags (Day 2)

#### 4.1 Feature Flags Setup ✅ UPDATED

Create `apps/mobile/hooks/use-feature-flag.ts`:
```typescript
import { useFeatureFlagEnabled, useFeatureFlagPayload } from 'posthog-react-native';

// Simple boolean flag (RECOMMENDED)
export function useFeatureFlag(flagName: string): { isEnabled: boolean; isLoading: boolean } {
  const isEnabled = useFeatureFlagEnabled(flagName);

  // PostHog hooks handle loading state internally
  return {
    isEnabled: isEnabled ?? false, // Default to false if undefined
    isLoading: isEnabled === undefined,
  };
}

// Flag with payload data
export function useFeatureFlagWithPayload<T = any>(flagName: string): {
  payload: T | null;
  isEnabled: boolean;
  isLoading: boolean;
} {
  const payload = useFeatureFlagPayload(flagName);

  return {
    payload: payload as T | null,
    isEnabled: payload !== null && payload !== undefined,
    isLoading: payload === undefined,
  };
}

// Usage in components
function TaskListScreen() {
  const { isEnabled: newSearchEnabled } = useFeatureFlag('new_search_ui');
  const { payload: betaConfig } = useFeatureFlagWithPayload<{ maxItems: number }>('beta_config');

  if (newSearchEnabled) {
    return <NewSearchComponent maxItems={betaConfig?.maxItems || 50} />;
  }

  return <LegacySearchComponent />;
}
```

#### 4.2 Analytics Events with Error Context

Update `apps/mobile/lib/analytics.ts`:
```typescript
import { posthog, captureException } from './posthog';

export const analytics = {
  // Task events with error handling
  taskCreated: (taskId: string, customerId: string) => {
    try {
      posthog.capture('task_created', { taskId, customerId });
    } catch (error) {
      captureException(error, {
        action: 'analytics_task_created',
        metadata: { taskId, customerId }
      });
    }
  },

  taskCompleted: (taskId: string, duration: number, revenue?: number) => {
    posthog.capture('task_completed', {
      taskId,
      duration,
      revenue,
      performance: duration < 3600000 ? 'fast' : 'normal', // Under 1 hour
    });
  },

  // Check-in/out events with location
  checkedIn: (taskId: string, location: { lat: number; lng: number }, accuracy?: number) => {
    posthog.capture('checked_in', {
      taskId,
      ...location,
      accuracy,
      timestamp: new Date().toISOString(),
    });
  },

  checkedOut: (taskId: string, duration: number, photosCount?: number) => {
    posthog.capture('checked_out', {
      taskId,
      duration,
      photosCount,
      completed: true,
    });
  },

  // Error-specific analytics
  errorOccurred: (error: Error, context: Record<string, any>) => {
    posthog.capture('error_tracked', {
      error_message: error.message,
      error_name: error.name,
      ...context,
    });
  },

  // Performance metrics
  screenLoadTime: (screen: string, duration: number) => {
    posthog.capture('screen_load_time', {
      screen,
      duration,
      slow: duration > 1000,
    });
  },
};
```

### Phase 5: Session Replay (SKIP - Future/Optional)

**⚠️ IMPORTANT**: Session replay is currently in BETA for React Native and not production-ready.
- **Recommendation**: Skip this phase entirely
- **Issues**: Performance impact, battery drain, potential crashes
- **Alternative**: Use comprehensive error tracking and analytics instead
- **Future**: Revisit when feature becomes stable (likely 2025 Q2+)

### Phase 6: Testing & Verification (Day 3)

#### 6.1 Error Tracking Verification Checklist

##### Mobile Error Testing
- [ ] **Global Error Handler**: Throw unhandled error and verify capture
  ```typescript
  // Test in any component
  setTimeout(() => {
    throw new Error('Test unhandled error');
  }, 1000);
  ```

- [ ] **Promise Rejection**: Test unhandled promise rejection
  ```typescript
  Promise.reject(new Error('Test promise rejection'));
  ```

- [ ] **Error Boundary**: Trigger component error
  ```typescript
  const TestCrash = () => {
    if (Math.random() > 0.5) {
      throw new Error('Test boundary error');
    }
    return <Text>No crash</Text>;
  };
  ```

- [ ] **Network Error**: Disconnect network and make API call
- [ ] **React Query Error**: Force query failure
- [ ] **Native Crash**: Test native module crash (if applicable)

##### API Error Testing
- [ ] **404 Error**: Request non-existent endpoint
- [ ] **500 Error**: Force internal server error
- [ ] **Database Error**: Violate unique constraint
- [ ] **Validation Error**: Send invalid data
- [ ] **Auth Error**: Make request without token
- [ ] **Timeout Error**: Create slow query
- [ ] **Rate Limit**: Exceed rate limits

#### 6.2 Error Dashboard Setup

Create these dashboards in PostHog:

##### Mobile Error Dashboard
- Error rate by screen
- Error types distribution
- Errors by user role
- Error trends over time
- Top error messages
- Fatal vs non-fatal errors
- Errors by app version
- Network error frequency

##### API Error Dashboard
- Error rate by endpoint
- Status code distribution
- Database error frequency
- Slow query tracking
- Error rate by user
- Error geographic distribution
- Response time percentiles
- Error recovery rate

#### 6.3 Alert Configuration

Set up these alerts in PostHog:

1. **High Error Rate**: > 5% of requests failing
2. **New Error Type**: Previously unseen error appears
3. **Fatal Error Spike**: Sudden increase in crashes
4. **Database Errors**: Any database connection issues
5. **Auth Failures**: Spike in authentication errors
6. **Performance Degradation**: P95 response time > 3s

### Phase 7: Documentation & Training

#### 7.1 Update Project Documentation

Update `CLAUDE.md` with error handling patterns:
```markdown
## Error Tracking with PostHog

### Capturing Errors
Always use the `captureException` helper for consistent error tracking:

\`\`\`typescript
import { captureException } from '@/lib/posthog';

try {
  // Your code
} catch (error) {
  captureException(error, {
    screen: 'TaskList',
    action: 'load_tasks',
    metadata: { filter: 'active' }
  });
}
\`\`\`

### Error Context
Always provide context when capturing errors:
- `screen`: Current screen/route
- `action`: What user was trying to do
- `metadata`: Additional relevant data
- `mechanism`: How error was captured
```

#### 7.2 Team Guidelines

Create `.claude/docs/error-tracking-guide.md`:
```markdown
# Error Tracking Guide

## When to Track Errors

### Always Track:
- Unhandled exceptions
- API failures (4xx, 5xx)
- Database errors
- Network failures
- Promise rejections
- Critical business logic failures

### Don't Track:
- Expected user errors (validation)
- Cancelled requests
- Dev environment errors (unless testing)

## Error Context Requirements

Every error MUST include:
1. User ID (if authenticated)
2. Screen/endpoint where it occurred
3. Action being performed
4. Relevant metadata

## Privacy Considerations

NEVER include in error reports:
- Passwords or tokens
- Credit card numbers
- Personal health information
- Private messages
- File contents

## Testing Error Tracking

Before deploying, verify:
1. Errors appear in PostHog dashboard
2. Stack traces are readable
3. Errors group correctly
4. User context is attached
5. No PII is leaked
```

### Phase 8: Monitoring & Optimization

#### 8.1 Performance Impact Assessment

Monitor after deployment:
- [ ] API latency impact (should be < 5ms)
- [ ] Mobile app performance impact
- [ ] Bundle size increase (mobile)
- [ ] Network traffic increase
- [ ] Battery usage (mobile)

#### 8.2 Error Reduction Tracking

Weekly metrics to track:
- Total error count
- Error rate (errors/user/day)
- Mean time to resolution
- Recurring error patterns
- User impact (affected users %)

## Rollback Plan ✅ NEW

If PostHog implementation causes issues, follow this rollback procedure:

### Quick Disable (Immediate)
1. **Set environment variable**: `POSTHOG_ENABLED=false`
2. **Deploy**: Push change to trigger redeploy
3. **Impact**: PostHog calls become no-ops, app continues working

### Full Rollback (If needed)
```bash
# Mobile App
cd apps/mobile
git revert [posthog-commit-hash]
pnpm remove posthog-react-native
# Remove PostHog imports and initialization

# API
cd apps/api
git revert [posthog-commit-hash]
pnpm remove posthog-node
# Remove PostHog error handler

# Deploy both
git push
```

### Rollback Triggers
- **Performance degradation** > 10% increase in response times
- **Crash rate increase** > 2% above baseline
- **Battery drain complaints** from multiple users
- **Data privacy concerns** raised by stakeholders
- **Cost overrun** if exceeding free tier unexpectedly

### Post-Rollback Actions
1. Document issues encountered
2. Contact PostHog support if bug-related
3. Plan fixes before re-implementation
4. Consider alternative solutions if needed

## Implementation Checklist

### Mobile Error Tracking
- [ ] Install PostHog SDK with async storage
- [ ] Configure global error handler
- [ ] Implement error boundary at root
- [ ] Add error tracking to API calls
- [ ] Configure React Query error handler
- [ ] Add network error detection
- [ ] Test all error scenarios
- [ ] Verify no PII in errors
- [ ] Set up error dashboards
- [ ] Configure error alerts

### API Error Tracking
- [ ] Install PostHog Node SDK
- [ ] Create error middleware
- [ ] Add Prisma error handler
- [ ] Implement service wrapper
- [ ] Add performance tracking
- [ ] Configure serverless flushing
- [ ] Test all error types
- [ ] Verify error serialization
- [ ] Monitor performance impact
- [ ] Set up API dashboards

### Verification
- [ ] All errors appear in dashboard
- [ ] Errors have proper context
- [ ] Stack traces are readable
- [ ] Error grouping works correctly
- [ ] No PII in error reports
- [ ] Alerts trigger correctly
- [ ] Performance acceptable
- [ ] Documentation updated

## Error Schema Reference

### Mobile Error Properties
| Property | Type | Description |
|----------|------|-------------|
| `$exception_message` | string | Error message |
| `$exception_stack` | string | Stack trace |
| `$exception_type` | string | Error name/type |
| `$exception_fatal` | boolean | If error was fatal |
| `$exception_mechanism` | string | How captured |
| `$exception_fingerprint` | string | For grouping |
| `screen` | string | Current screen |
| `action` | string | User action |
| `metadata` | object | Additional context |

### API Error Properties
| Property | Type | Description |
|----------|------|-------------|
| `$exception_message` | string | Error message |
| `$exception_stack` | string | Stack trace |
| `$exception_type` | string | Error name/type |
| `path` | string | API endpoint |
| `method` | string | HTTP method |
| `statusCode` | number | HTTP status |
| `errorType` | string | Error category |
| `userId` | string | User ID |
| `duration` | number | Request duration |
| `environment` | string | Env (dev/prod) |

## Cost Considerations

### Error Event Volume Estimation
- **Expected**: ~1,000 errors/month initially
- **After optimization**: ~200 errors/month
- **Alert threshold**: 10,000 errors/month
- **Action if exceeded**: Review error patterns and fix root causes

## Success Metrics

After implementation:
1. **Error Visibility**: 100% of errors tracked
2. **Context Quality**: All errors have user/screen context
3. **Resolution Time**: 50% faster error fixes
4. **Error Rate**: 30% reduction in month 1
5. **User Impact**: Track and minimize affected users

## Expo Go Compatibility ✅ NEW

**CONFIRMED**: PostHog React Native SDK **works with Expo Go**!

### What Works in Expo Go
- ✅ Error tracking
- ✅ Analytics events
- ✅ Feature flags
- ✅ User identification
- ✅ Screen tracking
- ✅ Custom events
- ✅ Performance monitoring
- ✅ Offline support

### What Doesn't Work in Expo Go
- ❌ Session replay (BETA feature anyway)
- ❌ Native crash reporting (requires native code)

### Why This Matters
- **No development builds required** for development
- **Faster iteration** during development
- **Easier onboarding** for new developers
- **Simpler CI/CD** pipeline

### Verification
See analysis documents:
- `.claude/analysis/20251031-posthog-expo-go-compatibility.md`
- `.claude/analysis/20251031-posthog-expo-modules-analysis.md`
- `.claude/analysis/20251031-posthog-expo-go-verification.md`

## Migration Notes

### From Sentry to PostHog
- PostHog captures same error data as Sentry
- Better integration with analytics and feature flags
- Single platform reduces complexity
- Cost savings (free tier sufficient)
- Better privacy controls
- **Bonus**: Works with Expo Go (Sentry doesn't)

## References

- [PostHog Error Tracking](https://posthog.com/docs/product-analytics/capture-events#exception-capture)
- [React Native Integration](https://posthog.com/docs/libraries/react-native#error-tracking)
- [Node.js Error Handling](https://posthog.com/docs/libraries/node#error-tracking)
- [Error Grouping](https://posthog.com/docs/product-analytics/error-tracking/grouping)
- [Privacy & GDPR](https://posthog.com/docs/privacy)