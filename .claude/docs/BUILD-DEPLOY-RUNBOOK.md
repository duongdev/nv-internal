# Build & Deploy Runbook

**Last Updated**: 2025-11-07
**For**: Local and GitHub Actions builds (post-EAS Build migration)

## Quick Reference

### Common Commands

```bash
# Install Fastlane dependencies
cd apps/mobile && bundle install

# Local iOS staging build
BUILD_NUMBER=<number> bundle exec fastlane ios build_staging

# Local iOS production build + TestFlight upload
BUILD_NUMBER=<number> bundle exec fastlane ios build_upload_testflight

# Local Android APK build
BUILD_NUMBER=<number> bundle exec fastlane android build_apk

# Trigger GitHub Actions build
gh workflow run build-deploy.yml --ref main \
  -f platform=ios \
  -f environment=production \
  -f submit=true
```

---

## Daily Workflows

### 1. Creating a Production Release

**When**: Ready to release new version to TestFlight/Play Store

**Steps**:

```bash
# 1. Ensure all changes are committed and pushed
git status
git push origin main

# 2. Create and push version tag
git tag v1.0.1
git push origin v1.0.1

# 3. Monitor GitHub Actions
gh run watch

# 4. Verify TestFlight upload
# Check App Store Connect for new build
```

**Expected Timeline**:
- iOS build: ~15-20 minutes
- TestFlight processing: ~10-15 minutes
- Total: ~30-35 minutes until testable

### 2. Publishing OTA Update

**When**: JS-only changes that don't require new native build

**Steps**:

```bash
cd apps/mobile

# Publish to production channel
eas update --channel production --message "Your update description"

# Publish to staging channel
eas update --channel staging --message "Your update description"

# Publish to preview channel
eas update --channel preview --message "Your update description"
```

**⚠️ Important**:
- OTA updates only work for same app version (1.0.0 → 1.0.0)
- Native changes (new packages, native code) require full build
- Test in staging first before production

### 3. Testing Staging Build

**When**: Before production release, to test changes

**Steps**:

```bash
# Trigger staging build via GitHub Actions
gh workflow run build-deploy.yml --ref main \
  -f platform=ios \
  -f environment=staging \
  -f submit=false

# Or build locally
cd apps/mobile
BUILD_NUMBER=999 \
EXPO_PUBLIC_ENV=staging \
EXPO_PUBLIC_API_URL=https://nv-internal-staging.vercel.app \
bundle exec fastlane ios build_staging

# Install IPA on device (via Xcode or TestFlight)
```

### 4. Building Locally for Development

**When**: Testing build process or debugging build issues

**Prerequisites**:
- macOS with Xcode installed
- Ruby and Bundler installed
- Fastlane dependencies installed (`bundle install`)

**Steps**:

```bash
cd apps/mobile

# Set environment variables (create .env.local)
export BUILD_NUMBER=999
export EXPO_PUBLIC_ENV=development
export EXPO_PUBLIC_API_URL=http://localhost:3000
# ... other EXPO_PUBLIC_* vars

# Build iOS staging
bundle exec fastlane ios build_staging

# Output: build/nvinternal-staging.ipa
```

---

## GitHub Actions Workflows

### Triggering Builds Manually

**Via GitHub UI**:
1. Go to https://github.com/duongdev/nv-internal/actions
2. Select "Build & Deploy to TestFlight/Play Store"
3. Click "Run workflow"
4. Select options:
   - Platform: ios, android, or all
   - Environment: production or staging
   - Submit: true (upload to stores) or false (build only)

**Via CLI**:

```bash
# iOS production with TestFlight upload
gh workflow run build-deploy.yml --ref main \
  -f platform=ios \
  -f environment=production \
  -f submit=true

# Android staging without Play Store upload
gh workflow run build-deploy.yml --ref main \
  -f platform=android \
  -f environment=staging \
  -f submit=false

# Both platforms production
gh workflow run build-deploy.yml --ref main \
  -f platform=all \
  -f environment=production \
  -f submit=true
```

### Monitoring Builds

```bash
# Watch latest run
gh run watch

# List recent runs
gh run list --workflow=build-deploy.yml --limit=5

# View specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

### Build Number Management

**Current build number**:
```bash
gh variable get BUILD_NUMBER --repo duongdev/nv-internal
```

**Manually set build number** (if needed):
```bash
gh variable set BUILD_NUMBER --body "100" --repo duongdev/nv-internal
```

**Note**: Build number auto-increments on each workflow run

---

## Troubleshooting

### Build Failures

#### 1. CocoaPods Installation Failed

**Symptoms**: Build fails during `pod install`

**Solution**:
```bash
cd apps/mobile/ios
rm -rf Pods Podfile.lock
pod install --repo-update
```

#### 2. Fastlane Match Certificate Issues

**Symptoms**: "Certificate not found" or "Provisioning profile expired"

**Solution**:
```bash
# Re-fetch certificates
bundle exec fastlane match appstore --readonly=false

# Force regenerate (destructive - only if needed)
bundle exec fastlane match nuke distribution
bundle exec fastlane match appstore
```

#### 3. Xcode Version Mismatch

**Symptoms**: Build fails with Xcode compatibility errors

**Solution**:
- GitHub Actions: Update `xcode-version` in workflow
- Local: Install matching Xcode version from Apple Developer

#### 4. expo prebuild Fails

**Symptoms**: Native project generation fails

**Solution**:
```bash
cd apps/mobile

# Clean and retry
rm -rf ios android node_modules
pnpm install
npx expo prebuild --clean
```

#### 5. TestFlight Upload Fails

**Symptoms**: Build succeeds but upload fails

**Solution**:
1. Check App Store Connect API key is valid
2. Verify bundle identifier matches App Store Connect
3. Ensure version number is higher than existing builds
4. Check App Store Connect for processing errors

### Runtime Issues

#### 1. App Crashes on Startup

**Possible Causes**:
- expo-updates misconfiguration
- Missing environment variables
- Native dependency issues

**Solution**:
1. Check crash logs in App Store Connect
2. Verify all `EXPO_PUBLIC_*` variables are set
3. Test with updates disabled: `updates: { enabled: false }`
4. Check for recent plugin changes

#### 2. OTA Updates Not Working

**Symptoms**: App doesn't receive updates

**Solution**:
1. Verify channel matches: `EXPO_PUBLIC_ENV` in app.config.ts
2. Check runtime version matches:
   ```bash
   eas update:view --channel=production
   ```
3. Test with staging channel first
4. Clear app data and reinstall

#### 3. Environment Variables Missing

**Symptoms**: Features fail due to missing config

**Solution**:
1. Verify GitHub Secrets are set
2. Check workflow passes all required `EXPO_PUBLIC_*` vars
3. Rebuild app (env vars are embedded at build time)

---

## Emergency Procedures

### Rollback to Previous Build

**Via TestFlight**:
1. Go to App Store Connect → TestFlight
2. Select previous build version
3. Re-enable for testing
4. Notify testers to install previous version

**Via OTA Update**:
```bash
# Rollback to specific update
eas update:republish --group=<update-id> --channel=production
```

### Disable Broken Feature (OTA)

```bash
# Quickly publish fix
cd apps/mobile
# Make JS-only change to disable feature
eas update --channel=production --message="Emergency fix: disable broken feature"
```

### Emergency Stop (Kill Switch)

If catastrophic issue in production:

1. **Disable OTA updates** (app.config.ts):
   ```typescript
   updates: { enabled: false }
   ```

2. **Build and release hotfix**:
   ```bash
   git tag v1.0.2-hotfix
   git push origin v1.0.2-hotfix
   ```

3. **Fast-track TestFlight**:
   - Build completes in ~20 minutes
   - TestFlight processing ~10 minutes
   - Users update within hours

---

## Certificate Management

### Viewing Certificates

```bash
cd apps/mobile

# List App Store certificates
bundle exec fastlane match appstore --readonly=true

# List Ad Hoc certificates
bundle exec fastlane match adhoc --readonly=true
```

### Renewing Certificates

**When**: Certificates expire (annually)

**Steps**:
```bash
cd apps/mobile

# Revoke and regenerate (requires Apple Developer Admin)
bundle exec fastlane match nuke distribution
bundle exec fastlane match appstore

# Update GitHub Secrets if Match password changed
gh secret set MATCH_PASSWORD --repo duongdev/nv-internal
```

**⚠️ Important**: Coordinate with team before revoking certificates

### Adding New Device for Ad Hoc

```bash
# Register device in Apple Developer Portal first
# Then update provisioning profiles
bundle exec fastlane match adhoc --force_for_new_devices=true
```

---

## Monitoring & Logs

### Build Logs

**GitHub Actions**:
```bash
# Download logs for run
gh run download <run-id>

# View specific job logs
gh run view <run-id> --job=build-ios --log
```

**Local Builds**:
- Fastlane logs: `apps/mobile/fastlane/report.xml`
- Build artifacts: `apps/mobile/build/`

### App Logs

**TestFlight**:
1. App Store Connect → TestFlight → Build
2. Crash Reports → View crashes
3. Download dSYMs for symbolication

**Production**:
- PostHog for analytics and errors
- Clerk dashboard for auth issues
- Vercel logs for API issues

---

## Maintenance Tasks

### Weekly

- [ ] Review TestFlight crash reports
- [ ] Monitor build success rate in GitHub Actions
- [ ] Check certificate expiration dates

### Monthly

- [ ] Update dependencies (`pnpm update`)
- [ ] Review and clean old builds in App Store Connect
- [ ] Audit GitHub Secrets (rotate if needed)

### Quarterly

- [ ] Update Xcode version in CI
- [ ] Review and update Fastlane
- [ ] Certificate renewal planning

---

## Getting Help

**Build Issues**:
- Check GitHub Actions logs first
- Review Fastlane documentation: https://docs.fastlane.tools
- Check Expo forums for prebuild issues

**App Issues**:
- Review crash logs in App Store Connect
- Check PostHog for error tracking
- Test in staging environment first

**Emergency**:
- Rollback immediately using procedures above
- Document issue in `.claude/tasks/`
- Post-mortem after resolution

---

## Useful Links

- **GitHub Actions**: https://github.com/duongdev/nv-internal/actions
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console
- **Certificates Repo**: https://github.com/duongdev/nv-internal-certificates
- **Fastlane Docs**: https://docs.fastlane.tools
- **Expo Docs**: https://docs.expo.dev

---

**Remember**: Test in staging before production. Always have a rollback plan ready.
