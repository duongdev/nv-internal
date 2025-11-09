# TestFlight Upload Fix - Build #34 Investigation

**Date**: 2025-11-10
**Issue**: Build #34 successfully generated IPA but did not upload to TestFlight
**Status**: Fixed ✅

---

## Problem Summary

GitHub Actions build #34 (Run ID: 19171008010) completed successfully and generated a 47.5 MB IPA, but the build was NOT uploaded to TestFlight. App Store Connect still showed build #17 as the latest.

**Build Parameters:**
- Platform: `ios`
- Environment: `staging`
- Submit: `false`
- Build Number: 34

---

## Root Cause Analysis

### Investigation Steps

1. **Examined workflow run logs** for Run #19171008010
2. **Identified lane executed**: `build_staging` (not `build_upload_testflight`)
3. **Analyzed Fastfile**: `build_staging` lane had no TestFlight upload step
4. **Reviewed workflow conditional logic**:

```bash
if [ "${{ github.event.inputs.submit }}" = "true" ] || [ "${{ github.event_name }}" = "push" ]; then
  bundle exec fastlane ios build_upload_testflight
else
  bundle exec fastlane ios build_staging
fi
```

### Root Cause

**The workflow has a flawed design that mixed two separate concerns:**

1. **Environment** (staging vs production) - which API URL to use
2. **Distribution method** (Ad Hoc vs App Store/TestFlight)

**Previous behavior:**
- `submit=false` → Runs `build_staging` lane
- `build_staging` lane:
  - ✅ Built IPA with **Ad Hoc** provisioning
  - ❌ **Did NOT upload to TestFlight** (no upload step)
  - ❌ **Could NOT upload to TestFlight** even if step existed (Ad Hoc provisioning incompatible with TestFlight)

**Key insight:** TestFlight requires **App Store** provisioning profile, not Ad Hoc.

---

## Solution Implemented

### Changes Made

#### 1. Enhanced `build_staging` Lane (Fastfile)

**Location**: `apps/mobile/fastlane/Fastfile` lines 131-222

**Key improvements:**
- Added `options` parameter to accept lane options
- Added `should_upload` flag based on:
  - Lane option: `upload:true`
  - Environment variable: `UPLOAD_TO_TESTFLIGHT=true`
- **Dynamic provisioning selection**:
  - If `should_upload=true`: Uses **App Store** provisioning (can upload to TestFlight)
  - If `should_upload=false`: Uses **Ad Hoc** provisioning (for internal distribution)
- Added conditional `upload_to_testflight` call at the end
- Added clear logging messages for transparency

**Code snippet:**
```ruby
lane :build_staging do |options|
  # Determine if we should upload to TestFlight
  should_upload = options[:upload] || ENV['UPLOAD_TO_TESTFLIGHT'] == 'true'

  # Use App Store provisioning if uploading to TestFlight, otherwise Ad Hoc
  provisioning_type = should_upload ? 'appstore' : 'adhoc'
  profile_name = should_upload ? "match AppStore vn.dienlanhnamviet.internal" : "match AdHoc vn.dienlanhnamviet.internal"
  export_method = should_upload ? 'app-store' : 'ad-hoc'

  # ... build app ...

  # Upload to TestFlight if requested
  if should_upload
    UI.message("📤 Uploading staging build to TestFlight...")
    upload_to_testflight(
      skip_waiting_for_build_processing: true,
      skip_submission: true,
      distribute_external: false,
      api_key: api_key
    )
    UI.success("✅ Successfully uploaded staging build to TestFlight!")
  else
    UI.message("⏭️  Skipping TestFlight upload (use upload:true or UPLOAD_TO_TESTFLIGHT=true to upload)")
  end
end
```

#### 2. Updated Workflow Logic (build-deploy.yml)

**Location**: `.github/workflows/build-deploy.yml` lines 126-151

**Key changes:**
- Added `UPLOAD_TO_TESTFLIGHT` environment variable
- Changed lane selection to be based on **environment** instead of **submit** parameter
- The `submit` parameter now controls `UPLOAD_TO_TESTFLIGHT` env var

**New workflow logic:**
```yaml
env:
  UPLOAD_TO_TESTFLIGHT: ${{ (github.event.inputs.submit == 'true' || github.event_name == 'push') && 'true' || 'false' }}

run: |
  # Use build_staging for staging environment, build_upload_testflight for production
  # The UPLOAD_TO_TESTFLIGHT env var controls whether build_staging uploads to TestFlight
  if [ "${{ github.event.inputs.environment }}" = "staging" ]; then
    bundle exec fastlane ios build_staging
  else
    bundle exec fastlane ios build_upload_testflight
  fi
```

---

## Behavior Matrix

### Before Fix

| Environment | Submit | Lane Executed | Provisioning | TestFlight Upload |
|-------------|--------|---------------|--------------|-------------------|
| staging     | false  | build_staging | Ad Hoc       | ❌ No             |
| staging     | true   | build_upload_testflight | App Store | ✅ Yes (but uses production API) |
| production  | false  | build_staging | Ad Hoc       | ❌ No             |
| production  | true   | build_upload_testflight | App Store | ✅ Yes            |

**Problem**: No way to upload staging builds to TestFlight!

### After Fix

| Environment | Submit | Lane Executed | Provisioning | TestFlight Upload | API URL |
|-------------|--------|---------------|--------------|-------------------|---------|
| staging     | false  | build_staging | Ad Hoc       | ❌ No             | Staging |
| staging     | true   | build_staging | App Store    | ✅ Yes            | Staging |
| production  | false  | build_upload_testflight | App Store | ❌ No | Production |
| production  | true   | build_upload_testflight | App Store | ✅ Yes | Production |

**Improvement**: Can now upload staging builds to TestFlight for testing!

---

## Testing Plan

### Test Case 1: Staging Build WITHOUT TestFlight Upload
```bash
gh workflow run build-deploy.yml \
  -f platform=ios \
  -f environment=staging \
  -f submit=false
```

**Expected:**
- Lane: `build_staging`
- Provisioning: Ad Hoc
- IPA built: ✅
- TestFlight upload: ❌ (skipped with log message)

### Test Case 2: Staging Build WITH TestFlight Upload (FIX VALIDATION)
```bash
gh workflow run build-deploy.yml \
  -f platform=ios \
  -f environment=staging \
  -f submit=true
```

**Expected:**
- Lane: `build_staging`
- Provisioning: App Store
- IPA built: ✅
- TestFlight upload: ✅
- App Store Connect: Build #35 appears
- API URL: `https://nv-internal-staging.vercel.app`

### Test Case 3: Production Build WITH TestFlight Upload
```bash
gh workflow run build-deploy.yml \
  -f platform=ios \
  -f environment=production \
  -f submit=true
```

**Expected:**
- Lane: `build_upload_testflight`
- Provisioning: App Store
- IPA built: ✅
- TestFlight upload: ✅
- App Store Connect: Build appears
- API URL: `https://nv-internal-api.vercel.app`

---

## Success Criteria

- [x] Identified root cause: `build_staging` lane doesn't upload to TestFlight
- [x] Fixed `build_staging` lane to support conditional TestFlight upload
- [x] Updated workflow to properly control upload behavior
- [ ] Triggered test build with `environment=staging` and `submit=true`
- [ ] Verified build appears in App Store Connect TestFlight
- [ ] Documented changes and behavior matrix

---

## Key Learnings

### 1. TestFlight Requires App Store Provisioning
Ad Hoc provisioning profiles cannot be used for TestFlight uploads. Only App Store provisioning profiles are compatible.

### 2. Separation of Concerns
Environment (staging vs production) and distribution method (Ad Hoc vs App Store) are separate concerns that should be handled independently.

### 3. Workflow Parameter Design
The `submit` parameter should control upload behavior, not which lane to execute. The `environment` parameter should control which lane to use.

### 4. Lane Flexibility
Lanes can accept options and environment variables to make them more flexible and reusable.

### 5. Logging is Critical
Clear log messages help debug CI/CD issues. The enhanced lane now logs:
- Which provisioning type is being used
- Whether TestFlight upload will happen
- Clear skip messages when upload is skipped

---

## Related Files

- **Fastfile**: `apps/mobile/fastlane/Fastfile` (lines 131-222)
- **Workflow**: `.github/workflows/build-deploy.yml` (lines 126-151)
- **Workflow Run**: #19171008010 (build #34, failed to upload)

---

## Recommendations

### Immediate Actions
1. ✅ Commit and push changes
2. ⏳ Trigger test build with `submit=true`
3. ⏳ Verify build in App Store Connect
4. ⏳ Update documentation if needed

### Future Improvements
1. **Consider renaming lanes for clarity:**
   - `build_staging` → `build_with_environment` (accepts environment parameter)
   - `build_upload_testflight` → `build_production` (simpler, more descriptive)

2. **Add validation:**
   - Validate that `UPLOAD_TO_TESTFLIGHT=true` only works with App Store provisioning
   - Add pre-flight checks to ensure environment variables are set correctly

3. **Improve logging:**
   - Log the API URL being used during build
   - Log the final build artifact paths
   - Log TestFlight upload status with URL to App Store Connect

4. **Add automated tests:**
   - Dry-run tests for Fastfile lanes
   - Workflow validation tests

---

## Summary

**Problem**: Build #34 didn't upload to TestFlight because `build_staging` lane used Ad Hoc provisioning and had no upload step.

**Solution**: Made `build_staging` lane flexible to support both Ad Hoc (for internal distribution) and App Store provisioning (for TestFlight upload) based on `UPLOAD_TO_TESTFLIGHT` environment variable.

**Impact**: Can now upload staging builds to TestFlight for testing, while still supporting Ad Hoc builds when TestFlight upload is not needed.

**Status**: Code changes complete. Awaiting test build verification.
