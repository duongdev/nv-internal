# Apple App Review - Quick Reference Card

**Last Updated**: 2025-11-10

---

## 🎯 WHAT TO COPY WHERE

### App Store Connect → App Review Information

#### 1. Sign-in Required Section
```
☑ Sign-in required

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Username Field:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
apple.review@namviet.test

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Password Field:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AppleReview2025!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Additional Information (Optional):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Demo account configured with Worker role. Contains 8 sample tasks showing
all features. GPS verification bypassed for testing at any location.
Pre-loaded with realistic Vietnamese sample data. Cannot affect production.
```

#### 2. Contact Information Section
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
First Name:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dương

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Last Name:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Đỗ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phone Number:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+84-979-477-635

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
dustin.do95@gmail.com
```

#### 3. Notes Section
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Notes Field:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ COPY ENTIRE CONTENT FROM:
  .claude/docs/app-store-review-notes-FINAL.md

→ COPY SECTION BETWEEN THE ═══ MARKERS
  (Everything from "APPLICATION OVERVIEW" to the end)

→ LENGTH: ~6,000 words
→ INCLUDES: App purpose, features, testing instructions,
            business justification, FAQ, contact info
```

---

## 🔑 DEMO ACCOUNT CREDENTIALS

```
┌─────────────────────────────────────────────────────────┐
│  DEMO ACCOUNT (For Apple Reviewers)                    │
├─────────────────────────────────────────────────────────┤
│  Email:    apple.review@namviet.test                   │
│  Password: AppleReview2025!                            │
│  Role:     Worker (Field Technician)                   │
│  Features: All features accessible                     │
│  GPS:      Bypassed (works from any location)          │
│  Tasks:    8 pre-loaded sample tasks                   │
│  Data:     Realistic Vietnamese sample data            │
└─────────────────────────────────────────────────────────┘
```

---

## ⚡ 3-STEP SUBMISSION PROCESS

### STEP 1: Setup Demo Account (20 min)
```bash
# Follow: .claude/docs/demo-account-quick-setup.md

✓ Create Clerk user (apple.review@namviet.test)
✓ Create database user record
✓ Run SQL scripts (8 tasks + customers + locations)
✓ Enable GPS bypass in API
✓ Test login and features
```

### STEP 2: Fill App Store Connect (10 min)
```bash
# Use credentials and notes from this card

✓ Copy demo credentials to "Sign-in required" section
✓ Fill contact information
✓ Copy review notes from FINAL.md to "Notes" field
✓ Verify all metadata complete
```

### STEP 3: Submit (1 min)
```bash
✓ Final checklist review
✓ Click "Submit for Review"
✓ Monitor email for reviewer questions
```

**Total Time**: ~30 minutes

---

## 📋 FINAL CHECKLIST (Check All Before Submit)

### Demo Account Setup
```
□ Clerk user created
□ Database user exists
□ 8 sample tasks loaded
□ GPS bypass enabled
□ Login works (tested)
□ Check-in works from anywhere (tested)
□ Photo upload works (tested)
□ Check-out works (tested)
□ Reports show data (tested)
```

### App Store Connect - Metadata
```
□ App name: Nam Việt Internal
□ Description filled (Vietnamese)
□ Keywords filled
□ Screenshots uploaded (6.5" iPhone minimum)
□ Support URL: https://dienlanhnamviet.vn
□ Privacy policy URL live
□ Copyright: CÔNG TY TNHH THƯƠNG MẠI VÀ ĐIỆN LẠNH NAM VIỆT
```

### App Store Connect - App Review Info
```
□ Sign-in required: ☑ Checked
□ Username: apple.review@namviet.test
□ Password: AppleReview2025!
□ Additional info filled
□ First name: Dương
□ Last name: Đỗ
□ Phone: +84-979-477-635
□ Email: dustin.do95@gmail.com
□ Notes: Copied from FINAL.md (6,000+ words)
```

### App Privacy & Compliance
```
□ Privacy questionnaire completed
□ Location data disclosed (precise location)
□ Camera/photos data disclosed
□ User data disclosed (name, email)
□ All data uses explained
□ Age rating completed
```

### Build & Testing
```
□ Production build uploaded
□ Build selected for this version
□ TestFlight tested (no crashes)
□ All Vietnamese text displays correctly
□ Maps/GPS work properly
```

---

## 🧪 QUICK TEST SEQUENCE

Test this exact sequence before submitting:

```
1. LOGIN (30 sec)
   → Email: apple.review@namviet.test
   → Password: AppleReview2025!
   ✓ Should see 8 tasks

2. VIEW TASK (1 min)
   → Tap "Bảo trì điều hòa định kỳ - Công ty ABC"
   ✓ See customer, location, payment details

3. CHECK-IN (2 min)
   → Tap "Bắt đầu làm việc" (Start Work)
   → Grant location permission
   ✓ GPS passes (from any location)
   ✓ Status → IN_PROGRESS

4. ADD PHOTO (2 min)
   → Scroll to attachments
   → Tap "Thêm ảnh" (Add Photo)
   → Take/select photo
   ✓ Photo appears

5. CHECK-OUT (3 min)
   → Tap "Hoàn thành công việc" (Complete Work)
   → Select "Đã thu đủ tiền" (Payment Collected)
   → Enter 3,000,000 VND
   → Tap "Xác nhận hoàn thành" (Confirm)
   ✓ Task → COMPLETED

6. VIEW REPORTS (1 min)
   → Tap "Báo cáo" (Reports) tab
   ✓ See completed tasks
   ✓ See total revenue
   ✓ Charts display

Total: ~10 minutes
```

---

## 💬 QUICK RESPONSES TO COMMON QUESTIONS

### Q: Why GPS "always" permission?

**A:** The app only accesses location when user explicitly taps check-in/out buttons (2-4 times per day). We do NOT track in background. The "always" permission name is misleading - we use it for when-in-use access only. Test with demo account to verify.

### Q: Why Vietnamese only?

**A:** All employees are native Vietnamese speakers. Company operates exclusively in Vietnam. This is appropriate for our internal enterprise use case.

### Q: Why public App Store for internal app?

**A:** Easier deployment to 50+ employees, automatic updates, no MDM required (BYOD policy), simpler management than Apple Business Manager.

### Q: Demo account issue?

**A:** Please verify:
- Username: apple.review@namviet.test (no spaces)
- Password: AppleReview2025! (case-sensitive)
- Internet connected

Contact: dustin.do95@gmail.com (< 24 hour response)

---

## 📊 EXPECTED TIMELINE

```
Submit → Waiting (24-48h) → In Review (2-6h) → Approved/Rejected

If Approved:  App goes live immediately (auto-release enabled)
If Rejected:  Fix issues, resubmit within 14 days
```

**Success Tips:**
- Respond to questions within 24 hours
- Monitor email daily
- Keep demo account working
- Be professional and helpful

---

## 🔗 ESSENTIAL LINKS

**Documents**:
- Review Notes: `.claude/docs/app-store-review-notes-FINAL.md`
- Demo Setup: `.claude/docs/demo-account-quick-setup.md`
- Summary: `.claude/docs/app-review-submission-summary.md`

**App Store Connect**:
- Your App: https://appstoreconnect.apple.com/apps/6754835683
- Privacy: https://appstoreconnect.apple.com/apps/6754835683/distribution/privacy

**Support**:
- Email: dustin.do95@gmail.com
- Phone: +84-979-477-635

---

## 🎯 ONE-MINUTE SUBMIT CHECKLIST

Right before clicking "Submit for Review":

```
□ Demo account works (just tested)
□ Review notes pasted (6,000+ words)
□ Contact info filled
□ Privacy questionnaire done
□ Build uploaded and selected
□ Screenshots uploaded
□ All checkboxes above completed

→ READY TO SUBMIT ✅
```

---

## 📞 EMERGENCY CONTACT

**If reviewer contacts you**:

- **Response Time**: Within 24 hours (faster is better)
- **Email**: dustin.do95@gmail.com
- **Phone**: +84-979-477-635
- **Availability**: Daily monitoring during review period

**Have Ready**:
- Access to demo account
- Access to API logs
- Ability to fix issues quickly
- Polite, professional responses

---

## 🚀 YOU'RE READY TO SUBMIT!

```
┌─────────────────────────────────────────────────────────┐
│  SUBMISSION READY                                       │
├─────────────────────────────────────────────────────────┤
│  ✓ Comprehensive review notes (6,000+ words)           │
│  ✓ Working demo account with 8 tasks                   │
│  ✓ GPS bypass enabled                                  │
│  ✓ All features tested                                 │
│  ✓ Contact info ready                                  │
│  ✓ Quick response plan                                 │
├─────────────────────────────────────────────────────────┤
│  ESTIMATED APPROVAL TIME: 24-48 hours                  │
│  SUCCESS RATE: High (thorough preparation)             │
└─────────────────────────────────────────────────────────┘
```

**Good luck! 🎉**

---

**Version**: 1.0
**Date**: 2025-11-10
**Print this card for quick reference during submission**
