# Frontend Engineer Agent

**Agent**: `frontend-engineer`

**USE THIS AGENT FOR ALL MOBILE/UI WORK**

## Overview

The frontend-engineer agent is your expert for React Native mobile development, UI/UX implementation, and client-side architecture in the NV Internal project.

## Capabilities

- React Native component implementation
- Expo features and mobile-specific functionality
- Mobile UI/UX design and implementation
- Navigation and routing with Expo Router
- TanStack Query state management
- NativeWind styling and responsive design
- Mobile app optimization
- API integration from mobile app
- Form handling and validation

## When to Invoke (ALWAYS for frontend work)

Invoke this agent for:

- ✅ Building new mobile screens or components
- ✅ Implementing mobile-specific features
- ✅ Debugging mobile UI or navigation issues
- ✅ Optimizing mobile app performance
- ✅ Integrating with backend APIs
- ✅ Styling with NativeWind/Tailwind
- ✅ Managing client-side state with TanStack Query
- ✅ Working with Expo Router navigation

## Project-Specific Context

### Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: TanStack Query with aggressive caching (1 week gcTime)
- **Styling**: NativeWind (Tailwind for React Native)
- **Authentication**: Clerk SDK with protected routes
- **API Client**: Type-safe `callHonoApi` utility
- **Forms**: Modal-based presentation pattern
- **Testing**: Mobile-MCP for UI testing

### Mobile App Structure

- **Routing**: Expo Router file-based routing in `apps/mobile/app/`
  - **⚠️ CRITICAL WARNING**: Never use `screenOptions` with Stack navigators wrapping Tabs - it creates invisible overlays that block touch events
  - **✅ CORRECT**: Use individual `options` on each Stack.Screen
  - **❌ WRONG**: `<Stack screenOptions={{ headerShown: false }}>`
  - **Tab Navigation**: Using stable `Tabs` from expo-router (NOT unstable NativeTabs)
  - **Haptic Feedback**: Tab presses trigger light haptic feedback for better UX

- **API Calls**: Use `callHonoApi` utility for type-safe API calls
- **State Management**: TanStack Query with aggressive caching (1 week gcTime)
  - **Comparison Data**: Fetch multiple periods in parallel for month-over-month comparisons
  - **Smart Invalidation**: Invalidate queries based on parameter changes

- **Styling**: NativeWind (Tailwind for React Native) with sorted classes
  - **className Composition**: Use the `cn` utility from `@/lib/utils` for composing classNames with conditional logic
  - The `cn` utility combines `clsx` and `tailwind-merge` to properly merge and deduplicate Tailwind classes
  - **Change Indicators**: Use color-coded badges (green/red/gray) for metric changes

- **Components**: Follow existing component structure in `components/` directory
- **Accessibility**: All interactive elements have proper accessibility props

### Key Implementation Patterns

#### Navigation

- Use stable `Tabs` from expo-router (NOT unstable NativeTabs)
- Never use `screenOptions` on Stack navigators wrapping Tabs
- Add haptic feedback to tab presses for better UX
- See [Tabs Navigation Pattern](../../docs/architecture/patterns/tabs-navigation.md)

#### Accessibility

- All interactive elements require 4 properties:
  - `accessibilityLabel` (Vietnamese, descriptive)
  - `accessibilityHint` (Vietnamese, action description)
  - `accessibilityRole` (button, link, text, etc.)
  - `testID` (format: `{screen}-{action}-{type}`)
- See [Mobile Accessibility Pattern](../../docs/architecture/patterns/mobile-accessibility.md)

#### State Management

- Use TanStack Query for server state
- Cache aggressively (1 week gcTime) for better performance
- Invalidate queries based on mutations
- Fetch comparison data in parallel

#### Styling

- Use NativeWind with `cn` utility for className composition
- Follow mobile-first responsive design
- Use color-coded indicators for changes (green/red/gray)
- Maintain consistent spacing with Tailwind utilities

#### Forms and Inputs

- Present forms as modals
- Use bottom sheets for selectors (not dropdowns)
- Implement proper validation feedback
- Handle keyboard dismissal correctly

### Quality Standards

- Run `pnpm biome:check --write .` before committing
- Ensure all interactive elements have accessibility props
- Test on both iOS and Android
- Verify haptic feedback works correctly
- Check performance with React DevTools

## Reference Documentation

- **Architecture patterns**: `docs/architecture/patterns/`
- **Mobile testing**: `docs/testing/mobile-mcp.md`
- **Tabs navigation**: `docs/architecture/patterns/tabs-navigation.md`
- **Mobile accessibility**: `docs/architecture/patterns/mobile-accessibility.md`
- **Feature flags**: `.claude/docs/feature-flags-guide.md`

## Common Workflows

### Implementing a New Screen

1. **Design Phase**
   - Review UI/UX requirements
   - Identify data fetching needs
   - Plan component structure
   - Consider accessibility requirements

2. **Implementation Phase**
   - Create route file in `apps/mobile/app/`
   - Implement components with proper accessibility props
   - Set up TanStack Query hooks for data fetching
   - Apply NativeWind styling with `cn` utility
   - Add haptic feedback for interactions

3. **Testing Phase**
   - Test on iOS and Android
   - Verify accessibility with screen reader
   - Test with Mobile-MCP if available
   - Check performance with large datasets

4. **Quality Check**
   - Run TypeScript compiler: `npx tsc --noEmit`
   - Run Biome checks: `pnpm biome:check --write .`
   - Invoke `code-quality-enforcer` agent for final validation

### Integrating with Backend API

1. **Define API Contract**
   - Review backend endpoint implementation
   - Understand request/response types
   - Plan error handling

2. **Implement API Call**
   - Use `callHonoApi` utility for type safety
   - Wrap in TanStack Query hook
   - Handle loading and error states
   - Implement optimistic updates if needed

3. **Update UI**
   - Display loading indicators
   - Show error messages
   - Handle empty states
   - Add pull-to-refresh if applicable

### Optimizing Performance

1. **Identify Bottleneck**
   - Use React DevTools for profiling
   - Check render counts
   - Analyze data fetching patterns

2. **Apply Optimizations**
   - Use `FlatList` for long lists
   - Implement `getItemLayout` for known heights
   - Add memoization with `useMemo`/`useCallback`
   - Optimize images with proper sizing
   - Use virtualization props

3. **Measure Impact**
   - Profile again with React DevTools
   - Test on lower-end devices
   - Verify 60fps scrolling

## Best Practices

### UI/UX Patterns

- **Pull-to-Refresh**: Implement with haptic feedback on key screens
- **Bottom Sheets**: Use for selectors (employees, dates) instead of dropdowns
- **Progressive Disclosure**: Show key metrics first, details on demand
- **Loading States**: Always show loading indicators for async operations
- **Error Handling**: Display user-friendly error messages in Vietnamese

### Performance

- **FlatList Optimization**: Always use `FlatList` over `ScrollView` for large datasets
- **Image Optimization**: Use proper sizing and lazy loading
- **Query Caching**: Leverage TanStack Query's aggressive caching
- **Memoization**: Use `useMemo` and `useCallback` for expensive operations
- **Virtualization**: Enable for long lists with proper props

### Accessibility

- **Required Properties**: All interactive elements need 4 accessibility props
- **Vietnamese Labels**: Use proper Vietnamese grammar in labels and hints
- **Dynamic Labels**: Update based on state (loading, count, context)
- **Screen Reader Testing**: Test with VoiceOver (iOS) and TalkBack (Android)

### State Management

- **Server State**: Use TanStack Query for all API data
- **Local State**: Use React hooks for UI-only state
- **Cache Invalidation**: Invalidate queries after mutations
- **Optimistic Updates**: Use for better perceived performance

## Related Agents

- **backend-engineer** - For API endpoint implementation
- **code-quality-enforcer** - For pre-commit validation
- **task-doc-tracker** - For documentation updates
- **qa-ui** - For comprehensive mobile testing

## Quick Reference Links

- [Tabs Navigation Pattern](../../docs/architecture/patterns/tabs-navigation.md)
- [Mobile Accessibility Pattern](../../docs/architecture/patterns/mobile-accessibility.md)
- [Cache Invalidation Pattern](../../docs/architecture/patterns/cache-invalidation.md)
- [Feature Flags Guide](../docs/feature-flags-guide.md)
- [OTA Updates Pattern](../../docs/architecture/patterns/ota-updates.md)
- [Mobile Testing Guide](../../docs/testing/mobile-mcp.md)
