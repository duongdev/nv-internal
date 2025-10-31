# Error Tracking Guide - PostHog Implementation

## Overview

This guide provides comprehensive instructions for implementing error tracking using PostHog across both the mobile app and API. The goal is to achieve 100% error visibility with proper context for debugging.

**✅ UPDATED**: Incorporates expert review feedback with production-ready patterns
**✅ Expo Go Compatible**: Works without development builds!

## Quick Reference

### Mobile Error Tracking

```typescript
import { captureException } from '@/lib/posthog';

// Basic error capture
captureException(error);

// With context (recommended)
captureException(error, {
  screen: 'TaskList',
  action: 'load_tasks',
  metadata: { filter: 'active' }
});
```

### API Error Tracking

Errors are automatically captured by root error handler. For manual capture in services:

```typescript
import { captureAndFlush } from '@/lib/posthog';

// In service layer - use captureAndFlush for serverless
await captureAndFlush('database_error', {
  distinctId: userId,
  error_code: error.code,
  operation: 'TaskService.create',
});
```

## Implementation Checklist

### Phase 1: Setup ✅
- [ ] Create PostHog account (free tier)
- [ ] Get API keys for dev and prod
- [ ] Remove Sentry from mobile app
- [ ] Install PostHog SDKs

### Phase 2: Mobile Implementation ✅
- [ ] Global error handler setup
- [ ] Error boundary at app root
- [ ] API call error tracking
- [ ] React Query error handler
- [ ] Network error detection
- [ ] User identification

### Phase 3: API Implementation ✅
- [ ] Root error handler (app.onError)
- [ ] Request sanitization
- [ ] Stack trace scrubbing
- [ ] Prisma error tracking
- [ ] Serverless flushing (captureImmediate)

### Phase 4: Testing ✅
- [ ] Test all error scenarios
- [ ] Verify error grouping
- [ ] Check context quality
- [ ] Ensure no PII leakage

### Phase 5: Monitoring ✅
- [ ] Create error dashboards
- [ ] Configure alerts
- [ ] Track error rates
- [ ] Monitor performance

## Error Types & Handling

### Mobile Errors

| Error Type | Mechanism | Example |
|------------|-----------|---------|
| Unhandled Exception | `global_error_handler` | App crash |
| Promise Rejection | `unhandled_promise` | Async failure |
| Component Error | `error_boundary` | React error |
| API Error | `api_call` | HTTP 4xx/5xx |
| Network Error | `network_error` | Connection lost |
| Query Error | `react_query` | Data fetch fail |

### API Errors

| Error Type | Status | Example |
|------------|--------|---------|
| Validation | 400 | Invalid input |
| Authentication | 401 | Invalid token |
| Authorization | 403 | No permission |
| Not Found | 404 | Resource missing |
| Conflict | 409 | Duplicate entry |
| Server Error | 500 | Unhandled error |
| Database Error | 500 | Query failure |

## Context Requirements

### Required Context Fields

Every error MUST include:
- **User ID**: Who experienced the error
- **Location**: Screen (mobile) or endpoint (API)
- **Action**: What was being attempted
- **Timestamp**: When it occurred

### Recommended Context

Include when available:
- **Metadata**: Additional relevant data
- **Device Info**: Platform, version (mobile)
- **Network State**: Online/offline status
- **Performance**: Response times
- **User Role**: For permission errors

## Privacy & Security

### Never Include in Errors

❌ **Forbidden Data**:
- Passwords or auth tokens
- Credit card information
- Personal health data
- Private messages
- File contents
- API keys or secrets

### Safe to Include

✅ **Allowed Data**:
- User IDs (not emails in stack)
- Screen/endpoint names
- Error codes and types
- Timestamps
- Device information
- Network status

## Testing Error Tracking

### Mobile Test Scenarios

```typescript
// 1. Test unhandled error
setTimeout(() => {
  throw new Error('Test: Unhandled error');
}, 1000);

// 2. Test promise rejection
Promise.reject(new Error('Test: Promise rejection'));

// 3. Test component error
const TestCrash = () => {
  throw new Error('Test: Component crash');
};

// 4. Test API error
fetch('/api/v1/nonexistent');

// 5. Test network error (turn off WiFi/data)
```

### API Test Scenarios

```bash
# 1. Test 404 error
curl $API_URL/v1/nonexistent

# 2. Test auth error
curl $API_URL/v1/tasks # without token

# 3. Test validation error
curl -X POST $API_URL/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"invalid": "data"}'

# 4. Test database error (duplicate)
# Create same customer twice
```

## Error Dashboards

### Mobile Dashboard Metrics

1. **Error Rate**: Errors per session
2. **Error Types**: Distribution by type
3. **Affected Users**: % experiencing errors
4. **Top Errors**: Most frequent issues
5. **Error Trends**: Change over time
6. **Fatal Errors**: App crashes
7. **Network Errors**: Connection issues
8. **Performance**: Slow operations

### API Dashboard Metrics

1. **Error Rate**: Errors per request
2. **Status Codes**: 4xx vs 5xx distribution
3. **Endpoint Errors**: By route
4. **Database Errors**: Query failures
5. **Slow Requests**: > 2s response time
6. **User Impact**: Errors by user
7. **Error Recovery**: Retry success rate
8. **Geographic**: Errors by region

## Alert Configuration

### Critical Alerts (Immediate)

- **High Error Rate**: > 10% requests failing
- **Fatal Errors**: App crash spike
- **Database Down**: Connection failures
- **Auth System**: Login failures spike

### Warning Alerts (Within Hour)

- **New Error Type**: Previously unseen
- **Performance**: P95 > 3 seconds
- **Error Trend**: 50% increase
- **User Impact**: > 20% affected

### Info Alerts (Daily)

- **Error Summary**: Daily report
- **Top Issues**: Most frequent errors
- **Resolution Status**: Fixed vs open
- **Performance Trends**: Week over week

## Troubleshooting

### Common Issues

**Errors not appearing in PostHog:**
- Check API key is correct
- Verify PostHog initialization
- Ensure flush is called (API)
- Check network connectivity

**Missing context:**
- Verify user identification
- Check error handler setup
- Ensure middleware ordering

**Poor error grouping:**
- Review fingerprinting logic
- Normalize dynamic values
- Check stack trace quality

**Performance impact:**
- Reduce event properties
- Batch events when possible
- Review flush settings

## Best Practices

### Do's ✅

1. **Always provide context** for errors
2. **Test error tracking** before deploy
3. **Monitor error rates** after release
4. **Fix root causes**, not symptoms
5. **Document known issues** and fixes
6. **Review errors daily** initially
7. **Keep error messages** user-friendly

### Don'ts ❌

1. **Don't ignore** recurring errors
2. **Don't include PII** in errors
3. **Don't over-track** expected errors
4. **Don't delay** critical fixes
5. **Don't assume** context is obvious
6. **Don't track** in development
7. **Don't expose** technical details to users

## Migration from Sentry

### Key Differences

| Feature | Sentry | PostHog |
|---------|--------|---------|
| Error Tracking | ✅ Core feature | ✅ Included |
| Analytics | ❌ Separate tool | ✅ Integrated |
| Feature Flags | ❌ Not included | ✅ Included |
| Session Replay | ✅ Paid feature | ✅ Free (beta) |
| Cost | Paid after 5k | Free to 1M events |

### Migration Steps

1. **Export Sentry data** if needed
2. **Remove Sentry SDK** from project
3. **Install PostHog SDK**
4. **Update error handlers** to use PostHog
5. **Test all scenarios**
6. **Monitor both** for transition period
7. **Deactivate Sentry** after validation

## Support & Resources

### Documentation
- [PostHog Error Tracking](https://posthog.com/docs/product-analytics/capture-events#exception-capture)
- [React Native SDK](https://posthog.com/docs/libraries/react-native)
- [Node.js SDK](https://posthog.com/docs/libraries/node)

### Internal Docs
- Implementation Plan: `.claude/enhancements/20251031-posthog-observability-implementation.md`
- Project Patterns: `CLAUDE.md`
- Architecture: `docs/architecture/patterns/`

### Getting Help
1. Check PostHog dashboard for insights
2. Review this guide for solutions
3. Check PostHog documentation
4. Contact PostHog support if needed

## Appendix: Code Templates ✅ UPDATED

### Mobile PostHog Initialization (Async)

```typescript
// CRITICAL: Use async initialization
export async function initializePostHog() {
  const posthog = new PostHog(API_KEY, {
    persistor: AsyncStorage,
    captureScreens: false, // Manual tracking
  });

  await posthog.initAsync(); // IMPORTANT!
  return posthog;
}
```

### Mobile Error Boundary

```typescript
import { ErrorBoundary } from 'react-error-boundary';
import { captureException } from '@/lib/posthog';

function ErrorFallback({ error, resetErrorBoundary }) {
  captureException(error, {
    mechanism: 'error_boundary',
    screen: usePathname(),
  });

  return (
    <SafeAreaView>
      <Text>Something went wrong</Text>
      <Button onPress={resetErrorBoundary} title="Try again" />
    </SafeAreaView>
  );
}

// Usage with PostHogProvider
<PostHogProvider client={posthog}>
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <YourComponent />
  </ErrorBoundary>
</PostHogProvider>
```

### API Root Error Handler (Not Middleware!)

```typescript
// In main app file - use onError, not middleware
app.onError(async (err, c) => {
  const errorProperties = {
    $exception_message: err.message,
    $exception_stack: scrubStackTrace(err.stack),
    path: c.req.path,
    method: c.req.method,
    userId: c.get('userId'),
    body: sanitizeRequestBody(await c.req.json().catch(() => null)),
  };

  // Use captureImmediate for serverless
  try {
    await captureAndFlush('$exception', errorProperties);
  } finally {
    // Always return response
    return c.json({ error: err.message }, err.status || 500);
  }
});
```

### Service Layer Error Tracking

```typescript
// Track Prisma errors in existing services
export async function createTask(data, userId) {
  try {
    return await prisma.task.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      await captureAndFlush('database_error', {
        distinctId: userId,
        error_code: error.code,
        operation: 'createTask',
      });
    }
    throw error;
  }
}
```