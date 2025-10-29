# Test Plan Template

**Feature**: [Feature Name]
**Version**: [App Version]
**Created**: YYYY-MM-DD
**Last Updated**: YYYY-MM-DD
**Status**: ⏳ Draft | 🔄 In Review | ✅ Approved | 📝 In Progress | ✅ Completed

## 📋 Feature Overview

### Description
[Brief description of the feature being tested]

### Business Requirements
- [Key requirement 1]
- [Key requirement 2]
- [Key requirement 3]

### Technical Implementation
- **Frontend**: [React Native components/screens involved]
- **Backend**: [API endpoints used]
- **Database**: [Models/tables affected]

### Related Documentation
- Feature Specification: `.claude/plans/v1/[feature].md`
- Implementation Task: `.claude/tasks/[task].md`
- API Documentation: `docs/api/[endpoint].md`

## 🎯 Test Objectives

### Primary Goals
1. [Verify core functionality works as designed]
2. [Ensure data integrity and accuracy]
3. [Validate user experience meets requirements]

### Out of Scope
- [Items explicitly not being tested]
- [Features covered by other test plans]

## ✅ Success Criteria

### Functional Criteria
- [ ] All happy path scenarios pass
- [ ] Error handling works correctly
- [ ] Data validation prevents invalid inputs
- [ ] Integration with other features works

### Non-Functional Criteria
- [ ] Performance meets requirements (< X seconds)
- [ ] UI is responsive and smooth
- [ ] Accessibility requirements met
- [ ] Vietnamese language displays correctly

## 📋 Prerequisites

### Test Environment
- **Device Requirements**: iOS 14+ / Android 10+
- **Network**: Stable internet connection
- **Location Services**: Enabled (if applicable)
- **Permissions**: Camera, location (as needed)

### Test Data
- **User Accounts**:
  - Admin: [email]
  - Employee: [email]
  - Manager: [email]
- **Required Data**:
  - [Existing records needed]
  - [Configuration settings]

### Setup Steps
1. [Install app version X.X.X]
2. [Configure test environment]
3. [Prepare test data]

## 🧪 Test Scenarios

### Happy Path Scenarios

#### Scenario 1: [Primary Use Case]
**Priority**: High
**Test Data**: [Specific data needed]

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | [User action] | [Expected outcome] | | ⏳ |
| 2 | [User action] | [Expected outcome] | | ⏳ |
| 3 | [User action] | [Expected outcome] | | ⏳ |

**Verification Points**:
- [ ] [What to verify]
- [ ] [What to check]

#### Scenario 2: [Secondary Use Case]
**Priority**: Medium
**Test Data**: [Specific data needed]

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | [User action] | [Expected outcome] | | ⏳ |
| 2 | [User action] | [Expected outcome] | | ⏳ |

### Edge Cases

#### Scenario 3: [Edge Case Description]
**Priority**: Medium
**Test Data**: [Edge case data]

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | [User action] | [Expected outcome] | | ⏳ |
| 2 | [User action] | [Expected outcome] | | ⏳ |

### Error Scenarios

#### Scenario 4: [Error Handling]
**Priority**: High
**Test Data**: [Invalid data]

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | [User action with invalid input] | [Error message/behavior] | | ⏳ |
| 2 | [Recovery action] | [Expected recovery] | | ⏳ |

### Integration Scenarios

#### Scenario 5: [Integration with Other Feature]
**Priority**: Medium
**Test Data**: [Integration test data]

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | [Cross-feature action] | [Expected integration behavior] | | ⏳ |

## 🔄 Regression Tests

### Critical Paths to Verify
- [ ] [Existing feature 1] still works
- [ ] [Existing feature 2] not affected
- [ ] [Performance] not degraded

## 📊 Test Execution

### Test Cycles

#### Cycle 1: Initial Testing
- **Date**: YYYY-MM-DD
- **Tester**: [Name]
- **Device**: [Device/Simulator]
- **Results**: X/Y scenarios passed
- **Issues Found**: [List of bugs]

#### Cycle 2: Bug Verification
- **Date**: YYYY-MM-DD
- **Tester**: [Name]
- **Device**: [Device/Simulator]
- **Results**: X/Y bugs fixed
- **Outstanding Issues**: [Remaining bugs]

### Test Coverage

| Area | Scenarios | Passed | Failed | Blocked | Coverage |
|------|-----------|---------|---------|----------|-----------|
| Happy Path | X | | | | 0% |
| Edge Cases | X | | | | 0% |
| Error Handling | X | | | | 0% |
| Integration | X | | | | 0% |
| **Total** | **X** | **0** | **0** | **0** | **0%** |

## 🐛 Defects Found

### Bug Summary

| ID | Description | Severity | Status | Notes |
|----|-------------|----------|--------|--------|
| BUG-001 | [Bug description] | Critical/High/Medium/Low | Open/Fixed/Verified | [Notes] |

### Detailed Bug Reports
[Link to detailed bug reports in test-results/]

## 📈 Test Metrics

### Execution Metrics
- **Total Test Cases**: X
- **Executed**: X (X%)
- **Passed**: X (X%)
- **Failed**: X (X%)
- **Blocked**: X (X%)

### Quality Metrics
- **Defect Density**: X bugs per scenario
- **Critical Defects**: X
- **Test Effectiveness**: X% of bugs found

## 🎬 Test Evidence

### Screenshots
- [Login screen - success]: `test-results/YYYYMMDD/screenshot-001.png`
- [Error state]: `test-results/YYYYMMDD/screenshot-002.png`

### Test Recordings
- [Full flow video]: `test-results/YYYYMMDD/recording-001.mp4`

## ✍️ Sign-off

### Test Completion Criteria
- [ ] All high priority scenarios executed
- [ ] All critical bugs fixed and verified
- [ ] Regression tests passed
- [ ] Performance acceptable
- [ ] Documentation updated

### Approvals
- **QA Lead**: [Name] - [Date]
- **Development Lead**: [Name] - [Date]
- **Product Owner**: [Name] - [Date]

## 📝 Notes and Observations

### Improvements Suggested
- [UI/UX improvement ideas]
- [Performance optimization opportunities]
- [Feature enhancement suggestions]

### Lessons Learned
- [What worked well]
- [What could be improved]
- [Process improvements]

### Follow-up Items
- [ ] [Action items]
- [ ] [Documentation updates needed]
- [ ] [Additional testing required]

---

**Test Plan Status Legend**:
- ⏳ Pending - Not started
- 🔄 In Progress - Currently testing
- ✅ Passed - Test successful
- ❌ Failed - Test failed
- 🔒 Blocked - Cannot test due to blocker
- ⏭️ Skipped - Test skipped (with reason)