# PostHog Feature Flags Guide

Complete guide for using PostHog feature flags in the NV Internal mobile app.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Using Feature Flags](#using-feature-flags)
- [Creating Flags in PostHog](#creating-flags-in-posthog)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

---

## Overview

PostHog feature flags allow you to:
- **Toggle features** without code deployments
- **Run A/B tests** with different variants
- **Roll out gradually** to percentage of users
- **Target segments** based on user properties
- **Kill switches** to disable problematic features instantly

### Architecture

- **Library**: `posthog-react-native` (Expo Go compatible ✅)
- **Initialization**: Async initialization in root layout
- **Provider**: `PostHogProvider` wraps the app (conditionally)
- **Persistence**: Uses AsyncStorage for local caching
- **Hooks**: Three specialized hooks for different flag types

---

## Setup

### 1. Environment Variables

Create or update your `.env` files:

```env
# .env.local (development)
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_dev_api_key_here
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
EXPO_PUBLIC_POSTHOG_ENABLED=true

# .env.production
EXPO_PUBLIC_POSTHOG_API_KEY_PRODUCTION=phc_your_prod_api_key_here
EXPO_PUBLIC_POSTHOG_ENABLED=true

# .env.staging (optional)
EXPO_PUBLIC_POSTHOG_API_KEY_STAGING=phc_your_staging_api_key_here
EXPO_PUBLIC_POSTHOG_ENABLED=true
```

**Important**:
- Never commit real API keys to git
- Use different projects in PostHog for dev/staging/prod
- Set `EXPO_PUBLIC_POSTHOG_ENABLED=false` to disable PostHog entirely

### 2. PostHog Account Setup

1. **Create Account**: Sign up at [posthog.com](https://posthog.com)
2. **Create Projects**:
   - Development (for local testing)
   - Staging (optional)
   - Production (for released app)
3. **Get API Keys**: Found in Project Settings → API Keys
4. **Copy Host URL**: Usually `https://app.posthog.com` (or your self-hosted URL)

---

## Using Feature Flags

### Import Hooks

```typescript
import { useFeatureFlag, useFeatureFlagPayload, useFeatureFlagVariant, FEATURE_FLAGS } from '@/hooks/use-feature-flag'
```

### 1. Boolean Feature Flags

**Use Case**: Simple on/off toggles

```typescript
function TaskListScreen() {
  const { isEnabled, isLoading } = useFeatureFlag('new_task_ui')

  if (isLoading) {
    return <LoadingSpinner />
  }

  return isEnabled ? <NewTaskList /> : <LegacyTaskList />
}
```

**Type-Safe Version**:
```typescript
const { isEnabled } = useFeatureFlag(FEATURE_FLAGS.NEW_TASK_UI)
```

### 2. Payload Feature Flags

**Use Case**: Configuration values (numbers, strings, objects)

```typescript
function TasksScreen() {
  const { payload, isLoading } = useFeatureFlagPayload<{
    maxResults: number
    showPhotos: boolean
  }>('task_config')

  // Always provide fallback values
  const pageSize = payload?.maxResults || 20
  const showPhotos = payload?.showPhotos ?? true

  const { data } = useInfiniteQuery({
    queryKey: ['tasks'],
    queryFn: ({ pageParam }) => fetchTasks({
      page: pageParam,
      limit: pageSize
    }),
  })

  return (
    <TaskList
      data={data}
      showPhotos={showPhotos}
    />
  )
}
```

**Payload Types**:
- **Number**: `{ limit: 50 }`
- **String**: `{ color: "blue" }`
- **Boolean**: `{ enabled: true }`
- **Object**: `{ config: { x: 1, y: 2 } }`
- **Array**: `{ features: ["a", "b"] }`

### 3. Variant Feature Flags (A/B Testing)

**Use Case**: Testing multiple variations

```typescript
function TaskCard({ task }: { task: Task }) {
  const { variant, isLoading } = useFeatureFlagVariant(
    'card_design',
    ['minimal', 'detailed', 'compact']
  )

  if (isLoading) {
    return <TaskCardSkeleton />
  }

  const cardStyles = {
    minimal: 'p-2',
    detailed: 'p-4 shadow-lg',
    compact: 'p-1',
  }[variant || 'minimal']

  return <View className={cardStyles}>...</View>
}
```

**Variant Rollout Example**:
- 33% users see "minimal"
- 33% users see "detailed"
- 34% users see "compact"

---

## Creating Flags in PostHog

### 1. Navigate to Feature Flags

1. Go to your PostHog project
2. Click "Feature Flags" in sidebar
3. Click "New feature flag"

### 2. Boolean Flag Setup

**Example**: New Task UI

```
Key: new_task_ui
Name: New Task UI
Description: Enables the redesigned task list interface

Release conditions:
☑ Roll out to 10% of users
```

**Gradual Rollout Strategy**:
1. Start at 10% → Monitor for issues
2. Increase to 50% → Gather feedback
3. Scale to 100% → Full release
4. Remove flag from code once stable

### 3. Payload Flag Setup

**Example**: Task Pagination Config

```
Key: task_pagination
Name: Task Pagination Configuration
Description: Controls pagination settings

Payload:
{
  "maxResults": 50,
  "enableInfiniteScroll": true,
  "prefetchPages": 2
}

Release conditions:
☑ Roll out to 100% of users
```

### 4. Variant Flag Setup

**Example**: Button Color A/B Test

```
Key: button_color_test
Name: Button Color A/B Test
Description: Test which button color drives more engagement

Variants:
- control (33%): blue
- variant_a (33%): green
- variant_b (34%): red

Release conditions:
☑ Roll out to 100% of users
☑ Track conversion events
```

### 5. User Targeting

**Target Specific Users**:
```
Match users where:
- email contains "@company.com"
- role equals "admin"
- has_beta_access is true
```

**Percentage Rollouts**:
```
Roll out to 25% of users matching:
- role equals "worker"
- created_at < 2024-01-01
```

---

## Best Practices

### 1. Always Provide Fallbacks

```typescript
// ✅ GOOD - Handles loading and null states
const { payload, isLoading } = useFeatureFlagPayload<{ limit: number }>('config')
const limit = payload?.limit || 20

// ❌ BAD - Can crash if payload is null
const { payload } = useFeatureFlagPayload<{ limit: number }>('config')
const limit = payload.limit // TypeError if null
```

### 2. Handle Loading States

```typescript
// ✅ GOOD - Shows loading UI
const { isEnabled, isLoading } = useFeatureFlag('new_ui')
if (isLoading) return <LoadingSpinner />

// ❌ BAD - Flickers between states
const { isEnabled } = useFeatureFlag('new_ui')
return isEnabled ? <NewUI /> : <OldUI />
```

### 3. Use TypeScript for Payloads

```typescript
// ✅ GOOD - Type-safe access
interface TaskConfig {
  maxResults: number
  showPhotos: boolean
  sortOrder: 'asc' | 'desc'
}

const { payload } = useFeatureFlagPayload<TaskConfig>('task_config')
const maxResults = payload?.maxResults || 20

// ❌ BAD - No type safety
const { payload } = useFeatureFlagPayload('task_config')
const maxResults = payload.maxResults // Could be anything
```

### 4. Clean Up Old Flags

When a feature flag reaches 100% rollout and is stable:

1. **Remove from PostHog dashboard**
2. **Remove flag check from code**
3. **Delete old code paths**
4. **Document in changelog**

```typescript
// Before (with flag)
const { isEnabled } = useFeatureFlag('new_ui')
return isEnabled ? <NewUI /> : <OldUI />

// After (flag removed, new UI is default)
return <NewUI />
```

### 5. Naming Conventions

**Flag Keys**: Use snake_case
```
✅ new_task_ui
✅ payment_v2_enabled
❌ NewTaskUI
❌ payment-v2-enabled
```

**TypeScript Constants**: Use SCREAMING_SNAKE_CASE
```typescript
export const FEATURE_FLAGS = {
  NEW_TASK_UI: 'new_task_ui',
  PAYMENT_V2: 'payment_v2_enabled',
} as const
```

### 6. Document Your Flags

Add flags to `FEATURE_FLAGS` constant for discoverability:

```typescript
// hooks/use-feature-flag.ts
export const FEATURE_FLAGS = {
  // UI Features
  NEW_TASK_UI: 'new_task_ui',
  ENHANCED_SEARCH: 'enhanced_search',

  // Payment Features
  PAYMENT_V2: 'payment_v2',
  STRIPE_INTEGRATION: 'stripe_integration',

  // Experimental
  BETA_FEATURES: 'beta_features',
  DARK_MODE: 'dark_mode',
} as const
```

---

## Common Patterns

### 1. Feature Toggle

**Use Case**: Enable/disable entire features

```typescript
function PaymentScreen() {
  const { isEnabled } = useFeatureFlag(FEATURE_FLAGS.PAYMENT_V2)

  return isEnabled ? <PaymentV2 /> : <PaymentV1 />
}
```

### 2. Gradual Rollout

**Use Case**: Release to subset of users, expand gradually

```typescript
// PostHog Dashboard Settings:
// Week 1: 10% of users
// Week 2: 25% of users
// Week 3: 50% of users
// Week 4: 100% of users

function App() {
  const { isEnabled } = useFeatureFlag('new_navigation')

  return isEnabled ? <NewNavigation /> : <OldNavigation />
}
```

### 3. Configuration Management

**Use Case**: Adjust app behavior without code changes

```typescript
function TaskList() {
  const { payload } = useFeatureFlagPayload<{
    pageSize: number
    enablePrefetch: boolean
    cacheTime: number
  }>('task_list_config')

  const config = {
    pageSize: payload?.pageSize || 20,
    enablePrefetch: payload?.enablePrefetch ?? true,
    cacheTime: payload?.cacheTime || 300000,
  }

  const { data } = useInfiniteQuery({
    queryKey: ['tasks'],
    queryFn: ({ pageParam }) => fetchTasks({
      page: pageParam,
      limit: config.pageSize
    }),
    gcTime: config.cacheTime,
  })

  return <TaskListUI data={data} />
}
```

### 4. A/B Testing

**Use Case**: Test multiple variations, measure impact

```typescript
function TaskCard({ task }: { task: Task }) {
  const { variant } = useFeatureFlagVariant(
    'task_card_style',
    ['minimal', 'standard', 'detailed']
  )

  // Track which variant user sees
  React.useEffect(() => {
    captureEvent('task_card_viewed', {
      variant: variant || 'standard',
      task_id: task.id,
    })
  }, [variant])

  // Track user interactions
  const handleClick = () => {
    captureEvent('task_card_clicked', {
      variant: variant || 'standard',
      task_id: task.id,
    })
  }

  return <TaskCardVariant variant={variant} onClick={handleClick} />
}
```

### 5. Kill Switch

**Use Case**: Instantly disable problematic features

```typescript
function ExpensiveFeature() {
  const { isEnabled } = useFeatureFlag('expensive_feature_enabled')

  if (!isEnabled) {
    return <FeatureDisabledMessage />
  }

  return <ExpensiveFeatureComponent />
}

// In PostHog: Set to 0% rollout to instantly disable for all users
```

### 6. Beta Features

**Use Case**: Show features only to beta testers

```typescript
function SettingsScreen() {
  const { isEnabled: isBetaUser } = useFeatureFlag('beta_access')

  return (
    <ScrollView>
      <SettingsList />

      {isBetaUser && (
        <BetaFeaturesSection />
      )}
    </ScrollView>
  )
}

// In PostHog: Target users with property beta_tester = true
```

---

## Troubleshooting

### Flags Not Loading

**Symptoms**: `isLoading` stays true indefinitely

**Solutions**:
1. Check PostHog is initialized:
   ```typescript
   import { getPostHog } from '@/lib/posthog'
   console.log('PostHog initialized:', getPostHog() !== null)
   ```

2. Verify API key is set:
   ```typescript
   import { getPostHogApiKey } from '@/lib/env'
   console.log('API key:', getPostHogApiKey())
   ```

3. Check network connectivity
4. Verify flag exists in PostHog dashboard
5. Check PostHog project matches environment

### Flags Return Wrong Values

**Symptoms**: Flag always returns false or unexpected value

**Solutions**:
1. **Check User Targeting**: Verify your user matches flag conditions
2. **Check Rollout Percentage**: 10% rollout means 90% get false
3. **Clear Cache**:
   ```typescript
   await resetPostHog() // Clears local cache
   ```
4. **Check Flag Key**: Ensure key matches exactly (case-sensitive)

### PostHog Not Initializing

**Symptoms**: Console shows "PostHog Disabled" or "No API key"

**Solutions**:
1. **Check Environment Variables**:
   ```bash
   # Verify .env.local exists
   cat .env.local

   # Check variable is set
   echo $EXPO_PUBLIC_POSTHOG_API_KEY
   ```

2. **Restart Metro Bundler**:
   ```bash
   # Kill metro
   killall node

   # Restart
   pnpm dev
   ```

3. **Check `isPostHogEnabled()`**:
   ```typescript
   import { isPostHogEnabled } from '@/lib/env'
   console.log('PostHog enabled:', isPostHogEnabled())
   ```

### Performance Issues

**Symptoms**: App feels slow, delayed rendering

**Solutions**:
1. **Use Loading States**: Don't block UI on flag checks
   ```typescript
   const { isEnabled, isLoading } = useFeatureFlag('flag')
   if (isLoading) return <QuickFallback /> // Show something fast
   ```

2. **Preload Flags**: Flags are preloaded on init by default
3. **Cache Flags Locally**: PostHog caches in AsyncStorage automatically
4. **Avoid Flag Checks in Loops**: Extract flags outside render loops

---

## Advanced Usage

### Custom Event Tracking

Track feature flag interactions:

```typescript
import { captureEvent } from '@/lib/posthog'

function FeatureButton() {
  const { isEnabled } = useFeatureFlag('new_button')

  const handleClick = () => {
    captureEvent('feature_button_clicked', {
      feature_enabled: isEnabled,
      timestamp: Date.now(),
    })
  }

  return <Button onPress={handleClick}>Click Me</Button>
}
```

### Screen Tracking

Automatic screen tracking is enabled. To add custom properties:

```typescript
import { trackScreen } from '@/lib/posthog'

function TaskDetailsScreen({ taskId }: { taskId: string }) {
  React.useEffect(() => {
    trackScreen('Task Details', {
      task_id: taskId,
      source: 'task_list',
    })
  }, [taskId])

  return <TaskDetails id={taskId} />
}
```

### User Properties

Update user properties for better targeting:

```typescript
import { identifyUser } from '@/lib/posthog'

function onUserProfileUpdate(user: User) {
  identifyUser(user.id, {
    role: user.role,
    plan: user.plan,
    tasks_completed: user.taskCount,
    is_beta_tester: user.isBetaTester,
  })
}
```

---

## Resources

- **PostHog Docs**: [posthog.com/docs/libraries/react-native](https://posthog.com/docs/libraries/react-native)
- **Implementation Plan**: `.claude/enhancements/20251031-posthog-observability-implementation.md`
- **Architecture Patterns**: `docs/architecture/patterns/`
- **Code Examples**: `apps/mobile/hooks/use-feature-flag.ts`

---

## Quick Reference

### Hooks

```typescript
// Boolean flag
const { isEnabled, isLoading } = useFeatureFlag('flag_key')

// Payload flag
const { payload, isEnabled, isLoading } = useFeatureFlagPayload<T>('flag_key')

// Variant flag
const { variant, isLoading } = useFeatureFlagVariant('flag_key', ['a', 'b', 'c'])
```

### Utilities

```typescript
import {
  initializePostHog,  // Initialize PostHog
  getPostHog,         // Get instance
  identifyUser,       // Set user properties
  resetPostHog,       // Clear user data (logout)
  captureEvent,       // Track custom events
  trackScreen,        // Track screen views
} from '@/lib/posthog'
```

### Environment Variables

```env
EXPO_PUBLIC_POSTHOG_API_KEY=phc_...
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
EXPO_PUBLIC_POSTHOG_ENABLED=true
```

---

**Last Updated**: 2025-11-07
**Version**: 1.0
**Maintainer**: NV Internal Team
