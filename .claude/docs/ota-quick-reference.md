# OTA Updates - Quick Reference

Quick commands and examples for common OTA tasks.

## Publish OTA

### Via GitHub UI (Easiest)

1. Go to https://github.com/duongdev/nv-internal/actions
2. Find "OTA Update" workflow
3. Click "Run workflow"
4. Select channel (staging, preview, production)
5. Click "Run workflow" (green button)
6. Watch logs and get link to EAS dashboard

### Via GitHub CLI

```bash
# Publish to staging
gh workflow run ota-update.yml -f channel=staging

# Publish to preview
gh workflow run ota-update.yml -f channel=preview

# Publish to production
gh workflow run ota-update.yml -f channel=production
```

### Via Local Script

```bash
# Publish to staging
./scripts/publish-ota.sh staging

# Publish to production
./scripts/publish-ota.sh production

# Dry run (shows what would happen)
./scripts/publish-ota.sh staging --dry-run

# Publish and notify Slack
./scripts/publish-ota.sh production --notify
```

### Automatic on Merge to Main

```bash
# Code automatically publishes to production when merged to main
git push origin main
# → Workflow automatically triggers
# → Tests pass
# → OTA publishes to production channel
# → Users receive update on next app launch
```

---

## Check Deployment Status

### View Latest Deployments

```bash
# GitHub Actions logs
gh workflow view ota-update -a

# View specific run
gh run view <run-id> --log

# List recent runs
gh run list --workflow ota-update.yml --limit 10
```

### EAS Dashboard

1. Go to https://expo.dev
2. Click your project
3. Click "Updates" tab
4. See all published OTA updates
5. Click any update to see:
   - Deployment time
   - Download count
   - Published version
   - Channel name

---

## Monitor Users

### PostHog Analytics

1. Go to https://us.posthog.com
2. Click your project
3. Check:
   - Error rate trend
   - Feature flag adoption
   - Screen view changes
   - User retention

### Manual Check in App

In mobile app Settings screen:
- See current app version
- See OTA update version
- Check update timestamp

---

## Rollback OTA Update

### Via EAS Dashboard (Recommended)

1. Go to https://expo.dev
2. Click your project
3. Click "Updates"
4. Find the bad deployment
5. Click "..." menu
6. Select "Rollback"
7. Choose previous version
8. Confirm

Users automatically receive rollback on next app launch.

### Via GitHub Workflow

```bash
# Emergency rollback (latest successful)
gh workflow run ota-update.yml \
  -f channel=production \
  -f rollback=true

# Rollback to specific version
gh workflow run ota-update.yml \
  -f channel=production \
  -f rollback=true \
  -f rollback_id=abc123def456
```

### Via Feature Flag (Instant Fix)

```typescript
// In PostHog, find the problematic feature flag
// Set rollout to 0% (disables for all users)
// No new OTA needed - instant fix!

const { isEnabled } = useFeatureFlag('problematic_feature')
// isEnabled will be false immediately
```

---

## Workflow Examples

### Example 1: Bug Fix

```bash
# Make fix on develop
git commit -m "fix: critical task list bug"
git push origin develop

# Publish to staging for QA
gh workflow run ota-update.yml -f channel=staging

# Wait for QA approval...

# Publish to production
gh workflow run ota-update.yml -f channel=production

# Users see fix on next app launch
```

### Example 2: Feature with Feature Flag

```typescript
// Code includes feature behind flag
const { isEnabled } = useFeatureFlag('new_search')
return isEnabled ? <NewSearch /> : <OldSearch />
```

```bash
# Publish OTA with feature behind disabled flag
gh workflow run ota-update.yml -f channel=production

# In PostHog, gradually enable flag
# 10% users → monitor errors
# 50% users → gather feedback
# 100% users → full rollout

# No new OTA needed, users already have code!
```

### Example 3: Staging Pipeline

```bash
# 1. QA Testing
gh workflow run ota-update.yml -f channel=staging
# QA tests on staging build

# 2. Internal Preview
gh workflow run ota-update.yml -f channel=preview
# Select employees test

# 3. Beta Users
# Already has preview, they test in real environment

# 4. Production Release
# Once beta approved, merge to main
git checkout main
git merge develop
git push origin main
# Auto-publishes to production!
```

---

## Version Management

### Check Current Version

```bash
# In app.config.ts
grep '"version"' apps/mobile/app.config.ts

# In running app
# Settings → About → Version 1.0.0
```

### Update App Version

```bash
# 1. Update version in app.config.ts
# Version: "1.0.0" → "1.0.1"

# 2. Rebuild native app (for stores)
eas build --platform all --profile production

# 3. Submit to stores
eas submit --platform all --profile production

# 4. Once live, OTA updates automatically use 1.0.1
```

**Important**: OTA updates are version-bound. Users on v1.0.0 only receive OTAs built for v1.0.0.

---

## Common Issues & Fixes

### "No compatible version found"

**Cause**: App version mismatch
- App installed: v1.0.0
- OTA built for: v1.0.1

**Fix**:
- User must update app from App Store first
- Or rebuild OTA for app's current version

### Workflow Fails in "Run quality checks"

**Check logs**:
```bash
gh run view <run-id> --log
```

**Fix**:
1. Run checks locally: `pnpm biome check apps/mobile/`
2. Fix issues: `pnpm biome check apps/mobile/ --write`
3. Commit and retry

### Users Not Seeing Update After 24 Hours

**Troubleshoot**:
1. ✅ Is update "Published" on EAS dashboard?
2. ✅ Is user on correct app version?
3. ✅ Has user restarted app?

**Manual trigger**:
```typescript
// In app, implement pull-to-refresh
// Or use feature flag to force update check
const { isEnabled } = useFeatureFlag('force_update_check')
// Manually trigger in PostHog
```

---

## Channel Strategy

### When to Use Each Channel

**Staging**
- Internal QA team
- Daily testing
- Automatic updates
- 0% risk (internal only)

**Preview**
- 10-20 beta testers
- Real environment testing
- Manual update on next launch
- Low risk (limited users)

**Production**
- All users
- Fully tested OTA
- Auto-update within 24h
- Highest reliability required

### Recommended Process

```
Feature Branch
    ↓
Merge to develop
    ↓
Publish to staging (QA tests)
    ↓
Publish to preview (Beta testers verify)
    ↓
Merge to main
    ↓
Auto-publish to production
    ↓
Monitor for 24 hours
```

---

## Performance Tips

### Optimize OTA Bundle Size

```bash
# Check what's in the bundle
npx expo export-web apps/mobile/

# Remove unused dependencies
pnpm remove unused-package

# Lazy load heavy modules
const HeavyComponent = lazy(() => import('./Heavy'))
```

### Speed Up Publishing

```bash
# Local publish (faster feedback)
./scripts/publish-ota.sh staging

# Caching (GitHub Actions)
# Automatically caches node_modules
# First run: ~5 min
# Subsequent runs: ~2 min
```

---

## Security

### Protect EXPO_TOKEN

```bash
# Set locally (never in git)
export EXPO_TOKEN="your_token_here"

# Or use .env.local (add to .gitignore)
echo "EXPO_TOKEN=your_token_here" >> apps/mobile/.env.local
```

### Audit Deployments

```bash
# See who published what when
gh run list --workflow ota-update.yml --limit 20

# See deployment details on EAS
https://expo.dev → Updates tab
```

---

## Integration with Other Tools

### With Slack

After configuring SLACK_WEBHOOK:
```bash
gh workflow run ota-update.yml -f channel=production
# → Automatically posts to Slack when done
```

### With Discord

After configuring DISCORD_WEBHOOK:
```bash
gh workflow run ota-update.yml -f channel=production
# → Automatically posts to Discord when done
```

### With PostHog

Monitor impact of OTA:
1. Check error rate before/after
2. Monitor feature flag adoption
3. See which screens affected
4. Measure user retention change

---

## Frequently Asked Questions

**Q: How long until users get the update?**
A: Staging/Preview: Next app launch. Production: Within 24 hours (checks periodically).

**Q: Can I push directly to production?**
A: Yes, but not recommended. Use staging first, then preview, then production.

**Q: What if users are offline?**
A: App will check again when connection restored, up to 24 hours.

**Q: Can I rollback an OTA?**
A: Yes, via EAS dashboard or `gh workflow run` with rollback flag.

**Q: Does OTA update require app store approval?**
A: No, OTA updates are JavaScript changes only. Binary changes need store approval.

**Q: Can I update native code with OTA?**
A: No, OTA can only update JavaScript/React code, assets, and configuration.

**Q: What about database migrations?**
A: Safe if you make them backward compatible or use feature flags.

---

## Next Steps

1. Set up EXPO_TOKEN (see ota-setup-checklist.md)
2. Test locally: `./scripts/publish-ota.sh staging --dry-run`
3. Trigger first OTA: `gh workflow run ota-update.yml -f channel=staging`
4. Monitor on EAS dashboard: https://expo.dev
5. Read full guide: `.claude/docs/ota-updates-guide.md`

---

**Quick Links**:
- Full Guide: `.claude/docs/ota-updates-guide.md`
- Setup Checklist: `.claude/docs/ota-setup-checklist.md`
- EAS Dashboard: https://expo.dev
- GitHub Actions: https://github.com/duongdev/nv-internal/actions

**Created**: 2025-11-07
