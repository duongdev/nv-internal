# Bug Tracking Quick Reference

**For**: NV Internal - Small business air conditioning service app
**Date**: 2025-10-24

## TL;DR Recommendation

✅ **Start with Sentry Free Tier** → Upgrade to Team ($26/month) when needed

## Why Sentry?

- ✅ **Free**: 5,000 errors/month (sufficient for small stable app)
- ✅ **Best React Native support**: 562k weekly downloads (vs competitors' <1k)
- ✅ **Vercel + Hono compatible**: Official integration
- ✅ **Easy upgrade**: $26/month when you scale
- ✅ **Fast setup**: 4-6 hours to production

## Cost Comparison

| Solution | Free Tier | Year 1 Cost | Year 2 Cost | Notes |
|----------|-----------|-------------|-------------|-------|
| **Sentry** ⭐ | 5,000 errors | $0 | $0-312 | Best choice |
| GlitchTip | 1,000 errors | $144 (self-host) | $144 | Requires DevOps |
| Bugsnag | 7,500 errors | $0 | $384+ | React Native issues |
| LogRocket | 1,000 sessions | $1,668 | $1,668 | Too expensive |
| PostHog | N/A | N/A | N/A | Not ready yet |

## Quick Setup

### 1. Create Account
- Go to sentry.io
- Create 2 projects: `nv-internal-mobile`, `nv-internal-api`

### 2. Mobile Setup (5 min)
```bash
cd apps/mobile
pnpm add @sentry/react-native
```

Add to `apps/mobile/app/_layout.tsx`:
```typescript
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
});

export default Sentry.wrap(RootLayout);
```

### 3. API Setup (5 min)
```bash
cd apps/api
pnpm add @sentry/node
```

Add to `apps/api/src/v1/index.ts`:
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});

// Add error handler
.onError((err, c) => {
  if (err.status >= 500) {
    Sentry.captureException(err);
  }
  // ... return error response
});
```

### 4. Environment Variables
```bash
# apps/mobile/.env
EXPO_PUBLIC_SENTRY_DSN=https://...@sentry.io/mobile-project-id

# apps/api/.env
SENTRY_DSN=https://...@sentry.io/api-project-id
```

## When to Upgrade?

**Free Tier (5,000 errors/month) is enough when:**
- ✅ App is stable (< 5,000 errors/month)
- ✅ Team is small (1-2 developers)
- ✅ Only need basic error tracking

**Upgrade to Team ($26/month) when:**
- 📈 Exceeding 5,000 errors/month
- 👥 Need team collaboration (5 seats)
- 🏗️ Want multiple projects (staging + production)
- 📊 Need longer data retention

## Budget Alternative: GlitchTip

**If budget is extremely tight:**
- Self-host GlitchTip on DigitalOcean ($12/month droplet)
- Uses same Sentry SDKs (zero code changes)
- Saves $170/year vs Sentry Team
- **Trade-off**: Requires DevOps maintenance (2-4 hours/month)

**Only choose if:**
- You have DevOps skills
- Budget is critically tight
- Don't need advanced features (APM, session replay)

## Full Documentation

See `/Users/duongdev/personal/nv-internal/.claude/research/20251024-220000-production-bug-tracking-solutions.md` for:
- Detailed tool comparisons
- Full integration examples
- Privacy/compliance guidance
- Implementation roadmap
