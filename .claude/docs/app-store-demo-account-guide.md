# Demo Account Preparation Guide - Nam Việt Internal

**Purpose**: Set up and maintain demo account for Apple App Review
**Last Updated**: November 6, 2025

---

## Overview

Apple reviewers need a fully functional demo account to test all app features. This guide ensures the demo account is properly configured with realistic data and all features accessible.

## Account Setup

### 1. Create Demo Account in Clerk

```bash
# Option A: Via Clerk Dashboard
1. Go to Clerk Dashboard (https://dashboard.clerk.com)
2. Navigate to Users
3. Click "Create user"
4. Fill in:
   - Email: apple.review@namviet.test
   - First name: Apple
   - Last name: Reviewer
   - Password: AppleReview2025!

# Option B: Via API/Script
POST /v1/users
{
  "email_address": ["apple.review@namviet.test"],
  "password": "AppleReview2025!",
  "first_name": "Apple",
  "last_name": "Reviewer",
  "public_metadata": {
    "role": "WORKER"
  }
}
```

### 2. Configure User Metadata

```javascript
// Set role to WORKER for full feature access
{
  "publicMetadata": {
    "role": "WORKER",
    "isDemo": true,
    "createdFor": "app-store-review"
  }
}
```

### 3. Database User Record

```sql
-- Create user in database
INSERT INTO "User" (
  id,
  email,
  "firstName",
  "lastName",
  role,
  "createdAt",
  "updatedAt"
) VALUES (
  'user_apple_review_2025',
  'apple.review@namviet.test',
  'Apple',
  'Reviewer',
  'WORKER',
  NOW(),
  NOW()
);
```

## Sample Data Creation

### Tasks Setup

Create diverse task samples showing different features:

```sql
-- Task 1: Active task ready for check-in
INSERT INTO "Task" (
  id,
  title,
  description,
  status,
  "customerId",
  "locationId",
  "assigneeIds",
  "scheduledDate",
  "createdAt"
) VALUES (
  'task_demo_001',
  'Bảo trì điều hòa định kỳ - Công ty ABC',
  'Kiểm tra và vệ sinh hệ thống điều hòa tầng 2. Khách hàng yêu cầu làm việc trong giờ hành chính.',
  'READY',
  'cust_demo_001',
  'geo_demo_001',
  ARRAY['user_apple_review_2025'],
  DATE(NOW() + INTERVAL '1 day'),
  NOW()
);

-- Task 2: In-progress task with check-in
INSERT INTO "Task" (
  id,
  title,
  status,
  "customerId",
  "locationId",
  "assigneeIds",
  "checkedInAt"
) VALUES (
  'task_demo_002',
  'Sửa chữa điều hòa - Văn phòng XYZ',
  'IN_PROGRESS',
  'cust_demo_002',
  'geo_demo_002',
  ARRAY['user_apple_review_2025'],
  NOW() - INTERVAL '30 minutes'
);

-- Task 3: Completed task with photos
INSERT INTO "Task" (
  id,
  title,
  status,
  "customerId",
  "locationId",
  "assigneeIds",
  "completedAt"
) VALUES (
  'task_demo_003',
  'Lắp đặt điều hòa mới - Nhà riêng',
  'COMPLETED',
  'cust_demo_003',
  'geo_demo_003',
  ARRAY['user_apple_review_2025'],
  NOW() - INTERVAL '1 day'
);

-- Add more tasks for variety (5-10 total)
```

### Customer Data

```sql
-- Create demo customers
INSERT INTO "Customer" (id, name, phone, address)
VALUES
  ('cust_demo_001', 'Công ty ABC', '0901234567', '123 Nguyễn Huệ, Q1, TP.HCM'),
  ('cust_demo_002', 'Văn phòng XYZ', '0907654321', '456 Lê Lai, Q3, TP.HCM'),
  ('cust_demo_003', 'Nguyễn Văn A', '0909876543', '789 Cách Mạng Tháng 8, Q10, TP.HCM');
```

### Location Data

```sql
-- Create demo locations (real coordinates in Ho Chi Minh City)
INSERT INTO "GeoLocation" (
  id,
  address,
  latitude,
  longitude,
  "googleMapsUrl"
)
VALUES
  ('geo_demo_001', '123 Nguyễn Huệ, Q1', 10.7731, 106.7020, 'https://maps.google.com/?q=10.7731,106.7020'),
  ('geo_demo_002', '456 Lê Lai, Q3', 10.7693, 106.6819, 'https://maps.google.com/?q=10.7693,106.6819'),
  ('geo_demo_003', '789 CMT8, Q10', 10.7726, 106.6573, 'https://maps.google.com/?q=10.7726,106.6573');
```

### Activity History

```sql
-- Add check-in/check-out history
INSERT INTO "Activity" (
  id,
  action,
  "userId",
  "taskId",
  "locationId",
  payload,
  "createdAt"
)
VALUES
  ('act_demo_001', 'TASK_CHECKED_IN', 'user_apple_review_2025', 'task_demo_002', 'geo_demo_002',
   '{"distance": 45, "accuracy": 10}', NOW() - INTERVAL '30 minutes'),
  ('act_demo_002', 'TASK_COMPLETED', 'user_apple_review_2025', 'task_demo_003', 'geo_demo_003',
   '{"duration": "2 hours", "notes": "Hoàn thành lắp đặt"}', NOW() - INTERVAL '1 day');
```

### Sample Attachments

```sql
-- Add photo attachments to completed task
INSERT INTO "Attachment" (
  id,
  "taskId",
  "uploadedBy",
  "fileName",
  url,
  "mimeType",
  size,
  "createdAt"
)
VALUES
  ('att_demo_001', 'task_demo_003', 'user_apple_review_2025',
   'before-installation.jpg', 'https://example.com/demo/before.jpg', 'image/jpeg', 1024000, NOW() - INTERVAL '1 day'),
  ('att_demo_002', 'task_demo_003', 'user_apple_review_2025',
   'after-installation.jpg', 'https://example.com/demo/after.jpg', 'image/jpeg', 1536000, NOW() - INTERVAL '1 day');
```

### Payment Records

```sql
-- Add sample payments
INSERT INTO "Payment" (
  id,
  "taskId",
  amount,
  "expectedAmount",
  method,
  status,
  "collectedBy",
  "collectedAt"
)
VALUES
  ('pay_demo_001', 'task_demo_003', 5000000, 5000000, 'CASH', 'COMPLETED',
   'user_apple_review_2025', NOW() - INTERVAL '1 day');
```

## Demo Account Special Features

### 1. Bypass GPS Restrictions

For demo account, modify check-in logic:

```typescript
// In check-in service
if (user.email === 'apple.review@namviet.test') {
  // Allow check-in from any location for demo
  return {
    success: true,
    message: 'Demo account - GPS check bypassed',
    distance: 0
  };
}
```

### 2. Pre-populate Sample Photos

Host sample work photos that can be displayed:
- Before/after air conditioner installation
- Maintenance work in progress
- Completed repairs
- Invoice/receipt samples

### 3. Generate Report Data

Create historical data for reports:

```sql
-- Generate 30 days of activity
INSERT INTO "Activity" (action, "userId", "taskId", "createdAt")
SELECT
  'TASK_COMPLETED',
  'user_apple_review_2025',
  'task_demo_' || generate_series,
  NOW() - (generate_series || ' days')::interval
FROM generate_series(1, 30);
```

## Testing Checklist

### Before Submission

Test each feature with demo account:

- [ ] **Authentication**
  - [ ] Can log in successfully
  - [ ] Session persists
  - [ ] Can log out

- [ ] **Task List**
  - [ ] Shows 5-10 diverse tasks
  - [ ] Different statuses visible
  - [ ] Can filter/sort tasks
  - [ ] Pull to refresh works

- [ ] **Task Details**
  - [ ] All task information displays
  - [ ] Customer info visible
  - [ ] Location map shows
  - [ ] Attachments load

- [ ] **Check-in/Check-out**
  - [ ] GPS check-in works (anywhere)
  - [ ] Success message shows
  - [ ] Check-out completes task
  - [ ] History recorded

- [ ] **Photo Features**
  - [ ] Can take new photo
  - [ ] Can select from gallery
  - [ ] Multiple photos attach
  - [ ] Photos display in task

- [ ] **Reports**
  - [ ] Monthly summary shows data
  - [ ] Charts render correctly
  - [ ] Statistics are realistic
  - [ ] Comparison works

- [ ] **Settings/Profile**
  - [ ] Profile info displays
  - [ ] App version shown
  - [ ] Logout works

### Data Validation

Verify demo data is:
- [ ] Realistic (Vietnamese names, addresses)
- [ ] Complete (no missing fields)
- [ ] Diverse (various task types)
- [ ] Current (recent dates)
- [ ] Functional (links work)

## Maintenance

### Daily Tasks (During Review Period)

1. **Check account access**
   ```bash
   # Test login daily
   curl -X POST https://api.namviet.com/auth/login \
     -d '{"email":"apple.review@namviet.test","password":"AppleReview2025!"}'
   ```

2. **Refresh data if needed**
   - Add new tasks dated "today"
   - Update in-progress tasks
   - Keep data current

3. **Monitor for issues**
   - Check error logs for demo account
   - Verify API endpoints work
   - Test critical features

### Post-Review

After app approval:

1. **Disable demo account** (optional)
   ```sql
   UPDATE "User"
   SET "deletedAt" = NOW()
   WHERE email = 'apple.review@namviet.test';
   ```

2. **Archive demo data**
   - Keep for future submissions
   - Document what worked
   - Note reviewer questions

3. **Clean up test data** (if needed)
   ```sql
   -- Remove demo tasks
   DELETE FROM "Task" WHERE id LIKE 'task_demo_%';
   DELETE FROM "Customer" WHERE id LIKE 'cust_demo_%';
   ```

## Troubleshooting

### Common Issues & Solutions

**Issue**: Demo account can't log in
```bash
# Reset password via Clerk
clerk users update user_xxx --password "NewPassword2025!"
```

**Issue**: No tasks showing
```sql
-- Check task assignment
SELECT * FROM "Task"
WHERE 'user_apple_review_2025' = ANY("assigneeIds");
```

**Issue**: GPS check-in fails
```typescript
// Verify demo bypass code is deployed
console.log('Demo account check:', user.email === 'apple.review@namviet.test');
```

**Issue**: Photos not uploading
```bash
# Check storage service
curl -I https://storage.namviet.com/health
```

## Quick Setup Script

```typescript
// scripts/setup-demo-account.ts
import { clerkClient } from '@clerk/nextjs';
import { prisma } from '@nv-internal/prisma-client';

async function setupDemoAccount() {
  // 1. Create Clerk user
  const clerkUser = await clerkClient.users.createUser({
    emailAddress: ['apple.review@namviet.test'],
    password: 'AppleReview2025!',
    firstName: 'Apple',
    lastName: 'Reviewer',
    publicMetadata: { role: 'WORKER' }
  });

  // 2. Create database user
  const dbUser = await prisma.user.create({
    data: {
      id: clerkUser.id,
      email: 'apple.review@namviet.test',
      firstName: 'Apple',
      lastName: 'Reviewer',
      role: 'WORKER'
    }
  });

  // 3. Create sample data
  await createSampleTasks(dbUser.id);
  await createSampleActivities(dbUser.id);

  console.log('Demo account ready:', dbUser.email);
}

// Run: npx tsx scripts/setup-demo-account.ts
```

## Security Considerations

1. **Password Security**
   - Use strong password
   - Don't reuse production passwords
   - Change after review if needed

2. **Data Isolation**
   - Demo data clearly marked
   - Cannot access real customer data
   - Limited permissions

3. **Monitoring**
   - Log all demo account actions
   - Alert on suspicious activity
   - Track usage patterns

4. **Cleanup**
   - Remove after approval
   - Or disable access
   - Archive for records

---

**Important**: Test the demo account thoroughly before submission. Apple reviewers will use this account to evaluate your app, so ensure everything works perfectly.