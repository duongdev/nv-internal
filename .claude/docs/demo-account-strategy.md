# Demo Account Strategy for Apple App Store Review

**App**: Nam Việt Internal
**Purpose**: Provide reviewers with full access to test all features
**Last Updated**: 2025-11-10
**Status**: Production-Ready

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Demo Account Specification](#demo-account-specification)
3. [Implementation Guide](#implementation-guide)
4. [Security Considerations](#security-considerations)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Apple Review Compliance](#apple-review-compliance)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Create Demo Account (First Time)

```bash
cd apps/api
npx tsx scripts/setup-demo-account.ts
```

### Reset Demo Account (Recreate Data)

```bash
npx tsx scripts/setup-demo-account.ts --reset
```

### Cleanup Demo Account (After Approval)

```bash
npx tsx scripts/setup-demo-account.ts --cleanup
```

---

## Demo Account Specification

### Account Credentials

| Field | Value | Notes |
|-------|-------|-------|
| **Email** | `applereview@namviet.app` | Distinctive, non-production domain |
| **Username** | `applereview` | Simple, easy to remember |
| **Password** | `AppleDemo2025!` | Strong, meets security requirements |
| **Phone** | `0999999999` | Distinctive test number |
| **Role** | `nvInternalWorker` | Full worker permissions |
| **First Name** | `Apple` | Clear demo identifier |
| **Last Name** | `Reviewer` | Clear purpose |

### Account Metadata

```json
{
  "phoneNumber": "0999999999",
  "roles": ["nv_internal_worker"],
  "defaultPasswordChanged": true,
  "isDemo": true,
  "purpose": "app-store-review",
  "createdAt": "2025-11-10T00:00:00Z"
}
```

### Why This Design?

1. **Email**: Uses `.app` TLD (trusted by Apple) with clear "review" purpose
2. **Password**: Strong (uppercase, lowercase, number, special char) but memorable
3. **Phone**: All 9s - clearly fake but valid format
4. **Metadata**: Flags account as demo for special handling
5. **Role**: Worker role gives access to all app features

---

## Implementation Guide

### 1. Automated Setup (Recommended)

The `setup-demo-account.ts` script handles everything:

**What It Does:**
- ✅ Creates user in Clerk with proper metadata
- ✅ Seeds 5 customers (Vietnamese names)
- ✅ Seeds 5 locations (real Ho Chi Minh City coordinates)
- ✅ Seeds 6 tasks (various statuses: PREPARING, READY, IN_PROGRESS, COMPLETED, ON_HOLD)
- ✅ Generates activity history (check-ins, completions)
- ✅ Creates payment records for completed tasks
- ✅ Sets proper search text for all entities
- ✅ Uses realistic Vietnamese data

**Run:**
```bash
cd apps/api
npx tsx scripts/setup-demo-account.ts
```

**Output:**
```
═══════════════════════════════════════════════════════
  DEMO ACCOUNT SETUP COMPLETE
═══════════════════════════════════════════════════════

📧 Email:     applereview@namviet.app
🔑 Password:  AppleDemo2025!
👤 User ID:   user_xxxxxxxxxxxxx

📊 Statistics:
   - 5 customers
   - 5 locations
   - 6 tasks
   - 2 completed tasks with payments

🎉 Demo account is ready for Apple App Review!
```

### 2. Manual Setup (If Needed)

<details>
<summary>Click to expand manual steps</summary>

#### Step 2.1: Create User in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Users** → **Create User**
3. Fill in:
   - Email: `applereview@namviet.app`
   - Username: `applereview`
   - Password: `AppleDemo2025!`
   - First Name: `Apple`
   - Last Name: `Reviewer`
4. Set Public Metadata:
   ```json
   {
     "phoneNumber": "0999999999",
     "roles": ["nv_internal_worker"],
     "defaultPasswordChanged": true,
     "isDemo": true,
     "purpose": "app-store-review"
   }
   ```

#### Step 2.2: Run Seed Script

```bash
# Get user ID from Clerk Dashboard
export DEMO_USER_ID="user_xxxxxxxxxxxxx"

# Run seeding (use the automated script)
npx tsx scripts/setup-demo-account.ts
```

</details>

### 3. Test Data Structure

**Customers (5):**
- Công ty TNHH ABC (0901234567)
- Văn phòng XYZ (0907654321)
- Nguyễn Văn An (0909876543)
- Trần Thị Bình (0912345678)
- Lê Văn Cường (0923456789)

**Locations (5 in Ho Chi Minh City):**
- District 1: Nguyễn Huệ (10.7731, 106.7020)
- District 3: Lê Lai (10.7693, 106.6819)
- District 10: Cách Mạng Tháng 8 (10.7726, 106.6573)
- Bình Thạnh: Điện Biên Phủ (10.8031, 106.7100)
- Phú Nhuận: Phan Xích Long (10.7990, 106.6815)

**Tasks (6 with various statuses):**

| Task | Status | Revenue | Purpose |
|------|--------|---------|---------|
| Bảo trì điều hòa định kỳ | READY | 2.5M VNĐ | Show ready-to-start task |
| Sửa chữa điều hòa không lạnh | IN_PROGRESS | 3.5M VNĐ | Show active work |
| Lắp đặt điều hòa 2 chiều | COMPLETED | 5M VNĐ | Show completed with payment |
| Vệ sinh điều hòa - 3 cục | COMPLETED | 1.8M VNĐ | Show another completion |
| Kiểm tra hệ thống trung tâm | PREPARING | 8M VNĐ | Show planning phase |
| Thay dàn nóng điều hòa | ON_HOLD | 12M VNĐ | Show blocked task |

**Activity History:**
- Task creation events
- Check-in events (for in-progress and completed tasks)
- Task completion events

**Payment Records:**
- 2 payments for completed tasks
- Cash payments
- Full expected amount collected

---

## Security Considerations

### 1. Credential Management

**DO:**
- ✅ Use strong, unique password
- ✅ Store credentials in 1Password/secure vault
- ✅ Share via Apple's secure submission form only
- ✅ Rotate password after review period
- ✅ Mark account with `isDemo: true` metadata

**DON'T:**
- ❌ Commit credentials to git
- ❌ Share via email or Slack
- ❌ Use production user passwords
- ❌ Allow demo account to modify other users' data

### 2. Data Isolation

**Implementation:**
```typescript
// In check-in service or similar
async function isDemo(userId: string): Promise<boolean> {
  const user = await clerkClient.users.getUser(userId)
  return user.publicMetadata?.isDemo === true
}

// Allow demo account to bypass GPS restrictions
if (await isDemo(userId)) {
  // Skip distance validation for demo
  logger.info('Demo account - bypassing GPS validation')
  return { success: true, distance: 0 }
}
```

**Protect Production Data:**
- Demo account can only see tasks assigned to it
- Demo customers/locations have `demo_` prefix in IDs
- Activities are logged separately by userId
- Payments are isolated by collectedBy

### 3. Rate Limiting

Demo account should have same rate limits as regular users:
- Prevents abuse if credentials leak
- Shows realistic API performance to reviewers
- Maintains production-like behavior

### 4. Monitoring

**Track demo account usage:**
```sql
-- View demo account activity
SELECT
  action,
  COUNT(*) as count,
  MAX(created_at) as last_action
FROM "Activity"
WHERE user_id = 'user_demo_xxxxx'
GROUP BY action
ORDER BY last_action DESC;
```

**Set up alerts:**
- Alert if demo account is banned or deleted
- Alert if demo account has > 100 requests/hour (possible abuse)
- Alert if login fails > 3 times (credential issue)

---

## Monitoring & Maintenance

### Pre-Submission Checklist

Run this checklist **before** submitting to App Store:

```bash
# 1. Test login via mobile app
# Login with: applereview@namviet.app / AppleDemo2025!

# 2. Verify data exists
cd apps/api
npx tsx -e "
import { getPrisma } from './src/lib/prisma';
const prisma = getPrisma();
const tasks = await prisma.task.findMany({
  where: { assigneeIds: { has: 'user_xxxxx' } }
});
console.log('Tasks:', tasks.length);
await prisma.\$disconnect();
"

# 3. Check all features work:
```

**Feature Test Matrix:**

| Feature | Test Steps | Expected Result | ✓ |
|---------|-----------|-----------------|---|
| **Login** | Use demo credentials | Successful login, no 2FA | □ |
| **Task List** | View home screen | See 6 tasks with various statuses | □ |
| **Search** | Search "bảo trì" | Find maintenance task | □ |
| **Filters** | Filter by "Completed" | See 2 completed tasks | □ |
| **Task Details** | Open any task | See customer, location, revenue | □ |
| **Map** | View location on map | Map loads with correct marker | □ |
| **Check-In** | Check in to IN_PROGRESS task | Success (bypass GPS for demo) | □ |
| **Photos** | Take/upload photo | Photo uploads successfully | □ |
| **Payment** | View completed task | See payment record | □ |
| **Activity** | View activity tab | See check-ins and completions | □ |
| **Profile** | View profile | See name and email | □ |
| **Logout** | Sign out | Logged out, return to login | □ |

### Daily Monitoring (During Review)

**Check every 24 hours:**

```bash
# 1. Verify account is active
npx tsx -e "
import { clerkClient } from '@clerk/backend';
const users = await clerkClient.users.getUserList({
  emailAddress: ['applereview@namviet.app']
});
console.log('Account status:', users.data[0]?.banned ? 'BANNED' : 'ACTIVE');
"

# 2. Check API health
curl -I https://nv-internal-api.vercel.app/health

# 3. Test login
curl -X POST https://nv-internal-api.vercel.app/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"applereview@namviet.app","password":"AppleDemo2025!"}'
```

### Refresh Data (If Needed)

If Apple requests fresh data or reports stale dates:

```bash
# Reset with new timestamps
npx tsx scripts/setup-demo-account.ts --reset
```

This recreates all tasks with current dates.

### Post-Approval Cleanup

After app is approved:

**Option 1: Keep for Future Submissions**
```bash
# Just disable login
# In Clerk Dashboard: Ban user (temporary)
```

**Option 2: Complete Removal**
```bash
# Delete everything
npx tsx scripts/setup-demo-account.ts --cleanup
```

**Recommended:** Keep account active for:
- Future app updates
- TestFlight reviews
- Customer support demos
- Internal testing

---

## Apple Review Compliance

### Requirements Met

✅ **No Physical Restrictions**
- Demo account can check in from anywhere (GPS bypass for demo users)
- No need to visit actual Ho Chi Minh City locations
- Coordinates are real but distance validation is disabled

✅ **No Time Restrictions**
- Tasks have scheduled dates but no expiration
- Can complete tasks any time
- Historical data shows realistic timeline

✅ **No External Dependencies**
- No VPN required
- No special network access
- No hardware requirements (GPS coordinates are real but flexible)

✅ **Full Feature Access**
- Worker role has all permissions
- Can view, check-in, complete tasks
- Can upload photos
- Can view payments and reports
- Can search and filter

✅ **Realistic Data**
- Vietnamese business names
- Real Ho Chi Minh City addresses
- Realistic revenue amounts (VND)
- Authentic workflow (preparing → ready → in-progress → completed)
- Activity history shows genuine usage patterns

### App Store Connect Submission

**In "App Review Information" section:**

```
Demo Account Credentials:

Email: applereview@namviet.app
Password: AppleDemo2025!

Notes for Reviewer:
This is a fully functional worker account with realistic Vietnamese data.
The app displays tasks for air conditioning service technicians in Ho Chi Minh City.

All features are accessible:
- View and search tasks
- Check in/out of job sites (GPS validation is relaxed for demo)
- Upload work photos
- View payment records
- Access activity history

No VPN or special network is required.
The demo account has 6 sample tasks with various statuses.
```

### Common Apple Rejection Reasons & Solutions

| Reason | Solution |
|--------|----------|
| "Cannot test GPS features" | Demo account bypasses strict GPS validation |
| "Login doesn't work" | Test credentials before submission |
| "Not enough data" | Script seeds 6 tasks, 5 customers, 5 locations |
| "Features are restricted" | Worker role has full permissions |
| "Dates are in the past" | Use `--reset` to regenerate with current dates |
| "Vietnamese language" | Legitimate - app targets Vietnamese market |

---

## Troubleshooting

### Issue: Login Fails

**Symptoms:**
- "Invalid credentials" error
- Account not found

**Solutions:**
```bash
# 1. Verify account exists
npx tsx -e "
import { clerkClient } from '@clerk/backend';
const users = await clerkClient.users.getUserList({
  emailAddress: ['applereview@namviet.app']
});
console.log('Found:', users.data.length, 'users');
if (users.data[0]) {
  console.log('Status:', users.data[0].banned ? 'BANNED' : 'ACTIVE');
  console.log('Email verified:', users.data[0].hasVerifiedEmailAddress);
}
"

# 2. Reset password if needed
# In Clerk Dashboard → Users → applereview@namviet.app → Change Password

# 3. Verify mobile app uses correct Clerk publishable key
# Check apps/mobile/app.config.ts → CLERK_PUBLISHABLE_KEY
```

### Issue: No Tasks Showing

**Symptoms:**
- Empty task list
- No data in app

**Solutions:**
```bash
# 1. Check tasks exist
npx tsx -e "
import { getPrisma } from './apps/api/src/lib/prisma';
const prisma = getPrisma();

const user = await clerkClient.users.getUserList({
  emailAddress: ['applereview@namviet.app']
});

const tasks = await prisma.task.findMany({
  where: { assigneeIds: { has: user.data[0].id } }
});

console.log('Tasks for demo user:', tasks.length);
await prisma.\$disconnect();
"

# 2. Re-seed data
npx tsx scripts/setup-demo-account.ts --reset
```

### Issue: GPS Check-In Fails

**Symptoms:**
- "Too far from location" error
- Cannot check in to tasks

**Solution:**
Ensure demo account bypass is deployed:

```typescript
// In apps/api/src/v1/tasks/checkin.service.ts (or similar)

// Add this check BEFORE distance validation:
const user = await clerkClient.users.getUser(userId)
const isDemo = user.publicMetadata?.isDemo === true

if (isDemo) {
  logger.info('Demo account detected - bypassing GPS validation')
  return {
    success: true,
    distance: 0,
    message: 'Demo mode - GPS check bypassed'
  }
}

// Normal GPS validation continues for non-demo users...
```

### Issue: Photos Won't Upload

**Symptoms:**
- Upload fails
- Timeout errors

**Solutions:**
```bash
# 1. Check Vercel Blob storage
curl -I https://your-blob-store.vercel-storage.com/health

# 2. Verify API endpoint
curl -X POST https://nv-internal-api.vercel.app/v1/attachments/presigned-url \
  -H "Authorization: Bearer YOUR_DEMO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.jpg","mimeType":"image/jpeg","size":1024}'

# 3. Check mobile permissions
# iOS: Settings → Nam Việt Internal → Photos → All Photos
```

### Issue: Stale Dates

**Symptoms:**
- Tasks show old dates
- Apple reviewer says "data is outdated"

**Solution:**
```bash
# Regenerate with current dates
npx tsx scripts/setup-demo-account.ts --reset
```

### Issue: Demo Account Banned

**Symptoms:**
- Login says "Account suspended"
- Cannot access app

**Solution:**
```bash
# Unban in Clerk
npx tsx -e "
import { clerkClient } from '@clerk/backend';
const users = await clerkClient.users.getUserList({
  emailAddress: ['applereview@namviet.app']
});
if (users.data[0]) {
  await clerkClient.users.unbanUser(users.data[0].id);
  console.log('Account unbanned');
}
"

# Or via Clerk Dashboard → Users → applereview@namviet.app → Unban
```

---

## Advanced Configuration

### Custom Demo Data

To create different demo scenarios, edit `setup-demo-account.ts`:

**More Tasks:**
```typescript
// Add to tasks array (line ~150)
{
  title: 'Your custom task',
  description: 'Custom description',
  status: 'READY' as const,
  customerId: customers[0].id,
  geoLocationId: locations[0].id,
  expectedRevenue: 1000000,
  scheduledAt: tomorrow,
}
```

**Different Locations:**
```typescript
// Add to locations array (line ~100)
{
  id: 'geo_demo_custom',
  name: 'Your location',
  address: 'Your address',
  lat: 10.xxxx,
  lng: 106.xxxx,
}
```

### Environment-Specific Demo Accounts

**Staging:**
```typescript
const DEMO_CONFIG = {
  email: 'demo@namviet.staging',
  username: 'demo-staging',
  password: 'StagingDemo2025!',
  // ...
}
```

**Production:**
```typescript
const DEMO_CONFIG = {
  email: 'applereview@namviet.app',
  username: 'applereview',
  password: 'AppleDemo2025!',
  // ...
}
```

Use environment variables:
```typescript
const DEMO_CONFIG = {
  email: process.env.DEMO_EMAIL || 'applereview@namviet.app',
  password: process.env.DEMO_PASSWORD || 'AppleDemo2025!',
  // ...
}
```

---

## Summary

**Quick Commands:**
```bash
# Setup (first time)
npx tsx scripts/setup-demo-account.ts

# Reset (refresh data)
npx tsx scripts/setup-demo-account.ts --reset

# Cleanup (after approval)
npx tsx scripts/setup-demo-account.ts --cleanup
```

**Demo Credentials:**
- Email: `applereview@namviet.app`
- Password: `AppleDemo2025!`

**What's Included:**
- 6 tasks (various statuses)
- 5 customers (Vietnamese names)
- 5 locations (Ho Chi Minh City)
- Activity history
- Payment records

**Key Features:**
- ✅ No GPS restrictions (bypass for demo)
- ✅ No time restrictions
- ✅ Full feature access
- ✅ Realistic Vietnamese data
- ✅ Production-like behavior

**Support:**
- Pre-submission checklist: [Section](#pre-submission-checklist)
- Troubleshooting: [Section](#troubleshooting)
- Monitoring: [Section](#monitoring--maintenance)

---

**Last Updated**: 2025-11-10
**Script Version**: 1.0
**Tested**: ✅ Ready for submission
