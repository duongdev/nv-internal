# QA Documentation

This directory contains comprehensive quality assurance documentation for the NV Internal mobile application.

## 📂 Structure

```
.claude/qa/
├── README.md                    # This file - navigation and methodology
├── mobile-testing-guide.md      # Guide for using Mobile-MCP
├── test-plan-template.md        # Template for creating test plans
├── test-plans/                  # Feature-specific test plans
│   ├── 01-authentication.md
│   ├── 02-task-list-filtering.md
│   ├── 03-task-details-attachments.md
│   ├── 04-checkin-checkout-gps.md
│   ├── 05-payment-tracking.md
│   ├── 06-monthly-reports.md
│   └── 07-navigation-routing.md
├── test-scenarios/              # Detailed test scenarios
│   └── [feature-name]/
│       └── [scenario-name].md
└── test-results/               # Test execution results
    └── [YYYYMMDD-feature]/
        └── results.md
```

## 🎯 Testing Methodology

### 1. Test Planning Phase
- Review feature requirements from `.claude/plans/v1/`
- Create or update test plan in `test-plans/`
- Define success criteria and acceptance tests
- Identify edge cases and error scenarios

### 2. Test Scenario Development
- Break down test plans into detailed scenarios
- Document step-by-step test procedures
- Include expected results for each step
- Cover both happy paths and edge cases

### 3. Test Execution
- Use Mobile-MCP tools for automated interaction
- Document actual results in `test-results/`
- Capture screenshots for failures
- Log bugs with reproduction steps

### 4. Test Verification
- Verify bug fixes
- Run regression tests
- Update test results with verification status
- Sign off on feature completion

## 🧪 Test Coverage Areas

### Core Functionality
1. **Authentication & Authorization**
   - Clerk login/logout flows
   - Session management
   - Role-based access

2. **Task Management**
   - CRUD operations
   - Status transitions
   - Assignment workflows

3. **Location Services**
   - GPS verification
   - Check-in/out accuracy
   - Distance calculations

4. **Data Management**
   - Photo attachments
   - Payment records
   - Activity logging

5. **Reporting**
   - Employee summaries
   - Performance metrics
   - Data accuracy

### Non-Functional Testing
- **Performance**: App responsiveness, list scrolling
- **Usability**: Navigation, form interactions
- **Accessibility**: Screen readers, touch targets
- **Localization**: Vietnamese language support
- **Network**: Offline behavior, sync issues

## 📋 Test Status Dashboard

| Feature | Test Plan | Scenarios | Last Tested | Status |
|---------|-----------|-----------|-------------|---------|
| Authentication | ✅ Created | 🔄 In Progress | - | ⏳ Pending |
| Task List | ✅ Created | ⏳ Pending | - | ⏳ Pending |
| Task Details | ✅ Created | ⏳ Pending | - | ⏳ Pending |
| Check-in/out | ✅ Created | ⏳ Pending | - | ⏳ Pending |
| Payments | ✅ Created | ⏳ Pending | - | ⏳ Pending |
| Reports | ✅ Created | ⏳ Pending | - | ⏳ Pending |
| Navigation | ✅ Created | ⏳ Pending | - | ⏳ Pending |

## 🔄 Testing Workflow

### For New Features
1. Create test plan when feature is in `.claude/plans/v1/`
2. Review with development during implementation
3. Create detailed test scenarios
4. Execute tests when feature is ready
5. Document results and bugs
6. Verify fixes and run regression tests
7. Update status to ✅ Completed

### For Bug Fixes
1. Create test scenario to reproduce bug
2. Execute test to confirm bug exists
3. Re-test after fix is implemented
4. Add to regression test suite
5. Document verification in test results

### For Regression Testing
1. Run core functionality tests before releases
2. Focus on critical paths
3. Test integrations between features
4. Verify no existing functionality broken

## 🤖 Using QA Agents

### Mobile QA Agent (`qa-ui`)
Specialized agent for mobile UI testing:
- Creates comprehensive test scenarios
- Executes tests using Mobile-MCP
- Documents test results
- Identifies UI/UX issues

**When to use:**
- Testing new mobile features
- Verifying bug fixes
- Running regression tests
- Checking accessibility

**Invocation:**
```
Use the qa-ui agent to test [feature name]
```

## 📊 Test Metrics

Track these key metrics:
- **Test Coverage**: % of features with test plans
- **Pass Rate**: % of tests passing
- **Bug Discovery**: Bugs found per test cycle
- **Regression Rate**: % of bugs reintroduced
- **Test Execution Time**: Time to run test suite

## 🐛 Bug Tracking

When bugs are found:
1. Document in test results with:
   - Clear description
   - Reproduction steps
   - Expected vs actual behavior
   - Screenshots/recordings
   - Severity level
2. Create task in `.claude/tasks/` for fixes
3. Link test result to task
4. Verify fix and update status

## 📝 Documentation Standards

All test documentation should:
- Use clear, concise language
- Include timestamps (UTC)
- Reference specific app versions
- Link to related documentation
- Follow the template structure
- Include visual evidence when relevant

## 🔗 Related Documentation

- **Feature Plans**: `.claude/plans/v1/`
- **Task Tracking**: `.claude/tasks/`
- **Development Guide**: `docs/development/`
- **Mobile Testing**: `docs/testing/mobile-mcp.md`
- **Architecture**: `docs/architecture/`

## ✅ Quality Gates

Features are considered tested when:
1. All test scenarios documented
2. Test execution completed
3. All critical/high bugs fixed
4. Regression tests pass
5. Test results documented
6. Status updated to Completed

---

*This QA documentation structure ensures comprehensive testing coverage and maintains a clear audit trail of all testing activities.*