# Feature: App Store submission

**Status**: 🟡 Draft
**Owner**: Dương Đỗ
**Created**: 2025-11-10
**Last Updated**: 2025-11-10

---

## 📋 Requirements

### Functional Requirements
- FR1: System shall support automated iOS app submission to App Store Connect
- FR2: System shall distribute builds to TestFlight for internal testing
- FR3: System shall manage app metadata and screenshots in App Store Connect
- FR4: System shall handle version numbering and build increments automatically
- FR5: System shall support both manual and CI/CD-triggered submissions

### Non-Functional Requirements
- NFR1: Submission process should complete within 30 minutes from tag to TestFlight
- NFR2: Build success rate should be ≥ 95%
- NFR3: Zero manual intervention required for routine releases
- NFR4: All credentials must be stored securely (never committed to repo)

### Acceptance Criteria
- [ ] App Store Connect account configured with app listing
- [ ] TestFlight internal testing group set up
- [ ] App Store Connect API key created and stored in GitHub Secrets
- [ ] EAS Submit configured for iOS
- [ ] CI/CD pipeline triggers iOS submission on tag push
- [ ] Manual submission via CLI works correctly
- [ ] Version and build numbers auto-increment properly
- [ ] Documentation covers complete setup and release process

---

## 🎨 User Experience

### User Flows

**1. Developer Release Flow**:
1. Developer completes feature work
2. Creates git tag (e.g., `v1.2.0`)
3. Pushes tag to GitHub
4. CI/CD automatically builds and submits to TestFlight
5. Developer receives notification when build is available
6. QA team tests via TestFlight
7. Developer promotes to production when ready

**2. Manual Release Flow (Emergency)**:
1. Developer runs `eas build --platform ios --profile production`
2. After build completes, runs `eas submit --platform ios --profile production`
3. Build appears in TestFlight within 10-15 minutes
4. Promotes to App Store when approved

### Screenshots / Designs
- App Store Connect screenshots (required: at least 2 per device size)
- App icon (1024x1024)
- Privacy policy URL ✅ Implemented at `/privacy-policy` (PSN-15)
- App description and metadata

---

## 🏗️ Technical Design

### Architecture

**Components**:
- **App Store Connect**: Apple's platform for app distribution
- **EAS Build**: Cloud build service (already configured for iOS)
- **EAS Submit**: Automated submission to App Store Connect
- **GitHub Actions**: CI/CD orchestration
- **Fastlane**: Under the hood for EAS Submit (handled automatically)

**Current State**:
- ✅ EAS Build configured for iOS (already working)
- ✅ Build profiles: development, staging, preview, production
- ✅ iOS builds generating successfully
- ⚠️ EAS Submit not configured yet
- ⚠️ App Store Connect API key not set up
- ⚠️ TestFlight not configured

### API Key Setup

**App Store Connect API Key**:
```bash
# Create in App Store Connect:
# Users & Access → Keys → App Store Connect API → Generate Key

# Key details needed:
# - Key ID (e.g., ABC123XYZ)
# - Issuer ID (UUID format)
# - .p8 key file content

# Store in GitHub Secrets:
# - ASC_KEY_ID
# - ASC_ISSUER_ID
# - ASC_API_KEY_P8 (base64 encoded .p8 file)
```

### EAS Submit Configuration

**Update `apps/mobile/eas.json`**:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "duong@dienlanhnamviet.vn",
        "ascAppId": "[App Store Connect App ID]",
        "appleTeamId": "[Team ID from Apple Developer]"
      }
    }
  }
}
```

### CI/CD Integration

**GitHub Actions Workflow** (`.github/workflows/eas-build.yml`):
```yaml
# Extend existing workflow to include iOS submission

submit-ios:
  needs: build
  if: startsWith(github.ref, 'refs/tags/v') && matrix.platform == 'ios'
  runs-on: ubuntu-latest
  steps:
    - name: Setup EAS
      uses: expo/expo-github-action@v8
      with:
        expo-version: latest
        eas-version: latest
        token: ${{ secrets.EXPO_TOKEN }}

    - name: Submit to App Store
      run: |
        eas submit --platform ios --profile production --non-interactive
      env:
        ASC_KEY_ID: ${{ secrets.ASC_KEY_ID }}
        ASC_ISSUER_ID: ${{ secrets.ASC_ISSUER_ID }}
        ASC_API_KEY_P8: ${{ secrets.ASC_API_KEY_P8 }}
```

### Version Management

**Auto-increment strategy** (already implemented for iOS):
```typescript
// apps/mobile/app.config.ts
export default {
  ios: {
    buildNumber: process.env.BUILD_NUMBER || '1',
    bundleIdentifier: 'vn.dienlanhnamviet.internal'
  }
}
```

Build number synced via GitHub variable (lines 135-191 in existing workflow).

---

## 🧪 Testing Strategy

### Unit Tests
- Not applicable (infrastructure/deployment feature)

### Integration Tests
1. **Manual submission test**: Build and submit one test build via CLI
2. **Automated submission test**: Create test tag and verify CI/CD submission
3. **Version increment test**: Multiple submissions should increment build numbers correctly
4. **TestFlight delivery test**: Verify build appears in TestFlight within 15 minutes

### Validation Checklist
- [ ] Test build appears in App Store Connect
- [ ] TestFlight internal testers receive notification
- [ ] Build installs correctly on test devices
- [ ] App metadata displays correctly in TestFlight
- [ ] Version and build numbers are correct

---

## 🚀 Implementation Plan

### Task Breakdown

**Phase 1: App Store Connect Setup** (Est: 3h)
- [ ] **Task 1**: Create app listing in App Store Connect (Est: 1h)
  - Set up app information
  - Upload screenshots and app icon
  - Configure age rating and privacy details
  - Add app description and keywords

- [ ] **Task 2**: Generate App Store Connect API Key (Est: 30m)
  - Create API key in App Store Connect
  - Download .p8 key file
  - Store credentials in GitHub Secrets
  - Document key rotation process

- [ ] **Task 3**: Set up TestFlight internal testing (Est: 1h)
  - Create internal testing group
  - Add internal testers
  - Configure build distribution settings
  - Test notification delivery

**Phase 2: EAS Submit Configuration** (Est: 2h)
- [ ] **Task 4**: Update eas.json with submit profile (Est: 30m)
  - Add iOS submit configuration
  - Set Apple ID and Team ID
  - Configure ascAppId

- [ ] **Task 5**: Test manual submission (Est: 1h)
  - Build production iOS app via EAS
  - Submit to TestFlight via CLI
  - Verify build appears in App Store Connect
  - Validate TestFlight installation

**Phase 3: CI/CD Integration** (Est: 2h)
- [ ] **Task 6**: Extend GitHub Actions workflow (Est: 1h)
  - Add iOS submit job
  - Configure API key secrets
  - Set up conditional trigger on tags
  - Add error handling and notifications

- [ ] **Task 7**: Test automated submission (Est: 1h)
  - Create test tag
  - Monitor CI/CD pipeline
  - Verify TestFlight delivery
  - Validate build number increment

**Phase 4: Documentation** (Est: 2h)
- [ ] **Task 8**: Create iOS release documentation (Est: 1.5h)
  - Document App Store Connect setup steps
  - Write TestFlight distribution guide
  - Document manual release procedure
  - Add troubleshooting section

- [ ] **Task 9**: Update project documentation (Est: 30m)
  - Update CLAUDE.md with iOS release commands
  - Enhance deployment documentation
  - Add iOS to quick reference

**Total Estimate**: 9 hours (~1-1.5 days of active work)

**💡 Tip**: Use `/pm:spec:break-down PSN-12` to create Linear tasks from this plan.

---

## 🔒 Security Considerations

### Credentials Management
- **App Store Connect API Key**: Store .p8 file in GitHub Secrets (base64 encoded)
- **Apple ID credentials**: Use App Store Connect API key instead (no password needed)
- **Team ID**: Not sensitive, can be in eas.json
- **Key rotation**: Document process for rotating API keys annually

### App Store Guidelines Compliance
- Privacy policy URL ✅ Implemented at `/privacy-policy` (PSN-15) required
- App must follow Apple Human Interface Guidelines
- No private APIs usage
- Proper age rating configuration

### Code Signing
- Use Apple-managed certificates via EAS Build
- No need to manage provisioning profiles manually
- Signing handled automatically by EAS

---

## 📊 Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| App Store Connect account verification delay | Low | Medium | Start account setup early, verify email immediately |
| API key permission issues | Medium | High | Follow Apple's documentation exactly, test with manual submission first |
| TestFlight review delays | Low | Low | Use internal testing (no review required) for initial rollout |
| Build submission failures | Medium | Medium | Implement retry logic, monitor with alerts, maintain 95%+ success rate target |
| Certificate/provisioning issues | Low | High | Use EAS managed credentials, avoid manual certificate management |

---

## 🔗 References

**Linear Feature**: [PSN-12: App Store submission](https://linear.app/withdustin/issue/PSN-12/app-store-submission)

**External Documentation**:
- [App Store Connect](https://appstoreconnect.apple.com/)
- [EAS Submit: iOS](https://docs.expo.dev/submit/ios/)
- [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)
- [TestFlight Guide](https://developer.apple.com/testflight/)
- [EAS Build: iOS](https://docs.expo.dev/build/setup/)

**Project Files**:
- `apps/mobile/eas.json` - Build and submit profiles
- `apps/mobile/app.config.ts` - iOS configuration
- `.github/workflows/eas-build.yml` - CI/CD pipeline
- `apps/mobile/ios/` - Native iOS code (generated by prebuild)

**Related Features**:
- Android release (PSN-2) - Similar workflow for Android
- Existing iOS builds - Already generating via EAS Build

---

## 📝 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-11-10 | Use App Store Connect API key instead of fastlane credentials | More secure, easier to rotate, better for CI/CD automation |
| 2025-11-10 | Start with TestFlight internal testing | No review required, faster iteration, controlled rollout |
| 2025-11-10 | Leverage existing EAS Build infrastructure | iOS builds already working, just need submission layer |
| 2025-11-10 | Use EAS-managed code signing | Simpler than manual certificate management, less error-prone |

---

## 🎯 Success Metrics

**Technical Metrics**:
- ✅ Submission time: < 30 minutes (tag → TestFlight)
- ✅ Success rate: ≥ 95%
- ✅ Build number sync: 100% accuracy
- ✅ Manual intervention: 0 steps required

**Team Metrics**:
- ✅ Team can submit releases independently
- ✅ Documentation rated 4/5+ by team
- ✅ Setup time: < 3 hours for new team member

**Business Metrics**:
- ✅ Weekly release capability
- ✅ Zero deployment blockers
- ✅ Reduced time-to-market for features
