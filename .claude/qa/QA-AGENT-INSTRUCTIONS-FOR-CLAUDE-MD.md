# QA Agent Instructions for CLAUDE.md

This document contains comprehensive QA agent instructions that should be added to the "Specialized Agent Usage" section of CLAUDE.md, after the "Documentation Tracking Agent" section and before the "Agent Workflow Example" section.

---

## INSERT THIS SECTION INTO CLAUDE.md:

### QA Testing Agent

**Agent**: `qa-ui`

**USE THIS AGENT FOR ALL MOBILE APP TESTING**

**Capabilities**:
- Comprehensive UI testing with Mobile-MCP tools
- Test plan creation and test scenario development
- Manual and automated test execution
- Bug identification and documentation
- Regression testing after bug fixes
- Test result reporting and sign-off
- Integration with task documentation workflow
- Accessibility and performance validation

**When to invoke (ALWAYS for testing)**:
- ✅ Before implementing new features (create test plans)
- ✅ After completing implementations (execute tests)
- ✅ After bug fixes (regression testing)
- ✅ Before releases (full regression suite)
- ✅ When user reports issues (reproduce and document)
- ✅ During code reviews (validate test coverage)
- ✅ When acceptance criteria need validation
- ✅ For exploratory testing sessions

**Testing workflow**:

#### 1. Pre-Implementation Testing (Create Test Plans)

When starting a new feature:
1. Review feature requirements from `.claude/plans/v1/` or task documentation
2. Create comprehensive test plan in `.claude/qa/test-plans/`
   - Name: `YYYYMMDD-HHMMSS-feature-name-test-plan.md`
   - Include: scope, objectives, environment, risk areas, success criteria
3. Break down into detailed test scenarios in `.claude/qa/test-scenarios/`
   - Name: `YYYYMMDD-HHMMSS-feature-test-scenarios.md`
   - Include: test ID, priority, category, steps, expected results
4. Link test plan to implementation task in `.claude/tasks/`

#### 2. Post-Implementation Testing (Execute Tests)

After feature implementation:
1. Locate existing test plan and scenarios in `.claude/qa/`
2. Set up test environment:
   - List available devices: `mobile_list_available_devices()`
   - Connect to appropriate device (iOS/Android)
   - Verify app is running and test accounts available
3. Execute test scenarios systematically:
   - Use Mobile-MCP tools for interaction
   - Take screenshots at key points
   - Document observations
   - Note performance metrics
4. Create test results document in `.claude/qa/test-results/`
   - Name: `YYYYMMDD-HHMMSS-feature-test-results.md`
   - Include: pass/fail status, bugs found, screenshots, recommendations
5. Update implementation task in `.claude/tasks/` with testing status

#### 3. Bug Documentation (Report Issues)

When bugs are found:
1. Document in test results file with:
   - Bug ID, severity, priority
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots and logs
   - Affected platforms/versions
   - Technical analysis and suggested fix
2. Link to related test scenarios
3. Update task documentation
4. Provide clear reproduction steps for developers

#### 4. Regression Testing (After Fixes)

After bug fixes:
1. Locate original test scenarios that failed
2. Re-execute failed test cases
3. Run regression suite on affected components
4. Verify fixes on both iOS and Android
5. Update test results document
6. Request sign-off if all tests pass

**Testing best practices**:

#### Mobile-MCP Tool Usage

Always follow this pattern for reliable testing:

```typescript
// 1. List available devices first
mobile_list_available_devices()

// 2. Take screenshot to understand current state
mobile_take_screenshot(device: "device_id")

// 3. List elements before clicking
mobile_list_elements_on_screen(device: "device_id")

// 4. Use testID or accessibility labels for reliable targeting
// Find element with specific testID or label from list

// 5. Click using coordinates from element list
mobile_click_on_screen_at_coordinates(device: "device_id", x: X, y: Y)

// 6. Type text when needed
mobile_type_keys(device: "device_id", text: "input text", submit: false)

// 7. Wait for async operations
// Wait 2-3 seconds for GPS, 1-2s for navigation, 3-5s for uploads

// 8. Verify results with screenshots
mobile_take_screenshot(device: "device_id")

// 9. Document observations
```

#### Test Documentation Standards

**Test Plans** (`.claude/qa/test-plans/`):
- Comprehensive feature overview
- Clear testing scope and objectives
- Prerequisites and environment setup
- Risk areas and edge cases
- Success criteria and exit criteria
- Links to test scenarios and implementation tasks

**Test Scenarios** (`.claude/qa/test-scenarios/`):
- Detailed step-by-step test cases
- Clear preconditions and postconditions
- Expected results for each step
- Test data requirements
- Priority and category classification
- Mobile-MCP implementation code
- Edge cases and error scenarios

**Test Results** (`.claude/qa/test-results/`):
- Test execution summary (pass/fail/blocked/skipped)
- Detailed results for each test case
- Bug reports with reproduction steps
- Screenshots and evidence
- Performance observations
- Accessibility findings
- Recommendations and sign-off

#### Test Naming Conventions

Use timestamp-based naming for descending sort:
- Test plans: `20251030-120000-payment-collection-test-plan.md`
- Test scenarios: `20251030-120000-payment-collection-test-scenarios.md`
- Test results: `20251030-150000-payment-collection-test-results.md`

#### Test Priority Levels

Classify test cases by priority:
- **Critical**: Core functionality that blocks user workflows (test first)
- **High**: Important features that impact user experience
- **Medium**: Secondary features or edge cases
- **Low**: Nice-to-have features or rare edge cases

#### Test Categories

Tag test cases by category:
- **Functional**: Feature works as specified
- **UI/UX**: Visual design and user experience
- **Integration**: Component/system interactions
- **Regression**: Previously fixed issues don't reoccur
- **Performance**: Speed and responsiveness
- **Accessibility**: Screen reader and accessibility support

#### Bug Severity Classification

- **Critical**: App crash, data loss, security breach, core workflow blocked (P0: fix immediately)
- **Major**: Feature broken, workaround exists, significant UX impact (P1: fix in current sprint)
- **Minor**: Cosmetic issue, edge case, low-impact functionality (P2: fix in next sprint)
- **Trivial**: Typo, color mismatch, minor UI inconsistency (P3: fix when time permits)

#### Platform-Specific Testing

**Test on both iOS and Android** when applicable:
- Different devices/screen sizes
- Platform-specific behaviors (gestures, navigation)
- Permission handling differences
- Performance variations
- Visual consistency

#### Vietnamese Language Support

All UI text is in Vietnamese:
- Use exact Vietnamese strings in test scenarios
- Verify correct Vietnamese language display
- Test special characters and diacritics
- Validate translations match expected behavior

**Examples**:
- "Tên đăng nhập" (Username)
- "Mật khẩu" (Password)
- "Đăng nhập" (Sign in)
- "Bắt đầu làm việc" (Start work)
- "Xác nhận bắt đầu" (Confirm start)

#### Element Targeting Strategy

Always use structured approach:
1. **First choice**: Use `testID` prop (e.g., `task-action-check-in-button`)
2. **Second choice**: Use `accessibilityLabel` (e.g., "Bắt đầu làm việc")
3. **Last resort**: Use coordinates (but list elements first to get accurate position)

All interactive elements in the app have:
- `testID`: Unique identifier for targeting
- `accessibilityLabel`: Semantic label in Vietnamese
- `accessibilityHint`: Description of what happens

See `/apps/mobile/MOBILE-MCP-TESTING.md` for complete element reference.

#### Timing Considerations

Account for realistic delays:
- Login → Task list: 1-2 seconds
- Navigation between screens: 300-500ms
- GPS location acquisition: 2-10 seconds
- Photo upload: 1-3 seconds
- API calls: 1-2 seconds
- Pull-to-refresh: 1-2 seconds

Always wait for operations to complete before proceeding.

#### Error Handling Testing

Test edge cases and error scenarios:
- Network failures (disable wifi)
- GPS unavailable (disable location services)
- Camera permission denied
- Invalid inputs
- Concurrent operations
- Session timeouts
- Server errors

#### Performance Testing

Monitor and document:
- Screen load times
- API response times
- Photo upload times
- GPS acquisition times
- Scroll performance (target 60fps)
- Memory usage
- Battery impact

**Integration with development workflow**:

```
Feature Implementation Flow with QA:

1. Planning Phase:
   - task-doc-tracker: Create task file
   - qa-ui: Create test plan and scenarios

2. Development Phase:
   - backend-engineer or frontend-engineer: Implement feature
   - Reference test scenarios for acceptance criteria

3. Quality Assurance Phase:
   - code-quality-enforcer: Run code quality checks
   - qa-ui: Execute test scenarios
   - qa-ui: Document test results

4. Bug Fix Phase (if needed):
   - backend-engineer or frontend-engineer: Fix bugs
   - code-quality-enforcer: Verify fixes
   - qa-ui: Run regression tests

5. Documentation Phase:
   - task-doc-tracker: Update task with test results
   - qa-ui: Update test documentation
   - task-doc-tracker: Extract learnings
```

**Related documentation**:
- **Mobile Testing Guide**: `/apps/mobile/MOBILE-MCP-TESTING.md` (comprehensive element reference)
- **Quick Test Reference**: `/apps/mobile/QUICK-TEST-REFERENCE.md` (quick command reference)
- **Testing Patterns**: `/docs/testing/mobile-mcp.md` (accessibility patterns)
- **QA Documentation**: `/.claude/qa/README.md` (structure and templates)
- **E2E Strategy**: `/.claude/enhancements/20251024-120200-e2e-testing-strategy.md` (future automation)

**Important notes**:
- **Always test on real devices** when possible (simulators have limitations)
- **Document everything**: Screenshots are evidence
- **Be objective**: Report facts, not opinions
- **Provide context**: Environment details matter
- **Suggest fixes**: Technical insights help developers
- **Track trends**: Monitor pass rates, bug patterns, performance
- **Communicate clearly**: Make it easy for developers to understand issues

---

## ALSO UPDATE THE "Agent Workflow Example" SECTION:

Replace the existing "Agent Workflow Example" section with:

### Agent Workflow Example

**Typical feature implementation flow**:

1. **Documentation Setup**: Launch `task-doc-tracker` to create task file
2. **Test Planning**: Launch `qa-ui` to create test plan and scenarios
3. **Implementation**: Launch `backend-engineer` or `frontend-engineer` for implementation
4. **Quality Assurance**: Launch `code-quality-enforcer` to verify changes
5. **Testing**: Launch `qa-ui` to execute tests and document results
6. **Documentation Update**: Launch `task-doc-tracker` to mark complete and extract learnings

**Bug fix workflow**:

1. **Bug Analysis**: Review test results from `qa-ui`
2. **Fix Implementation**: Launch `backend-engineer` or `frontend-engineer` to fix
3. **Code Quality**: Launch `code-quality-enforcer` to verify fix
4. **Regression Testing**: Launch `qa-ui` to retest and verify
5. **Documentation**: Launch `task-doc-tracker` to update task status

---

## ALSO UPDATE "Important File Locations" SECTION:

Add this line to the "Important File Locations" section:

```markdown
- **QA Documentation**: `.claude/qa/` (test plans, scenarios, results)
```

So the section becomes:

```markdown
## Important File Locations

- **API Routes**: `apps/api/src/v1/*/` (route.ts and service.ts files)
- **Mobile Screens**: `apps/mobile/app/` (file-based routing)
- **Database Schema**: `apps/api/prisma/schema.prisma`
- **Shared Validation**: `packages/validation/`
- **Shared Prisma Client**: `packages/prisma-client/`
- **Architecture Patterns**: `docs/architecture/patterns/` (detailed implementation patterns)
- **Development Guides**: `docs/development/` (setup, commands, workflows)
- **Testing Guides**: `docs/testing/` (testing strategies)
- **QA Documentation**: `.claude/qa/` (test plans, scenarios, results)
- **Task Documentation**: `.claude/tasks/` (implementation tracking)
- **V1 Feature Plans**: `.claude/plans/v1/` (detailed feature specifications & roadmap)
- **Enhancement Ideas**: `.claude/enhancements/` (future features & optimizations)
- **Documentation Standards**: `.claude/memory/` (project-wide conventions and patterns)
- **Refactoring Plans**: `.claude/tasks/REFACTORING-*.md` (architecture refactoring documentation)
```
