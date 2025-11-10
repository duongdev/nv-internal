# Staging Channel Implementation Plan

**Created**: 2025-11-10
**Status**: 📝 Planning Phase
**Priority**: Medium (implement after production is stable)
**Related Docs**:
- `.claude/docs/BUILD-DEPLOY-RUNBOOK.md`
- `MIGRATION-SUMMARY.md`
- `.github/workflows/build-deploy.yml`

---

## Executive Summary

The current build and deployment system is configured for **production-only** to enable rapid deployment. This document outlines the plan to add a staging channel for safer pre-production testing once the production workflow is validated and stable.

### Why Production-Only Now?

- ✅ **Speed to market**: Get the app into production faster
- ✅ **Simplified initial setup**: Fewer moving parts to configure and test
- ✅ **Validate core workflow**: Ensure production builds work flawlessly first
- ✅ **Easy to expand**: Staging can be added later without disrupting production

### Why Add Staging Later?

- ✅ **Safe testing environment**: Test changes before they reach production users
- ✅ **Catch issues early**: Identify bugs in a production-like environment
- ✅ **OTA update testing**: Test updates on staging channel before production
- ✅ **Team collaboration**: Multiple team members can test simultaneously without affecting production
- ✅ **Reduced production incidents**: Lower risk of breaking changes

---

## Current State

### What Works (Production)

| Component | Status | Notes |
|-----------|--------|-------|
| iOS production builds | ✅ Working | Tested in build #34 |
| TestFlight uploads | ✅ Working | Automatic on tag push |
| Production EAS Update channel | ✅ Working | OTA updates enabled |
| GitHub Actions workflow | ✅ Working | Tag-based auto-deploy |
| Fastlane Match (iOS certs) | ✅ Working | Manual code signing configured |
| Environment variables | ✅ Working | All production secrets set |

### What's Missing (Staging)

| Component | Status | Required Action |
|-----------|--------|-----------------|
| Staging EAS Update channel | ❌ Not configured | Create in EAS dashboard |
| Staging environment variables | ❌ Not configured | Add to GitHub Secrets |
| app.config.ts channel mapping | ❌ Not configured | Map `staging` env to channel |
| Staging backend URL | ⚠️ Partial | URL exists but not in secrets |
| Fastlane staging lane validation | ⚠️ Untested | Lane exists but needs testing |
| Staging provisioning profiles | ⚠️ Unknown | May need separate profiles |
| TestFlight staging group | ❌ Not configured | Optional but recommended |
| Documentation | ❌ Not complete | Update all docs for staging |

---

## Implementation Roadmap

### Phase 1: Configuration & Setup (Estimated: 2-3 hours)

#### 1.1 EAS Update Channel Configuration

**Task**: Create and configure staging channel in EAS Update dashboard

**Steps**:
```bash
# Verify current channels
cd apps/mobile
eas channel:list

# Expected output:
# - production (exists)

# Create staging channel (if not exists)
# This may be done automatically when first update is published to staging
```

**Validation**:
```bash
# Publish test update to staging
eas update --channel staging --message "Test staging channel setup"

# Verify channel was created
eas channel:list
```

**Outcome**: Staging channel exists and can receive OTA updates

---

#### 1.2 Environment Variables

**Task**: Add staging-specific environment variables to GitHub Secrets

**Required Secrets**:

| Secret Name | Value | Purpose |
|-------------|-------|---------|
| `EXPO_PUBLIC_API_URL_STAGING` | `https://nv-internal-staging.vercel.app` | Staging backend URL |

**Steps**:
```bash
# Add staging API URL to GitHub Secrets
gh secret set EXPO_PUBLIC_API_URL_STAGING \
  --body "https://nv-internal-staging.vercel.app" \
  --repo duongdev/nv-internal

# Verify secret was added
gh secret list --repo duongdev/nv-internal | grep STAGING
```

**Alternative**: Reuse existing secrets if staging backend uses same credentials (Clerk, Google Maps, PostHog, etc.)

**Outcome**: All required environment variables available for staging builds

---

#### 1.3 App Configuration Update

**Task**: Update `apps/mobile/app.config.ts` to properly map staging environment to staging channel

**Current Code** (verify):
```typescript
// apps/mobile/app.config.ts
updates: {
  enabled: !IS_DEV,
  url: 'https://u.expo.dev/...',
  // Check current channel mapping
}
```

**Expected Code**:
```typescript
updates: {
  enabled: !IS_DEV,
  url: 'https://u.expo.dev/...',
  channel: process.env.EXPO_PUBLIC_ENV === 'staging' ? 'staging' : 'production',
}
```

**Steps**:
1. Review current `app.config.ts` channel configuration
2. Ensure `EXPO_PUBLIC_ENV` environment variable maps correctly:
   - `production` → `production` channel
   - `staging` → `staging` channel
3. Test configuration locally with different env values

**Validation**:
```bash
# Build with staging config
cd apps/mobile
EXPO_PUBLIC_ENV=staging npx expo prebuild --clean

# Verify Info.plist or AndroidManifest.xml has correct channel
# iOS: Check ios/nvinternal/Supporting/Expo.plist
# Android: Check android/app/src/main/AndroidManifest.xml
```

**Outcome**: App correctly uses staging channel when `EXPO_PUBLIC_ENV=staging`

---

### Phase 2: Build Configuration (Estimated: 2-3 hours)

#### 2.1 Fastlane Staging Lane Validation

**Task**: Test and validate the existing `build_staging` lane for iOS

**Current Lane** (verify in `apps/mobile/fastlane/Fastfile`):
```ruby
lane :build_staging do
  # Verify this lane exists and review its configuration
end
```

**Test Plan**:
1. **Local Test Build**:
   ```bash
   cd apps/mobile

   # Set environment variables
   export BUILD_NUMBER=9999
   export EXPO_PUBLIC_ENV=staging
   export EXPO_PUBLIC_API_URL=https://nv-internal-staging.vercel.app
   export EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=<key>
   # ... other required env vars

   # Run staging build
   bundle exec fastlane ios build_staging
   ```

2. **Verify Build Output**:
   - IPA file generated in `build/` directory
   - App bundle ID correct
   - Code signing successful
   - No errors in build logs

3. **Check Provisioning Profiles**:
   ```bash
   # Check if separate staging profile needed
   bundle exec fastlane match adhoc --readonly=true

   # Or can reuse production profile?
   bundle exec fastlane match appstore --readonly=true
   ```

**Issues to Watch For**:
- Code signing failures (may need separate staging profiles)
- Environment variable not properly embedded
- Build configuration errors

**Outcome**: `build_staging` lane works reliably for local builds

---

#### 2.2 TestFlight Upload Testing

**Task**: Validate that staging builds can upload to TestFlight

**Test Plan**:
1. **Update Fastlane Lane** (if needed):
   ```ruby
   # apps/mobile/fastlane/Fastfile
   lane :build_staging do
     # ... existing build steps ...

     # Add optional TestFlight upload
     if ENV['UPLOAD_TO_TESTFLIGHT'] == 'true'
       upload_to_testflight(
         skip_waiting_for_build_processing: true,
         distribute_external: false,  # Staging = internal only
         groups: ["Internal Testers"],  # Or create "Staging Testers" group
       )
     end
   end
   ```

2. **Test Upload**:
   ```bash
   # Local test with upload
   UPLOAD_TO_TESTFLIGHT=true \
   BUILD_NUMBER=9999 \
   EXPO_PUBLIC_ENV=staging \
   bundle exec fastlane ios build_staging
   ```

3. **Verify in App Store Connect**:
   - Build appears in TestFlight
   - Version number correct (should be same as production but different build number)
   - Distributed to correct group

**Outcome**: Staging builds successfully upload to TestFlight

---

#### 2.3 GitHub Actions Workflow Update

**Task**: Update workflow to properly support staging builds

**Current Workflow Issues**:
- Staging option exists but is not fully tested
- Environment variables hard-coded (not using secret for staging URL)
- Comments indicate staging is not ready

**Changes Needed**:

1. **Update iOS Build Step**:
   ```yaml
   # .github/workflows/build-deploy.yml
   - name: Build and upload to TestFlight
     env:
       # Use secret for staging URL
       EXPO_PUBLIC_API_URL: ${{
         github.event.inputs.environment == 'staging'
         && secrets.EXPO_PUBLIC_API_URL_STAGING
         || 'https://nv-internal-api.vercel.app'
       }}
   ```

2. **Update Comments**:
   - Remove "TODO" comments once staging is validated
   - Update warnings to reflect staging availability

3. **Test Workflow**:
   ```bash
   # Trigger staging build
   gh workflow run build-deploy.yml --ref main \
     -f platform=ios \
     -f environment=staging \
     -f submit=false

   # Monitor build
   gh run watch

   # Verify success
   gh run list --workflow=build-deploy.yml --limit=1
   ```

**Outcome**: GitHub Actions successfully builds and uploads staging builds

---

### Phase 3: Testing & Validation (Estimated: 3-4 hours)

#### 3.1 End-to-End Staging Build Test

**Test Scenarios**:

| Test Case | Expected Outcome |
|-----------|------------------|
| Local staging build | IPA generated successfully |
| GitHub Actions staging build | Build succeeds, artifact uploaded |
| TestFlight upload (staging) | Build appears in TestFlight |
| App launch (staging build) | App starts without crashes |
| Environment check | App uses staging backend URL |
| OTA update (staging channel) | Update received and applied |
| Navigation/features | All features work as expected |

**Test Plan**:

1. **Build Test**:
   ```bash
   # Trigger staging build via GitHub Actions
   gh workflow run build-deploy.yml --ref main \
     -f platform=ios \
     -f environment=staging \
     -f submit=true
   ```

2. **Installation Test**:
   - Install from TestFlight
   - Verify app opens without crashes
   - Check "About" or settings screen for environment indicator

3. **Backend Connection Test**:
   - Login with test account
   - Create test data
   - Verify API calls go to staging backend (check network logs)

4. **OTA Update Test**:
   ```bash
   # Make small JS change
   # Publish to staging channel
   cd apps/mobile
   eas update --channel staging --message "Test OTA on staging"

   # Force reload app
   # Verify update is received
   ```

**Validation Checklist**:
- [ ] Staging build compiles successfully
- [ ] Code signing works (no profile errors)
- [ ] App installs from TestFlight
- [ ] App connects to staging backend
- [ ] All critical features work
- [ ] OTA updates work on staging channel
- [ ] No crashes or errors

**Outcome**: Staging environment fully functional and tested

---

#### 3.2 Team Training & Documentation

**Task**: Update documentation and train team on staging workflow

**Documentation Updates**:

1. **Update MIGRATION-SUMMARY.md**:
   - Change status from "production-only" to "staging available"
   - Update example commands to include staging
   - Remove warnings about staging not being ready

2. **Update BUILD-DEPLOY-RUNBOOK.md**:
   - Update "Daily Workflows" section
   - Change "Future: Staging Channel" to "Using Staging Channel"
   - Add staging-specific troubleshooting

3. **Update CLAUDE.md**:
   - Update "Quick Start" section with staging commands
   - Update workflow examples

4. **Update .github/workflows/build-deploy.yml**:
   - Remove TODO comments
   - Update descriptions to reflect staging availability

**Team Training Topics**:
- When to use staging vs production builds
- How to trigger staging builds (local and CI)
- How to publish OTA updates to staging
- How to test staging builds before production
- Troubleshooting staging-specific issues

**Outcome**: Team understands and can use staging workflow

---

### Phase 4: Android Staging Support (Optional - Estimated: 2-3 hours)

**Note**: Android builds may be lower priority depending on release strategy

**Tasks**:
1. Create `build_staging_apk` Fastlane lane for Android
2. Test Android staging builds
3. Configure Play Store internal testing track (if needed)
4. Update workflow for Android staging

**Outcome**: Staging works for both iOS and Android

---

## Rollout Strategy

### Recommended Approach

1. **Implement in Phases**: Follow phases 1-3 sequentially
2. **Test Thoroughly**: Validate each phase before moving to next
3. **Start with iOS**: Android can come later if needed
4. **Internal First**: Use staging internally before rolling out to team
5. **Monitor Production**: Ensure production builds remain stable during staging setup

### Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Configuration | 2-3 hours | None |
| Phase 2: Build Config | 2-3 hours | Phase 1 complete |
| Phase 3: Testing | 3-4 hours | Phase 2 complete |
| Phase 4: Android (optional) | 2-3 hours | Phase 3 complete |
| **Total** | **9-13 hours** | |

### Trigger Conditions

Implement staging when:
- ✅ Production builds are stable and working reliably
- ✅ Team has time allocated for staging setup
- ✅ There's a need for safer pre-production testing
- ✅ Team has validated production workflow sufficiently

---

## Staging Workflow (After Implementation)

### Building for Staging

**Via GitHub Actions** (recommended):
```bash
# Trigger staging build
gh workflow run build-deploy.yml --ref main \
  -f platform=ios \
  -f environment=staging \
  -f submit=true

# Monitor progress
gh run watch
```

**Locally**:
```bash
cd apps/mobile

export BUILD_NUMBER=$(gh variable get BUILD_NUMBER --repo duongdev/nv-internal)
export EXPO_PUBLIC_ENV=staging
export EXPO_PUBLIC_API_URL=https://nv-internal-staging.vercel.app
# ... other env vars

bundle exec fastlane ios build_staging
```

### Publishing OTA Updates

```bash
# Publish to staging channel
cd apps/mobile
eas update --channel staging --message "Your update description"

# Install staging build from TestFlight
# Verify update is received
```

### Testing Strategy

**Workflow**:
1. **Develop** locally with Expo Go
2. **Build** staging version with new features
3. **Test** internally on staging builds
4. **Fix** any issues found
5. **Build** production version
6. **Release** to external testers/users

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: Staging build uses production backend

**Symptoms**: API calls go to production URL instead of staging

**Solution**:
1. Verify `EXPO_PUBLIC_ENV=staging` is set during build
2. Check `app.config.ts` correctly reads environment variable
3. Rebuild app (env vars are embedded at build time)

#### Issue: OTA updates not received on staging

**Symptoms**: Staging app doesn't receive updates published to staging channel

**Solution**:
1. Verify channel in app matches published channel:
   ```bash
   eas channel:list
   eas update:view --channel=staging
   ```
2. Check runtime version compatibility
3. Clear app data and reinstall

#### Issue: Code signing fails for staging builds

**Symptoms**: Build fails with provisioning profile errors

**Solution**:
1. Check if separate staging profiles are needed
2. Verify Fastlane Match configuration
3. Re-run Match to fetch certificates:
   ```bash
   bundle exec fastlane match adhoc --readonly=false
   ```

---

## Success Criteria

Staging implementation is successful when:

- [ ] Staging EAS Update channel is created and working
- [ ] Staging environment variables are configured
- [ ] app.config.ts correctly maps staging env to channel
- [ ] Fastlane `build_staging` lane works reliably
- [ ] GitHub Actions can build and upload staging builds
- [ ] Staging builds upload to TestFlight successfully
- [ ] Team can install and test staging builds
- [ ] OTA updates work on staging channel
- [ ] Documentation is updated to reflect staging availability
- [ ] Team is trained on staging workflow
- [ ] At least one successful staging → production release cycle

---

## Risks & Mitigation

### Risk: Staging setup disrupts production

**Mitigation**:
- Implement staging in separate branch first
- Test thoroughly before merging to main
- Keep production builds running during staging setup

### Risk: Increased complexity

**Mitigation**:
- Document staging workflow clearly
- Provide team training
- Start simple (iOS only, then add Android)

### Risk: Environment variable confusion

**Mitigation**:
- Use clear naming conventions (`*_STAGING` suffix)
- Document all environment variables
- Add validation in app.config.ts to catch misconfigurations

### Risk: Certificate/provisioning profile issues

**Mitigation**:
- Test locally first before CI
- Document Fastlane Match setup clearly
- Have rollback plan (can revert to production-only)

---

## Future Enhancements

After staging is stable, consider:

1. **Preview Channel**: For feature branches and PRs
2. **Automated Staging Deploys**: On merge to `develop` branch
3. **Staging Backend**: Separate staging API deployment
4. **Feature Flags**: Use PostHog feature flags for gradual rollouts
5. **Automated Testing**: E2E tests on staging builds before production

---

## References

- **Build & Deploy Runbook**: `.claude/docs/BUILD-DEPLOY-RUNBOOK.md`
- **Migration Summary**: `MIGRATION-SUMMARY.md`
- **GitHub Workflow**: `.github/workflows/build-deploy.yml`
- **Fastlane Configuration**: `apps/mobile/fastlane/Fastfile`
- **App Configuration**: `apps/mobile/app.config.ts`
- **EAS Update Docs**: https://docs.expo.dev/eas-update/introduction/
- **Fastlane Match Docs**: https://docs.fastlane.tools/actions/match/

---

**Last Updated**: 2025-11-10
**Status**: Planning phase - ready for implementation when production is stable
**Next Steps**: Implement Phase 1 when triggered conditions are met
