# End-to-End Testing Strategy for React Native Mobile App

## Overview

Implement comprehensive end-to-end (E2E) testing for the React Native mobile app to ensure critical user workflows function correctly across different devices and platforms. This will catch integration issues, UI regressions, and workflow breaks before they reach production.

## Status

⏳ **Not Started**

## Problem Analysis

### Current Testing Gaps

1. **No E2E Tests**
   - Only unit tests exist for API
   - No automated UI testing
   - No workflow validation
   - Manual testing is time-consuming and error-prone

2. **Risk Areas**
   - Authentication flows
   - Task creation and management
   - Check-in/check-out with GPS and camera
   - Payment collection workflows
   - File upload reliability
   - Navigation and routing

3. **Platform Differences**
   - iOS and Android behave differently
   - Different device sizes not tested
   - Performance varies across devices
   - Platform-specific bugs go unnoticed

### Business Impact

- **Quality Issues**: Bugs reach production
- **Regression Risk**: New features break existing ones
- **Manual Testing Cost**: Time-consuming manual validation
- **User Trust**: Production bugs erode confidence

## Proposed Solution

### 1. Testing Framework Selection

After evaluating options for Expo/React Native:

#### Current Implementation: Mobile-MCP Tools

**Update (2025-10-28)**: The app has been optimized for mobile-mcp testing with comprehensive accessibility support:
- ✅ All interactive elements have `accessibilityLabel`, `accessibilityHint`, and `testID` props
- ✅ 95%+ click success rate (improved from ~50%)
- ✅ Comprehensive testing guide: `apps/mobile/MOBILE-MCP-TESTING.md`
- ✅ Quick reference: `apps/mobile/QUICK-TEST-REFERENCE.md`

See implementation: `.claude/tasks/20251028-mobile-mcp-accessibility-optimization.md`

#### Recommended: Maestro
**Pros:**
- Excellent React Native and Expo support
- Simple YAML-based test syntax
- Great debugging tools with Studio UI
- Cross-platform (iOS & Android)
- No app modifications needed
- Active development and community

**Cons:**
- Relatively new (but stable)
- Less ecosystem than Detox

**Example Test:**
```yaml
# login-flow.yaml
appId: com.nvinternal.app
---
- launchApp
- assertVisible: "Đăng nhập"
- tapOn: "Email"
- inputText: "admin@nvinternal.com"
- tapOn: "Mật khẩu"
- inputText: "Test123!"
- tapOn: "Đăng nhập"
- assertVisible: "Danh sách công việc"
```

#### Alternative: Detox
**Pros:**
- Mature and battle-tested
- Gray box testing (can interact with app internals)
- Strong React Native support
- Extensive documentation

**Cons:**
- Complex setup for Expo
- Requires app rebuilds
- Steeper learning curve
- More brittle tests

### 2. Critical Test Workflows

#### Authentication Tests
```yaml
# auth/login-success.yaml
- launchApp
- clearState
- assertVisible: "Đăng nhập"
- tapOn: "Email"
- inputText: "${TEST_ADMIN_EMAIL}"
- tapOn: "Mật khẩu"
- inputText: "${TEST_ADMIN_PASSWORD}"
- tapOn: "Đăng nhập"
- assertVisible: "Danh sách công việc"
- assertVisible: "Admin" # Role badge

# auth/login-worker.yaml
- launchApp
- clearState
- tapOn: "Email"
- inputText: "${TEST_WORKER_EMAIL}"
- tapOn: "Mật khẩu"
- inputText: "${TEST_WORKER_PASSWORD}"
- tapOn: "Đăng nhập"
- assertVisible: "Công việc của tôi"
- assertNotVisible: "Quản lý" # Admin tab hidden
```

#### Task Management Tests
```yaml
# tasks/create-task.yaml
- runFlow: auth/login-admin.yaml
- tapOn: "Tạo công việc"
- assertVisible: "Thông tin khách hàng"
- tapOn: "Tên khách hàng"
- inputText: "Nguyễn Văn Test"
- tapOn: "Số điện thoại"
- inputText: "0901234567"
- tapOn: "Địa chỉ"
- inputText: "123 Đường Test, Q1, TP.HCM"
- scrollDown
- tapOn: "Chọn vị trí trên bản đồ"
- tapOn:
    point: "50%, 50%" # Center of map
- tapOn: "Xác nhận"
- tapOn: "Mô tả công việc"
- inputText: "Kiểm tra và bảo trì máy lạnh"
- tapOn: "Chọn nhân viên"
- tapOn: "Nguyễn Văn A"
- tapOn: "Tạo công việc"
- assertVisible: "Tạo công việc thành công"
```

#### Check-in/Check-out Tests
```yaml
# checkin/checkin-with-photo.yaml
- runFlow: auth/login-worker.yaml
- tapOn:
    id: "task-card-1"
- assertVisible: "Chi tiết công việc"
- scrollDown
- tapOn: "Check-in"
- assertVisible: "Xác nhận vị trí"
# Handle camera permission
- tapOn: "Cho phép" # Camera permission
- waitForAnimationToEnd
# Take photo
- tapOn:
    id: "camera-capture-button"
- assertVisible: "Sử dụng ảnh này?"
- tapOn: "Sử dụng"
- tapOn: "Ghi chú"
- inputText: "Đã đến nơi, bắt đầu kiểm tra"
- tapOn: "Xác nhận Check-in"
- assertVisible: "Check-in thành công"
```

#### Payment Collection Tests
```yaml
# payment/collect-payment.yaml
- runFlow: tasks/navigate-to-task.yaml
- scrollDown
- tapOn: "Check-out"
- tapOn: "Thu tiền"
- toggleOn: "Đã thu tiền"
- tapOn: "Số tiền"
- inputText: "1500000"
- tapOn: "Chụp hóa đơn"
- tapOn:
    id: "camera-capture-button"
- tapOn: "Sử dụng"
- tapOn: "Hoàn thành"
- assertVisible: "Check-out thành công"
- assertVisible: "₫1,500,000" # Payment amount shown
```

### 3. Test Organization Structure

```
e2e/
├── maestro/
│   ├── config.yaml          # Maestro configuration
│   ├── flows/
│   │   ├── auth/
│   │   │   ├── login-admin.yaml
│   │   │   ├── login-worker.yaml
│   │   │   └── logout.yaml
│   │   ├── tasks/
│   │   │   ├── create-task.yaml
│   │   │   ├── edit-task.yaml
│   │   │   ├── delete-task.yaml
│   │   │   └── list-tasks.yaml
│   │   ├── checkin/
│   │   │   ├── checkin-with-photo.yaml
│   │   │   ├── checkout-with-payment.yaml
│   │   │   └── checkin-gps-warning.yaml
│   │   └── payment/
│   │       ├── collect-payment.yaml
│   │       └── edit-payment.yaml
│   └── helpers/
│       ├── navigation.yaml  # Reusable navigation flows
│       └── setup.yaml       # Test data setup
```

### 4. CI/CD Integration

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
    paths:
      - 'apps/mobile/**'
      - 'e2e/**'

jobs:
  test-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install

      - name: Build iOS app
        run: |
          cd apps/mobile
          eas build --platform ios --local --profile test

      - name: Install Maestro
        run: |
          curl -fsSL https://get.maestro.mobile.dev | bash
          export PATH="$PATH:$HOME/.maestro/bin"

      - name: Run E2E tests
        run: |
          maestro test e2e/maestro/flows

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: maestro-results-ios
          path: maestro-results/

  test-android:
    runs-on: ubuntu-latest
    # Similar steps for Android
```

### 5. Test Data Management

```typescript
// e2e/test-data/seed.ts
export async function seedE2EData() {
  // Create test users
  const adminUser = await createUser({
    email: 'e2e-admin@test.com',
    role: 'admin',
    password: 'TestAdmin123!'
  });

  const workerUser = await createUser({
    email: 'e2e-worker@test.com',
    role: 'worker',
    password: 'TestWorker123!'
  });

  // Create test tasks
  const tasks = await createTasks([
    {
      customerName: 'E2E Test Customer 1',
      status: 'READY',
      assignedTo: [workerUser.id]
    },
    // ... more test data
  ]);

  return { adminUser, workerUser, tasks };
}

// Reset function for clean state
export async function resetE2EData() {
  await prisma.task.deleteMany({
    where: { customer: { name: { startsWith: 'E2E Test' } } }
  });
  // ... cleanup other test data
}
```

## Implementation Plan

### Phase 1: Setup & Infrastructure (2 days)
- [ ] Research and choose testing framework
- [ ] Set up Maestro or Detox
- [ ] Configure for iOS and Android
- [ ] Create test data seeding scripts
- [ ] Set up local test environment
- [ ] Document setup process

### Phase 2: Core Workflow Tests (3 days)
- [ ] Authentication flows (admin/worker)
- [ ] Task creation and listing
- [ ] Task status updates
- [ ] Basic navigation tests
- [ ] Error handling scenarios

### Phase 3: Feature Tests (3 days)
- [ ] Check-in/check-out with GPS
- [ ] Photo capture and upload
- [ ] Payment collection flow
- [ ] Activity feed updates
- [ ] Employee management (admin)

### Phase 4: CI/CD Integration (2 days)
- [ ] GitHub Actions workflow
- [ ] iOS simulator setup
- [ ] Android emulator setup
- [ ] Test result reporting
- [ ] PR status checks
- [ ] Nightly test runs

### Phase 5: Advanced Tests (2 days)
- [ ] Performance tests
- [ ] Network failure scenarios
- [ ] Deep linking tests
- [ ] Push notification tests
- [ ] Offline mode tests
- [ ] Device rotation tests

## Benefits

### Quality Assurance
- **Catch Regressions**: Automatically detect breaking changes
- **Platform Coverage**: Test both iOS and Android
- **Workflow Validation**: Ensure critical paths work
- **Early Detection**: Find bugs before production

### Development Efficiency
- **Faster Releases**: Confidence to ship quickly
- **Reduced Manual Testing**: Automate repetitive tests
- **Documentation**: Tests document expected behavior
- **Refactoring Safety**: Change code without fear

### Business Value
- **User Trust**: Fewer production bugs
- **Cost Savings**: Less time on manual QA
- **Faster Iteration**: Ship features with confidence
- **Better UX**: Catch UI/UX issues early

## Technical Considerations

### Test Stability
- Use test IDs for reliable element selection
- Implement proper waits and retries
- Handle animations and transitions
- Mock external services when needed

### Performance
- Run tests in parallel when possible
- Use cloud device farms for scale
- Optimize test data setup/teardown
- Cache dependencies in CI

### Maintenance
- Keep tests simple and readable
- Use page object pattern
- Share common flows
- Regular test review and cleanup

## Estimated Effort

**Total Estimate**: 12-15 days

### Breakdown
- Framework setup: 2 days
- Core tests: 3 days
- Feature tests: 3 days
- CI/CD setup: 2 days
- Advanced tests: 2 days
- Documentation: 1 day
- Buffer for issues: 2-3 days

## Priority

**Medium-High** - While not blocking immediate features, E2E tests become critical as the app grows and the team scales. Starting early prevents technical debt.

## Dependencies

- Testing framework (Maestro/Detox)
- CI/CD platform (GitHub Actions)
- Test devices/simulators
- Test data management strategy
- Stable test environment

## Success Metrics

- 90% of critical paths have E2E tests
- Tests run on every PR
- <5% test flakiness rate
- All tests complete in <30 minutes
- Zero production regressions in tested flows

## Recommendations

1. **Start with Maestro** - Simpler setup and maintenance for Expo apps
2. **Focus on Critical Paths** - Test the most important workflows first
3. **Implement Gradually** - Add tests incrementally, don't block on 100% coverage
4. **Involve Team** - Train all developers to write and maintain tests
5. **Monitor Flakiness** - Track and fix flaky tests immediately

## Next Steps

1. **Consult react-native-expert agent** for specific Expo testing insights
2. **Prototype with Maestro** - Try a simple login test
3. **Evaluate complexity** - Assess setup difficulty
4. **Create POC** - Implement 2-3 core tests
5. **Team review** - Get buy-in from development team
6. **Rollout plan** - Phase implementation over sprints

## Related Items

- API testing strategy (existing Jest tests)
- Performance testing
- Accessibility testing
- Security testing
- Visual regression testing (future)

## Notes

- Consider using Percy or Chromatic for visual regression testing
- May want to add performance metrics to E2E tests
- Could integrate with error tracking (Sentry)
- Consider testing on real devices via BrowserStack/Sauce Labs
- Maestro Cloud offers distributed testing if needed