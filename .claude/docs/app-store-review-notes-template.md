# App Review Notes Template - Nam Việt Internal

**Purpose**: Information for Apple App Review team
**Last Updated**: November 6, 2025

---

## App Review Information (Copy & Paste Version)

### Notes for Reviewer

```
APPLICATION OVERVIEW:
Nam Việt Internal is an internal task management application exclusively for employees of Điện Lạnh Nam Việt (Nam Viet Air Conditioning), a professional air conditioning service company in Vietnam. This app is designed to streamline field service operations and is not intended for public use.

KEY FEATURES TO TEST:

1. TASK MANAGEMENT
   - View list of assigned air conditioning service tasks
   - Each task shows customer location and service details
   - Tasks have different statuses: Preparing, Ready, In Progress, Completed

2. GPS CHECK-IN/CHECK-OUT
   - Employees must check in when arriving at customer location
   - GPS verification ensures employee is within 100 meters of work site
   - Check-out records task completion time
   - Location is only accessed during check-in/check-out

3. PHOTO DOCUMENTATION
   - Take photos to document work completion
   - Attach multiple photos per task
   - Photos are required for quality assurance
   - Camera permission is requested when adding photos

4. EMPLOYEE REPORTS
   - View monthly performance summaries
   - Track completed tasks and revenue
   - Compare performance with other technicians

5. PAYMENT TRACKING
   - Record customer payments
   - Track expected vs actual revenue
   - Support multiple payment methods

TESTING INSTRUCTIONS:

1. LOGIN
   - Use provided demo account credentials
   - Account has "Worker" role with full feature access
   - Authentication is handled by Clerk

2. MAIN FEATURES
   - Tap any task from the list to see details
   - Try the check-in feature (works at any location for demo account)
   - Test photo attachment by taking or selecting photos
   - View the Reports tab for performance data
   - Check the Me tab for account settings

3. LANGUAGE
   - The entire app interface is in Vietnamese
   - This is intentional as all users are Vietnamese employees
   - Error messages and alerts are also in Vietnamese

IMPORTANT NOTES:

• INTERNAL APP: This app is for company employees only, not general public
• GPS FEATURES: Check-in/check-out will work at any location for the demo account
• SAMPLE DATA: Demo account contains realistic sample tasks and data
• NO PAYMENTS: Demo account cannot process real payments
• PERMISSIONS: Camera and location permissions are essential for core features

COMMON WORKFLOWS:

Morning Routine:
1. Employee opens app and views assigned tasks
2. Travels to first customer location
3. Checks in using GPS verification
4. Completes air conditioning service
5. Takes photos of completed work
6. Records payment (if collected)
7. Checks out and moves to next task

End of Day:
1. Reviews completed tasks
2. Checks performance report
3. Views tomorrow's schedule

TECHNICAL INFORMATION:
- Built with React Native (Expo)
- Backend API hosted on Vercel
- Database: PostgreSQL
- Authentication: Clerk
- Maps: Google Maps for location display

CONTACT FOR QUESTIONS:
Technical Support: dustin.do95@gmail.com
Response Time: Within 24 hours
Language: English or Vietnamese

Thank you for reviewing Nam Việt Internal!
```

---

## Demo Account Credentials Section

### Sign-in Required
✅ Yes (Check this box in App Store Connect)

### Username
```
apple.review@namviet.test
```

### Password
```
AppleReview2025!
```

### Additional Information (Optional)
```
Demo Account Notes:
- Pre-configured with Worker role
- Contains sample tasks in various statuses
- GPS check-in works at any location
- Cannot process real payments
- Has example photos already attached to some tasks
```

---

## Contact Information Section

### First Name
```
Dương
```

### Last Name
```
Đỗ
```

### Phone Number
```
+84-979477635
```

### Email Address
```
dustin.do95@gmail.com
```

---

## App Review Attachment (Optional)

If needed, provide a PDF with:

1. **Screenshots of Key Features**
   - Login screen
   - Task list
   - GPS check-in process
   - Photo attachment
   - Reports dashboard

2. **Video Walkthrough**
   - 2-3 minute demo video
   - Show typical user workflow
   - Highlight GPS and photo features
   - Upload to YouTube (unlisted) and share link

3. **Architecture Diagram**
   - Show app components
   - Explain data flow
   - Clarify internal-only nature

---

## Common Review Questions & Answers

### Q: Is this app intended for public distribution?
A: No, this is an internal enterprise app for Nam Việt employees only. We're using public App Store distribution for easier deployment to our 50+ field technicians.

### Q: Why does the app require precise location?
A: GPS verification ensures employees are physically present at customer locations when checking in/out. This is essential for service quality and billing accuracy.

### Q: Why is the app only in Vietnamese?
A: All our employees are Vietnamese. The app is specifically designed for the Vietnamese market and our local operations.

### Q: What happens if GPS verification fails?
A: Employees can still check in with a warning if they're within 100 meters. Managers receive notifications of location mismatches for review.

### Q: How is employee privacy protected?
A: Location is only accessed during check-in/out, not continuously tracked. Full privacy policy is available at [Privacy URL]. Employees consent to monitoring as part of employment terms.

### Q: Can the demo account make real payments?
A: No, the demo account is restricted to viewing payment features only. Actual payment processing requires production credentials and manager approval.

### Q: Why Camera access?
A: Photo documentation is required for insurance and quality assurance. Technicians must photograph completed installations and repairs.

### Q: What data is collected?
A: Employee location during check-in/out, work photos, task completion times, and basic usage analytics. See our privacy policy for complete details.

---

## Quick Response Templates

### For Metadata Rejection
```
Thank you for your review. We have updated the [screenshots/description/keywords] to better reflect the app's actual functionality. The app is an internal tool for our air conditioning service company employees, not for general public use. Please let us know if you need any additional information.
```

### For Demo Account Issues
```
We apologize for the demo account issue. We have created a new demo account with the following credentials:
Username: [new username]
Password: [new password]
The account has been tested and verified to have access to all features. Please try again and let us know if you encounter any problems.
```

### For Feature Clarification
```
Thank you for your question about [feature]. This feature is designed for [explanation]. In our company's workflow, employees use this to [use case]. The demo account has sample data showing this feature in action. Please see [specific screen/button] to test this functionality.
```

### For GPS/Location Concerns
```
The app requires location access only for the check-in/check-out feature to verify employee presence at customer sites. Location is not tracked continuously. Employees are informed about location usage through our privacy policy and employment agreements. The 100-meter threshold allows for GPS inaccuracy while maintaining verification integrity.
```

---

## Pre-Submission Checklist

Before submitting, verify:

- [ ] Demo account logs in successfully
- [ ] All demo account features work
- [ ] Review notes are clear and complete
- [ ] Contact information is accurate
- [ ] Phone number includes country code
- [ ] Email is monitored daily
- [ ] Screenshots match current app version
- [ ] Privacy policy URL is live
- [ ] App metadata is accurate

---

## Tips for Faster Approval

1. **Be Specific**: Clearly explain internal-only nature
2. **Provide Context**: Explain air conditioning service industry needs
3. **Test Everything**: Ensure demo account works perfectly
4. **Respond Quickly**: Reply to reviewer questions within 24 hours
5. **Be Professional**: Keep communication polite and helpful
6. **Document Features**: Explain why each permission is needed
7. **Clarify Language**: Explain why Vietnamese-only is appropriate

---

**Note**: Customize this template based on actual app features and company policies. Keep responses honest and accurate.