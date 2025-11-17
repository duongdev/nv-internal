# App Store Configuration - Phone-Only Support

## Overview

The NV Internal app is configured to support **phones only**, excluding tablets (iPads and Android tablets). This is appropriate for a field-worker task management app optimized for mobile use.

## Configuration

### iOS - iPhone Only (No iPad)

In `apps/mobile/app.config.ts`:

```typescript
ios: {
  supportsTablet: false, // Phones only - no iPad support
  // ...
  infoPlist: {
    UIDeviceFamily: [1], // 1 = iPhone only (exclude iPad)
    // ...
  },
}
```

**What this does:**
- `supportsTablet: false` - Tells Expo to build for iPhone only
- `UIDeviceFamily: [1]` - Native iOS setting that restricts to iPhone device family
- App will NOT appear in iPad App Store
- If somehow installed on iPad, it will run in iPhone compatibility mode (small screen)

### Android - Phones Only (No Tablets)

Uses a custom Expo config plugin: `plugins/withAndroidPhoneOnly.js`

```typescript
plugins: [
  // ...
  './plugins/withAndroidPhoneOnly.js',
]
```

**What the plugin does:**
- Adds `<supports-screens>` to AndroidManifest.xml
- Sets `android:largeScreens="false"` and `android:xlargeScreens="false"`
- Sets `android:compatibleWidthLimitDp="480"` to restrict to phone-sized screens
- App will NOT appear for tablet devices in Google Play Store

**Generated AndroidManifest.xml:**
```xml
<supports-screens
  android:smallScreens="true"
  android:normalScreens="true"
  android:largeScreens="false"
  android:xlargeScreens="false"
  android:requiresSmallestWidthDp="320"
  android:compatibleWidthLimitDp="480"/>
```

## Screen Size Definitions

### iOS
- **iPhone (Device Family 1)**: All iPhone models
- **iPad (Device Family 2)**: All iPad models, iPad mini, iPad Pro

### Android
- **small**: ~320x426dp or smaller
- **normal**: ~320x470dp (typical phones)
- **large**: ~480x640dp (7" tablets) - **EXCLUDED**
- **xlarge**: ~720x960dp (10" tablets) - **EXCLUDED**

## App Store Visibility

### Apple App Store
- ✅ App appears in iPhone App Store
- ❌ App does NOT appear in iPad App Store
- ⚠️ Users cannot manually search and install on iPad

### Google Play Store
- ✅ App appears for phones (< 480dp width)
- ❌ App does NOT appear for tablets (>= 480dp width)
- ⚠️ Tablet users will see "Your device isn't compatible with this version"

## Verification

To verify the configuration is applied correctly:

```bash
# From apps/mobile/
npx expo prebuild --platform android --no-install --clean

# Check AndroidManifest.xml
grep "supports-screens" android/app/src/main/AndroidManifest.xml

# Clean up
rm -rf android
```

You should see:
```xml
<supports-screens android:smallScreens="true" android:normalScreens="true"
  android:largeScreens="false" android:xlargeScreens="false" .../>
```

## Build & Submit

When building with EAS:

```bash
# Production build
eas build --platform android --profile production
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

The phone-only restrictions will be automatically included in the submitted builds.

## Alternative: Google Play Console Device Exclusion

If you need finer control over specific Android tablet models, you can also manually exclude devices in Google Play Console:

1. Go to Google Play Console
2. Select your app
3. Navigate to **Release > Device catalog**
4. Manually exclude tablet devices

However, the AndroidManifest approach (implemented via config plugin) is recommended as it's automatic and version-controlled.

## Trade-offs & Considerations

### Why Restrict to Phones Only?

✅ **Benefits:**
- Simpler UI design optimized for one screen size
- Better user experience on target device (phones)
- Smaller APK/IPA size (fewer assets needed)
- Easier testing (fewer device types)
- Matches intended use case (field workers with phones)

⚠️ **Trade-offs:**
- Cannot support office workers who prefer tablets
- May need to reconsider if iPad/tablet support is requested later
- Some users may have company-issued tablets

### When to Support Tablets?

Consider adding tablet support if:
- Office managers want to use the app on larger screens
- Field workers carry tablets (e.g., iPad mini)
- You need to show detailed reports/dashboards
- Multi-window/split-screen support is desired

To add tablet support later:
1. Set `ios.supportsTablet: true`
2. Remove the `withAndroidPhoneOnly.js` plugin
3. Design and test UI for larger screens
4. Add tablet-specific layouts with responsive design

## Related Documentation

- [Expo App Configuration](https://docs.expo.dev/versions/latest/config/app/)
- [iOS Device Families](https://developer.apple.com/documentation/bundleresources/information_property_list/uidevicefamily)
- [Android Screen Support](https://developer.android.com/guide/topics/manifest/supports-screens-element)
- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)

---

**Last Updated**: 2025-11-17
**Author**: Claude Code
**Related Files**:
- `apps/mobile/app.config.ts` - Main app configuration
- `apps/mobile/plugins/withAndroidPhoneOnly.js` - Android phone-only config plugin
