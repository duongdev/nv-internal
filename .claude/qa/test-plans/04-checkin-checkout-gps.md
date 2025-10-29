# Test Plan: Check-in/Check-out with GPS Verification

**Feature**: GPS-Verified Check-in and Check-out
**Version**: 1.0.0
**Created**: 2025-10-30
**Last Updated**: 2025-10-30
**Status**: ⏳ Draft

## 📋 Feature Overview

### Description
Location-based check-in/check-out system that verifies employee presence at customer locations using GPS coordinates with configurable distance thresholds.

### Business Requirements
- Verify employee is at customer location
- Track check-in and check-out times
- Calculate work duration automatically
- Prevent fraudulent check-ins
- Support configurable distance thresholds
- Handle GPS unavailability gracefully

### Technical Implementation
- **Frontend**: Expo Location API, real-time GPS
- **Backend**: Haversine distance calculation
- **Database**: GeoLocation model, Activity logging

### Related Documentation
- Feature Plan: `.claude/plans/v1/02-checkin-checkout.md`
- GPS Pattern: `docs/architecture/patterns/gps-verification.md`
- Activity Events: `docs/architecture/patterns/activity-event.md`

## 🎯 Test Objectives

### Primary Goals
1. Verify GPS distance calculation accuracy
2. Ensure check-in/out flow works smoothly
3. Validate threshold enforcement
4. Test GPS error handling
5. Confirm activity logging

### Out of Scope
- GPS hardware testing
- Location spoofing prevention (OS level)

## ✅ Success Criteria

### Functional Criteria
- [ ] Check-in works within threshold
- [ ] Check-in blocked outside threshold
- [ ] Check-out records duration
- [ ] GPS coordinates stored correctly
- [ ] Activity events logged
- [ ] Warning messages display appropriately

### Non-Functional Criteria
- [ ] GPS acquisition < 5 seconds
- [ ] Check-in response < 2 seconds
- [ ] Accurate to within 10 meters
- [ ] Works with poor GPS signal
- [ ] Battery usage acceptable

## 📋 Prerequisites

### Test Environment
- **Device Requirements**: Real device with GPS
- **Network**: Mobile data or WiFi
- **Permissions**: Location services enabled
- **Settings**: High accuracy GPS mode

### Test Data
- **User Accounts**: Field employee account
- **Required Data**:
  - Tasks with customer locations
  - Valid GPS coordinates
  - Test locations at various distances
  - CHECKIN_DISTANCE_THRESHOLD env var (100m default)

### Setup Steps
1. Enable location services
2. Set GPS to high accuracy
3. Login as field employee
4. Navigate to assigned task

## 🧪 Test Scenarios

### Happy Path Scenarios

#### Scenario 1: Check-in at Customer Location
**Priority**: High
**Test Data**: At exact customer location

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Open task details | Check-in button visible | | ⏳ |
| 2 | Tap check-in | GPS acquisition starts | | ⏳ |
| 3 | Wait for GPS | Location found indicator | | ⏳ |
| 4 | Verify distance | Shows "0m from location" | | ⏳ |
| 5 | Confirm check-in | Success message | | ⏳ |
| 6 | Verify UI update | Shows checked-in status | | ⏳ |
| 7 | Check activity log | Event recorded | | ⏳ |

#### Scenario 2: Check-out After Work
**Priority**: High
**Test Data**: Already checked-in task

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | View checked-in task | Check-out button shows | | ⏳ |
| 2 | Tap check-out | Confirmation dialog | | ⏳ |
| 3 | Confirm action | Check-out recorded | | ⏳ |
| 4 | Verify duration | Work time calculated | | ⏳ |
| 5 | Check activity | Check-out event logged | | ⏳ |

### Edge Cases

#### Scenario 3: Check-in Near Threshold
**Priority**: Medium
**Test Data**: 90-100m from location

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Position near threshold | ~95m from location | | ⏳ |
| 2 | Attempt check-in | GPS calculates distance | | ⏳ |
| 3 | Verify warning | "95m away" warning | | ⏳ |
| 4 | Proceed anyway | Check-in allowed | | ⏳ |
| 5 | Verify metadata | Distance recorded | | ⏳ |

#### Scenario 4: Check-in Beyond Threshold
**Priority**: High
**Test Data**: >100m from location

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Position far from location | >100m away | | ⏳ |
| 2 | Attempt check-in | GPS calculates distance | | ⏳ |
| 3 | Verify block | "Too far" error message | | ⏳ |
| 4 | Show distance | "150m away" displayed | | ⏳ |
| 5 | Check-in disabled | Cannot proceed | | ⏳ |

### Error Scenarios

#### Scenario 5: GPS Unavailable
**Priority**: High
**Test Data**: GPS disabled

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Disable GPS | Location services off | | ⏳ |
| 2 | Try check-in | Error message shown | | ⏳ |
| 3 | Verify message | "Enable location" prompt | | ⏳ |
| 4 | Settings link | Opens location settings | | ⏳ |
| 5 | Enable and retry | Check-in works | | ⏳ |

#### Scenario 6: Poor GPS Signal
**Priority**: Medium
**Test Data**: Indoor/underground location

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Go indoors | Weak GPS signal | | ⏳ |
| 2 | Try check-in | Loading indicator | | ⏳ |
| 3 | Wait for timeout | Timeout message | | ⏳ |
| 4 | Suggest solution | "Go outside" hint | | ⏳ |
| 5 | Improve signal | Retry successful | | ⏳ |

### Integration Scenarios

#### Scenario 7: Multiple Check-ins Same Day
**Priority**: Medium
**Test Data**: Multiple tasks

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Check-in task 1 | Success | | ⏳ |
| 2 | Check-out task 1 | Success | | ⏳ |
| 3 | Navigate to task 2 | Different location | | ⏳ |
| 4 | Check-in task 2 | New GPS check | | ⏳ |
| 5 | Verify both logged | Activity shows both | | ⏳ |

### Performance Scenarios

#### Scenario 8: Rapid Check-in/out
**Priority**: Low
**Test Data**: Quick task completion

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Check-in to task | Success | | ⏳ |
| 2 | Wait 1 minute | Timer running | | ⏳ |
| 3 | Check-out quickly | Minimum duration check | | ⏳ |
| 4 | Verify duration | Shows 1 minute | | ⏳ |

## 🔄 Regression Tests

### Critical Paths to Verify
- [ ] Task status updates still work
- [ ] Photo uploads not affected
- [ ] Task assignment unchanged
- [ ] Other employees can check-in

## 📊 Test Execution

### Test Coverage

| Area | Scenarios | Passed | Failed | Blocked | Coverage |
|------|-----------|---------|---------|----------|-----------|
| Happy Path | 2 | | | | 0% |
| Edge Cases | 2 | | | | 0% |
| Error Handling | 2 | | | | 0% |
| Integration | 1 | | | | 0% |
| Performance | 1 | | | | 0% |
| **Total** | **8** | **0** | **0** | **0** | **0%** |

## 🐛 Defects Found

### Bug Summary
(To be filled during testing)

## 📈 Test Metrics

### Accuracy Metrics
- **Distance Accuracy**: ±10 meters
- **GPS Acquisition**: < 5 seconds
- **Check-in Success Rate**: Target 95%
- **False Positive Rate**: < 1%

## 🎬 Test Evidence

### Screenshots
- GPS permission request
- Distance calculation display
- Check-in success/failure
- Activity log entries

## ✍️ Sign-off

### Test Completion Criteria
- [ ] All distances tested
- [ ] Error scenarios handled
- [ ] GPS accuracy verified
- [ ] Activity logging confirmed

## 📝 Notes and Observations

### Improvements Suggested
- Manual override for admins
- GPS accuracy indicator
- Historical location tracking
- Offline check-in queue

### Follow-up Items
- [ ] Test in various weather conditions
- [ ] Verify battery impact
- [ ] Test location spoofing prevention