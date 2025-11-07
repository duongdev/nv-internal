# Fix Production Build Crash - EAS Secrets Configuration

**Created**: 2025-11-07
**Status**: ✅ Configuration Complete - Awaiting EAS Secrets Setup
**Priority**: CRITICAL
**Affects**: Production TestFlight builds

## Problem Analysis

### Issue Description
The TestFlight production build crashes immediately on startup. Users cannot authenticate because the app is using placeholder environment variables instead of real API keys.

### Root Cause
1. **eas.json** contained placeholder values for sensitive environment variables (Clerk keys, Google Maps keys, PostHog keys)
2. When EAS Build runs via GitHub Actions, these placeholders are embedded in the compiled app binary
3. Clerk SDK fails to initialize with invalid key format, causing app crash on startup
4. No mechanism in GitHub Actions workflow to inject real secrets (EAS Build doesn't support CLI flag overrides)

### Evidence
- File: `apps/mobile/eas.json` lines 82-89 (production profile)
- Placeholder values: `"pk_live_your_production_clerk_key_here"`, etc.
- Recent environment variable refactoring (commit `a4667bf`) maintained placeholders
- GitHub Actions workflow has no step to inject real environment variables

## Solution Architecture

### Key Understanding: EAS Secrets System

**Important Discovery**: EAS Build does NOT use GitHub Secrets or support CLI environment variable overrides. Instead, it uses its own secret management system called **EAS Secrets**.

**How it works**:
```
GitHub Actions Trigger
        ↓
EAS Build (Expo Servers)
        ↓
1. Reads eas.json profile configuration
2. Fetches EAS Secrets from Expo servers
3. Merges secrets with eas.json env object
4. Builds app with real values injected
```

**Environment Variable Priority** (highest to lowest):
1. **EAS Secrets** (stored on EAS servers) ← **USE THIS**
2. `eas.json` env configuration (for non-sensitive values)

### Solution Components

1. **Create EAS Secrets** for all sensitive production values
2. **Remove placeholder secrets** from eas.json (keep non-sensitive config)
3. **No GitHub Actions changes** needed (workflow already correct)
4. **Document setup process** for team

## Implementation

### Changes Made

#### 1. Updated eas.json Configuration

**File**: `/apps/mobile/eas.json`

**Changes to production profile**:
```diff
  "env": {
    "EXPO_PUBLIC_ENV": "production",
    "EXPO_PUBLIC_API_URL": "https://nv-internal-api.vercel.app",
-   "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_your_production_clerk_key_here",
-   "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS": "your_google_maps_ios_key_here",
-   "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID": "your_google_maps_android_key_here",
-   "EXPO_PUBLIC_POSTHOG_API_KEY": "phc_your_posthog_project_key_here",
+   "EXPO_PUBLIC_POSTHOG_HOST": "https://app.posthog.com",
    "EXPO_PUBLIC_POSTHOG_ENABLED": "true"
  }
```

**Rationale**:
- Removed all sensitive API keys (Clerk, Google Maps, PostHog)
- Kept non-sensitive configuration (URLs, feature flags)
- Added PostHog host for clarity (public URL, not sensitive)

**Also updated**:
- `staging` profile (same changes)
- `preview` profile (same changes)
- `development` profile kept as-is (uses local/test values)

#### 2. Created Documentation

**Files Created**:

1. **`.claude/docs/eas-secrets-configuration.md`** (14KB)
   - Comprehensive guide to EAS Secrets system
   - Step-by-step setup instructions (dashboard and CLI methods)
   - Security best practices
   - Troubleshooting guide
   - Migration checklist

2. **`.claude/docs/PRODUCTION-BUILD-FIX-QUICKSTART.md`** (6KB)
   - Quick-start guide for immediate action
   - 5-step setup process
   - Troubleshooting common issues
   - Success criteria checklist

### Required EAS Secrets

The following secrets must be created on EAS servers (via Expo Dashboard or CLI):

| Secret Name | Environment | Visibility | Description |
|-------------|-------------|------------|-------------|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | production | secret | Production Clerk key (pk_live_*) |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS` | production | secret | Google Maps iOS key |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID` | production | secret | Google Maps Android key |
| `EXPO_PUBLIC_POSTHOG_API_KEY` | production | secret | PostHog project key (phc_*) |

**Note**: These secrets must also be created for `staging` environment with test keys (not production keys).

## Testing Strategy

### Pre-Deployment Testing

**Cannot test locally** - EAS Secrets only work on EAS Build servers. Local builds will fail without secrets.

**Alternative**: Test with development profile that uses local .env values.

### Post-Deployment Verification

1. **Trigger production build** via GitHub Actions or git tag
2. **Monitor EAS Build logs** for successful secret injection
3. **Download TestFlight build** when complete
4. **Test checklist**:
   - [ ] App launches without crashing
   - [ ] Clerk authentication works (login/signup)
   - [ ] Google Maps displays correctly (both platforms)
   - [ ] PostHog events are tracked (check dashboard)
   - [ ] No error messages related to invalid keys

## Security Improvements

### Before
- ❌ Placeholder secrets committed to git (public repository)
- ❌ No distinction between sensitive and non-sensitive values
- ❌ No documentation of secret management process
- ❌ Risk of accidentally committing real secrets

### After
- ✅ All sensitive secrets stored on EAS servers (encrypted)
- ✅ Secrets never appear in git history
- ✅ Clear separation: eas.json (public config) vs EAS Secrets (sensitive keys)
- ✅ Documented setup and rotation process
- ✅ Visibility controls prevent accidental exposure

## Migration Guide for Team

### For Developers

**No action required for local development** - Development profile still uses local .env or placeholders.

**For production deployments**:
1. Read quick-start guide: `.claude/docs/PRODUCTION-BUILD-FIX-QUICKSTART.md`
2. Obtain production API keys from respective services
3. Create EAS Secrets via Expo Dashboard (one-time setup)
4. Trigger builds as usual (GitHub Actions or `eas build` command)

### For DevOps/Admins

**One-time setup** (approximately 10 minutes):
1. Gather all production API keys (Clerk, Google Maps, PostHog)
2. Access Expo Dashboard → nv-internal → Environment Variables
3. Create 4 secrets for production environment (as documented)
4. Verify secrets are created with correct visibility (secret)
5. Trigger test build to verify configuration
6. Document secret rotation schedule (recommended: quarterly)

## Rollback Plan

If issues occur after migration:

1. **Immediate**: Revert eas.json changes (add placeholders back)
2. **Short-term**: Use local .env.production file with `eas build --local` command
3. **Long-term**: Debug EAS Secrets configuration and retry

**Note**: Rollback is low-risk because GitHub Actions workflow wasn't modified.

## Additional Considerations

### Cost Impact
- **EAS Secrets**: Free (included in all Expo plans)
- **No additional charges** for secret storage or usage

### Maintenance
- **Secret Rotation**: Recommended quarterly
- **Access Control**: Only project admins can view/edit secrets
- **Audit Trail**: Expo Dashboard shows secret creation/modification history

### Future Improvements
1. **Automate secret rotation** with scripts
2. **Add staging secrets** for preview builds
3. **Document secret rotation process** in team wiki
4. **Set up monitoring** for failed builds due to invalid keys

## Dependencies

### External Services
- Clerk Dashboard (for production publishable key)
- Google Cloud Console (for Maps API keys)
- PostHog Dashboard (for project API key)
- Expo Dashboard (for EAS Secrets management)

### Internal Dependencies
- No code changes required in mobile app
- No changes to GitHub Actions workflow
- No changes to API or backend services

## Verification Checklist

Before marking this task complete:

- [x] eas.json updated (placeholders removed)
- [x] Comprehensive documentation created
- [x] Quick-start guide created
- [x] Security best practices documented
- [x] Troubleshooting guide provided
- [ ] EAS Secrets created on Expo servers (user action required)
- [ ] Production build triggered and tested (user action required)
- [ ] TestFlight app verified working (user action required)

## Success Metrics

**Definition of Done**:
1. Production build completes successfully on EAS
2. TestFlight app launches without crashes
3. All integrations work (Clerk, Google Maps, PostHog)
4. No placeholder values in production builds
5. Documentation accessible to team
6. Secret rotation process documented

## Lessons Learned

### Key Insights
1. **EAS Build architecture**: GitHub Secrets ≠ EAS Secrets. They are separate systems.
2. **No CLI overrides**: EAS CLI doesn't support `--set-env` flags for environment variables
3. **Security by design**: EAS Secrets never appear in logs, dashboard, or CLI output
4. **Build-time injection**: Secrets are resolved during build, not at runtime
5. **Environment-specific**: Secrets can be scoped to development/staging/production

### Process Improvements
1. **Earlier validation**: Check for placeholder values in CI/CD before building
2. **Documentation first**: Document secret requirements before deployment
3. **Staging testing**: Test with staging secrets before production deployment
4. **Monitoring**: Set up alerts for build failures due to missing/invalid secrets

## References

### Internal Documentation
- EAS Secrets Configuration Guide: `.claude/docs/eas-secrets-configuration.md`
- Quick-Start Guide: `.claude/docs/PRODUCTION-BUILD-FIX-QUICKSTART.md`
- Environment Variable Refactoring: `.claude/tasks/20251107-100000-environment-variable-refactoring.md`

### External Resources
- [EAS Environment Variables](https://docs.expo.dev/eas/environment-variables/)
- [EAS Secrets Documentation](https://docs.expo.dev/build-reference/variables/)
- [Clerk Environment Variables](https://clerk.com/docs/deployments/clerk-environment-variables)
- [Google Maps API Keys](https://developers.google.com/maps/documentation/embed/get-api-key)
- [PostHog API Keys](https://posthog.com/docs/api)

---

**Status Update Log**:
- 2025-11-07 14:00 UTC: Issue identified and analyzed
- 2025-11-07 14:30 UTC: Solution researched (EAS Secrets system)
- 2025-11-07 15:00 UTC: eas.json updated, documentation created
- 2025-11-07 15:30 UTC: Configuration complete, awaiting user setup of EAS Secrets
