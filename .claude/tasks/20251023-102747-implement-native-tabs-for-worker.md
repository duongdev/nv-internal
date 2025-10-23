# Implement Expo Router Native Tabs for Worker App

## Overview

Migrated the worker tab layout from standard JavaScript tabs to Expo Router's new experimental native tabs API (`expo-router/unstable-native-tabs`) to provide a more platform-native look and feel.

## Implementation Status

✅ Completed

## Changes Made

### File Modified

**`apps/mobile/app/worker/(tabs)/_layout.tsx`**

- Replaced `<Tabs>` from `expo-router` with `<NativeTabs>` from `expo-router/unstable-native-tabs`
- Converted `<Tabs.Screen>` components to `<NativeTabs.Trigger>` with nested components
- Migrated from `lucide-react-native` icons to `@expo/vector-icons/MaterialCommunityIcons` (required for VectorIcon compatibility)
- Added platform-specific styling:
  - **iOS**: Blur effects (`systemMaterialDark`/`systemMaterialLight`)
  - **Android**: Label visibility mode (`labeled`)
- Configured icon colors with default and selected states
- Applied existing theme colors and font families

### Tab Configuration

1. **Công việc (Tasks)** - Route: `index`
   - Icon: `format-list-checks` (MaterialCommunityIcons)
   - Header: Hidden (custom screen header)

2. **Cài đặt (Settings)** - Route: `settings`
   - Icon: `cog` (MaterialCommunityIcons)
   - Header: Shown with title

## Technical Details

### Native Tabs API Requirements

The `VectorIcon` component requires icon libraries with a `getImageSource` method:

```typescript
family: {
  getImageSource: (name: string, size: number, color: ColorValue) => Promise<ImageSourcePropType | null>
}
```

**Key Finding**: `lucide-react-native` icons don't provide `getImageSource`, so we switched to `@expo/vector-icons/MaterialCommunityIcons` which is compatible with the native tabs API.

### Platform-Specific Features

**iOS**:
- Blur effects for native translucent tab bar
- Automatically adapts to system theme (dark/light)

**Android**:
- Material Design active indicators
- Label visibility always shown
- Ripple effects (built-in)

### Theme Integration

```typescript
backgroundColor: isDark ? '#000000' : '#ffffff'
iconColor: {
  default: isDark ? '#9ca3af' : '#6b7280',
  selected: primaryColor  // From THEME config
}
labelStyle: {
  fontFamily: FONT_FAMILY.medium,
  fontSize: 12
}
```

## Benefits

✅ **Native UI**: Tab bars use platform-native system components
✅ **Better Performance**: Native rendering instead of JavaScript
✅ **iOS Blur Effects**: Modern translucent tab bar appearance
✅ **Android Material Design**: Platform-appropriate styling
✅ **Consistent UX**: Matches native app conventions

## Testing Verification

- ✅ TypeScript compilation successful (no errors in worker layout)
- ✅ Biome formatting and linting passed
- ✅ Icon rendering with VectorIcon works correctly
- ✅ Theme colors applied properly
- ✅ Platform-specific props correctly configured

## Important Notes

1. **Experimental API**: This feature is experimental (SDK 54+) and subject to change in future releases
2. **Icon Library Compatibility**: Only `@expo/vector-icons` family is compatible with `VectorIcon`
3. **Admin Tabs**: Admin section remains on standard tabs (can migrate separately if needed)
4. **No Breaking Changes**: Screen components remain unchanged; only layout implementation differs

## Resources

- [Expo Router Native Tabs Docs](https://docs.expo.dev/versions/latest/sdk/router-native-tabs/)
- Expo SDK Version: 54.0.19
- React Native Version: 0.81.5
- React Version: 19.1.0

## Next Steps

If desired, the admin tabs (`/admin/(tabs)/`) could also be migrated to native tabs following the same pattern. However, this should be done as a separate task to minimize risk.
