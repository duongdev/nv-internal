# Refactoring Rollback Playbook

## Overview

This document provides step-by-step procedures for rolling back refactoring changes if issues arise in production.

## Rollback Scenarios

### Scenario 1: Performance Degradation

**Symptoms**:
- API response times >2x baseline
- Cold start times >200ms
- Memory usage approaching 1GB

**Immediate Actions** (< 5 minutes):
1. Set master feature flag to `false`:
   ```bash
   vercel env add FF_USE_NEW_ARCHITECTURE false production
   ```
2. Trigger redeployment:
   ```bash
   vercel --prod
   ```
3. Monitor metrics for return to baseline

**Root Cause Analysis** (post-incident):
- Review performance test results
- Analyze container initialization overhead
- Check for memory leaks
- Profile service instantiation

### Scenario 2: Increased Error Rate

**Symptoms**:
- Error rate >1% (baseline: <0.1%)
- New error types appearing
- 500 errors from specific endpoints

**Immediate Actions** (< 5 minutes):
1. Identify affected services from logs
2. Disable specific feature flags:
   ```bash
   # Example: Disable only new task service
   vercel env add FF_NEW_TASK_SERVICE false production
   vercel --prod
   ```
3. Verify error rate returns to baseline

**Investigation**:
- Check error logs for specific endpoints
- Review recent deployments
- Validate error handling in new services
- Test rollback in staging first

### Scenario 3: Data Integrity Issues

**Symptoms**:
- Missing or incorrect data
- Transaction failures
- Database constraint violations

**Immediate Actions** (< 2 minutes):
1. **CRITICAL**: Disable ALL new features immediately:
   ```bash
   vercel env add FF_USE_NEW_ARCHITECTURE false production
   vercel --prod
   ```
2. Assess data impact:
   - Query affected records
   - Check transaction logs
   - Review activity logs

**Recovery**:
- Work with database backup if needed
- Run data validation queries
- Create incident report

### Scenario 4: Contract Breaking Changes

**Symptoms**:
- Mobile app crashes
- API response format changed
- Missing required fields

**Immediate Actions** (< 5 minutes):
1. Rollback to previous deployment:
   ```bash
   vercel rollback <previous-deployment-url>
   ```
2. Re-run contract tests:
   ```bash
   pnpm --filter @nv-internal/api test --testMatch='**/*.contract.test.ts'
   ```

**Prevention**:
- Always run contract tests before deployment
- Validate API responses match expected schema

## Feature Flag Rollback Matrix

| Phase | Feature Flag | Rollback Impact | Rollback Time |
|-------|-------------|-----------------|---------------|
| Phase 1 | `FF_NEW_AUTH_SERVICE` | Low - auth logic isolated | 2 minutes |
| Phase 1 | `FF_NEW_ERROR_HANDLING` | Low - error wrapper only | 2 minutes |
| Phase 1 | `FF_STORAGE_FACTORY` | Medium - affects uploads | 5 minutes |
| Phase 2 | `FF_TASK_REPOSITORY` | Medium - query changes | 5 minutes |
| Phase 2 | `FF_PAYMENT_REPOSITORY` | **High** - affects checkout | 2 minutes |
| Phase 3 | `FF_NEW_TASK_SERVICE` | **High** - core functionality | 2 minutes |
| Phase 3 | `FF_NEW_PAYMENT_SERVICE` | **Critical** - payment logic | 2 minutes |
| Master | `FF_USE_NEW_ARCHITECTURE` | **Critical** - all changes | 2 minutes |

## Monitoring Checklist

Before deploying each phase, ensure these monitoring tools are in place:

- [ ] Vercel Analytics dashboard configured
- [ ] Error tracking (Sentry/similar) enabled
- [ ] Performance baselines documented
- [ ] Alert thresholds configured:
  - [ ] Error rate >0.5% triggers alert
  - [ ] Response time >500ms p95 triggers alert
  - [ ] Memory usage >800MB triggers warning
- [ ] Rollback credentials accessible to team

## Communication Plan

### Internal Team

**Before Deployment**:
- [ ] Notify team of deployment window
- [ ] Share rollback procedures
- [ ] Assign rollback decision maker
- [ ] Establish monitoring rotation

**During Deployment**:
- [ ] Announce deployment start
- [ ] Share metrics dashboard link
- [ ] Update team on progress (10%, 50%, 100%)

**If Rollback Needed**:
- [ ] Immediately announce rollback in team chat
- [ ] State reason for rollback
- [ ] Provide ETA for resolution
- [ ] Schedule post-mortem

### Users (Mobile App)

**If Rollback Needed**:
- [ ] Assess user impact (data loss, functionality)
- [ ] Prepare user-facing message if severe
- [ ] Monitor app store reviews for issues

## Post-Rollback Actions

1. **Document Incident** (within 24 hours):
   - What happened
   - Why it happened
   - How it was detected
   - How it was resolved
   - How to prevent recurrence

2. **Update Tests** (within 48 hours):
   - Add test case for the issue
   - Verify test fails without fix
   - Verify test passes with fix

3. **Team Review** (within 1 week):
   - Share learnings with team
   - Update rollback playbook if needed
   - Update monitoring thresholds if needed

## Rollback Validation Checklist

After performing rollback, verify:

- [ ] Error rate returned to baseline (<0.1%)
- [ ] Response times returned to baseline
- [ ] Memory usage stable
- [ ] No new errors in logs
- [ ] Mobile app still functional
- [ ] Critical workflows tested:
  - [ ] Task creation
  - [ ] Check-in/check-out
  - [ ] Payment collection
  - [ ] File uploads

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| Deployment Lead | TBD | TBD |
| Database Admin | TBD | TBD |
| On-call Engineer | TBD | TBD |
| Product Owner | TBD | TBD |

## Quick Reference Commands

```bash
# Instant rollback to legacy architecture
vercel env add FF_USE_NEW_ARCHITECTURE false production && vercel --prod

# Rollback specific service
vercel env add FF_NEW_TASK_SERVICE false production && vercel --prod

# Check current feature flags
vercel env pull .env.production.local

# Rollback to previous deployment
vercel rollback <deployment-url>

# View recent deployments
vercel ls

# View production logs
vercel logs <deployment-url>
```

---

*Last Updated: 2025-10-24*
*Owner: DevOps Team*
*Version: 1.0*
