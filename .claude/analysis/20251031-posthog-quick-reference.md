# PostHog + Expo Go: Quick Reference

**TL;DR**: ✅ **PostHog React Native works perfectly with Expo Go**. Only limitation: No session replay (BETA feature anyway).

---

## The Answer You Need

| Question | Answer |
|----------|--------|
| **Does PostHog work with Expo Go?** | ✅ YES - Works perfectly |
| **Do I need development builds?** | ❌ NO - Stay with Expo Go |
| **What do I give up?** | Only session replay (BETA, not critical) |
| **Is it worth staying with Expo Go?** | ✅ YES - 95% features, 0% complexity |
| **Recommended approach?** | Use `posthog-react-native` with Expo Go |

---

## Feature Matrix

| Feature | Expo Go | Dev Build | Notes |
|---------|---------|-----------|-------|
| **Analytics Events** | ✅ Full | ✅ Full | Custom event tracking |
| **Screen Tracking** | ✅ Full | ✅ Full | Automatic + manual |
| **Feature Flags** | ✅ Full | ✅ Full | A/B tests, remote config |
| **User Identification** | ✅ Full | ✅ Full | User properties, segmentation |
| **Error Tracking** | ✅ Full | ✅ Full | JS error capture |
| **Autocapture** | ✅ Full | ✅ Full | Touch + lifecycle events |
| **Group Analytics** | ✅ Full | ✅ Full | Company/team tracking |
| **Super Properties** | ✅ Full | ✅ Full | Global event properties |
| **Offline Support** | ✅ Full | ✅ Full | Event queuing |
| **Session Replay** | ❌ None | ✅ BETA | Video replay of sessions |

**Verdict**: Staying with Expo Go gives you **everything except session replay** (which is BETA anyway).

---

## Installation (2 minutes)

```bash
cd apps/mobile
npx expo install posthog-react-native expo-file-system expo-application expo-device expo-localization
```

**Environment Variables:**
```bash
# apps/mobile/.env
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_api_key_here
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## Setup (5 minutes)

```tsx
// apps/mobile/app/_layout.tsx
import { PostHogProvider } from 'posthog-react-native'

export default function RootLayout() {
  return (
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY}
      options={{
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        captureAppLifecycleEvents: true,
        flushAt: 20,
        enableSessionReplay: false, // Not supported in Expo Go
        errorTracking: {
          autocapture: {
            uncaughtExceptions: true,
            unhandledRejections: true,
            console: ['error', 'warn']
          }
        }
      }}
      autocapture={{
        captureTouches: true,
        captureScreens: true,
        captureLifecycleEvents: true
      }}
    >
      {/* Your existing providers */}
    </PostHogProvider>
  )
}
```

---

## Usage Examples

### Capture Events

```tsx
import { usePostHog } from 'posthog-react-native'

function TaskScreen() {
  const posthog = usePostHog()

  const handleComplete = () => {
    posthog.capture('task_completed', {
      task_id: taskId,
      duration_hours: 2.5,
      assignee_count: 3,
    })
  }
}
```

### Identify Users

```tsx
import { usePostHog } from 'posthog-react-native'
import { useUser } from '@clerk/clerk-expo'

function useUserTracking() {
  const posthog = usePostHog()
  const { user } = useUser()

  useEffect(() => {
    if (user) {
      posthog.identify(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        role: user.publicMetadata.role,
      })
    }
  }, [user])
}
```

### Feature Flags

```tsx
import { useFeatureFlag } from 'posthog-react-native'

function MyComponent() {
  const newUIEnabled = useFeatureFlag('new-ui')

  if (newUIEnabled === undefined) {
    return <Loading />
  }

  return newUIEnabled ? <NewUI /> : <OldUI />
}
```

### Track Errors

```tsx
import { usePostHog } from 'posthog-react-native'

function MyComponent() {
  const posthog = usePostHog()

  try {
    // risky operation
  } catch (error) {
    posthog.captureException(error, {
      context: 'task_completion',
      task_id: taskId,
    })
  }
}
```

---

## Cost Estimate

**For <50 Users:**
- Events/month: 50,000-200,000
- Cost: **$0/month** (free tier covers 1M events)

**PostHog Free Tier:**
- ✅ 1M events/month
- ✅ Unlimited feature flags
- ✅ Unlimited users
- ✅ Error tracking included

---

## Comparison: Expo Go vs. Dev Build

| Aspect | Expo Go | Dev Build |
|--------|---------|-----------|
| **Setup Time** | 0 hours | 4-8 hours |
| **Build Time** | Instant | 5-10 minutes |
| **Team Onboarding** | Install Expo Go (5 min) | Install custom client (15-30 min) |
| **PostHog Features** | 95% | 100% |
| **Missing Feature** | Session replay (BETA) | None |
| **Complexity** | LOW | HIGH |
| **Maintenance** | LOW | MEDIUM |
| **Recommendation** | ✅ **RECOMMENDED** | ❌ Not worth it |

---

## Decision Matrix

### Choose Expo Go + PostHog If:
- ✅ You want analytics, feature flags, and error tracking
- ✅ You want to stay simple and fast
- ✅ You have <50 users (small team)
- ✅ Session replay is not critical
- ✅ You want to avoid build complexity

### Choose Dev Build + PostHog If:
- ✅ Session replay is **absolutely critical**
- ✅ You're willing to increase complexity
- ✅ You need other native modules anyway
- ✅ You have team resources for build management

**For Your Use Case (<50 users, AC service company):**
→ **Expo Go + PostHog** is the clear winner.

---

## What Session Replay Actually Gives You

**Session Replay Features:**
- Video replay of user sessions
- See exactly what user saw and did
- Useful for debugging complex UI issues
- Helps understand user confusion

**Why You Don't Need It (Yet):**
1. **Team Size**: <50 users means you can talk to users directly
2. **Beta Status**: Feature is still in beta, may have bugs
3. **Privacy Concerns**: Recording everything may be overkill
4. **Cost**: Replay has separate pricing (5,000 free, then paid)
5. **Alternatives**: Sentry, LogRocket if truly needed later

**Verdict**: Nice to have, not critical for your scale.

---

## Risk Assessment

### Staying with Expo Go
- **Risk**: LOW
- **Impact**: None (all critical features work)
- **Reversibility**: Can move to dev build later if needed
- **Cost**: $0/month

### Moving to Dev Build
- **Risk**: MEDIUM (complexity increase)
- **Impact**: HIGH (team workflow changes)
- **Reversibility**: Hard to go back once team is onboarded
- **Benefit**: Only gain BETA session replay

---

## FAQ

### Q: Can I add session replay later?
**A**: Yes! If you need it in the future, you can switch to development builds. Your PostHog setup and events will continue working.

### Q: Will PostHog slow down my app?
**A**: No. Events are batched and sent in the background. No noticeable performance impact.

### Q: What if I exceed the free tier?
**A**: Very unlikely with <50 users. Even if you do, it's only $0.000225/event. 5M events = ~$900/year.

### Q: Can I self-host PostHog?
**A**: Yes! PostHog offers self-hosted option (free). But cloud is easier for small teams.

### Q: Does PostHog work offline?
**A**: Yes! Events are queued in AsyncStorage and sent when online.

### Q: Can I use PostHog with my existing Hono API?
**A**: Yes! Client-side events go directly to PostHog. You can also send server-side events from your API if needed.

### Q: What about user privacy?
**A**: PostHog is GDPR compliant. You can implement opt-out with `posthog.optOut()`. User data is anonymized by default until you call `identify()`.

### Q: Can I test PostHog locally?
**A**: Yes! Enable debug mode with `posthog.debug(true)` to see events in console. PostHog dashboard updates in real-time.

---

## Next Steps

1. **Read Full Analysis**: `.claude/analysis/20251031-posthog-expo-go-compatibility.md`
2. **Review Checklist**: `.claude/analysis/20251031-posthog-implementation-checklist.md`
3. **Create PostHog Account**: [posthog.com](https://posthog.com)
4. **Get API Key**: From project settings
5. **Install Dependencies**: See "Installation" section above
6. **Implement Provider**: See "Setup" section above
7. **Test**: Verify events appear in dashboard
8. **Roll Out**: Add events to key user flows

---

## Official Resources

- **PostHog Docs**: https://posthog.com/docs/libraries/react-native
- **Expo Tutorial**: https://posthog.com/tutorials/react-native-analytics
- **Example Repo**: https://github.com/PostHog/support-rn-expo
- **Community Slack**: https://posthog.com/slack

---

## Final Recommendation

### ✅ Use PostHog React Native with Expo Go

**Rationale:**
1. All critical features work (analytics, flags, errors)
2. Zero complexity increase
3. Perfect for <50 user team
4. Free tier covers usage
5. Only missing BETA session replay (not critical)
6. Can upgrade to dev build later if needed

**Implementation Time**: 1-2 hours for basic setup, 5-8 days for full rollout

**Cost**: $0/month (free tier)

**Risk**: LOW (non-breaking addition)

**Recommendation Confidence**: **VERY HIGH** ✅

---

## Document Version

- **Created**: 2025-10-31
- **Last Updated**: 2025-10-31
- **Status**: ✅ Approved for implementation
- **Next Review**: After implementation complete
