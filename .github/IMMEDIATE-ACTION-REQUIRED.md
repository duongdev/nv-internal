# ⚠️ IMMEDIATE ACTION REQUIRED

**Date**: 2025-11-07
**Severity**: 🔴 CRITICAL
**Time Required**: ~30 minutes

---

## 🚨 What Happened

Your repository is **PUBLIC** and contained **REAL API KEYS** in `apps/mobile/eas.json`.

These credentials are now exposed and need to be rotated **immediately**.

---

## ✅ What's Been Fixed

1. ✅ Real credentials removed from `eas.json` (replaced with placeholders)
2. ✅ GitHub Actions workflow fixed (expo-router dependency issue)
3. ✅ Security warning added to `CLAUDE.md`
4. ✅ Complete incident response guide created

---

## 🔴 What You MUST Do Now (30 minutes)

### Step 1: Rotate Clerk API Keys (10 min)

1. Go to https://dashboard.clerk.com
2. Select your NV Internal application
3. Navigate to **API Keys**
4. Click **Regenerate** for:
   - ✅ Publishable Key (Test) - Used in staging/preview
   - ✅ Publishable Key (Live) - Used in production
5. **SAVE THE NEW KEYS SECURELY** (password manager!)

---

### Step 2: Rotate Google Maps API Key (10 min)

1. Go to https://console.cloud.google.com/apis/credentials
2. Delete the exposed key
3. Create new restricted key
4. **SAVE THE NEW KEY**

---

### Step 3: Rotate PostHog API Key (5 min)

1. Go to your PostHog dashboard
2. Navigate to **Project Settings**
3. Click **Reset Project API Key**
4. **SAVE THE NEW KEY**

---

### Step 4: Update GitHub Secrets (5 min)

Go to: https://github.com/duongdev/nv-internal/settings/secrets/actions

Add/update these secrets with NEW credentials.

---

## 📚 Complete Documentation

See `.github/` directory for full guides:
- `EAS_BUILD_FAILURE_ANALYSIS.md` - Technical fix details
- `GITHUB_SECRETS_GUIDE.md` - Secrets setup guide
- `CI_CD_FIXES_SUMMARY.md` - Quick reference

---

**IMPORTANT**: Do NOT commit new credentials. Use GitHub Secrets for CI/CD and `.env.local` for local development.
