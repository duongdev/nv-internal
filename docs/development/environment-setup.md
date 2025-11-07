# Environment Setup Guide

**Last Updated**: 2025-11-07

Complete guide to environment variable management and setup for the NV Internal project.

---

## Overview

The NV Internal project uses different environment variable strategies for API and Mobile apps:

- **API**: Standard `.env` files with Vercel integration
- **Mobile**: Expo's native environment management with build profiles

---

## API Environment Variables

### Development Setup

1. **Create `.env` file** in `apps/api/`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nv_internal"

# Clerk Authentication
CLERK_SECRET_KEY="sk_test_..."
CLERK_PUBLISHABLE_KEY="pk_test_..."

# Vercel (for local development)
VERCEL_URL="localhost:3000"
```

2. **Never commit `.env` files**:

The `.gitignore` already excludes `.env` files:
```gitignore
.env
.env.local
.env.*.local
```

3. **Use `.env.example`** as template:

```bash
# Copy example and fill in real values
cp apps/api/.env.example apps/api/.env
```

### Production Setup (Vercel)

Add environment variables through Vercel dashboard:

1. Go to project settings → Environment Variables
2. Add variables for Production, Preview, Development
3. Vercel automatically injects them at build/runtime

**Security**: Never commit production secrets to Git

---

## Mobile Environment Variables

### Expo's Native Environment Pattern

**Established**: 2025-11-07

The mobile app uses Expo's native environment management pattern:

#### Key Principles

1. **Single Variable Names**: Each environment variable has one name (e.g., `EXPO_PUBLIC_API_URL`)
2. **Build Profile Management**: Values are defined per build profile in `eas.json`
3. **No Runtime Switching**: Environment is determined at build time, not runtime
4. **Platform Exception**: Only Google Maps keys remain platform-specific (iOS/Android)

### Build Profiles Configuration

Located in `apps/mobile/eas.json`:

```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_API_URL": "http://localhost:3000",
        "EXPO_PUBLIC_POSTHOG_API_KEY": "phc_dev_key",
        "EXPO_PUBLIC_POSTHOG_HOST": "https://us.i.posthog.com"
      }
    },
    "staging": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://staging-api.example.com",
        "EXPO_PUBLIC_POSTHOG_API_KEY": "phc_staging_key",
        "EXPO_PUBLIC_POSTHOG_HOST": "https://us.i.posthog.com"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.example.com",
        "EXPO_PUBLIC_POSTHOG_API_KEY": "phc_prod_key",
        "EXPO_PUBLIC_POSTHOG_HOST": "https://us.i.posthog.com"
      }
    }
  }
}
```

### Accessing Environment Variables

```typescript
// ✅ CORRECT: Access directly (no suffixes or fallbacks)
const apiUrl = process.env.EXPO_PUBLIC_API_URL

// ✅ CORRECT: Platform-specific exception (Google Maps only)
const googleMapsKey = Platform.select({
  ios: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS,
  android: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID,
})

// ❌ WRONG: Don't use suffixes or runtime selection
const apiUrl = process.env[`EXPO_PUBLIC_API_URL_${env}`] // No!
```

### Why This Pattern?

**Before** (Anti-pattern):
- Multiple variables with suffixes (_DEV, _STAGING, _PROD)
- Runtime environment selection logic
- Confusing fallback chains
- Easy to misconfigure

**After** (Current pattern):
- Single variable names
- Build-time environment selection (via EAS profile)
- Clear, explicit configuration
- Harder to misconfigure

### Google Maps Platform-Specific Keys

Google Maps requires different keys for iOS and Android:

```typescript
// In app.config.ts
export default {
  ios: {
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS,
    },
  },
  android: {
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID,
      },
    },
  },
}
```

**Why platform-specific**:
- Google requires separate API keys for iOS and Android
- Keys are restricted by platform and bundle ID
- Security best practice

---

## Required Environment Variables

### API (apps/api/)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `CLERK_SECRET_KEY` | Clerk secret key for authentication | `sk_test_...` |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_test_...` |
| `VERCEL_URL` | Vercel deployment URL | `localhost:3000` (dev) |

### Mobile (apps/mobile/)

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | API base URL | `https://api.example.com` |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_test_...` |
| `EXPO_PUBLIC_POSTHOG_API_KEY` | PostHog project API key | `phc_...` |
| `EXPO_PUBLIC_POSTHOG_HOST` | PostHog host URL | `https://us.i.posthog.com` |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS` | Google Maps API key for iOS | `AIza...` |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID` | Google Maps API key for Android | `AIza...` |

---

## Local Development Setup

### Prerequisites

1. **Install pnpm**:
```bash
npm install -g pnpm
```

2. **Clone repository**:
```bash
git clone <repo-url>
cd nv-internal
```

3. **Install dependencies**:
```bash
pnpm install
```

### API Setup

1. **Start local PostgreSQL** (optional, can use Neon):
```bash
cd apps/api
docker-compose up -d
```

2. **Create `.env` file**:
```bash
cp apps/api/.env.example apps/api/.env
# Edit .env with your values
```

3. **Run migrations**:
```bash
cd apps/api
npx prisma migrate dev
```

4. **Start API server**:
```bash
# From project root
npx vc dev
```

### Mobile Setup

1. **No `.env` file needed** - uses `eas.json` configuration

2. **Update `eas.json`** if needed:
```bash
# Edit apps/mobile/eas.json
# Update development profile with your API URL
```

3. **Start Expo**:
```bash
cd apps/mobile
pnpm dev
```

4. **Run on device/simulator**:
```bash
# iOS
pnpm ios

# Android
pnpm android
```

---

## EAS Secrets Management

For sensitive values in `eas.json`, use EAS Secrets:

### Creating Secrets

```bash
# Navigate to mobile app
cd apps/mobile

# Create secret
eas secret:create --scope project --name SECRET_NAME --value "secret_value"

# List secrets
eas secret:list
```

### Using Secrets in eas.json

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.example.com",
        "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "$(CLERK_KEY_SECRET)"
      }
    }
  }
}
```

**Benefits**:
- Secrets not stored in Git
- Secure secret management
- Easy rotation

---

## Environment Variable Best Practices

### Security

✅ **DO**:
- Use `.env.example` with placeholder values
- Add secrets via EAS Secrets or Vercel Environment Variables
- Use different keys for development and production
- Rotate secrets regularly
- Validate environment variables at startup

❌ **DON'T**:
- Commit `.env` files to Git
- Share secrets in chat or email
- Use production secrets in development
- Hardcode secrets in source code
- Expose secrets in client-side code (except `EXPO_PUBLIC_*`)

### Naming Conventions

**API variables**:
```bash
DATABASE_URL           # Service name + purpose
CLERK_SECRET_KEY       # Service + key type
```

**Mobile variables** (must start with `EXPO_PUBLIC_`):
```bash
EXPO_PUBLIC_API_URL                     # Public variables
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY       # Exposed to client
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS     # Platform-specific
```

### Validation

Validate required environment variables at startup:

**API** (`apps/api/src/index.ts`):
```typescript
const requiredEnvVars = [
  'DATABASE_URL',
  'CLERK_SECRET_KEY',
  'CLERK_PUBLISHABLE_KEY',
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}
```

**Mobile** (`apps/mobile/app/_layout.tsx`):
```typescript
const requiredEnvVars = [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`)
  }
}
```

---

## Troubleshooting

### API Issues

**Problem**: `DATABASE_URL` not found
**Solution**: Create `.env` file in `apps/api/` with correct URL

**Problem**: Clerk authentication fails
**Solution**: Verify `CLERK_SECRET_KEY` is correct and not expired

**Problem**: Vercel deployment fails
**Solution**: Check environment variables in Vercel dashboard

### Mobile Issues

**Problem**: API calls fail with connection error
**Solution**: Check `EXPO_PUBLIC_API_URL` in `eas.json` for your build profile

**Problem**: Google Maps doesn't load
**Solution**: Verify platform-specific API keys are set and enabled in Google Cloud Console

**Problem**: Build fails with missing environment variables
**Solution**: Ensure all required variables are in `eas.json` for the build profile

---

## Migration Notes

### Environment Variable Refactoring (2025-11-07)

The mobile app was refactored from runtime environment selection to build-time profile selection:

**What Changed**:
- Removed suffixed variables (_DEV, _STAGING, _PROD)
- Removed runtime environment selection logic
- Added build profile configuration in `eas.json`
- Simplified variable access (no fallbacks needed)

**Migration**:
```typescript
// Before (removed)
const env = getEnvironment() // Returns 'development' | 'staging' | 'production'
const apiUrl = process.env[`EXPO_PUBLIC_API_URL_${env.toUpperCase()}`]

// After (current)
const apiUrl = process.env.EXPO_PUBLIC_API_URL // Value from build profile
```

**Reference**: `.claude/tasks/20251107-100000-environment-variable-refactoring.md`

---

## Related Documentation

- [Development Commands](./commands.md)
- [Setup Guide](./setup.md)
- [Deployment Guide](../../.claude/docs/deployment-guide.md) (if exists)

---

## Quick Reference

### API Environment Variables
```bash
# Copy example
cp apps/api/.env.example apps/api/.env

# Edit with real values
vim apps/api/.env
```

### Mobile Environment Variables
```bash
# Edit build profiles
vim apps/mobile/eas.json

# Build for specific environment
eas build --profile development
eas build --profile staging
eas build --profile production
```

### EAS Secrets
```bash
# Create secret
eas secret:create --scope project --name NAME --value "value"

# Use in eas.json
"EXPO_PUBLIC_KEY": "$(SECRET_NAME)"
```
