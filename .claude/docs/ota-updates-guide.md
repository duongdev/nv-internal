# OTA Updates Guide

Complete guide for building and publishing Over-The-Air (OTA) updates via GitHub Actions in the NV Internal mobile app.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [GitHub Actions Setup](#github-actions-setup)
- [Triggering OTA Updates](#triggering-ota-updates)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Rollback & Disaster Recovery](#rollback--disaster-recovery)

---

## Overview

OTA (Over-The-Air) updates allow you to push JavaScript/TypeScript changes and assets to users without rebuilding the entire native app. This is perfect for:

- **Bug fixes** - Deploy critical fixes instantly
- **Feature updates** - Add new features without app store review
- **Config changes** - Update API endpoints, feature flags
- **Asset updates** - Images, fonts, localization files

### What OTA Updates CANNOT Do

OTA updates cannot:
- Change native code (Java/Objective-C/Swift)
- Update app permissions
- Modify native modules or Expo plugins
- Change app icons or splash screens
- Require app store submission for approval

If you need these changes, you must build a new binary and submit to app stores.

### Your Setup

Your app uses Expo Updates with:
- **Runtime Version Policy**: `appVersion` (OTA updates only work for same app version)
- **EAS Project ID**: `efc85258-12ce-4f6a-826a-ab5765d18ebc`
- **Update URL**: `https://u.expo.dev/efc85258-12ce-4f6a-826a-ab5765d18ebc`
- **Channels**: `staging`, `preview`, `production`

---

## Architecture

### Channel Strategy

OTA updates are organized by channels, matching your EAS build profiles:

| Channel | Use Case | Users | Auto-Update |
|---------|----------|-------|------------|
| `staging` | Internal testing | QA team, beta testers | Yes (always) |
| `preview` | Pre-production testing | Subset of users | Yes (always) |
| `production` | Released app | All users | Yes (24h check) |

### Version Constraints

Your app is configured with `runtimeVersion: { policy: 'appVersion' }`, which means:

```
App Version 1.0.0 → Can only receive OTA updates built for v1.0.0
App Version 1.0.1 → Can only receive OTA updates built for v1.0.1
```

**Important**: OTA updates are **channel-specific** but **version-bound**. Always ensure:
1. OTA update runtime version matches app version
2. Channel name matches deployment target
3. Update is published to correct channel

### Workflow Architecture

```
GitHub Push/Dispatch
    ↓
CI/Quality Checks Pass
    ↓
Build OTA Bundle (eas update)
    ↓
Publish to Channel
    ↓
Users Auto-Download on Next App Launch
```

---

## GitHub Actions Setup

### Prerequisites

1. **Expo Account**: Create at [expo.dev](https://expo.dev) if needed
2. **EAS CLI Configured**: Already in your project ✅
3. **GitHub Secrets**: Required secrets configured in repo

### Required GitHub Secrets

Configure these in Settings → Secrets and variables → Actions:

```
EXPO_TOKEN              # Your Expo API token (from expo.dev account)
                        # Get at: https://expo.dev/settings/access-tokens
```

**To Get Your EXPO_TOKEN**:

1. Go to https://expo.dev/settings/access-tokens
2. Click "Create token"
3. Choose "Full access" scope
4. Copy the token
5. Add to GitHub: Settings → Secrets and variables → Actions → New repository secret
6. Name: `EXPO_TOKEN`

### Optional GitHub Secrets

```
SLACK_WEBHOOK           # For deployment notifications
DISCORD_WEBHOOK         # For deployment notifications
```

---

## Triggering OTA Updates

### 1. Automatic OTA Updates (Main Branch)

Automatically publish OTA updates when code is pushed to `main`:

```bash
# This happens automatically on push to main
git push origin main

# Example:
# - Code pushed to main
# - CI tests pass
# - OTA bundle created
# - Published to production channel
# - Users see update on next app launch
```

### 2. Manual OTA Updates (Workflow Dispatch)

Manually trigger OTA updates through GitHub UI:

**Steps**:
1. Go to your repository
2. Click "Actions" tab
3. Find "OTA Update" workflow
4. Click "Run workflow"
5. Select options:
   - **Channel**: `staging`, `preview`, or `production`
   - **Skip CI**: Skip quality checks (for emergencies only)
6. Click "Run workflow"

**Via GitHub CLI**:
```bash
# Publish to staging
gh workflow run ota-update.yml -f channel=staging

# Publish to production
gh workflow run ota-update.yml -f channel=production

# Emergency: Skip CI checks
gh workflow run ota-update.yml -f channel=production -f skip_ci=true
```

### 3. Scheduled Updates

Automatically publish OTA updates on a schedule (e.g., daily):

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Every day at 2 AM UTC
```

### 4. Update on Release Tags

Publish production OTA updates when you create a GitHub release:

```bash
# Create a release
git tag -a v1.0.1 -m "Fix critical bug"
git push origin v1.0.1

# This automatically:
# - Runs full build
# - Creates OTA bundle
# - Publishes to production
```

---

## Workflow Files

### Main OTA Update Workflow

See `.github/workflows/ota-update.yml` for the complete implementation.

**Triggers**:
- Manual dispatch (with channel selection)
- Push to main branch (production channel)
- Can be triggered via GitHub CLI

**Key Steps**:
1. Checkout code
2. Setup Node.js and Expo
3. Run CI checks (optional skip)
4. Build OTA bundle (`eas update`)
5. Publish to channel
6. Optional: Slack/Discord notification

### Integration with Existing Workflows

The OTA workflow integrates with:
- **CI Workflow** (`ci.yml`) - Tests must pass before OTA publish
- **Quality Checks** (`quality-checks.yml`) - Linting and formatting validation
- **EAS Build** (`eas-build.yml`) - Separate from OTA updates

---

## Best Practices

### 1. Test OTA Updates Before Production

**Workflow**:
```
Feature Branch → Staging Channel → Preview Channel → Production Channel
       ↓              ↓                   ↓                    ↓
    Code Review   QA Testing         User Testing          Release
```

**Steps**:
1. Develop feature on branch
2. Merge to `develop` branch
3. Push to staging: `gh workflow run ota-update.yml -f channel=staging`
4. QA tests the update in staging build
5. Move to preview: `gh workflow run ota-update.yml -f channel=preview`
6. Select beta testers to verify
7. Publish to production: `gh workflow run ota-update.yml -f channel=production`

### 2. Version Consistency

Always ensure version matches your EAS builds:

```typescript
// app.config.ts
export default ({ config }: ConfigContext): ExpoConfig => ({
  version: '1.0.0',  // Must match your built app
  runtimeVersion: {
    policy: 'appVersion',  // Locks OTA to this version
  },
})
```

**Before releasing new app version to stores**:
1. Update `version` in `app.config.ts`
2. Run `pnpm build` in mobile app
3. Submit to App Store/Play Store
4. Once live, OTA updates automatically use new version

### 3. Commit Messages

Use conventional commits to track what's in each OTA:

```bash
# Good commit messages
git commit -m "fix: critical bug in task list"
git commit -m "feat: add Vietnamese search support"
git commit -m "perf: optimize task queries"

# Helps track what's deployed
```

### 4. OTA Channels & Rollout Strategy

```
Staging     → For internal QA, always has latest
            → Everyone on staging build sees updates immediately

Preview     → For beta testers
            → Select 10-20 external testers
            → Validate in real environment before production

Production  → For all users
            → Roll out gradually:
              Week 1: 10% of users
              Week 2: 50% of users
              Week 3: 100% of users
            → Use feature flags for additional control
```

### 5. Monitor Deployments

After publishing OTA update:

1. **Check Deployment Status**:
   ```bash
   gh workflow view ota-update -a
   ```

2. **Monitor User Adoption**:
   - Check PostHog for update events
   - Look for error rate changes
   - Monitor user crash reports

3. **Check EAS Dashboard**:
   - Go to https://expo.dev
   - Click your project
   - View "Updates" tab
   - See deployment status and user downloads

### 6. Rollback Procedures

If an OTA update causes issues:

1. **Immediate Rollback** (revert to previous OTA):
   ```bash
   # Get previous release ID from EAS dashboard
   gh workflow run ota-update.yml \
     -f channel=production \
     -f rollback_id=abc123def456
   ```

2. **Manual Rollback** (via EAS dashboard):
   - Go to https://expo.dev
   - Find your project
   - Go to "Updates" tab
   - Find the bad deployment
   - Click "Rollback"
   - Select previous good version
   - Click "Rollback to this version"

3. **Emergency Disable**:
   - Use PostHog to kill switch affected features
   - Prevents users from hitting broken code paths
   - Buys time for proper fix

### 7. What to Include in OTA Updates

**Safe to Update** ✅:
- React/TypeScript code
- Screen components
- Business logic
- API integrations
- Feature flags
- Styling (NativeWind)
- Strings and localization
- Asset files (images, fonts)

**NOT Safe - Requires Full Build** ❌:
- Native module changes
- Plugin configuration
- App permissions
- `app.config.ts` native settings
- Expo SDK version upgrade
- Custom native code

### 8. Document Changes

After each OTA deployment, document:

```markdown
# OTA Update - 2025-11-07

## Version
App: 1.0.0
Channel: production

## Changes
- Fixed task filter not updating
- Added Vietnamese search support
- Optimized list rendering performance

## Risk Level
LOW - Only UI fixes, no native changes

## Rollback Plan
If issues: Use feature flag kill switch for search
If still broken: Manual rollback via EAS dashboard

## Testing
- [x] Tested on staging build
- [x] QA team verified
- [x] 5 beta testers approved
```

---

## Monitoring & Observability

### Check Deployment Status

**GitHub Actions**:
```bash
# View workflow runs
gh workflow view ota-update -a

# View logs of specific run
gh run view <run-id> --log
```

**EAS Dashboard**:
1. Go to https://expo.dev
2. Click your project
3. Click "Updates" tab
4. See all published updates
5. Click any update to see:
   - Deployment time
   - Users who received it
   - Channel and version
   - Manifest details

### Monitor User Impact

**PostHog Dashboard**:
- Check error rates after deployment
- Monitor feature flag adoption
- Track screen view changes
- Identify user segments affected

**Error Tracking**:
- Monitor crash reports
- Check API error rates
- Review console logs from production

### Metrics to Track

```
Before OTA:
- Error rate: 0.5%
- Average task load time: 200ms
- Feature flag cache hits: 95%

After OTA (next 24 hours):
- Error rate: Should stay ≤ 0.5%
- Task load time: Should be ≤ 200ms
- Feature flag cache: Should improve
```

---

## Troubleshooting

### OTA Update Not Downloading

**User Side**:
1. App must be built from same version
2. Updates check every 24 hours in production
3. Force check: Pull down on home screen (if implemented)
4. Restart app

**Check**:
- Are users on correct app version? (Settings → About)
- Did users update to latest from app store first?
- Is update published to correct channel?

### Update Fails During Publish

**Check logs**:
```bash
gh run view <run-id> --log
```

**Common Issues**:

1. **EXPO_TOKEN Invalid**:
   ```
   Error: Invalid token
   ```
   - Go to https://expo.dev/settings/access-tokens
   - Create new token
   - Update GitHub secret

2. **Out of Disk Space**:
   ```
   Error: No space left on device
   ```
   - Runner has limited storage
   - Clear caches in workflow
   - Split large assets

3. **Network Timeout**:
   ```
   Error: ECONNRESET
   ```
   - Retry workflow (usually works)
   - Check Expo status: https://status.expo.dev

### Users See Old Update

**Issue**: Users not seeing latest OTA

**Causes**:
1. Published to wrong channel
2. User hasn't restarted app
3. User on wrong app version

**Fix**:
1. Verify update is in "Published" state (not "Failed")
2. Check correct channel was published to
3. Inform users to restart app
4. Can also trigger automatic check with PostHog feature flag

### Version Mismatch Errors

**Error**: "No compatible version found"

**This means**:
- Update was built for v1.0.0
- User has app v1.0.1 installed
- Versions don't match

**Fix**:
- Rebuild OTA for v1.0.1
- Or tell users to update app from store first

---

## Rollback & Disaster Recovery

### Rollback Process

**If OTA breaks the app** (rare but possible):

1. **Identify the issue** (first 30 minutes):
   ```bash
   # Check EAS dashboard for error reports
   # Check PostHog for crash spike
   # Monitor Slack for user reports
   ```

2. **Immediate action** (emergency):
   ```bash
   # Option 1: Use feature flag kill switch
   # In PostHog, disable problematic feature flag
   # This buys time for proper fix

   # Option 2: Rollback OTA manually
   gh workflow run ota-update.yml \
     -f channel=production \
     -f rollback=true
   ```

3. **Find Previous Good Version**:
   - Go to https://expo.dev
   - Select your project
   - Click "Updates"
   - Find last successful deployment
   - Note the deployment ID

4. **Publish Rollback**:
   ```bash
   # Via EAS dashboard (easiest)
   # Click update → Click "Rollback"
   # Select previous version
   # Click "Rollback to this version"

   # Via workflow (if dashboard not available)
   gh workflow run ota-update.yml \
     -f channel=production \
     -f rollback_id=deployment-id-here
   ```

5. **Post-Incident Review**:
   - Document what broke
   - Add test coverage
   - Improve QA testing
   - Update rollback procedures

### Disaster Recovery Checklist

- [ ] Identify issue within 30 minutes
- [ ] Activate feature flag kill switch
- [ ] Initiate rollback to previous OTA
- [ ] Monitor error rates returning to normal
- [ ] Document root cause
- [ ] Fix code and test thoroughly
- [ ] Re-publish with fixes
- [ ] Post-mortem review

### Prevent Issues

1. **Test OTA locally** before publishing:
   ```bash
   # In development environment
   npx expo-updates update-android
   npx expo-updates update-ios
   ```

2. **Progressive rollout**:
   - Don't push 100% immediately
   - Start with 10% of users
   - Monitor for 24 hours
   - Expand to 50%
   - Then 100%

3. **Feature flags**:
   - Wrap new features with flags
   - Can instantly disable if broken
   - Doesn't require new OTA

4. **Automated testing**:
   - Run full test suite before OTA
   - CI workflow ensures quality
   - Skip only in true emergencies

---

## Advanced Topics

### Custom OTA Publishing Script

For more control over the publication process:

```bash
#!/bin/bash
# scripts/publish-ota.sh

set -e

CHANNEL=${1:-staging}
VERSION=$(jq -r '.version' app.config.ts)

echo "📦 Building OTA for v$VERSION on channel: $CHANNEL"

# Build OTA bundle
cd apps/mobile
npx eas update --channel "$CHANNEL"

echo "✅ OTA published successfully"
echo "Channel: $CHANNEL"
echo "Version: $VERSION"
echo "Users will receive update on next app launch"
```

### A/B Testing with OTA

Use PostHog feature flags to test different versions:

```typescript
function FeatureComponent() {
  const { variant } = useFeatureFlagVariant('ui_redesign', ['old', 'new'])

  return variant === 'new' ? <NewUI /> : <OldUI />
}

// OTA update includes both code paths
// PostHog gradually rolls out new UI
// Measure which performs better
// Keep winner, remove other after validation
```

### Conditional Deployments

Deploy different OTA versions based on conditions:

```yaml
jobs:
  publish-ota:
    # Only publish if code changes are in specific folders
    if: |
      github.event_name == 'push' &&
      github.ref == 'refs/heads/main' &&
      contains(github.event.head_commit.modified, 'apps/mobile/')
```

---

## Resources

- **Expo Updates Docs**: https://docs.expo.dev/build/updates/
- **EAS Dashboard**: https://expo.dev
- **GitHub Actions**: https://docs.github.com/en/actions
- **Troubleshooting**: https://docs.expo.dev/eas/update-faq/

---

## Changelog

### Version 1.0 (2025-11-07)
- Initial OTA updates guide
- Channel strategy documentation
- Workflow setup instructions
- Best practices for production deployments
- Rollback and disaster recovery procedures

---

**Last Updated**: 2025-11-07
**Maintainer**: NV Internal Team
