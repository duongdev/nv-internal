# PostHog Security Implementation Checklist

**Quick reference for implementing security improvements**

---

## ⚡ Quick Start

**Before you begin**:
1. Read: `POSTHOG-SECURITY-SUMMARY.md`
2. Review: `20251107-posthog-security-audit.md` (full details)
3. Follow this checklist step-by-step

**Estimated Time**: 8 hours for Phase 1

---

## Phase 1: Mandatory Before Merge (8 hours)

### 1. Privacy Consent Implementation (4 hours)

#### Step 1.1: Create Consent Banner Component
- [ ] Create `components/privacy-consent-banner.tsx`
- [ ] Add consent check using AsyncStorage
- [ ] Show banner on first app launch
- [ ] Add "Accept" and "Reject" buttons
- [ ] Link to privacy policy (create placeholder)
- [ ] Style banner with NativeWind

**Files to create**:
- `components/privacy-consent-banner.tsx`

**Code snippet**:
```typescript
const CONSENT_KEY = 'analytics_consent'

async function checkConsent() {
  const consent = await AsyncStorage.getItem(CONSENT_KEY)
  if (!consent) {
    setShowBanner(true)
  }
}
```

#### Step 1.2: Integrate Consent Banner
- [ ] Import banner in `app/_layout.tsx`
- [ ] Render banner above all other components
- [ ] Test banner appearance on fresh install
- [ ] Test consent acceptance flow
- [ ] Test consent rejection flow

**Files to modify**:
- `app/_layout.tsx`

#### Step 1.3: Respect Consent in PostHog Initialization
- [ ] Modify `lib/posthog.ts` - check consent before identify
- [ ] Modify `lib/posthog.ts` - check consent before capture
- [ ] Modify `lib/posthog.ts` - check consent before screen track
- [ ] Add consent getter utility function

**Files to modify**:
- `lib/posthog.ts`

**Code snippet**:
```typescript
async function hasAnalyticsConsent(): Promise<boolean> {
  const consent = await AsyncStorage.getItem('analytics_consent')
  return consent === 'true'
}

export async function identifyUser(...) {
  if (!await hasAnalyticsConsent()) return
  // ... rest of code
}
```

#### Step 1.4: Test Consent Flow
- [ ] Clear app data and restart
- [ ] Verify banner appears
- [ ] Accept consent - verify events are sent
- [ ] Clear app data and restart
- [ ] Reject consent - verify NO events are sent
- [ ] Verify app works normally without analytics

---

### 2. Minimize PII Collection (2 hours)

#### Step 2.1: Remove Email and Name from User Identification
- [ ] Modify `app/_layout.tsx` - remove email property
- [ ] Modify `app/_layout.tsx` - remove name property
- [ ] Test user identification without PII

**Files to modify**:
- `app/_layout.tsx` (lines 112-117)

**Before**:
```typescript
identifyUser(posthog, user.id, {
  email: user.primaryEmailAddress?.emailAddress,  // ❌ Remove
  name: user.fullName,                            // ❌ Remove
  role: user.publicMetadata?.role as string,
  created_at: user.createdAt,
})
```

**After**:
```typescript
identifyUser(posthog, user.id, {
  role_category: anonymizeRole(user.publicMetadata?.role),
  account_age_days: daysSince(user.createdAt),
})
```

#### Step 2.2: Add User ID Hashing (Optional but Recommended)
- [ ] Create `hashUserId()` function in `lib/posthog.ts`
- [ ] Use hashed ID instead of raw Clerk user ID
- [ ] Test that feature flags still work with hashed IDs

**Files to modify**:
- `lib/posthog.ts`
- `app/_layout.tsx`

**Code snippet**:
```typescript
// lib/posthog.ts
import { createHash } from 'crypto'

function hashUserId(userId: string): string {
  return createHash('sha256').update(userId).digest('hex').substring(0, 16)
}
```

#### Step 2.3: Add Role Anonymization
- [ ] Create `anonymizeRole()` function
- [ ] Map admin/super_admin to "privileged"
- [ ] Map other roles to "standard"
- [ ] Test role categorization

**Files to modify**:
- `lib/posthog.ts`

**Code snippet**:
```typescript
function anonymizeRole(role: string | undefined): string {
  if (!role) return 'user'
  if (role === 'admin' || role === 'super_admin') return 'privileged'
  return 'standard'
}
```

#### Step 2.4: Add Account Age Helper
- [ ] Create `daysSince()` function
- [ ] Use instead of raw created_at timestamp
- [ ] Test calculation

**Files to modify**:
- `lib/posthog.ts`

**Code snippet**:
```typescript
function daysSince(date: Date | string): number {
  const then = new Date(date).getTime()
  const now = Date.now()
  return Math.floor((now - then) / (1000 * 60 * 60 * 24))
}
```

---

### 3. Sanitize Screen Tracking (1 hour)

#### Step 3.1: Create Path Sanitization Function
- [ ] Create `sanitizePath()` function in `lib/posthog.ts`
- [ ] Add regex patterns for task IDs
- [ ] Add regex patterns for customer IDs
- [ ] Add regex patterns for emails
- [ ] Add regex patterns for phone numbers
- [ ] Test with sample paths

**Files to modify**:
- `lib/posthog.ts`

**Code snippet**:
```typescript
function sanitizePath(path: string): string {
  return path
    .replace(/\/task_[a-z0-9_]+/gi, '/task_[ID]')
    .replace(/\/cust_[a-z0-9_]+/gi, '/cust_[ID]')
    .replace(/\/user_[a-z0-9_]+/gi, '/user_[ID]')
    .replace(/\/pay_[a-z0-9_]+/gi, '/pay_[ID]')
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '[EMAIL]')
    .replace(/\+?\d{10,13}/g, '[PHONE]')
}
```

#### Step 3.2: Apply Sanitization to trackScreen
- [ ] Modify `trackScreen()` to sanitize path property
- [ ] Test screen tracking with sensitive paths
- [ ] Verify paths are masked correctly

**Files to modify**:
- `lib/posthog.ts`
- `app/_layout.tsx` (screen tracking useEffect)

**Before**:
```typescript
trackScreen(posthog, screenName, {
  path: pathname,  // ❌ May contain sensitive data
})
```

**After**:
```typescript
trackScreen(posthog, screenName, {
  path: sanitizePath(pathname),  // ✅ Sanitized
})
```

---

### 4. Remove Production Console Logs (30 min)

#### Step 4.1: Wrap Console Logs with __DEV__ Check
- [ ] Modify `lib/posthog.ts` line 38-39 (disabled message)
- [ ] Modify `lib/posthog.ts` line 45-46 (no API key warning)
- [ ] Modify `lib/posthog.ts` line 108-109 (reset message)
- [ ] Modify `lib/posthog.ts` line 142-143 (user identified message)

**Files to modify**:
- `lib/posthog.ts`

**Before**:
```typescript
console.log('[PostHog] User identified:', userId)
```

**After**:
```typescript
if (__DEV__) {
  console.log('[PostHog] User identified:', userId)
}
```

#### Step 4.2: Remove Biome Ignore Comments
- [ ] Remove biome-ignore comment line 38
- [ ] Remove biome-ignore comment line 108
- [ ] Remove biome-ignore comment line 142

#### Step 4.3: Test Logging
- [ ] Run in development - verify logs appear
- [ ] Build production bundle - verify no logs appear
- [ ] Check bundle for console.log statements

---

### 5. Remove Sentry Dependency (15 min)

#### Step 5.1: Remove Package
- [ ] Run `pnpm remove @sentry/react-native`
- [ ] Verify package removed from `package.json`

**Command**:
```bash
cd apps/mobile
pnpm remove @sentry/react-native
```

#### Step 5.2: Check for Sentry References
- [ ] Search codebase for "sentry" imports
- [ ] Search codebase for "Sentry" usage
- [ ] Remove any remaining Sentry code

**Command**:
```bash
grep -r "sentry\|Sentry" . --include="*.ts" --include="*.tsx"
```

#### Step 5.3: Rebuild and Test
- [ ] Run `pnpm install`
- [ ] Clear Metro cache: `pnpm dev`
- [ ] Test app launches successfully
- [ ] Verify bundle size decreased

---

## Phase 1 Testing Checklist

### Functional Testing
- [ ] App launches without errors
- [ ] Consent banner appears on first launch
- [ ] Accepting consent enables analytics
- [ ] Rejecting consent disables analytics
- [ ] User identification works without PII
- [ ] Screen tracking works with sanitized paths
- [ ] Feature flags still work correctly
- [ ] App works without PostHog if disabled

### Privacy Testing
- [ ] No email sent to PostHog (check PostHog dashboard)
- [ ] No full name sent to PostHog
- [ ] User IDs are hashed (or check they're Clerk IDs only)
- [ ] Roles are categorized (not exact roles)
- [ ] Screen paths don't contain IDs/emails
- [ ] Console logs only in development builds

### Regression Testing
- [ ] Login/logout works
- [ ] Feature flags toggle correctly
- [ ] Screen navigation tracked
- [ ] Custom events captured
- [ ] App works in Expo Go
- [ ] App works in production build

---

## Phase 2: PostHog Configuration (1 hour)

**Timeline**: Within 1 week after merge

### Step 1: Configure PostHog Dashboard Settings
- [ ] Log in to PostHog dashboard
- [ ] Navigate to Project Settings
- [ ] Enable rate limiting (recommended: 100 events/minute/user)
- [ ] Set data retention period (90 days recommended)
- [ ] Configure data validation rules
- [ ] Add allowed domains/apps (if applicable)
- [ ] Review privacy settings

### Step 2: Add Feature Flag Documentation
- [ ] Add security warning to `hooks/use-feature-flag.ts`
- [ ] Document safe vs unsafe use cases
- [ ] Add examples of proper backend validation

**Files to modify**:
- `hooks/use-feature-flag.ts`

**Code snippet**:
```typescript
/**
 * ⚠️ SECURITY WARNING: Never use feature flags for authorization!
 *
 * Feature flags are client-side and can be manipulated on rooted devices.
 * Always validate permissions on the backend.
 *
 * ✅ SAFE: UI variations, non-critical features
 * ❌ UNSAFE: Admin access, payments, security decisions
 */
```

### Step 3: Monitor and Test
- [ ] Check PostHog dashboard for events
- [ ] Verify rate limiting is working
- [ ] Test data retention (wait 90+ days or change setting)
- [ ] Review event properties for any PII leaks

---

## Phase 3: Privacy Settings Screen (4 hours)

**Timeline**: Within 1 month

### Step 1: Create Privacy Settings Screen
- [ ] Create `app/(user-settings)/privacy.tsx`
- [ ] Add navigation link from user settings
- [ ] Design UI with toggle switches and buttons

**Features to implement**:
- [ ] "Share usage data" toggle
- [ ] "Delete my analytics data" button
- [ ] Link to privacy policy
- [ ] Consent status display

### Step 2: Implement Analytics Opt-Out
- [ ] Create toggle that modifies AsyncStorage consent
- [ ] Call `resetPostHog()` when toggled off
- [ ] Show confirmation dialog
- [ ] Test toggle on/off functionality

### Step 3: Implement Data Deletion
- [ ] Add "Delete My Data" button
- [ ] Show confirmation dialog with warning
- [ ] Call PostHog API to delete user data
- [ ] Clear local AsyncStorage
- [ ] Show success message

**PostHog API endpoint**:
```typescript
// Delete user data via PostHog API
// See: https://posthog.com/docs/api/user-data-deletion
```

### Step 4: Create Privacy Policy
- [ ] Write privacy policy document (markdown)
- [ ] Host on website or in-app screen
- [ ] Link from consent banner
- [ ] Link from privacy settings
- [ ] Include required GDPR/CCPA disclosures

**Privacy policy must include**:
- What data is collected
- Why it's collected
- Who has access (PostHog)
- How long it's retained (90 days)
- User rights (access, delete, export)
- Contact for privacy requests

---

## Quick Reference: Files Modified

### Phase 1 Files
```
📁 apps/mobile/
├── 📝 app/_layout.tsx               (modify: user identification, screen tracking)
├── 📝 lib/posthog.ts                (modify: sanitization, helpers, consent check)
├── 📄 components/privacy-consent-banner.tsx  (create: new component)
└── 📝 package.json                  (modify: remove Sentry)
```

### Phase 2 Files
```
📁 apps/mobile/
└── 📝 hooks/use-feature-flag.ts     (modify: add security warning)
```

### Phase 3 Files
```
📁 apps/mobile/
├── 📄 app/(user-settings)/privacy.tsx       (create: privacy settings screen)
└── 📄 docs/privacy-policy.md                (create: privacy policy)
```

---

## Testing Commands

### Development Testing
```bash
# Start dev server
cd apps/mobile
pnpm dev

# Clear app data (test first launch)
# iOS Simulator: Device > Erase All Content and Settings
# Android Emulator: Settings > Apps > NV Internal > Clear Data
```

### Production Build Testing
```bash
# Build production bundle
npx expo export --platform ios --dev false
npx expo export --platform android --dev false

# Check bundle for console.log
grep -r "console\.log" dist/
```

### PostHog Dashboard
```
1. Go to app.posthog.com
2. Navigate to Events > Live Events
3. Verify events appear (or don't if consent rejected)
4. Check event properties for PII
```

---

## Common Issues & Solutions

### Issue: Consent banner not appearing
**Solution**: Clear app data and reinstall

### Issue: Events still sent after rejecting consent
**Solution**: Verify `hasAnalyticsConsent()` is called in all capture functions

### Issue: Feature flags not working with hashed IDs
**Solution**: PostHog requires consistent IDs - use the same hash function everywhere

### Issue: Production logs still appearing
**Solution**: Check bundle with `grep -r "console\.log" dist/`

### Issue: Sentry errors after removal
**Solution**: Clear Metro cache: `pnpm dev --clear`

---

## Sign-Off Checklist

Before merging to develop:

- [ ] All Phase 1 tasks completed
- [ ] All Phase 1 tests passed
- [ ] Code reviewed by security auditor
- [ ] Privacy policy drafted (can be placeholder)
- [ ] PostHog dashboard configured
- [ ] Documentation updated
- [ ] Team briefed on privacy changes

**Sign-off**: ___________________  Date: __________

---

## Additional Resources

- **Full Audit**: `.claude/security/20251107-posthog-security-audit.md`
- **Summary**: `.claude/security/POSTHOG-SECURITY-SUMMARY.md`
- **PostHog Docs**: https://posthog.com/docs
- **GDPR Guide**: https://gdpr.eu/checklist/
- **React Native Security**: https://reactnative.dev/docs/security

---

**Questions?** Refer to the full audit report or summary document.

**Ready to implement?** Start with Phase 1, Step 1: Privacy Consent Implementation.
