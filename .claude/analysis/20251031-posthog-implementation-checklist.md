# PostHog Implementation Checklist

**Date**: 2025-10-31
**Estimated Time**: 5-8 days
**Complexity**: LOW

## Pre-Implementation

- [ ] Create PostHog account at [posthog.com](https://posthog.com)
- [ ] Get API key from project settings
- [ ] Decide on self-hosted vs. cloud (recommend cloud for simplicity)
- [ ] Review [compatibility analysis](.claude/analysis/20251031-posthog-expo-go-compatibility.md)

## Phase 1: Setup (1 day)

### Environment Configuration
- [ ] Add PostHog API key to `.env` files:
  ```bash
  # apps/mobile/.env
  EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_api_key_here
  EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
  ```
- [ ] Update `.env.example` with new variables
- [ ] Add to `.gitignore` if not already there

### Installation
- [ ] Install dependencies:
  ```bash
  cd apps/mobile
  npx expo install posthog-react-native expo-file-system expo-application expo-device expo-localization
  ```
- [ ] Verify installation in `package.json`
- [ ] Test app still builds and runs

### Provider Setup
- [ ] Create PostHog client file: `apps/mobile/lib/posthog.ts`
- [ ] Add `PostHogProvider` to `apps/mobile/app/_layout.tsx`
- [ ] Configure autocapture options
- [ ] Enable debug mode for development
- [ ] Test provider renders without errors

### Verification
- [ ] Run app on iOS simulator
- [ ] Run app on Android emulator
- [ ] Check PostHog dashboard for connection
- [ ] Verify initial app lifecycle events appear

## Phase 2: Core Events (2-3 days)

### Task Events
- [ ] Add `task_created` event with properties:
  - `task_id`, `task_status`, `assignee_count`, `has_photos`
- [ ] Add `task_updated` event with properties:
  - `task_id`, `old_status`, `new_status`, `updated_fields`
- [ ] Add `task_completed` event with properties:
  - `task_id`, `duration_hours`, `photo_count`, `assignee_count`
- [ ] Add `task_deleted` event with properties:
  - `task_id`, `task_status`, `reason`

### Check-In/Check-Out Events
- [ ] Add `task_checked_in` event with properties:
  - `task_id`, `location_accuracy`, `distance_from_customer`
- [ ] Add `task_checked_out` event with properties:
  - `task_id`, `duration_minutes`, `location_accuracy`
- [ ] Add `gps_verification_failed` event with properties:
  - `task_id`, `reason`, `distance_meters`, `required_distance`

### Photo Events
- [ ] Add `photo_uploaded` event with properties:
  - `task_id`, `photo_count`, `upload_source` (camera/gallery)
- [ ] Add `photo_deleted` event with properties:
  - `task_id`, `photo_id`

### Payment Events
- [ ] Add `payment_created` event with properties:
  - `payment_id`, `amount`, `method`, `task_id`
- [ ] Add `payment_updated` event with properties:
  - `payment_id`, `old_amount`, `new_amount`, `reason`

### Navigation Events
- [ ] Verify automatic screen tracking works
- [ ] Add manual screen tracking for modal screens
- [ ] Test screen events appear in dashboard

### Testing
- [ ] Test each event fires correctly
- [ ] Verify event properties are captured
- [ ] Check events appear in PostHog dashboard
- [ ] Test events on both iOS and Android

## Phase 3: User Identification (1 day)

### Clerk Integration
- [ ] Create `useUserTracking` hook
- [ ] Identify user on login with properties:
  - `email`, `name`, `role`, `created_at`, `phone`
- [ ] Set super properties for user role
- [ ] Call `reset()` on logout
- [ ] Test anonymous → identified flow

### User Properties
- [ ] Add user properties on profile update
- [ ] Track user role changes
- [ ] Add organization/company properties
- [ ] Test user properties appear in PostHog

### Testing
- [ ] Test login flow (anonymous → identified)
- [ ] Test logout flow (reset)
- [ ] Test profile updates
- [ ] Verify user properties in dashboard

## Phase 4: Feature Flags (1-2 days)

### Setup First Flag
- [ ] Create test flag in PostHog dashboard
- [ ] Name: `new-task-ui` (example)
- [ ] Set rollout to 0% initially
- [ ] Add flag description and documentation

### Implementation
- [ ] Create `useFeatureFlag` examples
- [ ] Add flag check to UI component
- [ ] Test flag on/off states
- [ ] Implement loading state handling

### Flag Examples
- [ ] Simple boolean flag (show/hide feature)
- [ ] Multivariate flag (A/B/C test)
- [ ] Flag with payload (configuration)
- [ ] User-targeted flag (specific users)

### Documentation
- [ ] Document flag naming conventions
- [ ] Document flag usage patterns
- [ ] Create flag registry/list
- [ ] Add to `.claude/enhancements/`

### Testing
- [ ] Test flag evaluation works
- [ ] Test flag changes reflect in app
- [ ] Test loading states
- [ ] Test offline flag caching

## Phase 5: Error Tracking (1 day)

### Error Boundaries
- [ ] Create error boundary component
- [ ] Add to root layout
- [ ] Capture errors with PostHog
- [ ] Show user-friendly error UI

### Error Capture
- [ ] Create `useErrorTracking` hook
- [ ] Add to API error handling
- [ ] Add to async operation handlers
- [ ] Add to critical user flows

### Error Context
- [ ] Include task/user context in errors
- [ ] Add screen/route information
- [ ] Add app version information
- [ ] Add device/platform information

### Testing
- [ ] Test error capture fires
- [ ] Test error context included
- [ ] Verify errors in dashboard
- [ ] Test error boundary UI

## Phase 6: Advanced Features (Optional)

### Cohorts
- [ ] Create user cohorts in dashboard
- [ ] Example: "Active Workers" (check-ins in last 7 days)
- [ ] Example: "High Performers" (>10 tasks/month)
- [ ] Test cohort-targeted flags

### Insights
- [ ] Create key insights in dashboard:
  - Daily active users
  - Task completion rate
  - Average task duration
  - Check-in success rate
- [ ] Set up dashboard for team
- [ ] Share dashboard link

### Alerts
- [ ] Set up alerts for:
  - Error rate spike
  - GPS verification failures
  - Low task completion rate
- [ ] Configure alert channels (email/Slack)

## Testing & Quality Assurance

### Manual Testing
- [ ] Test on iOS (simulator + real device)
- [ ] Test on Android (emulator + real device)
- [ ] Test offline event queuing
- [ ] Test app restart with queued events
- [ ] Test background/foreground transitions

### Integration Testing
- [ ] Verify events appear in dashboard (< 1 minute delay)
- [ ] Verify user properties update
- [ ] Verify feature flags evaluate correctly
- [ ] Verify errors capture with context

### Performance Testing
- [ ] Check app startup time (no regression)
- [ ] Check event capture latency
- [ ] Check memory usage (no leaks)
- [ ] Check network usage (batching works)

## Documentation

### Code Documentation
- [ ] Document PostHog setup in `apps/mobile/README.md`
- [ ] Document event naming conventions
- [ ] Document feature flag patterns
- [ ] Document error tracking patterns

### Team Documentation
- [ ] Create PostHog dashboard guide
- [ ] Document how to create feature flags
- [ ] Document how to view analytics
- [ ] Document how to debug events

### Architecture Documentation
- [ ] Add PostHog pattern to `.claude/architecture/patterns/`
- [ ] Document event taxonomy
- [ ] Document user identification flow
- [ ] Document offline support strategy

## Deployment

### Staging
- [ ] Deploy to staging environment
- [ ] Verify events appear in PostHog
- [ ] Test feature flags in staging
- [ ] Run full QA test suite

### Production
- [ ] Update production environment variables
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Monitor event volume
- [ ] Verify billing stays in free tier

### Monitoring
- [ ] Set up alerts for error spikes
- [ ] Monitor event volume daily (first week)
- [ ] Check dashboard for insights
- [ ] Gather team feedback

## Post-Implementation

### Week 1
- [ ] Monitor event volume and costs
- [ ] Check for any errors or issues
- [ ] Gather initial insights
- [ ] Adjust event properties if needed

### Week 2-4
- [ ] Create first feature flag experiment
- [ ] Analyze user behavior patterns
- [ ] Create custom insights/dashboards
- [ ] Train team on PostHog usage

### Month 2+
- [ ] Review analytics regularly
- [ ] Iterate on event taxonomy
- [ ] Add more feature flags
- [ ] Consider advanced features (cohorts, etc.)

## Rollback Plan

### If Issues Occur
- [ ] PostHog provider can be disabled by removing from `_layout.tsx`
- [ ] All PostHog calls are non-blocking (errors won't crash app)
- [ ] Can disable specific features (autocapture, etc.)
- [ ] Can revert entire change via git

### Monitoring for Issues
- Watch for:
  - App crashes after integration
  - Increased network usage
  - Slower app startup
  - Battery drain complaints
  - Data usage complaints

### Rollback Steps
1. Remove `PostHogProvider` from `_layout.tsx`
2. Comment out event capture calls
3. Keep dependencies installed (easy re-enable)
4. Deploy hotfix if necessary

## Success Criteria

### Technical Success
- ✅ All core events captured correctly
- ✅ User identification works end-to-end
- ✅ Feature flags evaluate correctly
- ✅ Error tracking captures errors with context
- ✅ No performance regression
- ✅ No increase in crashes

### Business Success
- ✅ Team can view analytics dashboard
- ✅ Team can create/manage feature flags
- ✅ Team can analyze user behavior
- ✅ Cost stays within free tier (<$0/month)
- ✅ Insights help improve product decisions

## Resources

### Documentation
- PostHog React Native Docs: https://posthog.com/docs/libraries/react-native
- Expo + PostHog Tutorial: https://posthog.com/tutorials/react-native-analytics
- Official Example Repo: https://github.com/PostHog/support-rn-expo

### Support
- PostHog Community Slack: https://posthog.com/slack
- PostHog GitHub Issues: https://github.com/PostHog/posthog-js/issues
- PostHog Support: support@posthog.com

### Internal Docs
- Compatibility Analysis: `.claude/analysis/20251031-posthog-expo-go-compatibility.md`
- Implementation Guide: This file
- Architecture Patterns: `.claude/architecture/patterns/` (add PostHog pattern)
