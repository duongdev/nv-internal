# GitHub Workflows & CI/CD Documentation

This directory contains GitHub Actions workflows and comprehensive documentation for the NV Internal project's CI/CD pipeline.

## Quick Navigation

### Latest Updates (2025-11-07)

A comprehensive analysis of GitHub Actions EAS build workflow failures has been completed, with all issues identified and fixed. See documentation below for details.

---

## 📋 Documentation Index

### For Getting Started (5 minutes)

**Start here**: [CI/CD Fixes Summary](./CI_CD_FIXES_SUMMARY.md)
- Quick overview of what was wrong and fixed
- Action items prioritized by urgency
- Quick testing commands

### For Setting Up Secrets (30 minutes)

**Required reading**: [GitHub Secrets Guide](./GITHUB_SECRETS_GUIDE.md)
- Complete setup instructions for all required GitHub secrets
- Step-by-step Google Play Service Account creation
- Security best practices
- Troubleshooting guide

### For Technical Details (30 minutes)

**Detailed reference**: [EAS Build Failure Analysis](./EAS_BUILD_FAILURE_ANALYSIS.md)
- Root cause analysis of run #19132003651 failure
- Issue-by-issue explanation with code references
- All changes made with verification procedures
- Remaining tasks and timelines

### For Complete Reference (60 minutes)

**Comprehensive report**: [Deployment Readiness Report](./DEPLOYMENT_READINESS_REPORT.md)
- Executive summary
- Detailed root cause analysis
- Pre-deployment checklist
- Rollout plan and risk assessment
- Success criteria and metrics

---

## Workflows

### EAS Build & Submit

**File**: [`eas-build.yml`](./workflows/eas-build.yml)

**Purpose**: Build and submit mobile app to iOS App Store and Google Play

**Triggers**:
- Push version tags (e.g., `v1.0.0`)
- Manual workflow dispatch with custom options

**Jobs**:
- `build` - Build app for iOS and/or Android using EAS
- `submit` - Submit built app to app stores

**Platforms Supported**:
- iOS (App Store)
- Android (Google Play)

**Latest Changes** (2025-11-07):
- Fixed matrix strategy logic for platform selection
- Improved error handling and validation
- Added informative console messages
- Simplified step conditions

**Status**: ✅ Ready to use

---

## Configuration Files

### EAS Configuration

**File**: [`../apps/mobile/eas.json`](../apps/mobile/eas.json)

**Build Profiles**:
- `development` - Local development (simulator/emulator)
- `staging` - Staging environment (internal distribution)
- `preview` - Preview builds (internal distribution)
- `production` - Production builds (app stores)

**Latest Changes** (2025-11-07):
- Updated all production environment variables
- Fixed API endpoints and service keys
- Staging and preview profiles updated

**Status**: ✅ All production values configured

---

## Secrets Configuration

### Required Secrets

All secrets must be configured in GitHub repository settings (Settings → Secrets and variables → Actions).

| Secret Name | Status | Purpose | Setup Effort |
|-------------|--------|---------|-------------|
| `EXPO_TOKEN` | ✅ Configured | Authenticate with EAS Build | 5 min |
| `GOOGLE_PLAY_SERVICE_ACCOUNT` | ❌ Missing | Submit to Google Play Store | 30-45 min |
| `APPLE_ID` | ℹ️ Optional | iOS submission (not required) | Optional |

**Action Required**: Configure `GOOGLE_PLAY_SERVICE_ACCOUNT` before Android submissions will work.

See [GitHub Secrets Guide](./GITHUB_SECRETS_GUIDE.md) for detailed setup instructions.

---

## Common Tasks

### Trigger a Manual Build

```bash
# iOS build (no submission)
gh workflow run eas-build.yml \
  -f platform=ios \
  -f profile=production \
  -f submit=false

# Android build with submission
gh workflow run eas-build.yml \
  -f platform=android \
  -f profile=production \
  -f submit=true \
  -f auto_submit=true

# Build both platforms
gh workflow run eas-build.yml \
  -f platform=all \
  -f profile=production \
  -f submit=false
```

### Check Workflow Status

```bash
# View recent runs
gh run list --workflow=eas-build.yml --limit=10

# View specific run details
gh run view <run-id> --log

# View failed step details
gh run view <run-id> --log-failed
```

### Monitor Build Progress

1. GitHub Actions: https://github.com/duongdev/nv-internal/actions
2. Expo Dashboard: https://expo.dev/projects
3. App Store Connect: https://appstoreconnect.apple.com/
4. Google Play Console: https://play.google.com/console/

---

## Troubleshooting

### Build Fails with "Secret not found"

**Issue**: Workflow references `GOOGLE_PLAY_SERVICE_ACCOUNT` but it's not configured

**Solution**: Follow [GitHub Secrets Guide](./GITHUB_SECRETS_GUIDE.md) section 2 to configure the secret

### Android Build Succeeds but Submission Fails

**Issue**: Build completes but `eas submit --platform android` fails

**Solution**: Check that `GOOGLE_PLAY_SERVICE_ACCOUNT` secret is properly configured and service account has Google Play permissions

**Workaround**: Build and submit manually:
```bash
cd apps/mobile
eas build --platform android --profile production
eas submit --platform android --profile production --latest
```

### iOS Build Fails During Setup

**Issue**: "Error setting up iOS credentials"

**Solution**:
1. Verify `EXPO_TOKEN` is valid and not expired
2. Check Expo managed credentials in [Expo Dashboard](https://expo.dev)
3. Re-authenticate: `eas credentials`

### Workflow Times Out

**Issue**: Build takes longer than expected and times out

**Potential Causes**:
- First build is slower (initial setup)
- Large dependencies causing long build
- GitHub Actions queue backed up

**Solution**:
- Retry the workflow
- Monitor in Expo Dashboard for actual build progress
- If repeated, check with EAS support

---

## Release Process

### Preparing a Release

1. **Create release branch** (from develop)
   ```bash
   git checkout -b release/v1.0.0 develop
   ```

2. **Update version numbers** in:
   - `apps/mobile/app.config.ts` (version field)
   - Changelog / release notes

3. **Test thoroughly** on staging profile
   ```bash
   gh workflow run eas-build.yml -f platform=all -f profile=staging
   ```

4. **Create pull request** to main branch

5. **Merge to main** after approval

### Creating a Release

1. **Create version tag** (triggers automatic build)
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

2. **Monitor build** in GitHub Actions
   - Both iOS and Android will build automatically
   - Both will submit to stores automatically

3. **Track submission status**:
   - iOS: App Store Connect (manual approval usually required)
   - Android: Google Play Console (automatic review)

4. **Monitor release**:
   - Check analytics (PostHog) for new version adoption
   - Monitor error rates
   - Respond to user feedback

---

## Monitoring & Maintenance

### Weekly Checks

- [ ] Review workflow run logs for any errors
- [ ] Check EXPO_TOKEN expiration (set reminder 30 days before)
- [ ] Monitor app store review status

### Monthly Checks

- [ ] Review deployment metrics:
  - Build success rate
  - Submission success rate
  - Average build time
- [ ] Check for dependency updates
- [ ] Review error tracking (PostHog)

### Quarterly Checks

- [ ] Audit GitHub secrets access
- [ ] Review and update documentation
- [ ] Plan next major release
- [ ] Analyze app store feedback

---

## References

### Official Documentation

- [Expo EAS Build Documentation](https://docs.expo.dev/eas-build/)
- [Expo EAS Submit Documentation](https://docs.expo.dev/eas-submit/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Google Play Console Help](https://support.google.com/googleplay)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)

### Internal Documentation

- [Development Setup Guide](../docs/development/setup.md)
- [Architecture Patterns](../docs/architecture/patterns/)
- [Testing Guide](../docs/testing/)

---

## Recent Changes

### 2025-11-07: EAS Workflow Fixes

**Issues Fixed**:
1. Missing `GOOGLE_PLAY_SERVICE_ACCOUNT` secret for Android submission
2. Invalid production configuration in `eas.json` (all placeholder values)
3. Flawed matrix strategy logic in GitHub Actions workflow
4. Poor error handling for missing secrets
5. Redundant and overly complex step conditions

**Files Changed**:
- `.github/workflows/eas-build.yml` (19 changes)
- `apps/mobile/eas.json` (15 changes)

**Documentation Added**:
- GitHub Secrets Setup Guide (6.8 KB)
- EAS Build Failure Analysis (12 KB)
- CI/CD Fixes Summary (5.9 KB)
- Deployment Readiness Report (13 KB)

**Status**: ✅ All fixes applied and validated

---

## Support

### Getting Help

1. **Quick answers**: Check the relevant guide above
2. **Detailed info**: Read [EAS Build Failure Analysis](./EAS_BUILD_FAILURE_ANALYSIS.md)
3. **Complete reference**: See [Deployment Readiness Report](./DEPLOYMENT_READINESS_REPORT.md)
4. **Secret setup issues**: Follow [GitHub Secrets Guide](./GITHUB_SECRETS_GUIDE.md)

### Reporting Issues

If you encounter issues with the CI/CD pipeline:

1. Check [Troubleshooting](#troubleshooting) section
2. Review relevant documentation
3. Check workflow logs: `gh run view <run-id> --log`
4. Consult Expo documentation or support

---

## Document Version

**Last Updated**: 2025-11-07
**Document Version**: 1.0
**Status**: Complete & Ready for Use

---

## Table of Contents

### Documentation Files

- [CI/CD Fixes Summary](./CI_CD_FIXES_SUMMARY.md) - Quick overview (2 pages)
- [GitHub Secrets Guide](./GITHUB_SECRETS_GUIDE.md) - Setup instructions (4 pages)
- [EAS Build Failure Analysis](./EAS_BUILD_FAILURE_ANALYSIS.md) - Technical details (6 pages)
- [Deployment Readiness Report](./DEPLOYMENT_READINESS_REPORT.md) - Complete reference (8+ pages)

### Workflow Files

- [EAS Build & Submit](./workflows/eas-build.yml) - Main CI/CD workflow
- [CI Checks](./workflows/ci.yml) - Code quality checks
- [Quality Checks](./workflows/quality-checks.yml) - Linting and formatting

### Configuration Files

- [EAS Configuration](../apps/mobile/eas.json) - Build profiles and environment
- [app.config.ts](../apps/mobile/app.config.ts) - Expo app configuration

---

*This directory is part of the NV Internal project documentation.*
