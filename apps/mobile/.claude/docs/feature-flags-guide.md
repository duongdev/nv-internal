# Feature Flags Guide

## Overview

This guide documents the feature flag system implementation in the NV Internal mobile app using PostHog. Feature flags allow controlled rollout of new features, A/B testing, and instant rollback capabilities without requiring app updates.

## Quick Start

### Using a Feature Flag

```typescript
import { useFeatureFlag, FEATURE_FLAGS } from '@/hooks/use-feature-flag';

function MyComponent() {
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAGS.MY_FEATURE);

  if (!isFeatureEnabled) {
    return <DefaultView />;
  }

  return <NewFeatureView />;
}
```

## Naming Convention

### Format

**Pattern**: `feature-name-scope`

- Use **dash-case** (kebab-case) for consistency with PostHog
- Add role-specific postfixes for targeted features
- Keep names descriptive but concise

### Role-Specific Flags

Add postfixes to indicate the target audience:
- `-admin` for admin-only features
- `-worker` for worker-only features
- No postfix for features available to all users

### Examples

```typescript
// ✅ CORRECT - Following convention
'task-list-filter-enabled-admin'    // Admin-only feature
'quick-actions-worker'               // Worker-only feature
'offline-mode'                       // Available to all users
'payment-tracking-admin'             // Admin payment feature
'gps-check-in-worker'               // Worker location feature

// ❌ INCORRECT - Don't use these patterns
'task_list_filter_enabled_admin'    // Wrong: underscores instead of dashes
'taskListFilterEnabledAdmin'        // Wrong: camelCase
'TASK-LIST-FILTER-ENABLED-ADMIN'    // Wrong: uppercase
'task-list-filter-enabled'          // Wrong: missing role scope when needed
```

## Implementation Patterns

### 1. Define the Flag Constant

Add your flag to the `FEATURE_FLAGS` object in `hooks/use-feature-flag.ts`:

```typescript
export const FEATURE_FLAGS = {
  // Existing flags
  TASK_LIST_FILTER_ENABLED_ADMIN: 'task-list-filter-enabled-admin',

  // Your new flag
  MY_NEW_FEATURE_ADMIN: 'my-new-feature-admin',
} as const;
```

### 2. Basic Toggle Pattern

Simple on/off feature toggle:

```typescript
function TaskList() {
  const isFilterEnabled = useFeatureFlag(FEATURE_FLAGS.TASK_LIST_FILTER_ENABLED_ADMIN);

  return (
    <View>
      <TaskListHeader />
      {isFilterEnabled && <FilterButton />}
      <TaskListContent />
      {isFilterEnabled && <FilterBottomSheet />}
    </View>
  );
}
```

### 3. Feature Variant Pattern

For A/B testing with multiple variants:

```typescript
function PaymentScreen() {
  const paymentVariant = useFeatureFlag(FEATURE_FLAGS.PAYMENT_FLOW_VARIANT);

  switch (paymentVariant) {
    case 'simplified':
      return <SimplifiedPaymentFlow />;
    case 'detailed':
      return <DetailedPaymentFlow />;
    default:
      return <StandardPaymentFlow />;
  }
}
```

### 4. Progressive Enhancement Pattern

Add features without breaking existing functionality:

```typescript
function TaskDetails() {
  const hasComments = useFeatureFlag(FEATURE_FLAGS.TASK_COMMENTS_ENABLED);
  const hasPayments = useFeatureFlag(FEATURE_FLAGS.TASK_PAYMENTS_ENABLED);

  return (
    <ScrollView>
      <TaskInfo />          {/* Always shown */}
      <TaskPhotos />        {/* Always shown */}
      {hasComments && <TaskComments />}
      {hasPayments && <TaskPayments />}
    </ScrollView>
  );
}
```

### 5. Guard Pattern

Protect entire screens or flows:

```typescript
function AdminReports() {
  const isReportsEnabled = useFeatureFlag(FEATURE_FLAGS.REPORTS_V2_ADMIN);

  if (!isReportsEnabled) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Reports coming soon!</Text>
      </View>
    );
  }

  return <ReportsV2 />;
}
```

## PostHog Dashboard Configuration

### Creating a Feature Flag

1. **Navigate to Feature Flags** in PostHog dashboard
2. Click **"New feature flag"**
3. Configure the flag:
   - **Key**: Use the exact key from your code (e.g., `task-list-filter-enabled-admin`)
   - **Type**: Boolean for toggles, String for variants
   - **Description**: Explain what the feature does

### Rollout Strategies

#### 1. Percentage Rollout

Gradually increase exposure:
```
0% → 10% → 25% → 50% → 100%
```

#### 2. User Targeting

Target specific users for testing:
- By user ID
- By email
- By custom properties (role, organization, etc.)

#### 3. Property-Based Targeting

Target by user properties:
```json
{
  "role": "admin",
  "organization": "beta-testers"
}
```

#### 4. Time-Based Rollout

Schedule automatic rollout:
- Start date: Enable after specific date
- End date: Disable after testing period

## Production Examples

### 1. Task List Filter (Implemented)

**Flag**: `task-list-filter-enabled-admin`
**Purpose**: Control visibility of task filtering UI for admin users
**Implementation**: See `apps/mobile/app/admin/(tabs)/tasks/index.tsx`

```typescript
const isFilterEnabled = useFeatureFlag(FEATURE_FLAGS.TASK_LIST_FILTER_ENABLED_ADMIN);

// Conditionally render filter UI
{isFilterEnabled && <FilterButton />}
```

### 2. Payment Tracking (Planned)

**Flag**: `payment-tracking-enabled-admin`
**Purpose**: Enable payment features for gradual rollout

```typescript
const isPaymentEnabled = useFeatureFlag(FEATURE_FLAGS.PAYMENT_TRACKING_ADMIN);

// Add payment tab conditionally
<Tabs>
  <Tab name="tasks" />
  <Tab name="reports" />
  {isPaymentEnabled && <Tab name="payments" />}
</Tabs>
```

### 3. Offline Mode (Planned)

**Flag**: `offline-mode-worker`
**Purpose**: Enable offline capabilities for field workers

```typescript
const isOfflineEnabled = useFeatureFlag(FEATURE_FLAGS.OFFLINE_MODE_WORKER);

if (isOfflineEnabled) {
  // Use local storage and sync
  return <OfflineCapableTaskList />;
}
// Standard online-only mode
return <OnlineTaskList />;
```

## Best Practices

### Do's ✅

1. **Keep flags focused**: One flag = one feature
2. **Use descriptive names**: Clear what the flag controls
3. **Document flags**: Add comments explaining the feature
4. **Plan cleanup**: Set timeline for flag removal after full rollout
5. **Test both states**: Always test enabled AND disabled behavior
6. **Default to false**: New features off by default
7. **Monitor metrics**: Track adoption in PostHog

### Don'ts ❌

1. **Don't nest flags**: Avoid flags depending on other flags
2. **Don't overuse**: Not everything needs a flag
3. **Don't keep forever**: Remove flags after stable rollout
4. **Don't break core features**: Never put critical functionality behind flags
5. **Don't mix concerns**: One flag shouldn't control multiple unrelated features

## Testing Feature Flags

### Local Development

1. **Mock flag values** for consistent testing:
```typescript
// In development, you can override flags
if (__DEV__) {
  // Force specific flag values for testing
  mockFeatureFlag('task-list-filter-enabled-admin', true);
}
```

2. **Test both states**:
- Flag enabled: Verify new functionality works
- Flag disabled: Verify fallback behavior
- Toggle during session: Verify dynamic updates

### Manual Testing Checklist

- [ ] Feature works when flag enabled
- [ ] App doesn't break when flag disabled
- [ ] No console errors in either state
- [ ] Performance acceptable in both states
- [ ] UI gracefully handles flag changes
- [ ] Analytics events fire correctly

## Flag Lifecycle

### 1. Planning Phase
- Identify feature for flag control
- Define flag name following convention
- Document rollout strategy

### 2. Implementation Phase
- Add flag to FEATURE_FLAGS constant
- Implement conditional logic
- Test both enabled/disabled states

### 3. Testing Phase
- Enable for internal team
- Monitor for issues
- Collect feedback

### 4. Rollout Phase
- Gradual percentage increase
- Monitor metrics and errors
- Ready for instant rollback

### 5. Stabilization Phase
- 100% rollout
- Monitor for 2-4 weeks
- Confirm stability

### 6. Cleanup Phase
- Remove conditional logic
- Archive flag in PostHog
- Update documentation

## Monitoring and Analytics

### Key Metrics to Track

1. **Adoption Rate**: % of users with flag enabled
2. **Feature Usage**: How often the feature is used
3. **Error Rate**: Errors with flag enabled vs disabled
4. **Performance Impact**: Load times, memory usage
5. **User Feedback**: Satisfaction scores, bug reports

### PostHog Events

Track feature usage with custom events:

```typescript
import { usePostHog } from 'posthog-react-native';

function FilterButton() {
  const posthog = usePostHog();

  const handlePress = () => {
    posthog.capture('filter_button_clicked', {
      screen: 'admin_tasks',
      feature_flag: 'task-list-filter-enabled-admin'
    });
    // ... rest of handler
  };
}
```

## Troubleshooting

### Common Issues

#### Flag not updating
- **Cause**: Cached value
- **Solution**: Force refresh with pull-to-refresh or restart app

#### Flag always returns false
- **Cause**: PostHog not initialized or network issue
- **Solution**: Check PostHog initialization, verify API key

#### Inconsistent behavior
- **Cause**: Race condition or async loading
- **Solution**: Use loading state from hook

### Debug Mode

Enable debug logging:

```typescript
// In use-feature-flag.ts
const DEBUG_FLAGS = __DEV__;

if (DEBUG_FLAGS) {
  console.log('[FeatureFlag]', flagKey, 'is', isEnabled);
}
```

## Migration Guide

### Adding Your First Flag

1. **Choose a non-critical feature** for first flag
2. **Follow naming convention**: `feature-name-role`
3. **Implement basic toggle** pattern
4. **Test thoroughly** in development
5. **Document** in this guide
6. **Roll out gradually** in production

### Converting Existing Feature

```typescript
// Before: Hard-coded feature
function TaskList() {
  return (
    <View>
      <FilterButton />  {/* Always shown */}
      <TaskItems />
    </View>
  );
}

// After: Flag-controlled
function TaskList() {
  const isFilterEnabled = useFeatureFlag(FEATURE_FLAGS.TASK_LIST_FILTER_ENABLED_ADMIN);

  return (
    <View>
      {isFilterEnabled && <FilterButton />}
      <TaskItems />
    </View>
  );
}
```

## Related Documentation

- **Task Documentation**: `.claude/tasks/20251107-043354-first-feature-flag-task-list-filter-admin.md`
- **PostHog Implementation**: `.claude/enhancements/20251031-posthog-observability-implementation.md`
- **Hook Source**: `apps/mobile/hooks/use-feature-flag.ts`
- **Production Example**: `apps/mobile/app/admin/(tabs)/tasks/index.tsx`

## Future Enhancements

1. **Flag Templates**: Predefined flag patterns for common use cases
2. **Flag Dependencies**: Handle flags that depend on other flags
3. **Environment Overrides**: Different defaults for dev/staging/prod
4. **Flag Expiration**: Automatic warnings for old flags
5. **A/B Test Framework**: Built-in experiment tracking
6. **Feature Flag UI**: Admin panel to control flags in-app

## Appendix: Flag Registry

### Active Flags

| Flag Key | Purpose | Target | Status | Added |
|----------|---------|--------|--------|-------|
| `task-list-filter-enabled-admin` | Task filtering UI | Admin | Testing | 2025-11-07 |

### Planned Flags

| Flag Key | Purpose | Target | Priority |
|----------|---------|--------|----------|
| `payment-tracking-admin` | Payment features | Admin | High |
| `offline-mode-worker` | Offline capability | Worker | Medium |
| `quick-actions-worker` | Quick task actions | Worker | Low |
| `reports-v2-admin` | New reports UI | Admin | Medium |
| `voice-notes-worker` | Voice recordings | Worker | Low |

### Retired Flags

| Flag Key | Purpose | Retired | Reason |
|----------|---------|---------|--------|
| (None yet) | - | - | - |