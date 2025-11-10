# Demo Account Quick Setup Guide

**Purpose**: Rapid setup of demo account for Apple App Review
**Time Required**: 15-20 minutes
**Last Updated**: 2025-11-10

---

## 🚀 QUICK START (Copy-Paste Commands)

### Step 1: Create Clerk User

```bash
# Via Clerk Dashboard (https://dashboard.clerk.com)
# 1. Navigate to Users → Create user
# 2. Fill in:

Email: apple.review@namviet.test
First Name: Apple
Last Name: Reviewer
Password: AppleReview2025!

# 3. Set Public Metadata:
{
  "role": "WORKER",
  "isDemo": true,
  "gpsVerificationBypassed": true
}
```

### Step 2: Create Database User

```sql
-- Run this in your Neon console or via Prisma
INSERT INTO "User" (
  id,
  email,
  "firstName",
  "lastName",
  role,
  "createdAt",
  "updatedAt"
) VALUES (
  'user_apple_review_2025', -- Replace with actual Clerk user ID
  'apple.review@namviet.test',
  'Apple',
  'Reviewer',
  'WORKER',
  NOW(),
  NOW()
);
```

### Step 3: Create Sample Data

Run this SQL script to populate demo tasks:

```sql
-- ========================================
-- SAMPLE CUSTOMERS
-- ========================================
INSERT INTO "Customer" (id, name, phone, address, "createdAt", "updatedAt")
VALUES
  ('cust_demo_abc', 'Công ty ABC', '0901234567', '123 Nguyễn Huệ, Quận 1, TP.HCM', NOW(), NOW()),
  ('cust_demo_xyz', 'Văn phòng XYZ', '0907654321', '456 Lê Lại, Quận 3, TP.HCM', NOW(), NOW()),
  ('cust_demo_nguyen', 'Nguyễn Văn A', '0909876543', '789 Cách Mạng Tháng 8, Quận 10, TP.HCM', NOW(), NOW()),
  ('cust_demo_hotel', 'Khách sạn Hoàng Gia', '0283456789', '12 Pasteur, Quận 1, TP.HCM', NOW(), NOW()),
  ('cust_demo_vinhomes', 'Chung cư Vinhomes', '0287654321', '34 Nguyễn Chí Thanh, Quận 5, TP.HCM', NOW(), NOW());

-- ========================================
-- SAMPLE LOCATIONS
-- ========================================
INSERT INTO "GeoLocation" (id, address, latitude, longitude, "googleMapsUrl", "createdAt", "updatedAt")
VALUES
  ('geo_demo_abc', '123 Nguyễn Huệ, Quận 1, TP.HCM', 10.7731, 106.7020, 'https://maps.google.com/?q=10.7731,106.7020', NOW(), NOW()),
  ('geo_demo_xyz', '456 Lê Lại, Quận 3, TP.HCM', 10.7693, 106.6819, 'https://maps.google.com/?q=10.7693,106.6819', NOW(), NOW()),
  ('geo_demo_nguyen', '789 CMT8, Quận 10, TP.HCM', 10.7726, 106.6573, 'https://maps.google.com/?q=10.7726,106.6573', NOW(), NOW()),
  ('geo_demo_hotel', '12 Pasteur, Quận 1, TP.HCM', 10.7769, 106.7009, 'https://maps.google.com/?q=10.7769,106.7009', NOW(), NOW()),
  ('geo_demo_vinhomes', '34 Nguyễn Chí Thanh, Q5, TP.HCM', 10.7577, 106.6670, 'https://maps.google.com/?q=10.7577,106.6670', NOW(), NOW());

-- ========================================
-- TASK 1: READY (Ready for check-in)
-- ========================================
INSERT INTO "Task" (
  id, title, description, status,
  "customerId", "locationId", "assigneeIds",
  "scheduledDate", "expectedRevenue",
  "createdAt", "updatedAt"
)
VALUES (
  'task_demo_001',
  'Bảo trì điều hòa định kỳ - Công ty ABC',
  'Kiểm tra và vệ sinh hệ thống điều hòa 2 máy lạnh tầng 2. Khách hàng yêu cầu làm việc trong giờ hành chính.',
  'READY',
  'cust_demo_abc',
  'geo_demo_abc',
  ARRAY['user_apple_review_2025'], -- Replace with actual Clerk user ID
  CURRENT_DATE,
  3000000, -- 3 million VND
  NOW(),
  NOW()
);

-- ========================================
-- TASK 2: IN_PROGRESS (Checked in 30 min ago)
-- ========================================
INSERT INTO "Task" (
  id, title, description, status,
  "customerId", "locationId", "assigneeIds",
  "scheduledDate", "expectedRevenue",
  "checkedInAt",
  "createdAt", "updatedAt"
)
VALUES (
  'task_demo_002',
  'Sửa chữa điều hòa - Văn phòng XYZ',
  'Thay block điều hòa hỏng, kiểm tra hệ thống gas và bơm gas nếu cần.',
  'IN_PROGRESS',
  'cust_demo_xyz',
  'geo_demo_xyz',
  ARRAY['user_apple_review_2025'], -- Replace with actual Clerk user ID
  CURRENT_DATE,
  5000000, -- 5 million VND
  NOW() - INTERVAL '30 minutes',
  NOW(),
  NOW()
);

-- ========================================
-- TASK 3: COMPLETED (Completed yesterday with payment)
-- ========================================
INSERT INTO "Task" (
  id, title, description, status,
  "customerId", "locationId", "assigneeIds",
  "scheduledDate", "expectedRevenue",
  "checkedInAt", "completedAt",
  "createdAt", "updatedAt"
)
VALUES (
  'task_demo_003',
  'Lắp đặt điều hòa mới - Nhà riêng',
  'Lắp đặt 1 máy lạnh inverter 1.5HP, chạy ống đồng 3 mét, thi công âm tường.',
  'COMPLETED',
  'cust_demo_nguyen',
  'geo_demo_nguyen',
  ARRAY['user_apple_review_2025'], -- Replace with actual Clerk user ID
  CURRENT_DATE - INTERVAL '1 day',
  12000000, -- 12 million VND
  NOW() - INTERVAL '1 day 3 hours',
  NOW() - INTERVAL '1 day',
  NOW(),
  NOW()
);

-- Add payment for completed task
INSERT INTO "Payment" (
  id,
  "taskId",
  amount,
  "expectedAmount",
  method,
  status,
  "collectedBy",
  "collectedAt",
  notes,
  "createdAt",
  "updatedAt"
)
VALUES (
  'pay_demo_003',
  'task_demo_003',
  12000000,
  12000000,
  'CASH',
  'COMPLETED',
  'user_apple_review_2025', -- Replace with actual Clerk user ID
  NOW() - INTERVAL '1 day',
  'Khách hàng thanh toán tiền mặt đầy đủ',
  NOW(),
  NOW()
);

-- ========================================
-- TASK 4: PREPARING (Future task)
-- ========================================
INSERT INTO "Task" (
  id, title, description, status,
  "customerId", "locationId", "assigneeIds",
  "scheduledDate", "expectedRevenue",
  "createdAt", "updatedAt"
)
VALUES (
  'task_demo_004',
  'Bảo dưỡng hệ thống HVAC - Khách sạn',
  'Kiểm tra tổng thể hệ thống điều hòa trung tâm 10 phòng, vệ sinh filter.',
  'PREPARING',
  'cust_demo_hotel',
  'geo_demo_hotel',
  ARRAY['user_apple_review_2025'], -- Replace with actual Clerk user ID
  CURRENT_DATE + INTERVAL '1 day',
  8000000, -- 8 million VND
  NOW(),
  NOW()
);

-- ========================================
-- TASK 5: READY (Another ready task)
-- ========================================
INSERT INTO "Task" (
  id, title, description, status,
  "customerId", "locationId", "assigneeIds",
  "scheduledDate", "expectedRevenue",
  "createdAt", "updatedAt"
)
VALUES (
  'task_demo_005',
  'Kiểm tra rò rỉ gas - Chung cư',
  'Khách hàng phản ánh điều hòa không lạnh, cần kiểm tra gas và bơm thêm nếu thiếu.',
  'READY',
  'cust_demo_vinhomes',
  'geo_demo_vinhomes',
  ARRAY['user_apple_review_2025'], -- Replace with actual Clerk user ID
  CURRENT_DATE,
  2500000, -- 2.5 million VND
  NOW(),
  NOW()
);

-- ========================================
-- TASK 6: COMPLETED (Completed 3 days ago)
-- ========================================
INSERT INTO "Task" (
  id, title, description, status,
  "customerId", "locationId", "assigneeIds",
  "scheduledDate", "expectedRevenue",
  "checkedInAt", "completedAt",
  "createdAt", "updatedAt"
)
VALUES (
  'task_demo_006',
  'Vệ sinh điều hòa định kỳ - Văn phòng',
  'Vệ sinh 3 máy lạnh văn phòng, kiểm tra hoạt động và bảo dưỡng.',
  'COMPLETED',
  'cust_demo_xyz',
  'geo_demo_xyz',
  ARRAY['user_apple_review_2025'], -- Replace with actual Clerk user ID
  CURRENT_DATE - INTERVAL '3 days',
  4500000, -- 4.5 million VND
  NOW() - INTERVAL '3 days 2 hours',
  NOW() - INTERVAL '3 days',
  NOW(),
  NOW()
);

-- Add payment for task 6
INSERT INTO "Payment" (
  id,
  "taskId",
  amount,
  "expectedAmount",
  method,
  status,
  "collectedBy",
  "collectedAt",
  notes,
  "createdAt",
  "updatedAt"
)
VALUES (
  'pay_demo_006',
  'task_demo_006',
  4500000,
  4500000,
  'TRANSFER',
  'COMPLETED',
  'user_apple_review_2025', -- Replace with actual Clerk user ID
  NOW() - INTERVAL '3 days',
  'Chuyển khoản qua ngân hàng',
  NOW(),
  NOW()
);

-- ========================================
-- TASK 7: COMPLETED (Completed last week)
-- ========================================
INSERT INTO "Task" (
  id, title, description, status,
  "customerId", "locationId", "assigneeIds",
  "scheduledDate", "expectedRevenue",
  "checkedInAt", "completedAt",
  "createdAt", "updatedAt"
)
VALUES (
  'task_demo_007',
  'Lắp đặt điều hòa mới - Công ty',
  'Lắp đặt 2 máy lạnh 2HP cho phòng họp và khu làm việc.',
  'COMPLETED',
  'cust_demo_abc',
  'geo_demo_abc',
  ARRAY['user_apple_review_2025'], -- Replace with actual Clerk user ID
  CURRENT_DATE - INTERVAL '7 days',
  18000000, -- 18 million VND
  NOW() - INTERVAL '7 days 4 hours',
  NOW() - INTERVAL '7 days',
  NOW(),
  NOW()
);

-- Add payment for task 7
INSERT INTO "Payment" (
  id,
  "taskId",
  amount,
  "expectedAmount",
  method,
  status,
  "collectedBy",
  "collectedAt",
  notes,
  "createdAt",
  "updatedAt"
)
VALUES (
  'pay_demo_007',
  'task_demo_007',
  18000000,
  18000000,
  'CASH',
  'COMPLETED',
  'user_apple_review_2025', -- Replace with actual Clerk user ID
  NOW() - INTERVAL '7 days',
  'Thu tiền mặt đầy đủ từ kế toán công ty',
  NOW(),
  NOW()
);

-- ========================================
-- TASK 8: READY (Ready for testing)
-- ========================================
INSERT INTO "Task" (
  id, title, description, status,
  "customerId", "locationId", "assigneeIds",
  "scheduledDate", "expectedRevenue",
  "createdAt", "updatedAt"
)
VALUES (
  'task_demo_008',
  'Thay thế cục nóng - Nhà riêng',
  'Cục nóng hỏng, cần thay thế và kiểm tra lại toàn bộ hệ thống.',
  'READY',
  'cust_demo_nguyen',
  'geo_demo_nguyen',
  ARRAY['user_apple_review_2025'], -- Replace with actual Clerk user ID
  CURRENT_DATE,
  15000000, -- 15 million VND
  NOW(),
  NOW()
);

-- ========================================
-- ACTIVITY LOGS (for Reports)
-- ========================================
INSERT INTO "Activity" (
  id, action, "userId", "taskId", "locationId",
  payload, "createdAt"
)
VALUES
  -- Task 2 check-in
  ('act_demo_001', 'TASK_CHECKED_IN', 'user_apple_review_2025', 'task_demo_002', 'geo_demo_xyz',
   '{"distance": 35, "accuracy": 15}', NOW() - INTERVAL '30 minutes'),

  -- Task 3 check-in
  ('act_demo_002', 'TASK_CHECKED_IN', 'user_apple_review_2025', 'task_demo_003', 'geo_demo_nguyen',
   '{"distance": 28, "accuracy": 12}', NOW() - INTERVAL '1 day 3 hours'),

  -- Task 3 completed
  ('act_demo_003', 'TASK_COMPLETED', 'user_apple_review_2025', 'task_demo_003', 'geo_demo_nguyen',
   '{"duration": "120 minutes", "notes": "Lắp đặt hoàn tất, khách hài lòng"}', NOW() - INTERVAL '1 day'),

  -- Task 6 check-in
  ('act_demo_004', 'TASK_CHECKED_IN', 'user_apple_review_2025', 'task_demo_006', 'geo_demo_xyz',
   '{"distance": 42, "accuracy": 18}', NOW() - INTERVAL '3 days 2 hours'),

  -- Task 6 completed
  ('act_demo_005', 'TASK_COMPLETED', 'user_apple_review_2025', 'task_demo_006', 'geo_demo_xyz',
   '{"duration": "90 minutes", "notes": "Vệ sinh sạch sẽ, kiểm tra hoạt động tốt"}', NOW() - INTERVAL '3 days'),

  -- Task 7 check-in
  ('act_demo_006', 'TASK_CHECKED_IN', 'user_apple_review_2025', 'task_demo_007', 'geo_demo_abc',
   '{"distance": 51, "accuracy": 20}', NOW() - INTERVAL '7 days 4 hours'),

  -- Task 7 completed
  ('act_demo_007', 'TASK_COMPLETED', 'user_apple_review_2025', 'task_demo_007', 'geo_demo_abc',
   '{"duration": "180 minutes", "notes": "Lắp đặt 2 máy hoàn tất, test lạnh tốt"}', NOW() - INTERVAL '7 days');

-- ========================================
-- DONE! Verify setup
-- ========================================
SELECT
  'Demo account created successfully!' as status,
  COUNT(*) as task_count
FROM "Task"
WHERE 'user_apple_review_2025' = ANY("assigneeIds");
```

### Step 4: Enable GPS Bypass (API Code)

Add this to your check-in service:

```typescript
// In apps/api/src/v1/tasks/service.ts (or similar)

async function checkIn(userId: string, taskId: number, location: Location) {
  // Check if demo account - bypass GPS verification
  const user = await prisma.user.findUnique({ where: { id: userId } })

  const isDemoAccount = user?.email === 'apple.review@namviet.test'

  if (isDemoAccount) {
    // Allow check-in from any location for demo
    return {
      success: true,
      message: 'Check-in successful (demo account - GPS verification bypassed)',
      distance: 0,
      warnings: []
    }
  }

  // Normal GPS verification for real users
  const distance = calculateDistance(location, task.geoLocation)

  if (distance > 100) {
    return {
      success: false,
      message: 'Bạn cần ở gần vị trí công việc để check-in',
      distance,
      warnings: ['Khoảng cách xa hơn 100 mét']
    }
  }

  // ... rest of check-in logic
}
```

---

## ✅ VERIFICATION CHECKLIST

After setup, test these workflows:

### Test 1: Login
```
1. Open app
2. Enter: apple.review@namviet.test / AppleReview2025!
3. ✓ Should successfully log in
4. ✓ Should see 8 tasks in list
```

### Test 2: View Tasks
```
1. Open task list
2. ✓ Should see mix of statuses:
   - 3 READY tasks (green)
   - 1 IN_PROGRESS task (blue)
   - 3 COMPLETED tasks (gray)
   - 1 PREPARING task (yellow)
```

### Test 3: Check-in (GPS Bypass)
```
1. Tap task "Bảo trì điều hòa định kỳ - Công ty ABC"
2. Tap "Bắt đầu làm việc" (Start Work)
3. Grant location permission
4. ✓ Should succeed regardless of actual location
5. ✓ Task status changes to IN_PROGRESS
```

### Test 4: Add Photo
```
1. On IN_PROGRESS task, scroll to attachments
2. Tap "Thêm ảnh" (Add Photo)
3. Grant camera permission
4. Take or select photo
5. ✓ Photo appears in list
```

### Test 5: Check-out with Payment
```
1. Tap "Hoàn thành công việc" (Complete Work)
2. ✓ GPS verification passes
3. If payment section shows:
   - Select "Đã thu đủ tiền" (Payment Collected)
   - Enter amount matching expected revenue
4. Tap "Xác nhận hoàn thành" (Confirm Completion)
5. ✓ Task status changes to COMPLETED
```

### Test 6: View Reports
```
1. Tap "Báo cáo" (Reports) tab
2. ✓ Should show:
   - Total completed tasks: 4
   - Total revenue: ~38,500,000 VND
   - Charts with data
```

### Test 7: View Profile
```
1. Tap "Tôi" (Me) tab
2. ✓ Should show: Apple Reviewer
3. ✓ Email: apple.review@namviet.test
4. ✓ Role: WORKER
```

---

## 🔧 TROUBLESHOOTING

### Issue: Demo account can't log in

**Solution 1**: Verify Clerk user exists
```bash
# Check in Clerk Dashboard → Users
# Search for: apple.review@namviet.test
```

**Solution 2**: Reset password
```bash
# In Clerk Dashboard:
1. Find user
2. Click "..." → Reset password
3. Set: AppleReview2025!
```

### Issue: No tasks showing

**Solution**: Check user ID in database
```sql
-- Get Clerk user ID
SELECT id FROM "User" WHERE email = 'apple.review@namviet.test';

-- Update tasks with correct user ID
UPDATE "Task"
SET "assigneeIds" = ARRAY['user_ACTUAL_CLERK_ID_HERE']
WHERE id LIKE 'task_demo_%';
```

### Issue: GPS check-in fails for demo account

**Solution**: Verify GPS bypass code is deployed
```typescript
// Check in API logs:
console.log('Is demo account:', user.email === 'apple.review@namviet.test')

// Should log: Is demo account: true
```

### Issue: Reports show no data

**Solution**: Add more activity history
```sql
-- Generate additional completed tasks
INSERT INTO "Activity" (action, "userId", "taskId", "createdAt")
SELECT
  'TASK_COMPLETED',
  'user_apple_review_2025',
  'task_demo_' || generate_series,
  NOW() - (generate_series || ' days')::interval
FROM generate_series(1, 20);
```

---

## 📝 MAINTENANCE SCHEDULE

### Daily (During Review Period)
- [ ] Test login credentials
- [ ] Verify GPS bypass works
- [ ] Check for API errors in logs
- [ ] Ensure sample photos accessible

### Before Each Submission
- [ ] Reset demo data to clean state
- [ ] Update task dates to "recent"
- [ ] Verify all 8 tasks exist
- [ ] Test full workflow once

### After Approval
- [ ] Optionally disable demo account
- [ ] Archive demo data
- [ ] Document what worked for next time

---

## 🎯 QUICK REFERENCE

**Credentials**:
```
Username: apple.review@namviet.test
Password: AppleReview2025!
```

**Expected Task Count**: 8 tasks
- 3 READY
- 1 IN_PROGRESS
- 3 COMPLETED
- 1 PREPARING

**Expected Revenue**: ~38,500,000 VND total completed

**GPS Bypass**: Enabled for email `apple.review@namviet.test`

**Contact**: dustin.do95@gmail.com

---

## 📦 ONE-COMMAND SETUP (Optional)

Create a script to automate this:

```typescript
// scripts/setup-demo-account.ts
import { clerkClient } from '@clerk/clerk-expo'
import { prisma } from '@nv-internal/prisma-client'
import fs from 'fs'

async function setupDemoAccount() {
  console.log('🚀 Setting up demo account...\n')

  // 1. Create Clerk user
  console.log('1/4 Creating Clerk user...')
  const clerkUser = await clerkClient.users.createUser({
    emailAddress: ['apple.review@namviet.test'],
    password: 'AppleReview2025!',
    firstName: 'Apple',
    lastName: 'Reviewer',
    publicMetadata: { role: 'WORKER', isDemo: true }
  })
  console.log(`✅ Clerk user created: ${clerkUser.id}\n`)

  // 2. Create DB user
  console.log('2/4 Creating database user...')
  await prisma.user.create({
    data: {
      id: clerkUser.id,
      email: 'apple.review@namviet.test',
      firstName: 'Apple',
      lastName: 'Reviewer',
      role: 'WORKER'
    }
  })
  console.log('✅ Database user created\n')

  // 3. Run SQL script
  console.log('3/4 Creating sample data...')
  const sql = fs.readFileSync('./scripts/demo-data.sql', 'utf-8')
  await prisma.$executeRawUnsafe(sql.replace(/user_apple_review_2025/g, clerkUser.id))
  console.log('✅ Sample data created\n')

  // 4. Verify
  console.log('4/4 Verifying setup...')
  const taskCount = await prisma.task.count({
    where: { assigneeIds: { has: clerkUser.id } }
  })
  console.log(`✅ Demo account ready with ${taskCount} tasks\n`)

  console.log('📋 Credentials:')
  console.log('Username: apple.review@namviet.test')
  console.log('Password: AppleReview2025!')
}

setupDemoAccount().catch(console.error)
```

Run with:
```bash
npx tsx scripts/setup-demo-account.ts
```

---

**Setup complete! Test thoroughly before submitting to App Store Connect. 🎉**
