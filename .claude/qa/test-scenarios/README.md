# Test Scenarios

This directory contains detailed test scenarios organized by feature area.

## Structure

```
test-scenarios/
├── authentication/
│   ├── login-flow.md
│   ├── logout-flow.md
│   └── session-management.md
├── task-management/
│   ├── task-list-operations.md
│   ├── task-filtering.md
│   └── task-details.md
├── payments/
│   ├── payment-recording.md
│   └── payment-validation.md
└── [feature-area]/
    └── [scenario-name].md
```

## Purpose

Test scenarios provide step-by-step instructions for executing specific test cases. They are more detailed than test plans and focus on individual user flows.

## Creating Scenarios

When creating test scenarios:
1. Use descriptive filenames
2. Include exact steps with expected results
3. Specify test data requirements
4. Note any prerequisites
5. Link back to parent test plan

## Scenario Template

Each scenario should include:
- Scenario name and ID
- Purpose/objective
- Prerequisites
- Test data
- Step-by-step instructions
- Expected results
- Actual results (filled during execution)
- Pass/fail status

## Usage

Test scenarios are executed by:
- QA engineers during manual testing
- The qa-ui agent for automated testing
- Developers verifying fixes

Results from scenario execution are documented in `test-results/`.
