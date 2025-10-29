# Test Plan: Payment Tracking

**Feature**: Payment Recording and Tracking System
**Version**: 1.0.0
**Created**: 2025-10-30
**Last Updated**: 2025-10-30
**Status**: ⏳ Draft

## 📋 Feature Overview

### Description
Comprehensive payment tracking system for recording customer payments, managing payment methods, tracking revenue, and generating payment reports.

### Business Requirements
- Record payments from customers
- Support multiple payment methods (cash, transfer, card)
- Track partial and full payments
- Calculate revenue sharing
- Generate payment receipts
- View payment history

### Technical Implementation
- **Frontend**: Payment form modals, payment list views
- **Backend**: Payment service with decimal handling
- **Database**: Payment model with precise decimal fields

### Related Documentation
- Feature Plan: `.claude/plans/v1/01-payment-system.md`
- Payment Patterns: `docs/architecture/patterns/payment-transactions.md`

## 🎯 Test Objectives

### Primary Goals
1. Verify accurate payment recording
2. Ensure decimal precision for amounts
3. Validate payment method handling
4. Test revenue calculations
5. Confirm receipt generation

### Out of Scope
- External payment gateway integration
- Automated payment processing

## ✅ Success Criteria

### Functional Criteria
- [ ] Payment amounts recorded accurately
- [ ] All payment methods supported
- [ ] Partial payments tracked correctly
- [ ] Total calculations accurate
- [ ] Receipts generated properly
- [ ] Payment history displays correctly
- [ ] Activity events logged

### Non-Functional Criteria
- [ ] No floating-point errors
- [ ] Form submission < 2 seconds
- [ ] Payment list loads quickly
- [ ] Currency formatting correct
- [ ] Vietnamese number format

## 📋 Prerequisites

### Test Environment
- **Device Requirements**: iOS 14+ / Android 10+
- **Network**: Stable internet connection
- **Permissions**: None required

### Test Data
- **User Accounts**: Employee with payment permissions
- **Required Data**:
  - Tasks ready for payment
  - Various payment amounts
  - Customer information
  - Test payment scenarios

### Setup Steps
1. Login as authorized employee
2. Navigate to task with payment due
3. Ensure customer data complete

## 🧪 Test Scenarios

### Happy Path Scenarios

#### Scenario 1: Record Cash Payment
**Priority**: High
**Test Data**: Task with 1,000,000 VND due

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Open task details | Payment section visible | | ⏳ |
| 2 | Tap add payment | Payment form opens | | ⏳ |
| 3 | Enter amount: 1000000 | Amount formatted | | ⏳ |
| 4 | Select "Cash" method | Method selected | | ⏳ |
| 5 | Add note (optional) | Note accepted | | ⏳ |
| 6 | Submit payment | Success message | | ⏳ |
| 7 | Verify record | Payment in list | | ⏳ |

#### Scenario 2: Record Bank Transfer
**Priority**: High
**Test Data**: Transfer reference number

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Open payment form | Form displays | | ⏳ |
| 2 | Enter amount | Amount accepted | | ⏳ |
| 3 | Select "Transfer" | Transfer fields show | | ⏳ |
| 4 | Enter reference | Reference saved | | ⏳ |
| 5 | Submit payment | Recorded successfully | | ⏳ |
| 6 | Verify details | Reference shown | | ⏳ |

#### Scenario 3: Partial Payment
**Priority**: High
**Test Data**: 500,000 of 1,000,000 VND

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | View amount due | Shows 1,000,000 | | ⏳ |
| 2 | Record 500,000 payment | Payment accepted | | ⏳ |
| 3 | Check balance | Shows 500,000 remaining | | ⏳ |
| 4 | Add second payment | 500,000 payment | | ⏳ |
| 5 | Verify total | Fully paid status | | ⏳ |

### Edge Cases

#### Scenario 4: Large Amount Payment
**Priority**: Medium
**Test Data**: 99,999,999 VND

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Enter large amount | Number formatted correctly | | ⏳ |
| 2 | Verify display | Commas in right places | | ⏳ |
| 3 | Submit payment | No precision loss | | ⏳ |
| 4 | Check database | Exact amount stored | | ⏳ |

#### Scenario 5: Decimal Amount
**Priority**: Medium
**Test Data**: 1,234,567.89 VND

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Enter decimal amount | Decimals accepted | | ⏳ |
| 2 | Verify precision | Two decimal places | | ⏳ |
| 3 | Submit payment | Stored accurately | | ⏳ |
| 4 | Check calculations | No rounding errors | | ⏳ |

### Error Scenarios

#### Scenario 6: Invalid Amount
**Priority**: High
**Test Data**: Negative, zero, text

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Enter -1000 | Error message | | ⏳ |
| 2 | Enter 0 | Error message | | ⏳ |
| 3 | Enter "abc" | Input rejected | | ⏳ |
| 4 | Leave empty | Validation error | | ⏳ |
| 5 | Enter valid amount | Form accepts | | ⏳ |

#### Scenario 7: Network Failure
**Priority**: Medium
**Test Data**: Payment to submit

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Fill payment form | Form complete | | ⏳ |
| 2 | Disable network | Offline state | | ⏳ |
| 3 | Try to submit | Error message | | ⏳ |
| 4 | Enable network | Online state | | ⏳ |
| 5 | Retry submission | Payment recorded | | ⏳ |

### Integration Scenarios

#### Scenario 8: Payment with Task Completion
**Priority**: Medium
**Test Data**: Final payment on task

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Record final payment | Payment saved | | ⏳ |
| 2 | Mark task complete | Status updated | | ⏳ |
| 3 | Check payment status | Shows as final | | ⏳ |
| 4 | Verify in reports | Included in revenue | | ⏳ |

## 🔄 Regression Tests

### Critical Paths to Verify
- [ ] Task status unaffected
- [ ] Customer data intact
- [ ] Other payments unchanged
- [ ] Reports still accurate

## 📊 Test Execution

### Test Coverage

| Area | Scenarios | Passed | Failed | Blocked | Coverage |
|------|-----------|---------|---------|----------|-----------|
| Payment Entry | 3 | | | | 0% |
| Edge Cases | 2 | | | | 0% |
| Error Handling | 2 | | | | 0% |
| Integration | 1 | | | | 0% |
| **Total** | **8** | **0** | **0** | **0** | **0%** |

## 🐛 Defects Found

### Bug Summary
(To be filled during testing)

## 📈 Test Metrics

### Accuracy Metrics
- **Decimal Precision**: 100% accuracy
- **Calculation Errors**: 0 tolerance
- **Format Compliance**: VND format

## 🎬 Test Evidence

### Screenshots
- Payment form views
- Payment list display
- Receipt generation
- Error messages

## ✍️ Sign-off

### Test Completion Criteria
- [ ] All payment methods tested
- [ ] Decimal accuracy verified
- [ ] Calculations validated
- [ ] Error handling confirmed

## 📝 Notes and Observations

### Improvements Suggested
- Quick payment buttons
- Payment templates
- Bulk payment entry
- Payment reminders

### Follow-up Items
- [ ] Test currency formatting
- [ ] Verify receipt printing
- [ ] Test payment exports