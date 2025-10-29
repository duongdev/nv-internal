# Test Plans

This directory contains comprehensive test plans for major features and workflows in the NV Internal mobile application.

## Test Plan Template

Each test plan should follow this structure:

```markdown
# [Feature Name] Test Plan

**Created**: YYYY-MM-DD
**Last Updated**: YYYY-MM-DD
**Version**: X.Y
**Status**: Draft | In Progress | Active | Deprecated

## 1. Overview

### Feature Description
Brief description of the feature being tested.

### Testing Scope
What will be tested:
- Component A
- Flow B
- Integration C

What will NOT be tested:
- Out-of-scope items
- Future enhancements

### Test Objectives
- Verify [objective 1]
- Validate [objective 2]
- Ensure [objective 3]

## 2. Test Environment

### Prerequisites
- Required accounts (admin/worker/etc)
- Test data needed
- API/backend setup
- Device configurations

### Test Devices
- iOS: iPhone X and above (iOS 14+)
- Android: Samsung/Pixel (Android 10+)
- Simulators/Emulators: Versions to test

### Test Tools
- Mobile-MCP for automated testing
- Manual testing tools
- Screen recording/screenshots

## 3. Test Strategy

### Test Approach
- Manual testing focus areas
- Automated testing approach
- Integration points to validate
- Performance benchmarks

### Risk Areas
- High-risk scenarios
- Edge cases
- Known limitations
- Platform-specific issues

## 4. Test Scenarios

List high-level test scenarios (detailed in test-scenarios/ directory):

1. **[Scenario Category]**
   - TC-001: Test case description
   - TC-002: Test case description

2. **[Scenario Category]**
   - TC-003: Test case description
   - TC-004: Test case description

## 5. Test Data

### Required Test Accounts
- Admin: admin@test.com / credentials
- Worker: worker@test.com / credentials

### Test Data Sets
- Sample customers
- Sample tasks
- Sample locations

## 6. Success Criteria

- All critical test cases pass
- No high-severity bugs
- Performance meets benchmarks
- Accessibility requirements met

## 7. Dependencies

- Backend API: version X.Y
- Database: schema version
- Third-party services: Clerk, Google Maps, etc.

## 8. Schedule

- Test plan creation: Date
- Test scenario creation: Date
- Test execution: Date range
- Bug fixing: Date range
- Retest: Date

## 9. Exit Criteria

- Test coverage: 90%+ of critical paths
- Bug closure: All critical/high bugs fixed
- Regression: No new regressions introduced
- Sign-off: Product owner approval

## 10. Related Documentation

- Test Scenarios: Link to test-scenarios file
- Implementation Task: Link to .claude/tasks file
- Feature Plan: Link to .claude/plans/v1 file (if applicable)
```

## Existing Test Plans

Add links to test plans as they are created:

- [Example: Check-in/Check-out Test Plan](./example-checkin-test-plan.md) (template reference)

## Creating New Test Plans

1. Use the template above
2. Name file: `YYYYMMDD-HHMMSS-feature-name-test-plan.md`
3. Link from this README
4. Reference in related test scenarios
5. Update as feature evolves
