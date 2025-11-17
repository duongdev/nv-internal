# App Review Testing Instructions

**App Name**: Nam Việt Internal
**Version**: 1.0.0
**Platform**: iOS (iPhone) and Android (Phones only)
**Language**: Vietnamese (primary), with English code/technical terms
**Target Users**: Field service technicians for air conditioning company in Vietnam

---

## Important Notes for Reviewers

### Language
- **Primary Language**: Vietnamese (Tiếng Việt)
- All user-facing text, buttons, and messages are in Vietnamese
- This is intentional as the app is designed for Vietnamese field workers in Vietnam

### Test Account

**Test account credentials will be provided separately** via App Store Connect notes (iOS) or Google Play Console notes (Android) during the review submission process.

**Note**: The test account has pre-populated data including:

- Sample tasks assigned
- Example photos and attachments
- GPS check-in/check-out history
- Payment records

### Location Services
**IMPORTANT**: This app requires location services to function properly. The core feature is GPS-based check-in/check-out at work locations.

**For testing without actual GPS**:
- The app will work in simulator/emulator
- Mock location: **21.0285° N, 105.8542° E** (Hanoi, Vietnam)
- You can test check-in/check-out features using mock/simulated location

### Device Requirements
- **iOS**: iPhone only (NOT iPad - this is intentional)
- **Android**: Phones only (NOT tablets - this is intentional)
- **Minimum iOS**: iOS 14.0+
- **Minimum Android**: Android 8.0+ (API 26+)

---

## Pre-Testing Setup

### Step 1: Install the App
1. Download and install the app from TestFlight (iOS) or Internal Testing (Android)
2. Launch the app
3. You should see the splash screen with the "Nam Việt" logo

### Step 2: Grant Permissions (CRITICAL)
When prompted, please **ALLOW** the following permissions:

#### iOS Permissions:
- ✅ **Location** - "Allow While Using App" (Required for check-in/check-out)
- ✅ **Camera** - Allow (Required for taking work photos)
- ✅ **Photos** - Allow (Required for attaching photos to tasks)
- ✅ **Notifications** - Allow (Optional, for task updates)

#### Android Permissions:
- ✅ **Location** - "Allow only while using the app" (Required)
- ✅ **Camera** - Allow (Required)
- ✅ **Files and media** / **Photos and videos** - Allow (Required)
- ✅ **Notifications** - Allow (Optional)

**Why these permissions are needed:**
- **Location**: Core feature - verify technicians are at correct work site
- **Camera**: Take photos of work progress, equipment, before/after shots
- **Photos**: Attach photos from gallery to task reports

---

## Test Flow 1: First Launch & Authentication (5 minutes)

### Step 1.1: Launch App
1. Open the app
2. You should see a welcome/login screen
3. Interface should be in **Vietnamese**

### Step 1.2: Sign In with Test Account

1. Tap on the sign-in button (should say "Đăng nhập" in Vietnamese)
2. Enter the test credentials provided in the App Store Connect / Google Play Console notes
3. Tap "Đăng nhập" (Sign In)
4. Wait for authentication (2-3 seconds)

**Expected Result:**

- ✅ Successfully logged in
- ✅ Redirected to main app screen (Home/Tasks tab)
- ✅ Can see a list of tasks assigned to the test user

### Step 1.3: Verify User Profile

1. Tap on "Tài khoản" (Account) tab at the bottom
2. You should see:
   - User name (test account name)
   - Email (test account email)
   - Role: Nhân viên kỹ thuật (Technician)
   - Profile photo (placeholder or actual photo)

**Expected Result:**
- ✅ User profile loads correctly
- ✅ All user information is displayed

---

## Test Flow 2: Task Management (10 minutes)

### Step 2.1: View Task List
1. Go to "Nhiệm vụ" (Tasks) tab
2. You should see a list of tasks with:
   - Customer name
   - Address
   - Task status (color-coded)
   - Scheduled date/time

**Expected Result:**
- ✅ Task list loads without errors
- ✅ Can scroll through tasks
- ✅ Each task shows relevant information

### Step 2.2: View Task Details
1. Tap on any task from the list
2. Task detail screen should show:
   - Customer information (name, phone, address)
   - Task description
   - Scheduled time
   - Status
   - Map showing customer location
   - Photos (if any)
   - Check-in/check-out history (if any)

**Expected Result:**
- ✅ All task information loads correctly
- ✅ Map displays the customer location
- ✅ Can view attached photos (if available)

### Step 2.3: Search Tasks
1. Go back to task list
2. Tap on search bar at the top
3. Type a customer name or address (use Vietnamese characters)
4. Example: Type "Nguyễn" or "Hà Nội"

**Expected Result:**
- ✅ Search filters tasks in real-time
- ✅ Vietnamese text with diacritics works correctly
- ✅ Accent-insensitive search works (searching "nguyen" finds "Nguyễn")

---

## Test Flow 3: GPS Check-In/Check-Out (10 minutes)

**IMPORTANT**: This is the core feature of the app.

### Step 3.1: Navigate to a Task
1. From task list, select a task with status "Chờ thực hiện" (Pending)
2. Open task details
3. You should see a "Check-in" button (might say "Điểm danh vào")

### Step 3.2: Perform Check-In
1. Tap the "Check-in" button
2. App will request your current location
3. If using simulator/mock location, the app will use that location

**Expected Result:**
- ✅ Location is captured successfully
- ✅ Check-in time is recorded
- ✅ Task status changes to "Đang thực hiện" (In Progress)
- ✅ You can see check-in location on the map
- ✅ Check-in confirmation message appears

**Location Verification:**
- The app verifies the technician is within a reasonable distance of the customer's address
- For testing purposes, this validation may be relaxed for the test account

### Step 3.3: Work on Task (Simulate)
1. After check-in, you should be able to:
   - Add notes/comments
   - Take photos
   - Update task progress

### Step 3.4: Perform Check-Out
1. Tap the "Check-out" button (might say "Điểm danh ra")
2. App captures location and time again

**Expected Result:**
- ✅ Check-out location captured
- ✅ Check-out time recorded
- ✅ Task status might change to "Hoàn thành" (Completed) or require additional steps
- ✅ Total work duration calculated and displayed

---

## Test Flow 4: Photo Attachments (8 minutes)

### Step 4.1: Take Photo with Camera
1. Open any task in "In Progress" status
2. Look for "Thêm ảnh" or camera icon button
3. Tap to add photo
4. Select "Chụp ảnh" (Take Photo)
5. Allow camera permission if prompted
6. Take a photo using the device camera
7. Confirm/save the photo

**Expected Result:**
- ✅ Camera opens successfully
- ✅ Photo is captured
- ✅ Photo appears in task attachments
- ✅ Thumbnail is generated and displayed

### Step 4.2: Upload Photo from Gallery
1. Tap add photo button again
2. Select "Chọn từ thư viện" (Choose from Library)
3. Allow photos permission if prompted
4. Select an existing photo from device gallery
5. Confirm selection

**Expected Result:**
- ✅ Photo library/gallery opens
- ✅ Selected photo is uploaded
- ✅ Photo appears in task attachments
- ✅ Multiple photos can be attached to one task

### Step 4.3: View Photos
1. Tap on any attached photo
2. Photo should open in full-screen viewer
3. Try pinch-to-zoom
4. Swipe to view multiple photos

**Expected Result:**
- ✅ Full-screen photo viewer works
- ✅ Zoom in/out works smoothly
- ✅ Can navigate between multiple photos
- ✅ Can close viewer to return to task

---

## Test Flow 5: Customer Information (5 minutes)

### Step 5.1: View Customer List
1. Go to "Khách hàng" (Customers) tab
2. You should see a list of customers with:
   - Customer name
   - Phone number
   - Address
   - Number of tasks

**Expected Result:**
- ✅ Customer list loads successfully
- ✅ Can scroll through customers
- ✅ Search bar available at top

### Step 5.2: View Customer Details
1. Tap on any customer
2. Customer detail screen should show:
   - Full name
   - Phone number (tap to call)
   - Address (tap to open in maps)
   - Email (if available)
   - List of tasks for this customer
   - Payment history (if any)

**Expected Result:**
- ✅ All customer information displays correctly
- ✅ Phone number tap initiates call (you can cancel)
- ✅ Address tap opens native maps app
- ✅ Can view customer's task history

### Step 5.3: Contact Customer
1. From customer details, tap phone number
2. Device should prompt to make a call
3. Cancel the call (don't actually call)
4. Go back
5. Tap address
6. Maps app should open with customer location

**Expected Result:**
- ✅ Phone dialer opens with correct number
- ✅ Maps app opens with correct address
- ✅ Can return to app after canceling

---

## Test Flow 6: Navigation & Performance (5 minutes)

### Step 6.1: Test Tab Navigation
1. Navigate through all bottom tabs:
   - Trang chủ (Home)
   - Nhiệm vụ (Tasks)
   - Khách hàng (Customers)
   - Tài khoản (Account)
2. Each tab should load quickly and smoothly

**Expected Result:**
- ✅ All tabs are accessible
- ✅ Navigation is smooth (no lag)
- ✅ Tab state is preserved when switching
- ✅ No crashes or freezes

### Step 6.2: Test Back Navigation
1. Navigate deep into the app (Task → Task Details → Photo Viewer)
2. Use device back button (Android) or swipe back (iOS)
3. Should navigate back through screens correctly

**Expected Result:**
- ✅ Back navigation works correctly
- ✅ Returns to previous screen
- ✅ No unexpected exits or crashes

### Step 6.3: Test App Backgrounding
1. While viewing a task, press home button
2. Wait 5 seconds
3. Return to the app

**Expected Result:**
- ✅ App resumes where you left off
- ✅ No data loss
- ✅ No need to re-authenticate
- ✅ App state preserved

---

## Test Flow 7: Offline Behavior (5 minutes)

### Step 7.1: Enable Airplane Mode
1. Open a task with photos
2. Enable Airplane Mode on device
3. Try to view cached content (tasks you've already loaded)

**Expected Result:**
- ✅ Previously loaded tasks still viewable
- ✅ Cached photos still display
- ✅ Appropriate offline message for network operations

### Step 7.2: Try to Perform Actions Offline
1. While still offline, try to:
   - Check-in to a task
   - Upload a new photo
   - Load new tasks

**Expected Result:**
- ✅ Clear error message indicating no internet connection
- ✅ App doesn't crash
- ✅ Suggests enabling internet connection
- ✅ (Optional) Actions queued for when online

### Step 7.3: Return Online
1. Disable Airplane Mode
2. Wait for connection to restore
3. Try actions again

**Expected Result:**
- ✅ App reconnects automatically
- ✅ Pending actions complete (if queued)
- ✅ Fresh data loads

---

## Test Flow 8: Account & Settings (5 minutes)

### Step 8.1: View Account Information
1. Go to "Tài khoản" (Account) tab
2. Review profile information
3. Check for settings or preferences

**Expected Result:**
- ✅ Profile information accurate
- ✅ Settings accessible
- ✅ Can view app version number

### Step 8.2: Sign Out
1. Find "Đăng xuất" (Sign Out) button
2. Tap to sign out
3. Confirm if prompted

**Expected Result:**
- ✅ Successfully signed out
- ✅ Returned to login screen
- ✅ Session data cleared
- ✅ Can sign in again without issues

### Step 8.3: Sign In Again
1. Sign in again with test credentials
2. Verify all data is still available

**Expected Result:**
- ✅ Login successful
- ✅ All previous data still accessible
- ✅ App state restored

---

## Test Flow 9: Error Handling (5 minutes)

### Step 9.1: Test Invalid Login
1. Sign out if logged in
2. Try to sign in with invalid credentials:
   - Email: `wrong@example.com`
   - Password: `wrongpassword`

**Expected Result:**
- ✅ Clear error message in Vietnamese
- ✅ No crash
- ✅ Can try again with correct credentials

### Step 9.2: Test Permission Denial
1. Go to device Settings
2. Revoke Camera permission for the app
3. Return to app
4. Try to take a photo

**Expected Result:**
- ✅ Clear message asking to enable camera permission
- ✅ Option to go to Settings
- ✅ No crash

### Step 9.3: Test Network Error
1. Start an action (like loading tasks)
2. Quickly enable Airplane Mode mid-request
3. Observe behavior

**Expected Result:**
- ✅ Graceful error handling
- ✅ Clear error message
- ✅ Retry option available
- ✅ No crash or frozen UI

---

## Test Flow 10: Accessibility (iOS VoiceOver / Android TalkBack) (Optional but Recommended)

### Step 10.1: Enable Screen Reader
**iOS**: Enable VoiceOver in Settings → Accessibility → VoiceOver
**Android**: Enable TalkBack in Settings → Accessibility → TalkBack

### Step 10.2: Navigate App with Screen Reader
1. Launch app with screen reader enabled
2. Navigate through main screens
3. Try to:
   - Sign in
   - Open a task
   - Navigate tabs

**Expected Result:**
- ✅ All interactive elements have labels
- ✅ Screen reader announces elements correctly
- ✅ Navigation is possible without seeing the screen
- ✅ Vietnamese text is read correctly (may be robotic but understandable)

---

## Platform-Specific Testing

### iOS Specific Tests

#### Test 1: iPad Exclusion (IMPORTANT)
1. Try to install app on iPad via TestFlight
2. App should NOT appear as compatible

**Expected Result:**
- ✅ App shows as "iPhone only" in TestFlight
- ✅ Cannot install on iPad
- ✅ This is intentional - app is designed for iPhones only

#### Test 2: 3D Touch / Haptic Feedback
1. Perform check-in or check-out
2. Feel for haptic feedback

**Expected Result:**
- ✅ Subtle haptic feedback on important actions
- ✅ Enhances user experience

#### Test 3: iOS Share Sheet
1. From task details, try to share (if available)
2. iOS share sheet should appear

**Expected Result:**
- ✅ Share sheet works correctly
- ✅ Can share task info via Messages, Email, etc.

### Android Specific Tests

#### Test 1: Tablet Exclusion (IMPORTANT)
1. Try to install app on Android tablet via Play Store Internal Testing
2. App should NOT appear as compatible

**Expected Result:**
- ✅ App shows as incompatible on tablets
- ✅ Error: "Your device isn't compatible with this version"
- ✅ This is intentional - app is designed for phones only

#### Test 2: Back Button Behavior
1. Navigate through several screens
2. Use hardware/software back button
3. Should navigate back correctly

**Expected Result:**
- ✅ Back button navigates to previous screen
- ✅ Double-back exits app (may prompt for confirmation)
- ✅ No unexpected behavior

#### Test 3: Material Design
1. Observe UI elements (buttons, cards, inputs)
2. Should follow Material Design guidelines

**Expected Result:**
- ✅ UI looks native to Android
- ✅ Proper elevation/shadows
- ✅ Ripple effects on taps

---

## Performance Benchmarks

### Expected Performance:
- **App Launch**: < 3 seconds (cold start)
- **Tab Navigation**: < 200ms
- **Task List Load**: < 2 seconds (with network)
- **Photo Upload**: < 5 seconds (depending on network)
- **Check-in/Check-out**: < 1 second (GPS capture)

### Memory Usage:
- **Idle**: ~100-150 MB
- **Active Use**: ~200-300 MB
- **No memory leaks during normal usage**

---

## Common Issues & Expected Behavior

### Issue: Location Not Found
**Cause**: GPS not enabled or no location permission
**Expected**: Clear message asking to enable location services
**Solution**: Enable location in device settings

### Issue: Photos Not Uploading
**Cause**: No internet connection or photo permission denied
**Expected**: Error message with retry option
**Solution**: Check internet connection and permissions

### Issue: App in Vietnamese
**Cause**: This is intentional - app is for Vietnamese users
**Expected**: All UI text in Vietnamese
**Note**: This is NOT a bug - the app is designed for Vietnamese market

### Issue: Cannot Install on iPad/Tablet
**Cause**: Intentional device restriction
**Expected**: App only available for phones (iPhone/Android phones)
**Note**: This is by design - see "Platform-Specific Testing" above

---

## Security & Privacy

### Data Handling:
- ✅ User credentials are securely transmitted (HTTPS only)
- ✅ Authentication tokens stored securely (Keychain/Keystore)
- ✅ Photos uploaded over secure connection
- ✅ Location data sent only when necessary (check-in/check-out)
- ✅ No sensitive data logged to console

### Privacy:
- ✅ Location used only for check-in/check-out verification
- ✅ Camera/photos used only for work documentation
- ✅ No data shared with third parties
- ✅ Clear privacy policy (if requested)

---

## Edge Cases to Test

1. **Low Battery**: App should work normally even with low battery warning
2. **Low Storage**: Graceful handling if device storage is full
3. **Poor Network**: App should handle slow/unstable network gracefully
4. **Rapid Tapping**: No crashes from rapid UI interaction
5. **Rotation** (if supported): UI adjusts correctly to landscape/portrait
6. **Interruptions**: Incoming call, notification, etc. shouldn't crash app

---

## Test Summary Checklist

Copy this checklist for your review report:

### Core Functionality
- [ ] App launches successfully
- [ ] Authentication works (login/logout)
- [ ] Task list loads and displays correctly
- [ ] Task details accessible
- [ ] GPS check-in/check-out works
- [ ] Photos can be taken and uploaded
- [ ] Customer information viewable
- [ ] Search functionality works

### Technical Requirements
- [ ] Location permission requested and used appropriately
- [ ] Camera permission requested and used appropriately
- [ ] Photos permission requested and used appropriately
- [ ] App handles offline state gracefully
- [ ] Error messages are clear and helpful
- [ ] No crashes during testing
- [ ] Performance is acceptable

### Platform Compliance
- [ ] iPhone only (iOS) - NOT available on iPad ✓
- [ ] Android phones only - NOT available on tablets ✓
- [ ] Follows platform design guidelines
- [ ] Accessibility features work (if tested)
- [ ] Privacy/security requirements met

### User Experience
- [ ] UI is intuitive and responsive
- [ ] Vietnamese language throughout (intentional)
- [ ] Navigation is smooth
- [ ] Feedback for user actions is clear
- [ ] App state preserved during backgrounding

---

## Contact Information for Review Questions

**Developer Contact**: Available in App Store Connect / Google Play Console
**App Purpose**: Field service management for air conditioning technicians in Vietnam
**Market**: Vietnam only
**Language**: Vietnamese (primary user base)

---

## Notes for App Review Team

1. **Vietnamese Language**: The entire app is in Vietnamese as it serves Vietnamese technicians in Vietnam. This is intentional and appropriate for the target market.

2. **Phone-Only Support**: The app is intentionally restricted to phones (iPhone and Android phones only). Field technicians use phones, not tablets. This is a business decision, not a technical limitation.

3. **Location Services**: GPS-based check-in/check-out is the core feature. Location is used to verify technicians are at the correct work site, preventing fraud and ensuring service quality.

4. **Test Account**: The test account (credentials provided in submission notes) has pre-populated sample data. All features are accessible with this account.

5. **Mock Location**: For testing purposes, you can use simulator/mock location. The app will work correctly with simulated GPS coordinates.

6. **Privacy Compliance**: The app collects location data only during check-in/check-out (with user consent). Photos are work-related documentation. All data is transmitted securely over HTTPS.

Thank you for reviewing Nam Việt Internal. We appreciate your thorough testing and feedback.

---

**Document Version**: 1.0
**Last Updated**: 2025-11-17
**For**: Apple App Store & Google Play Store Review Teams
