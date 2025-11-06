# App Store Screenshot Guide - Nam Việt Internal

**Purpose**: Complete guide for creating App Store screenshots
**Last Updated**: November 6, 2025

---

## Quick Reference - Required Screenshots

### iPhone 6.5" Display (REQUIRED)
- **Dimensions**: 1242 × 2688 pixels (portrait) OR 1284 × 2778 pixels
- **Minimum**: 1 screenshot
- **Maximum**: 10 screenshots
- **Format**: PNG or JPEG (RGB color space)
- **File size**: Max 10MB each

### iPad 13" Display (REQUIRED if app runs on iPad)
- **Dimensions**: 2064 × 2752 pixels OR 2048 × 2732 pixels (portrait)
- **Landscape**: 2752 × 2064 pixels OR 2732 × 2048 pixels
- **Same requirements as iPhone**

---

## Recommended Screenshot Set

### Priority Screenshots (First 3 - Most Important!)

#### 1. Task List Overview
**Purpose**: Show the main screen users see
**Setup**:
```
- Show 5-6 tasks in different statuses
- Include Vietnamese task titles
- Show status badges (colors)
- Display customer names
- Ensure variety in task types
```

#### 2. Task Detail with GPS & Photos
**Purpose**: Highlight core features
**Setup**:
```
- Open a task with completed check-in
- Show map with location pin
- Display 2-3 attached photos
- Show customer information
- Include check-in/out buttons
```

#### 3. Check-in Success Screen
**Purpose**: Demonstrate GPS verification feature
**Setup**:
```
- Show success message in Vietnamese
- Display GPS accuracy indicator
- Show distance from location
- Include timestamp
- Green success color theme
```

### Additional Screenshots (4-10)

#### 4. Photo Attachment Feature
**Setup**:
```
- Show camera/gallery selection
- Display photo thumbnails
- Include upload progress
- Show multiple photos attached
```

#### 5. Employee Reports Dashboard
**Setup**:
```
- Monthly summary with charts
- Task completion statistics
- Revenue tracking
- Performance comparison
- Vietnamese labels
```

#### 6. Payment Recording
**Setup**:
```
- Payment entry form
- Amount in VND format
- Payment method selection
- Success confirmation
```

#### 7. Task Filters/Search
**Setup**:
```
- Filter options visible
- Search bar with Vietnamese text
- Status filter selections
- Date range picker
```

#### 8. Profile/Settings
**Setup**:
```
- User profile information
- App version display
- Settings options
- Logout button
```

---

## Screenshot Creation Process

### Method 1: iOS Simulator (Recommended)

#### Setup Simulator
```bash
# 1. Open Xcode
open -a Xcode

# 2. Open Simulator
open -a Simulator

# 3. Select device
Device > iOS 15+ > iPhone 14 Pro Max (6.5" display)
# OR
Device > iOS 15+ > iPhone 13 Pro Max

# 4. Install app
# Drag and drop .app file or use:
xcrun simctl install booted /path/to/app
```

#### Configure for Screenshots
```bash
# Set perfect time (9:41 AM - Apple's preference)
xcrun simctl status_bar booted override --time "9:41"

# Full battery and signal
xcrun simctl status_bar booted override --batteryLevel 100 --cellularBars 4

# Remove carrier name (cleaner look)
xcrun simctl status_bar booted override --operatorName ""
```

#### Take Screenshots
```
1. CMD + S (saves to Desktop)
2. Or use Screenshot app
3. Or Device > Screenshot
```

### Method 2: Physical Device

#### Preparation
```
1. Clean device screen
2. Update to latest iOS
3. Set language to Vietnamese
4. Enable Do Not Disturb
5. Full battery charge
6. Strong WiFi/cellular signal
```

#### Screenshot Process
```
1. Press Volume Up + Side Button simultaneously
2. Screenshots save to Photos
3. Use AirDrop/iCloud to transfer to Mac
```

### Method 3: Fastlane Snapshot (Automated)

#### Setup
```ruby
# fastlane/Snapfile
devices([
  "iPhone 14 Pro Max",
  "iPad Pro (12.9-inch) (6th generation)"
])

languages([
  "vi-VN" # Vietnamese
])

# Output directory
output_directory "./screenshots"

# Clear previous screenshots
clear_previous_screenshots true
```

#### Run
```bash
cd apps/mobile
fastlane snapshot
```

---

## Screenshot Preparation Checklist

### Data Setup
- [ ] Create/use demo account with realistic data
- [ ] Populate with Vietnamese customer names
- [ ] Add variety of task statuses
- [ ] Include real Ho Chi Minh City addresses
- [ ] Upload sample work photos
- [ ] Generate recent activity history

### Device Configuration
- [ ] Set language to Vietnamese
- [ ] Time at 9:41 AM (optional but recommended)
- [ ] 100% battery
- [ ] Full signal bars
- [ ] WiFi connected
- [ ] Do Not Disturb enabled
- [ ] Hide personal notifications

### App State
- [ ] Logged into demo account
- [ ] All permissions granted
- [ ] Remove any debug overlays
- [ ] Hide development menus
- [ ] Clear test/debug data
- [ ] Ensure production API

---

## Screenshot Guidelines

### DO ✅
- Use real Vietnamese text
- Show actual app functionality
- Include variety in data
- Maintain consistent style
- Show app in best light
- Use high-quality images
- Test on target device size

### DON'T ❌
- No lorem ipsum text
- No placeholder images
- No error states
- No loading spinners
- No empty states
- No personal information
- No competitor references
- No inappropriate content

---

## Exact Screenshot Specifications

### For iPhone 6.5" Display

```javascript
// Device options
const devices = [
  { name: "iPhone 14 Pro Max", width: 1284, height: 2778 },
  { name: "iPhone 13 Pro Max", width: 1284, height: 2778 },
  { name: "iPhone 12 Pro Max", width: 1284, height: 2778 },
  { name: "iPhone 11 Pro Max", width: 1242, height: 2688 }
];

// All are acceptable for 6.5" requirement
```

### For iPad 13" Display

```javascript
// Device options
const iPads = [
  { name: "iPad Pro 12.9\" (6th gen)", width: 2048, height: 2732 },
  { name: "iPad Pro 12.9\" (5th gen)", width: 2048, height: 2732 },
  { name: "iPad Pro 13\" (M4)", width: 2064, height: 2752 }
];
```

---

## Screenshot Editing Tools

### Recommended Tools

#### 1. macOS Screenshot Editor
```bash
# Built-in, free, simple
# CMD + Shift + 4 for selection
# CMD + Shift + 5 for options
# Space bar to capture window
```

#### 2. Sketch/Figma
```
- Professional design tools
- Add device frames
- Create app store graphics
- Batch export options
```

#### 3. Photoshop
```
- Advanced editing
- Batch processing
- Color correction
- Remove sensitive data
```

#### 4. Screenshot App (Mac App Store)
```
- Device frames
- Annotations
- Backgrounds
- Export presets
```

---

## Screenshot Optimization

### File Size Optimization
```bash
# Using ImageOptim (Mac)
open -a ImageOptim screenshot.png

# Using command line (imagemagick)
convert input.png -quality 95 output.jpg

# Using pngquant for PNG
pngquant --quality=90-100 screenshot.png
```

### Batch Processing Script
```bash
#!/bin/bash
# Resize all screenshots to exact dimensions
for file in *.png; do
  convert "$file" -resize 1284x2778 "optimized_$file"
done
```

---

## App Store Connect Upload

### Manual Upload Process

1. **Navigate to App Version**
   - App Store Connect → My Apps → Nam Việt Internal
   - iOS App → Version 1.0

2. **Media Manager**
   - Scroll to "Screenshots" section
   - Click device size (6.5" Display)

3. **Upload Screenshots**
   - Drag and drop files
   - Or click "Choose File"
   - Wait for processing

4. **Arrange Order**
   - Drag to reorder
   - First 3 are most important
   - Preview in different contexts

5. **Save Changes**
   - Click "Save" in top right
   - Verify no errors

### Using Transporter App

```bash
# For bulk upload
1. Download Transporter from Mac App Store
2. Sign in with Apple ID
3. Select app
4. Add screenshots to media folder
5. Deliver
```

---

## Screenshot Templates

### Task List Screen
```
Status bar: 9:41 AM | Full signal | 100% battery
Navigation: "Nhiệm vụ" title
Content:
  - Task 1: "Bảo trì điều hòa - Công ty ABC" [Sẵn sàng]
  - Task 2: "Sửa chữa - Văn phòng XYZ" [Đang thực hiện]
  - Task 3: "Lắp đặt mới - Nhà riêng" [Hoàn thành]
  - Task 4: "Kiểm tra định kỳ - Cửa hàng" [Chuẩn bị]
Bottom tabs: Visible with icons
```

### Check-in Screen
```
Modal overlay showing:
  "Xác nhận vị trí"
  Map with pin
  Distance: "Cách 45m từ địa điểm"
  Accuracy: "Độ chính xác: ±10m"
  [Check-in button - green]
  [Hủy button - gray]
```

### Success Messages
```
Toast/Alert styles:
  ✓ "Check-in thành công!"
  ✓ "Đã gửi ảnh"
  ✓ "Thanh toán đã được ghi nhận"
  ✓ "Nhiệm vụ hoàn thành"
```

---

## Localization Considerations

### Vietnamese UI Elements
Ensure these are in Vietnamese:
- Navigation titles
- Button labels
- Status messages
- Error messages
- Date/time formats (DD/MM/YYYY)
- Currency (₫ or VND)
- Phone numbers (+84 format)

### Sample Vietnamese Text
```
Common UI text:
- "Nhiệm vụ" (Tasks)
- "Báo cáo" (Reports)
- "Tài khoản" (Account)
- "Check-in" (Keep in English or use "Điểm danh")
- "Hoàn thành" (Complete)
- "Đang thực hiện" (In Progress)
- "Sẵn sàng" (Ready)
- "Chụp ảnh" (Take Photo)
- "Thêm ảnh" (Add Photo)
```

---

## Quality Checklist

Before uploading to App Store Connect:

### Technical Requirements
- [ ] Correct dimensions (1284×2778 or 1242×2688)
- [ ] RGB color space (not CMYK)
- [ ] File size under 10MB each
- [ ] PNG or JPEG format
- [ ] No transparency/alpha channel

### Content Requirements
- [ ] Real app UI (not mockups)
- [ ] Vietnamese language displayed
- [ ] No placeholder text
- [ ] No personal information visible
- [ ] No errors or warnings shown
- [ ] Professional appearance

### Order and Priority
- [ ] Most impressive screenshot first
- [ ] Core features in first 3
- [ ] Logical flow of features
- [ ] Variety in screens shown
- [ ] Consistent visual style

---

## Common Issues & Solutions

### Issue: Wrong dimensions
```bash
# Fix with ImageMagick
convert input.png -resize 1284x2778! output.png
# ! forces exact dimensions
```

### Issue: File too large
```bash
# Compress JPEG
convert input.png -quality 85 output.jpg

# Compress PNG
pngquant --quality=65-80 input.png
```

### Issue: Wrong color space
```bash
# Convert CMYK to RGB
convert input.png -colorspace sRGB output.png
```

### Issue: Screenshots rejected
Common reasons:
1. Mockups instead of real app
2. Placeholder/lorem ipsum text
3. Wrong dimensions
4. Personal information visible
5. Inappropriate content

---

## Final Tips

1. **First Impressions Matter**: The first 2-3 screenshots determine if users will download
2. **Show, Don't Tell**: Visual demonstration better than text
3. **Vietnamese First**: Since app is for Vietnamese users, ensure language consistency
4. **Test on Device**: Preview how screenshots look on actual App Store
5. **Get Feedback**: Have others review before submission
6. **Keep Originals**: Save unedited versions for future updates

---

**Note**: Take extra screenshots beyond the minimum. You can always choose the best ones, but retaking screenshots later is time-consuming.