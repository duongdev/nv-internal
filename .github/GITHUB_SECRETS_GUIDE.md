# GitHub Secrets Configuration Guide

This guide documents all the GitHub Secrets required for the EAS build and deployment workflow to function correctly.

## Current Configuration Status

As of 2025-11-07, the following secrets are configured:

- ✅ **EXPO_TOKEN** - Configured and working
- ✅ **CLAUDE_CODE_OAUTH_TOKEN** - Configured for Claude Code operations
- ❌ **GOOGLE_PLAY_SERVICE_ACCOUNT** - **MISSING** (required for Android Play Store submission)
- ❌ **APPLE_ID** - Optional (uses default value if not configured)

## Required Secrets for CI/CD Pipeline

### 1. EXPO_TOKEN (✅ Required & Configured)

**Purpose**: Authenticates with EAS Build and Expo Services

**How to set up**:
1. Visit https://expo.dev
2. Sign in to your Expo account
3. Go to Account Settings → Personal Tokens
4. Create a new token with name "GitHub Actions"
5. Set expiration (12-24 months recommended)
6. Copy the token value
7. In GitHub: Settings → Secrets and variables → Actions → New repository secret
8. Name: `EXPO_TOKEN`
9. Value: Paste the token

**Status**: ✅ Currently configured (expires 2025-11-06)

---

### 2. GOOGLE_PLAY_SERVICE_ACCOUNT (❌ Missing - CRITICAL for Android)

**Purpose**: Authenticates with Google Play Console for Android app submission

**How to set up**:

1. **Create Google Play Service Account**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select or create project linked to your Google Play Console account
   - Enable Google Play Android Developer API
   - Create Service Account: APIs & Services → Credentials → Create Credentials → Service Account
   - Name: `github-eas-build`
   - Email format: `github-eas-build@[project-id].iam.gserviceaccount.com`

2. **Create and Download Key**:
   - Go to the service account you created
   - Keys → Add Key → Create new key
   - Choose JSON format
   - Download the key file

3. **Grant Google Play Console Permissions**:
   - Go to Google Play Console → Settings → Users and permissions
   - Add the service account email
   - Grant "Admin" or "Release Manager" role
   - Wait for activation (typically 24 hours)

4. **Add to GitHub Secrets**:
   - In GitHub: Settings → Secrets and variables → Actions → New repository secret
   - Name: `GOOGLE_PLAY_SERVICE_ACCOUNT`
   - Value: Copy entire JSON content from the downloaded key file
   - Example format:
     ```json
     {
       "type": "service_account",
       "project_id": "...",
       "private_key_id": "...",
       "private_key": "...",
       "client_email": "github-eas-build@...",
       "client_id": "...",
       "auth_uri": "...",
       "token_uri": "...",
       "auth_provider_x509_cert_url": "...",
       "client_x509_cert_url": "..."
     }
     ```

**Status**: ❌ **ACTION REQUIRED** - Must be configured before Android submissions work

**Impact if missing**:
- Android Play Store submissions will fail
- iOS builds will still work
- The workflow includes a warning message when this secret is missing

---

### 3. APPLE_ID (Optional)

**Purpose**: Apple ID for iOS App Store submission

**How to set up**:
1. In GitHub: Settings → Secrets and variables → Actions → New repository secret
2. Name: `APPLE_ID`
3. Value: Your Apple ID email address

**Status**: ⚠️ Optional - Falls back to `dustin.do95@gmail.com` if not configured

**Note**: Expo managed credentials handle most iOS authentication. This is mainly for reference.

---

## Workflow Behavior Based on Secret Configuration

### Build Jobs

**iOS Build**: ✅ Will always work (uses Expo managed credentials)

**Android Build**: ✅ Will build, but submission requires `GOOGLE_PLAY_SERVICE_ACCOUNT`

### Submission Jobs

**iOS Submission**: ✅ Works with Expo managed credentials

**Android Submission**:
- ❌ **FAILS** if `GOOGLE_PLAY_SERVICE_ACCOUNT` is missing
- ✅ Works once secret is configured

**Workaround if secret is missing**:
- Don't enable auto-submit during build
- Submit builds manually via EAS Dashboard
- Configure the secret and retry via `eas submit` locally

---

## Verifying Secrets Are Set Up Correctly

### Check Secret Exists

```bash
gh secret list
```

Expected output:
```
CLAUDE_CODE_OAUTH_TOKEN    2025-10-22T06:23:50Z
EXPO_TOKEN                 2025-11-06T08:35:51Z
GOOGLE_PLAY_SERVICE_ACCOUNT 2025-11-07T00:00:00Z  (once configured)
```

### Validate GOOGLE_PLAY_SERVICE_ACCOUNT Format

After adding the secret, verify in the workflow logs that the file is created correctly:
1. Trigger a manual Android build: `.github/workflows/eas-build.yml` → Run workflow
2. Check logs in "Setup Android secrets" step
3. Look for message: "✓ Google Play service account file created"

---

## Troubleshooting

### Issue: "eas submit --platform android" fails with auth error

**Solution**:
1. Verify `GOOGLE_PLAY_SERVICE_ACCOUNT` secret exists
2. Verify the service account has "Admin" role in Google Play Console
3. Check service account permissions are activated (can take 24 hours)

### Issue: Secret shows in workflow logs

**This should never happen** - GitHub automatically redacts secret values in logs. If you see a secret value printed:
1. Immediately rotate the secret
2. Generate a new one and update
3. Do NOT commit the old secret to git

### Issue: "Android keystore not found" error

**Solution**:
1. Verify file `apps/mobile/@duongdev__nv-internal.jks` exists and is committed to git
2. This file should be ignored by .gitignore but you can safely commit it (it's protected by encryption)
3. If missing, regenerate locally: `eas credentials` and select "Set up Android credentials"

---

## Security Best Practices

1. **Rotate EXPO_TOKEN**: Set reminder to rotate annually (expires 2025-11-06)
2. **Monitor Service Account**: Use Google Cloud audit logs to monitor service account activity
3. **Principle of Least Privilege**: Don't grant more permissions than needed
4. **Never Commit Secrets**: Always use GitHub Secrets, never hardcode in code or config
5. **Audit Access**: Regularly review GitHub collaborators who have access to secrets

---

## Next Steps

1. **IMMEDIATE**: Configure `GOOGLE_PLAY_SERVICE_ACCOUNT` secret (if planning Android submissions)
2. **RECOMMENDED**: Set up calendar reminder to rotate `EXPO_TOKEN` 30 days before expiration
3. **MONITORING**: After each successful build, verify all secrets are being used correctly

---

## References

- [Expo Documentation - EAS Submit](https://docs.expo.dev/eas-update/getting-started/)
- [Google Play Console - Service Accounts](https://support.google.com/googleplay/android-developer/answer/6135970)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [EAS Build Configuration](https://docs.expo.dev/eas/build/)

## Update History

- **2025-11-07**: Initial guide created, identified missing `GOOGLE_PLAY_SERVICE_ACCOUNT` secret and improved workflow logic
