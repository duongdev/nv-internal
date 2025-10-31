# Production Bug Tracking Solutions Research

**Date**: 2025-10-24
**Status**: ✅ Completed
**Context**: Small business mobile-first task management app (NV Internal)

## Executive Summary

**UPDATED 2025-10-31**: Based on recent developments, **PostHog** is now the recommended solution for NV Internal, offering comprehensive error tracking, analytics, and feature flags in a single platform with an extremely generous free tier (1M events/month vs Sentry's 5K).

### Quick Recommendation

**For NV Internal (50 users, small business):**
- **Primary Choice**: PostHog (1M events free, includes analytics + errors + feature flags)
- **Traditional Alternative**: Sentry Free Tier → Sentry Team ($26/month when needed)
- **Budget Alternative**: GlitchTip (self-hosted, free)

### Why PostHog Over Sentry Now?

1. **Better Value**: 1,000,000 free events vs 5,000 errors (200x more generous)
2. **Unified Platform**: Error tracking + analytics + feature flags in one tool
3. **Full Support**: Both React Native and Node.js error tracking now available
4. **Cost Effective**: Free tier will cover NV Internal indefinitely (~30K events/month expected)

---

## 1. Bug Tracking Tools Comparison

### 1.1 Sentry ⭐ RECOMMENDED

**Overview**: Market-leading error monitoring platform with comprehensive React Native and Vercel support.

**Pricing (2025)**:
- **Free (Developer)**: 5,000 errors/month, 1 project, basic features
- **Team**: $26/month - 50,000 errors/month, 5 team members, enhanced features
- **Business**: $80/month - 100,000 errors/month, SSO, custom metrics, priority support
- **Enterprise**: Custom pricing - dedicated support, SLAs

**Key Features**:
- ✅ Excellent React Native SDK (`@sentry/react-native`) with 562,471 weekly downloads
- ✅ Native Expo integration with automatic setup
- ✅ Source map support for production debugging
- ✅ Breadcrumbs (user actions leading to errors)
- ✅ Performance monitoring (APM)
- ✅ Release tracking and health monitoring
- ✅ Error grouping and intelligent deduplication
- ✅ Vercel/Node.js serverless support
- ✅ Session replay (mobile preview available)
- ✅ Custom context and tags
- ✅ Slack/email notifications
- ✅ 14-day free trial for all plans

**React Native Support**:
- Mature, well-maintained SDK
- Automatic crash reporting (native + JS)
- Network breadcrumbs
- Navigation tracking (Expo Router compatible)
- Source maps upload via `@sentry/react-native/metro`

**Vercel/Hono Support**:
- Official Hono integration (SDK 10.6+)
- Vercel serverless functions compatible
- `vercelAIIntegration` for AI SDK telemetry
- Works seamlessly with `@vercel/node` runtime

**Pros**:
- ✅ Industry standard with largest community
- ✅ Best-in-class React Native support
- ✅ Generous free tier (5,000 errors adequate for early stage)
- ✅ Excellent documentation and examples
- ✅ Affordable Team plan when scaling ($26/month)
- ✅ Strong performance monitoring capabilities

**Cons**:
- ❌ Can get expensive at scale (usage-based pricing)
- ❌ Learning curve for advanced features
- ❌ Self-hosted version complex (20+ services)

**Estimated Cost for NV Internal (~50 users)**:
- **Year 1**: Free tier likely sufficient (< 5,000 errors/month for stable app)
- **Year 2+**: $26/month ($312/year) when hitting limits or needing team features
- **Growth**: $80/month if exceeding 50,000 errors (indicates serious issues)

---

### 1.2 Bugsnag

**Overview**: Focused error monitoring platform with enterprise-grade stability tracking.

**Pricing (2025)**:
- **Free**: 7,500 events/month, 1 seat (15,000 events for open source)
- **Select**: Starting at $32/month for 150,000 events
- **Professional**: Custom pricing
- **Enterprise**: Custom pricing

**Key Features**:
- ✅ React Native SDK (but only 921 weekly downloads vs Sentry's 562k)
- ✅ Release health tracking
- ✅ Stability scoring
- ✅ Error grouping with ML
- ✅ User impact analysis
- ❌ De-obfuscation issues with React Native noted in 2025 reviews

**Pros**:
- ✅ Slightly higher free tier (7,500 vs 5,000 events)
- ✅ Strong enterprise features
- ✅ Good stability monitoring

**Cons**:
- ❌ Much smaller React Native community adoption
- ❌ Known React Native de-obfuscation issues
- ❌ Higher paid tier pricing than Sentry
- ❌ Less comprehensive than Sentry for similar price

**Estimated Cost for NV Internal**:
- **Year 1**: Free tier (7,500 events)
- **Year 2+**: $32+/month

**Verdict**: Not recommended - Sentry offers better value and React Native support.

---

### 1.3 LogRocket

**Overview**: Session replay platform with integrated error tracking (more focused on UX than errors).

**Pricing (2025)**:
- **Free**: 1,000 sessions/month, 1-month retention
- **Team**: $139-239/month for 10K-25K sessions
- **Professional**: $350-2,645/month for 10K-1M sessions
- **Enterprise**: Custom pricing

**Key Features**:
- ✅ Session replay with video playback
- ✅ React Native support (Expo compatible)
- ✅ Redux integration
- ✅ Network logging
- ✅ Console logs capture
- ❌ Expensive for small teams
- ❌ Session-based pricing (not error-based)

**Pros**:
- ✅ Excellent for UX debugging (see user's exact experience)
- ✅ Deep React Native integration
- ✅ Network request inspection

**Cons**:
- ❌ Very expensive ($139/month minimum for meaningful usage)
- ❌ Overkill for basic error tracking
- ❌ Pricing based on tracked users (unpredictable costs)
- ❌ 4.5x - 5x more expensive than Sentry Team plan

**Estimated Cost for NV Internal**:
- **Minimum**: $139/month ($1,668/year)
- **Typical**: $239-350/month for 50 users

**Verdict**: Too expensive for small business error tracking. Consider only if budget allows and UX debugging is critical priority.

---

### 1.4 PostHog ⭐ RECOMMENDED (Updated 2025-10-31)

**Overview**: Open-source product analytics platform with comprehensive error tracking capabilities.

**UPDATE (2025-10-31)**: PostHog now offers full error tracking for both React Native and Node.js, making it a compelling alternative to Sentry with additional analytics and feature flag capabilities.

**Pricing (2025)**:
- **Free Tier**: 1,000,000 events/month + 5,000 session replays
- **Cloud**: Usage-based pricing after free tier
- **Self-hosted**: Free (infrastructure costs only)
- **Enterprise**: Custom pricing

**Key Features (Updated)**:
- ✅ **Full error tracking for React Native and Node.js** (now available!)
- ✅ Feature flags for gradual rollouts
- ✅ Product analytics built-in
- ✅ Session replay (mobile in BETA)
- ✅ A/B testing capabilities
- ✅ User behavior tracking
- ✅ Performance monitoring
- ✅ Open source (MIT license)

**React Native Support (Updated)**:
- ✅ **Full error tracking with posthog-react-native SDK**
- ✅ Global error handler support
- ✅ Error boundaries integration
- ✅ Network error tracking
- ✅ React Query error handler integration
- ✅ Native crash reporting
- ✅ Error context with user, screen, and metadata

**Node.js/API Support**:
- ✅ **Full error tracking with posthog-node SDK**
- ✅ Serverless-optimized (immediate flush)
- ✅ Prisma error tracking
- ✅ Performance monitoring
- ✅ Request/response context

**Pros**:
- ✅ **Single platform for analytics + errors + feature flags**
- ✅ Generous free tier (1M events vs Sentry's 5K errors)
- ✅ Open source with self-hosting option
- ✅ Better value than multiple separate tools
- ✅ No vendor lock-in
- ✅ Privacy-friendly (can self-host)

**Cons**:
- ❌ Less mature error tracking than Sentry (but rapidly improving)
- ❌ Smaller community for error tracking specifically
- ❌ Session replay for mobile still in BETA

**Estimated Cost for NV Internal**:
- **Cloud**: Free tier (1M events/month easily covers 50 users)
- **Self-hosted**: Free (infrastructure ~$10-20/month)

**Verdict**: **NOW RECOMMENDED** - PostHog has matured significantly and offers a comprehensive observability solution. The generous free tier (1M events vs Sentry's 5K) and unified platform for analytics, errors, and feature flags make it an excellent choice for NV Internal. See updated implementation plan at `.claude/enhancements/20251031-posthog-observability-implementation.md`.

---

### 1.5 Rollbar

**Overview**: Error monitoring focused on developer workflow integration.

**Pricing (2025)**:
- **Free**: 5,000 events/month (similar to Sentry)
- **Essentials**: $15/month
- **Advanced**: $29/month
- **Enterprise**: $149+/month (some sources mention higher starting prices)

**Key Features**:
- ✅ React Native SDK support
- ✅ Node.js/JavaScript support
- ✅ Volume-based pricing (no user limits)
- ✅ RQL (Rollbar Query Language) for advanced filtering
- ✅ No surprise charges (stops at plan limit by default)

**Pros**:
- ✅ Competitive pricing on low tiers
- ✅ React Native support available
- ✅ Good developer experience

**Cons**:
- ❌ Less popular in React Native ecosystem vs Sentry
- ❌ Limited information on Vercel/serverless compatibility
- ❌ Smaller community and fewer resources
- ❌ Pricing inconsistencies across sources (unclear actual costs)

**Estimated Cost for NV Internal**:
- **Year 1**: Free tier (5,000 events)
- **Year 2+**: $15-29/month

**Verdict**: Decent budget option but Sentry offers better ecosystem fit and clearer pricing.

---

### 1.6 GlitchTip (Open Source) ⭐ BUDGET ALTERNATIVE

**Overview**: Lightweight, open-source Sentry alternative with API compatibility.

**Pricing**:
- **Self-hosted**: Free (infrastructure costs only)
- **Hosted**: Free plan with 1,000 events/month
- **Paid Plans**: TBD (check glitchtip.com for latest)

**Key Features**:
- ✅ Sentry API compatible (use Sentry SDKs!)
- ✅ Uses `@sentry/react-native` SDK directly
- ✅ Much simpler infrastructure (4 components vs Sentry's 20+)
- ✅ Components: Backend, Worker, Redis, PostgreSQL
- ✅ Fully open source
- ✅ Core error collection and tracking

**Pros**:
- ✅ **Best budget option** (free self-hosted)
- ✅ Use proven Sentry SDKs (React Native, Node.js)
- ✅ Simple deployment (Docker Compose ready)
- ✅ No vendor lock-in (open source)
- ✅ Good for privacy-conscious teams (data stays on your servers)

**Cons**:
- ❌ Missing advanced Sentry features (charts, advanced queries, session replay)
- ❌ Requires DevOps knowledge for self-hosting
- ❌ Ongoing maintenance burden
- ❌ Smaller community than Sentry
- ❌ Limited hosted plan (1,000 events vs Sentry's 5,000)

**Self-Hosting Costs (Example)**:
- **DigitalOcean Droplet**: $12/month (2GB RAM, sufficient for small team)
- **AWS Lightsail**: $10/month (similar specs)
- **Total**: ~$120-144/year vs Sentry Team $312/year

**Estimated Cost for NV Internal**:
- **Self-hosted**: $10-12/month infrastructure (~$144/year)
- **Hosted**: Free (1,000 events) - likely too limited

**Verdict**: Excellent budget alternative if you have DevOps capacity. Saves ~$170/year vs Sentry Team but requires maintenance effort.

---

### 1.7 Other Alternatives

#### Better Stack
- **Pricing**: Free (5,000 errors/month), Team $39/month (150,000 errors/month)
- **Verdict**: Limited React Native info, more expensive than Sentry Team

#### Honeybadger
- **Pricing**: Free (Developer), $26/month (Team), $80/month (Business)
- **Verdict**: Similar pricing to Sentry but less React Native adoption

#### APItoolkit
- **Pricing**: Free plan for API-heavy apps
- **Verdict**: Focused on API monitoring, not comprehensive error tracking

---

## 2. Evaluation Summary

### Cost Comparison (50 users, typical usage)

| Solution | Free Tier | Paid Tier (Year 1-2) | Notes |
|----------|-----------|----------------------|-------|
| **Sentry** | 5,000 errors | $26/month ($312/year) | Best value, industry standard |
| **Bugsnag** | 7,500 errors | $32+/month ($384/year) | Higher cost, React Native issues |
| **LogRocket** | 1,000 sessions | $139+/month ($1,668/year) | 5x more expensive |
| **PostHog** | N/A | N/A | React Native error tracking not available yet |
| **Rollbar** | 5,000 errors | $15-29/month ($180-348/year) | Unclear pricing |
| **GlitchTip** | 1,000 errors (hosted) | $10-12/month self-hosted ($144/year) | Requires DevOps effort |

### Feature Comparison Matrix

| Feature | Sentry | Bugsnag | LogRocket | PostHog | Rollbar | GlitchTip |
|---------|--------|---------|-----------|---------|---------|-----------|
| React Native SDK Quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ N/A | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ (uses Sentry SDK) |
| Vercel/Node.js Support | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ (uses Sentry SDK) |
| Error Grouping | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ N/A | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Stack Traces | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⚠️ N/A | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Breadcrumbs | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⚠️ N/A | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Session Replay | ⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ❌ |
| Performance (APM) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ N/A | ⭐⭐⭐ | ❌ |
| Cost-Effectiveness | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Ease of Integration | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Documentation | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

---

## 3. Recommendations

### 3.1 Best Option for Tight Budget: Sentry Free Tier ⭐

**Why Sentry Free?**
- 5,000 errors/month is generous for a stable small business app
- Zero cost until you scale
- Full-featured SDK (no limitations on core error tracking)
- Easy upgrade path to Team plan ($26/month) when needed
- Professional tool from day one

**When to upgrade to Sentry Team ($26/month)?**
- Exceeding 5,000 errors/month (indicates growth or stability issues)
- Need more than 1 project (staging + production)
- Want team collaboration features (5 seats)
- Require longer data retention

**Total Cost Year 1-2**: $0 - $312/year

---

### 3.2 Best Budget Alternative: GlitchTip (Self-Hosted)

**Why GlitchTip Self-Hosted?**
- Truly free (only infrastructure costs ~$10-12/month)
- Uses same Sentry SDKs (no vendor lock-in)
- Full control over data (privacy benefit)
- Saves ~$170/year vs Sentry Team

**Considerations**:
- Requires DevOps knowledge (Docker, databases, backups)
- Ongoing maintenance burden (~2-4 hours/month)
- Missing advanced features (session replay, charts, APM)

**When to choose this?**
- Team has DevOps capacity
- Budget is extremely tight
- Privacy/data sovereignty is priority
- Don't need advanced features

**Total Cost Year 1-2**: ~$144/year (infrastructure only)

---

### 3.3 Best Comprehensive Solution: Sentry Team Plan

**Why Sentry Team?**
- Industry standard with best ecosystem support
- Excellent React Native + Vercel integration
- Performance monitoring included
- Professional support and SLAs
- Strong community and documentation

**When to choose this?**
- Budget allows $26/month ($312/year)
- Want professional-grade monitoring from start
- Plan to scale beyond 5,000 errors/month
- Need team collaboration features
- Value time over cost (vs self-hosting)

**Total Cost Year 1-2**: $312/year

---

### 3.4 Future Consideration: PostHog (When Ready)

**Why wait for PostHog?**
- Combines error tracking + product analytics + session replay
- Open source with generous free tier
- Could replace multiple tools (Sentry + analytics)
- Better long-term value proposition

**When to evaluate?**
- Q2-Q3 2025 when React Native error tracking ships
- When you need product analytics (currently missing in stack)
- If considering self-hosting for cost savings

**Action**: Set reminder to re-evaluate PostHog in June 2025

---

## 4. Integration Examples

### 4.1 Sentry + React Native (Expo)

#### Installation

```bash
# Install Sentry SDK
cd apps/mobile
pnpm add @sentry/react-native

# Update metro config
# metro.config.js already exists in the project
```

#### Configuration

**File**: `apps/mobile/app/_layout.tsx`

```typescript
import { Stack, useNavigationContainerRef } from "expo-router";
import { isRunningInExpoGo } from "expo";
import * as Sentry from "@sentry/react-native";
import { useEffect } from "react";

// Initialize Sentry
const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: __DEV__ ? 1.0 : 0.2, // 100% in dev, 20% in production

  // Profiling
  profilesSampleRate: __DEV__ ? 1.0 : 0.1,

  // Session replay
  replaysOnErrorSampleRate: 1.0, // 100% when errors occur
  replaysSessionSampleRate: 0.1, // 10% of sessions

  integrations: [
    navigationIntegration,
    Sentry.mobileReplayIntegration(),
  ],

  // Environment
  environment: __DEV__ ? 'development' : 'production',

  // Enable debug logs in development
  debug: __DEV__,

  // Attach stack trace to messages
  attachStacktrace: true,
});

function RootLayout() {
  const ref = useNavigationContainerRef();

  // Register navigation container for tracking
  useEffect(() => {
    if (ref) {
      navigationIntegration.registerNavigationContainer(ref);
    }
  }, [ref]);

  return <Stack />;
}

// Wrap root component with Sentry
export default Sentry.wrap(RootLayout);
```

#### Environment Variables

**File**: `apps/mobile/.env`

```bash
# Get DSN from Sentry dashboard after project creation
EXPO_PUBLIC_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

#### Metro Config Update

**File**: `apps/mobile/metro.config.js`

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

// Get default Expo config
const config = getDefaultConfig(__dirname);

// Merge with Sentry config for source maps
const sentryConfig = getSentryExpoConfig(__dirname, config);

module.exports = sentryConfig;
```

#### App Config for Source Maps

**File**: `apps/mobile/app.json`

```json
{
  "expo": {
    "plugins": [
      [
        "@sentry/react-native/expo",
        {
          "organization": "your-org-slug",
          "project": "nv-internal-mobile"
        }
      ]
    ]
  }
}
```

#### Usage Examples

```typescript
// Capture manual errors
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'task-checkout',
      taskId: task.id,
    },
    extra: {
      taskStatus: task.status,
      userId: user.id,
    },
  });
  throw error;
}

// Set user context
Sentry.setUser({
  id: user.id,
  email: user.emailAddresses[0]?.emailAddress,
  username: user.username,
});

// Add breadcrumb
Sentry.addBreadcrumb({
  category: 'task',
  message: 'User started checkout process',
  level: 'info',
  data: {
    taskId: task.id,
  },
});

// Test error in development
if (__DEV__) {
  throw new Error('Sentry test error');
}
```

---

### 4.2 Sentry + Hono API (Vercel)

#### Installation

```bash
cd apps/api
pnpm add @sentry/node @sentry/profiling-node
```

#### Configuration

**File**: `apps/api/src/lib/sentry.ts`

```typescript
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    integrations: [
      nodeProfilingIntegration(),
    ],

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    // Enable debug in development
    debug: process.env.NODE_ENV !== 'production',

    // Attach stack traces
    attachStacktrace: true,

    // Filter out health check errors
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Ignore health check 404s
      if (event.request?.url?.includes('/health')) {
        return null;
      }

      return event;
    },
  });
}

// Export Sentry for use in error handlers
export { Sentry };
```

#### Hono Integration

**File**: `apps/api/src/v1/index.ts`

```typescript
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { initSentry, Sentry } from '@/lib/sentry';
import { getLogger } from '@/lib/logger';

// Initialize Sentry
initSentry();

export const hono = new Hono()
  .use('*', authMiddleware)

  // Sentry request tracking middleware
  .use('*', async (c, next) => {
    const transaction = Sentry.startTransaction({
      op: 'http.server',
      name: `${c.req.method} ${c.req.path}`,
    });

    // Set user context from auth
    const auth = c.get('auth');
    if (auth?.userId) {
      Sentry.setUser({ id: auth.userId });
    }

    try {
      await next();
    } finally {
      transaction.finish();
    }
  })

  // Route handlers...
  .route('/task', taskApp)
  .route('/payment', paymentApp)

  // Global error handler
  .onError((err, c) => {
    const logger = getLogger('api.error-handler');

    // Capture in Sentry
    if (err instanceof HTTPException) {
      // Don't send expected HTTP errors to Sentry (4xx)
      if (err.status >= 500) {
        Sentry.captureException(err, {
          tags: {
            path: c.req.path,
            method: c.req.method,
            status: err.status,
          },
        });
      }
    } else {
      // Unexpected errors - always capture
      Sentry.captureException(err, {
        tags: {
          path: c.req.path,
          method: c.req.method,
        },
        extra: {
          body: c.req.json().catch(() => ({})),
        },
      });
    }

    logger.error({ err, path: c.req.path }, 'Request error');

    // Return error response
    if (err instanceof HTTPException) {
      return c.json({ error: err.message }, err.status);
    }

    return c.json({ error: 'Internal server error' }, 500);
  });
```

#### Service Layer Error Tracking

**File**: `apps/api/src/v1/task/task.service.ts`

```typescript
import { HTTPException } from 'hono/http-exception';
import { Sentry } from '@/lib/sentry';
import { getLogger } from '@/lib/logger';

export async function checkOutTask(taskId: number, userId: string) {
  try {
    // Add breadcrumb for debugging
    Sentry.addBreadcrumb({
      category: 'task',
      message: 'Starting task checkout',
      data: { taskId, userId },
    });

    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      throw new HTTPException(404, {
        message: 'Không tìm thấy công việc',
        cause: 'TASK_NOT_FOUND',
      });
    }

    // Perform checkout...
    return task;

  } catch (error) {
    // Service layer errors are caught by route handler and sent to Sentry
    const logger = getLogger('task.service:checkOutTask');
    logger.error({ error, taskId, userId }, 'Task checkout failed');
    throw error;
  }
}
```

#### Environment Variables

**File**: `apps/api/.env`

```bash
# Get DSN from Sentry dashboard
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0

# Vercel automatically sets these
VERCEL_GIT_COMMIT_SHA=
NODE_ENV=production
```

#### Vercel Build Configuration

**File**: `apps/api/package.json`

```json
{
  "scripts": {
    "vercel-build": "pnpm run build && sentry-upload-sourcemaps"
  },
  "devDependencies": {
    "@sentry/cli": "^2.x"
  }
}
```

**File**: `apps/api/.sentryclirc`

```ini
[defaults]
org=your-org-slug
project=nv-internal-api

[auth]
token=your-auth-token
```

---

### 4.3 GlitchTip Self-Hosted (Alternative)

#### Docker Compose Setup

**File**: `infrastructure/glitchtip/docker-compose.yml`

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: glitchtip
      POSTGRES_USER: glitchtip
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  web:
    image: glitchtip/glitchtip:latest
    depends_on:
      - postgres
      - redis
    ports:
      - "8080:8000"
    environment:
      DATABASE_URL: postgresql://glitchtip:${POSTGRES_PASSWORD}@postgres:5432/glitchtip
      REDIS_URL: redis://redis:6379/0
      SECRET_KEY: ${SECRET_KEY}
      PORT: 8000
      EMAIL_URL: ${EMAIL_URL}
      GLITCHTIP_DOMAIN: ${GLITCHTIP_DOMAIN}
      DEFAULT_FROM_EMAIL: ${DEFAULT_FROM_EMAIL}
      CELERY_WORKER_AUTOSCALE: "1,3"
      CELERY_WORKER_MAX_TASKS_PER_CHILD: "10000"
    restart: unless-stopped

  worker:
    image: glitchtip/glitchtip:latest
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://glitchtip:${POSTGRES_PASSWORD}@postgres:5432/glitchtip
      REDIS_URL: redis://redis:6379/0
      SECRET_KEY: ${SECRET_KEY}
      EMAIL_URL: ${EMAIL_URL}
    command: ./bin/run-celery-with-beat.sh
    restart: unless-stopped

volumes:
  postgres-data:
```

**File**: `infrastructure/glitchtip/.env`

```bash
# Generate with: openssl rand -hex 32
SECRET_KEY=your-secret-key-here

# Database
POSTGRES_PASSWORD=your-postgres-password

# GlitchTip domain
GLITCHTIP_DOMAIN=https://glitchtip.yourdomain.com

# Email (optional)
EMAIL_URL=smtp://user:password@smtp.example.com:587
DEFAULT_FROM_EMAIL=glitchtip@yourdomain.com
```

#### Usage

```bash
# Start GlitchTip
cd infrastructure/glitchtip
docker compose up -d

# Create superuser
docker compose run --rm web ./manage.py createsuperuser

# Access GlitchTip
open http://localhost:8080
```

#### Integration

**Use the same Sentry SDK code from sections 4.1 and 4.2**, just change the DSN to your GlitchTip instance:

```bash
# Mobile
EXPO_PUBLIC_SENTRY_DSN=https://key@glitchtip.yourdomain.com/1

# API
SENTRY_DSN=https://key@glitchtip.yourdomain.com/2
```

**No code changes needed** - GlitchTip is Sentry API compatible!

---

## 5. Performance Impact

### Sentry SDK Performance Impact

**React Native (Mobile)**:
- **App size increase**: ~500KB (minified)
- **Startup time**: < 50ms additional
- **Runtime overhead**: Negligible (< 1% CPU)
- **Network**: Errors sent asynchronously (non-blocking)
- **Recommendation**: Safe for production use

**Node.js (API)**:
- **Cold start**: +10-20ms on Vercel serverless
- **Memory**: +5-10MB per instance
- **Runtime overhead**: < 1% CPU
- **Recommendation**: Safe for production use

### Optimization Tips

1. **Sample rates**: Use lower rates in production (10-20% for traces)
2. **Filter events**: Ignore expected errors (404s, validation errors)
3. **Lazy initialization**: Initialize after critical app logic
4. **Breadcrumb limits**: Default 100 is reasonable
5. **Attachment limits**: Don't auto-attach large payloads

---

## 6. Privacy & Compliance

### Vietnam PDPD Compliance

**Vietnam Personal Data Protection Decree (13/2023/ND-CP)**:
- Effective: July 1, 2023
- Applies to: Any processing of Vietnamese citizens' data
- Extraterritorial: Applies to foreign companies

**Key Requirements**:
- ✅ User consent for data collection
- ✅ Impact assessment required (submit within 60 days)
- ✅ Breach notification (within 72 hours)
- ✅ Data minimization
- ✅ Right to erasure

**Sentry PDPD Compliance**:
- ✅ Data Processing Agreement (DPA) available
- ✅ Data minimization controls (scrubbing, filtering)
- ✅ User data deletion on request
- ✅ Data residency options (US, EU)
- ⚠️ No Vietnam data center (use EU for lower latency)

**GlitchTip PDPD Compliance**:
- ✅ Self-hosted = full control (best for compliance)
- ✅ Data stays in Vietnam if self-hosted locally
- ✅ No third-party data sharing

### GDPR Considerations

Both Sentry and GlitchTip support GDPR compliance:
- Data scrubbing (PII removal)
- User consent mechanisms
- Data deletion requests
- Data export

### Recommendations for NV Internal

1. **Scrub PII**: Configure Sentry to remove phone numbers, emails from error data
2. **User consent**: Add privacy policy mentioning error tracking
3. **Data retention**: Set to 30-90 days (reduce compliance burden)
4. **Self-hosting option**: Use GlitchTip if data sovereignty is critical

**Example Sentry PII Scrubbing**:

```typescript
Sentry.init({
  beforeSend(event) {
    // Remove PII from URLs
    if (event.request?.url) {
      event.request.url = event.request.url.replace(/phone=\d+/g, 'phone=[REDACTED]');
    }

    // Remove PII from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(crumb => ({
        ...crumb,
        data: scrubPII(crumb.data),
      }));
    }

    return event;
  },
});

function scrubPII(data: any) {
  // Remove phone numbers, emails, etc.
  const scrubbed = { ...data };

  if (scrubbed.phoneNumber) scrubbed.phoneNumber = '[REDACTED]';
  if (scrubbed.email) scrubbed.email = '[REDACTED]';

  return scrubbed;
}
```

---

## 7. Implementation Roadmap

### Phase 1: Initial Setup (Week 1)

**Tasks**:
- [ ] Create Sentry account and project
- [ ] Configure Sentry for React Native mobile app
- [ ] Configure Sentry for Hono API
- [ ] Set up source maps for production debugging
- [ ] Test error capture in development
- [ ] Deploy to production

**Estimated Effort**: 4-6 hours

### Phase 2: Optimization (Week 2-3)

**Tasks**:
- [ ] Configure PII scrubbing for PDPD compliance
- [ ] Set up error filtering (ignore expected errors)
- [ ] Configure performance monitoring sample rates
- [ ] Set up Slack/email notifications
- [ ] Create custom error handlers for critical paths
- [ ] Document error handling patterns in CLAUDE.md

**Estimated Effort**: 4-6 hours

### Phase 3: Monitoring & Iteration (Ongoing)

**Tasks**:
- [ ] Monitor error rates and patterns
- [ ] Triage and fix reported errors
- [ ] Adjust alert thresholds
- [ ] Review usage and upgrade if needed
- [ ] Evaluate session replay when stable

**Estimated Effort**: 1-2 hours/week

---

## 8. Final Recommendation (Updated 2025-10-31)

### For NV Internal: Start with PostHog

**Why PostHog?**
1. **Exceptional value**: 1M free events/month (vs Sentry's 5K errors)
2. **All-in-one platform**: Error tracking + analytics + feature flags
3. **Full React Native support**: Complete error tracking now available
4. **Node.js/API support**: Serverless-optimized error tracking
5. **Future-proof**: Won't need multiple tools as you grow
6. **Cost-effective**: Free tier will last indefinitely for 50 users

**Next Steps**:
1. Review implementation plan at `.claude/enhancements/20251031-posthog-observability-implementation.md`
2. Create PostHog Cloud account (free tier)
3. Remove Sentry from mobile app
4. Install PostHog SDKs (mobile and API)
5. Configure error tracking, analytics, and feature flags
6. Test in development
7. Deploy to production (estimated 2-3 days total effort)

**Implementation Resources**:
- Detailed plan: `.claude/enhancements/20251031-posthog-observability-implementation.md`
- Error tracking guide: `.claude/docs/error-tracking-guide.md`
- PostHog React Native SDK: https://posthog.com/docs/libraries/react-native
- PostHog Node SDK: https://posthog.com/docs/libraries/node

**When to consider alternatives?**
- **Sentry**: If you need the most mature error tracking solution with largest community
- **GlitchTip**: If data sovereignty is critical and you have DevOps capacity
- **LogRocket**: Only if session replay is the primary requirement

**Estimated Total Cost**:
- Year 1: $0 (free tier covers 1M events)
- Year 2+: $0 (unlikely to exceed free tier with 50 users)
- Growth scenario: Usage-based pricing scales gradually

---

## Appendix A: Additional Resources

### Sentry Documentation
- React Native: https://docs.sentry.io/platforms/react-native/
- Expo: https://docs.expo.dev/guides/using-sentry/
- Hono: https://docs.sentry.io/platforms/javascript/guides/hono/
- Node.js: https://docs.sentry.io/platforms/node/

### GlitchTip Documentation
- Official Docs: https://glitchtip.com/documentation
- Docker Setup: https://glitchtip.com/documentation/install
- GitHub: https://github.com/mikekosulin/glitchtip-backend

### Community Resources
- Sentry Discord: https://discord.gg/sentry
- React Native Sentry Examples: https://github.com/getsentry/sentry-react-native/tree/main/samples

---

## Appendix B: Cost Calculator

### Sentry Cost Estimation

Based on error volume:

| Errors/Month | Plan | Cost/Month | Cost/Year |
|--------------|------|------------|-----------|
| < 5,000 | Free | $0 | $0 |
| 5,000 - 50,000 | Team | $26 | $312 |
| 50,000 - 100,000 | Team (overage) | $26 + overage | ~$400-500 |
| 100,000+ | Business | $80+ | $960+ |

**For NV Internal (50 users, stable app)**:
- Expected errors: 1,000-3,000/month (normal operation)
- Free tier sufficient for first 6-12 months
- Upgrade to Team when hitting limits or needing features

### GlitchTip Cost Estimation

**Self-Hosted (DigitalOcean Droplet)**:
- Droplet (2GB RAM): $12/month
- Backups: $2.40/month (20% extra)
- Domain: $12/year (~$1/month)
- **Total**: ~$15.40/month = $185/year

**Savings vs Sentry Team**: $312 - $185 = $127/year (41% cheaper)

**Trade-off**: Requires ~2-4 hours/month maintenance (setup, updates, monitoring)

**Break-even**: If you value your time at $50/hour, self-hosting costs more in time than savings

---

## Document History

- **Created**: 2025-10-24
- **Author**: Claude (research agent)
- **Status**: Complete
- **Next Review**: 2025-06 (re-evaluate PostHog React Native support)
