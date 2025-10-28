# Performance Monitoring Quick Reference

**For**: NV Internal - Performance optimization checklist
**Date**: 2025-10-24

## Critical Performance Issues Found

### ❌ Major Gaps in Original Research

1. **Performance impact underestimated**
   - Claimed: 10-20ms API cold start
   - Reality: 160-300ms actual impact (15x worse!)

2. **Missing Vercel Analytics** (FREE and essential!)
   - No mention of built-in Vercel monitoring
   - Provides RUM, Core Web Vitals, cold start tracking

3. **No performance budget**
   - No regression detection
   - No CI/CD performance checks

4. **Sampling rates too high**
   - 20% mobile, 10% API wastes resources
   - Recommended: 5% mobile, 2-5% API

5. **Missing observability**
   - No database query monitoring
   - No cold start attribution
   - No timeout tracking
   - No geo-latency analysis

---

## Recommended Monitoring Stack

### ✅ Essential Tools (All FREE!)

```
Error Tracking: Sentry Free Tier
├─ Errors & exceptions
├─ Basic performance monitoring
└─ Cost: $0/month (5,000 errors)

APM: Vercel Analytics (CRITICAL!)
├─ Core Web Vitals
├─ Serverless cold starts
├─ Regional latency
└─ Cost: $0/month (included)

Database: Prisma Middleware
├─ Query performance tracking
├─ Slow query alerts
└─ Cost: $0/month (custom code)

Uptime: Sentry Cron Monitoring
├─ Health check monitoring
└─ Cost: $0/month (included in Sentry)

Total: $0/month 🎉
```

---

## Quick Implementation Checklist

### Before Implementing Sentry (MUST DO FIRST!)

- [ ] **Enable Vercel Analytics** (5 min)
  ```json
  // vercel.json
  {
    "analytics": {
      "enable": true
    }
  }
  ```

- [ ] **Create performance budget** (30 min)
  - Mobile bundle: 35MB max
  - API cold start: 2000ms max
  - Warm response p95: 500ms
  - See: `PERFORMANCE-ANALYSIS-bug-tracking.md` section 8.1

- [ ] **Set up dynamic sampling** (1 hour)
  ```typescript
  // Lower default rates
  tracesSampleRate: __DEV__ ? 1.0 : 0.05, // 5% not 20%!

  // Use tracesSampler for per-endpoint control
  tracesSampler: (context) => {
    if (context.request?.url?.includes('/payment')) return 0.5;
    if (context.request?.method === 'GET') return 0.02;
    return 0.05;
  }
  ```

---

## Critical Performance Optimizations

### 1. Mobile App Startup (Target: < 3s)

```typescript
// Lazy init Sentry AFTER critical UI
useEffect(() => {
  const timer = setTimeout(() => {
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,

      // OPTIMIZE:
      maxBreadcrumbs: 50, // Reduce memory
      profilesSampleRate: 0, // NEVER profile on mobile
      tracesSampleRate: 0.05, // 5% not 20%

      // Bandwidth-aware
      beforeSend: async (event) => {
        const netInfo = await NetInfo.fetch();
        if (netInfo.type === 'cellular') {
          delete event.extra?.screenshots;
          event.breadcrumbs = event.breadcrumbs?.slice(-20);
        }
        return event;
      },
    });
  }, 1000); // Delay 1s after mount

  return () => clearTimeout(timer);
}, []);
```

### 2. API Cold Start (Target: < 2s)

```typescript
// Track cold starts separately
let isFirstRequest = true;

export async function coldStartMiddleware(c: Context, next: Next) {
  if (isFirstRequest) {
    const startTime = Date.now();
    isFirstRequest = false;

    await next();

    const duration = Date.now() - startTime;
    Sentry.captureMessage('Cold start', {
      level: 'info',
      tags: {
        cold_start: 'true',
        duration_ms: duration.toString(),
        region: process.env.VERCEL_REGION,
      },
    });

    return;
  }

  Sentry.setTag('cold_start', 'false');
  await next();
}
```

### 3. Database Query Performance

```typescript
// Track slow queries
prisma.$on('query', (e) => {
  if (e.duration > 1000) { // > 1s
    Sentry.captureMessage(`Slow query: ${e.duration}ms`, {
      level: 'warning',
      tags: {
        query_type: e.target,
        duration_ms: e.duration.toString(),
      },
    });
  }
});
```

### 4. Timeout Monitoring

```typescript
const TIMEOUT_MS = 10000; // Vercel limit
const WARNING_MS = 8000; // 80% threshold

export async function withTimeoutTracking<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();

    const duration = Date.now() - startTime;
    if (duration > WARNING_MS) {
      Sentry.captureMessage('Approaching timeout', {
        level: 'warning',
        tags: {
          operation,
          duration_ms: duration.toString(),
          percent_used: ((duration / TIMEOUT_MS) * 100).toFixed(1),
        },
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    if (duration >= TIMEOUT_MS) {
      Sentry.captureException(error, {
        tags: { error_type: 'timeout' },
      });
    }
    throw error;
  }
}
```

---

## Performance Budget

### Mobile App

```yaml
bundleSize:
  android: 35MB
  ios: 40MB
  sentrySdkMax: 3MB

startup:
  timeToInteractive: 3000ms
  timeToFirstScreen: 1500ms

rendering:
  screenLoad: 1000ms
  scrollFPS: 55

memory:
  maxHeapSize: 150MB
  warningThreshold: 100MB
```

### API (Vercel Serverless)

```yaml
coldStart:
  max: 2000ms
  warning: 1500ms

warmResponse:
  p50: 200ms
  p95: 500ms
  p99: 1000ms

database:
  queryMax: 1000ms
  queryWarning: 500ms

memory:
  heapMax: 800MB # 80% of 1GB

timeout:
  functionMax: 9000ms
  warningThreshold: 8000ms
```

---

## CI/CD Performance Checks

### Bundle Size Check (GitHub Actions)

```yaml
# .github/workflows/performance-check.yml
- name: Check bundle size
  run: |
    BUNDLE_SIZE=$(du -sh apps/mobile/.expo/dist | cut -f1)
    if [ $BUNDLE_SIZE -gt 35000000 ]; then
      echo "❌ Bundle size exceeded: $BUNDLE_SIZE"
      exit 1
    fi
```

### API Cold Start Check

```yaml
- name: Measure cold start
  run: |
    sleep 300 # Wait for cold start

    START=$(date +%s%N)
    curl $VERCEL_URL/api/health
    END=$(date +%s%N)

    DURATION=$(( (END - START) / 1000000 ))

    if [ $DURATION -gt 2000 ]; then
      echo "❌ Cold start exceeded: ${DURATION}ms"
      exit 1
    fi
```

---

## Load Testing (k6)

```javascript
// scripts/load-test.js
export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 10 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% under 500ms
    'errors': ['rate<0.1'], // < 10% error rate
  },
};

export default function () {
  const res = http.get(`${__ENV.API_URL}/v1/task`, {
    headers: { 'Authorization': `Bearer ${__ENV.AUTH_TOKEN}` },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

---

## Monitoring Checklist

### ✅ Error Tracking
- [ ] Sentry SDK installed (mobile + API)
- [ ] Source maps uploaded
- [ ] PII scrubbing configured
- [ ] Error grouping validated

### ✅ Performance Monitoring
- [ ] Vercel Analytics enabled
- [ ] Database query tracking
- [ ] Cold start attribution
- [ ] Timeout monitoring
- [ ] Geo-latency tracking

### ✅ Performance Budget
- [ ] Budget defined in code
- [ ] CI/CD checks configured
- [ ] Alerts set up
- [ ] Team educated

### ✅ Load Testing
- [ ] k6 scripts created
- [ ] Baseline established
- [ ] Automated in CI/CD
- [ ] Results dashboard

---

## Cost Breakdown

### Year 1
```
Sentry Free Tier: $0/month
Vercel Analytics: $0/month (included)
Implementation: 20 hours @ $100/hour = $2,000

Total: $2,000 one-time
```

### Year 2 (if scaling)
```
Sentry Team Plan: $26/month = $312/year
Vercel Analytics: $0/month
Maintenance: 2 hours/month = $2,400/year

Total: $2,712/year
```

### ROI
```
Bug resolution time savings: 10 hours/month × $100/hour = $1,000/month
Annual savings: $12,000/year

Year 1 ROI: $12,000 - $2,000 = $10,000 net
Year 2 ROI: $12,000 - $2,712 = $9,288 net
```

---

## Next Steps

### Immediate (Week 1)
1. Enable Vercel Analytics (5 min)
2. Define performance budget (30 min)
3. Implement dynamic sampling (1 hour)
4. Add cold start tracking (1 hour)
5. Set up database monitoring (1 hour)

### Short-term (Week 2-4)
1. Mobile performance instrumentation (3 hours)
2. Timeout tracking (2 hours)
3. Geo-latency tracking (1 hour)
4. Performance CI/CD checks (4 hours)
5. Load testing setup (8 hours)

### Medium-term (Month 2-3)
1. Distributed tracing (6 hours)
2. Custom metrics dashboard (4 hours)
3. Memory profiling (4 hours)
4. Log aggregation (6 hours)

---

## Full Documentation

See detailed analysis: `/Users/duongdev/personal/nv-internal/.claude/research/PERFORMANCE-ANALYSIS-bug-tracking.md`

## Related Documents
- Original research: `20251024-220000-production-bug-tracking-solutions.md`
- Quick reference: `QUICK-REFERENCE-bug-tracking.md`
