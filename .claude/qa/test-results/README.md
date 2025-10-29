# Test Results

This directory contains test execution results organized by date and feature.

## Structure

```
test-results/
├── YYYYMMDD-feature-name/
│   ├── results.md
│   ├── screenshots/
│   │   ├── 001-login-success.png
│   │   └── 002-error-state.png
│   ├── logs/
│   │   └── test-execution.log
│   └── bugs-found.md
└── [date-feature]/
    └── results.md
```

## Naming Convention

- Directory: `YYYYMMDD-feature-name/`
  - Example: `20251030-authentication/`
- Screenshots: `NNN-description.png`
  - Example: `001-login-success.png`
- Results: `results.md` (main results file)

## Result Documentation

Each test result should include:

### Execution Summary
- Date and time (UTC)
- Tester name/agent
- Device/simulator used
- App version tested
- Test plan/scenario reference

### Test Results
- Total scenarios executed
- Pass/fail/blocked counts
- Execution time

### Detailed Results
For each scenario:
- Scenario ID and name
- Steps executed
- Expected vs actual results
- Screenshots/evidence
- Pass/fail status
- Notes/observations

### Bugs Found
- Bug ID and title
- Severity level
- Reproduction steps
- Screenshots
- Workaround if any

## Bug Severity Levels

- **Critical**: App crash, data loss, security issue
- **High**: Major feature broken, no workaround
- **Medium**: Feature impaired, workaround exists
- **Low**: Minor issue, cosmetic problem

## Archival

Test results older than 3 months may be archived to maintain directory size.

## Integration

Test results should be:
1. Referenced in test plans
2. Linked from bug reports
3. Used for regression testing
4. Reviewed in retrospectives
