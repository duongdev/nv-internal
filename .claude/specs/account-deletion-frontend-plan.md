# Account Deletion Frontend Implementation Plan

**Feature**: Account Deletion UI (Mobile)
**Linear Issue**: PSN-13
**Created**: 2025-11-10
**Status**: 🟢 Ready for Implementation
**Platform**: React Native (iOS/Android)

---

## 📋 Overview

This document provides a detailed step-by-step plan to implement the account deletion user interface in the React Native mobile app, ensuring compliance with Apple App Store Guideline 5.1.1(v).

**Key Requirements:**
- Feature flag controlled (`account-deletion-enabled`)
- Two-step confirmation with text input validation
- Vietnamese language throughout
- Full accessibility support (4 required props)
- Clean user flow with loading and success states
- Integration with TanStack Query for API calls
- Local data cleanup and Clerk sign-out

---

## 🎯 Implementation Strategy

### Development Approach

1. **Bottom-up Component Development**: Build UI components first, then integrate with API
2. **Feature Flag First**: Implement feature flag check before any UI
3. **Incremental Testing**: Test each component independently before integration
4. **Accessibility Built-in**: Add all 4 required props from the start

### File Organization

```
apps/mobile/
├── app/
│   ├── (authenticated)/
│   │   └── settings/                  # Existing
│   │       └── delete-account.tsx     # NEW - Full flow screen (modal)
│   │
│   └── worker/(tabs)/settings.tsx     # MODIFY - Add delete button
│   └── admin/(tabs)/settings.tsx      # MODIFY - Add delete button
│
├── components/
│   ├── user-settings/
│   │   └── user-settings-screen.tsx   # MODIFY - Add delete button
│   │   └── delete-account-dialog.tsx  # NEW - First confirmation
│   │   └── delete-account-final.tsx   # NEW - Final confirmation with input
│   │   └── delete-account-success.tsx # NEW - Success screen
│   │
│   └── ui/
│       └── alert-dialog.tsx           # EXISTING - Reuse
│       └── button.tsx                 # EXISTING - Use destructive variant
│       └── input.tsx                  # EXISTING - Use for text input
│
├── hooks/
│   └── use-delete-account.ts          # NEW - TanStack Query mutation
│   └── use-feature-flag.ts            # EXISTING - Feature flag check
│
└── api/
    └── account/
        └── use-delete-account.ts      # NEW - API integration
```

---

## 🚦 Step-by-Step Implementation

### Phase 1: Feature Flag & Entry Point (Est: 1 hour)

#### Task 1.1: Add Feature Flag to Constants

**File**: `apps/mobile/hooks/use-feature-flag.ts`

**Action**: Add flag constant

```typescript
export const FEATURE_FLAGS = {
  // ... existing flags ...

  // Account Deletion
  /** Enable/disable account deletion functionality (App Store compliance) */
  // biome-ignore lint/style/useNamingConvention: SCREAMING_SNAKE_CASE for constants is intentional
  ACCOUNT_DELETION_ENABLED: 'account-deletion-enabled',
} as const
```

**Location**: After line 140 (after existing flags)

**Testing**:
- TypeScript compiles without errors
- Flag appears in IDE autocomplete

---

#### Task 1.2: Add Delete Account Button to Settings

**File**: `apps/mobile/components/user-settings/user-settings-screen.tsx`

**Action**: Add delete button section with feature flag check

**Implementation**:

```typescript
import { useFeatureFlag, FEATURE_FLAGS } from '@/hooks/use-feature-flag'
import { TrashIcon } from 'lucide-react-native'
import { useState } from 'react'
import { DeleteAccountDialog } from './delete-account-dialog'

// Inside UserSettingsScreen component, after logout MenuGroup (line 246)

export const UserSettingsScreen: FC<UserSettingsProps> = ({ isAdminView }) => {
  const { user } = useUser()
  const { signOut } = useAuth()
  const queryClient = useQueryClient()
  const router = useRouter()

  // Feature flag check
  const { isEnabled: isAccountDeletionEnabled, isLoading: isFlagLoading } =
    useFeatureFlag(FEATURE_FLAGS.ACCOUNT_DELETION_ENABLED)

  // State for delete account dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // ... existing code ...

  return (
    <View className="gap-4">
      {/* ... existing sections ... */}

      {/* Logout section */}
      <MenuGroup>
        {/* ... existing logout button ... */}
      </MenuGroup>

      {/* Account Deletion Section - Feature Flag Controlled */}
      {isAccountDeletionEnabled && !isFlagLoading && (
        <MenuGroup>
          <MenuItem
            contentClassName="!text-destructive"
            label="Xóa tài khoản"
            leftIcon={TrashIcon}
            accessibilityLabel="Xóa tài khoản vĩnh viễn"
            accessibilityHint="Mở hộp thoại xác nhận xóa tài khoản"
            accessibilityRole="button"
            testID="settings-delete-account-button"
            onPress={() => setShowDeleteDialog(true)}
          />
        </MenuGroup>
      )}

      <VersionInfoFooter className="mt-8" />

      {/* Delete Account Dialog */}
      {showDeleteDialog && (
        <DeleteAccountDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
        />
      )}
    </View>
  )
}
```

**Visual Position**: After logout section, before VersionInfoFooter

**Accessibility Props** (4 required):
1. ✅ `accessibilityLabel="Xóa tài khoản vĩnh viễn"`
2. ✅ `accessibilityHint="Mở hộp thoại xác nhận xóa tài khoản"`
3. ✅ `accessibilityRole="button"` (inherited from MenuItem)
4. ✅ `testID="settings-delete-account-button"`

**Testing**:
- Button only shows when feature flag is `true`
- Button has red/destructive styling
- Tapping button opens dialog (placeholder for now)
- VoiceOver reads Vietnamese label correctly

---

### Phase 2: First Confirmation Dialog (Est: 2 hours)

#### Task 2.1: Create First Confirmation Component

**File**: `apps/mobile/components/user-settings/delete-account-dialog.tsx` (NEW)

**Implementation**:

```typescript
import type { FC } from 'react'
import { View } from 'react-native'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Text } from '@/components/ui/text'

export type DeleteAccountDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export const DeleteAccountDialog: FC<DeleteAccountDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa tài khoản?</AlertDialogTitle>
          <AlertDialogDescription>
            Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <View className="gap-2 py-2">
          <Text className="text-sm text-muted-foreground">
            Dữ liệu sẽ bị xóa:
          </Text>
          <View className="gap-1 pl-4">
            <Text className="text-sm">❌ Thông tin cá nhân</Text>
            <Text className="text-sm">❌ Lịch sử công việc</Text>
            <Text className="text-sm">❌ Hình ảnh đã tải lên</Text>
            <Text className="text-sm">❌ Lịch sử check-in/check-out</Text>
          </View>
        </View>

        <AlertDialogFooter>
          <AlertDialogCancel
            accessibilityLabel="Hủy xóa tài khoản"
            accessibilityHint="Đóng hộp thoại và quay lại cài đặt"
            accessibilityRole="button"
            testID="delete-account-cancel-button"
          >
            <Text>Hủy</Text>
          </AlertDialogCancel>
          <AlertDialogAction
            accessibilityLabel="Tiếp tục xóa tài khoản"
            accessibilityHint="Chuyển đến bước xác nhận cuối cùng"
            accessibilityRole="button"
            testID="delete-account-continue-button"
            onPress={onConfirm}
          >
            <Text>Tiếp tục</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

**Vietnamese Translations**:
- Title: "Xóa tài khoản?" (Delete account?)
- Description: "Hành động này không thể hoàn tác..." (This action cannot be undone...)
- Data items:
  - "Thông tin cá nhân" (Personal information)
  - "Lịch sử công việc" (Task history)
  - "Hình ảnh đã tải lên" (Uploaded photos)
  - "Lịch sử check-in/check-out" (Check-in/check-out history)
- Buttons: "Hủy" (Cancel), "Tiếp tục" (Continue)

**Accessibility**: All interactive elements have 4 required props

**Testing**:
- Dialog opens when triggered
- Warning message displays correctly
- Cancel button closes dialog
- Continue button proceeds to next step
- VoiceOver reads all content

---

### Phase 3: Final Confirmation with Text Input (Est: 2 hours)

#### Task 3.1: Create Final Confirmation Component

**File**: `apps/mobile/components/user-settings/delete-account-final.tsx` (NEW)

**Implementation**:

```typescript
import { useState, type FC } from 'react'
import { View } from 'react-native'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'

export type DeleteAccountFinalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting: boolean
}

const CONFIRMATION_PHRASE = 'XÓA TÀI KHOẢN'

export const DeleteAccountFinal: FC<DeleteAccountFinalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}) => {
  const [inputValue, setInputValue] = useState('')

  const isConfirmationValid =
    inputValue.trim().toUpperCase() === CONFIRMATION_PHRASE

  const handleConfirm = () => {
    if (isConfirmationValid && !isDeleting) {
      onConfirm()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa tài khoản</AlertDialogTitle>
          <AlertDialogDescription>
            Nhập "{CONFIRMATION_PHRASE}" để xác nhận xóa tài khoản vĩnh viễn.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <View className="gap-2">
          <Input
            accessibilityLabel="Ô nhập xác nhận xóa tài khoản"
            accessibilityHint={`Nhập cụm từ ${CONFIRMATION_PHRASE} để xác nhận`}
            accessibilityRole="text"
            testID="delete-account-confirmation-input"
            placeholder={CONFIRMATION_PHRASE}
            value={inputValue}
            onChangeText={setInputValue}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isDeleting}
          />

          {inputValue.length > 0 && !isConfirmationValid && (
            <Text className="text-xs text-destructive">
              Vui lòng nhập chính xác: "{CONFIRMATION_PHRASE}"
            </Text>
          )}
        </View>

        <AlertDialogFooter>
          <AlertDialogCancel
            accessibilityLabel="Hủy xóa tài khoản"
            accessibilityHint="Đóng hộp thoại và quay lại cài đặt"
            accessibilityRole="button"
            testID="delete-account-final-cancel-button"
            disabled={isDeleting}
          >
            <Text>Hủy</Text>
          </AlertDialogCancel>
          <AlertDialogAction
            accessibilityLabel={
              isDeleting
                ? 'Đang xóa tài khoản'
                : 'Xóa tài khoản vĩnh viễn'
            }
            accessibilityHint="Xóa tài khoản và tất cả dữ liệu"
            accessibilityRole="button"
            testID="delete-account-final-confirm-button"
            disabled={!isConfirmationValid || isDeleting}
            onPress={handleConfirm}
            className="bg-destructive"
          >
            <Text>
              {isDeleting ? 'Đang xóa...' : 'Xóa tài khoản vĩnh viễn'}
            </Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

**Key Features**:
1. **Text Input Validation**:
   - User must type "XÓA TÀI KHOẢN" exactly
   - Case-insensitive comparison (`toUpperCase()`)
   - Shows error hint if typed incorrectly
   - Button disabled until phrase matches

2. **Loading State**:
   - `isDeleting` prop controls loading UI
   - Input disabled during deletion
   - Cancel button disabled during deletion
   - Button text changes to "Đang xóa..." (Deleting...)

3. **Accessibility**:
   - Dynamic `accessibilityLabel` based on loading state
   - Input has clear hint about what to type
   - Error message announced by screen reader

**Testing**:
- Input validation works correctly
- Button only enables when phrase matches
- Loading state disables interactions
- Case-insensitive comparison works
- VoiceOver announces validation errors

---

### Phase 4: API Integration Hook (Est: 2 hours)

#### Task 4.1: Create Account Deletion API Hook

**File**: `apps/mobile/api/account/use-delete-account.ts` (NEW)

**Implementation**:

```typescript
import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'

export async function deleteAccount() {
  const { data } = await callHonoApi(
    (c) => c.v1.account.$delete(),
    {
      toastOnError: false, // Handle errors manually in UI
      throwOnError: true,
    },
  )
  return data
}

export type DeleteAccountResponse = Awaited<ReturnType<typeof deleteAccount>>

export function useDeleteAccount(
  mutationOptions?: UseMutationOptions<
    DeleteAccountResponse,
    Error,
    void
  >,
) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: deleteAccount,
    ...mutationOptions,
    onSuccess: (...args) => {
      mutationOptions?.onSuccess?.(...args)
      // Clear all cached queries (user is being logged out)
      queryClient.clear()
    },
  })

  return mutation
}
```

**Notes**:
- Uses existing `callHonoApi` utility (follows project pattern)
- `throwOnError: true` - Errors caught in mutation hook
- `toastOnError: false` - Show custom error UI in dialogs
- `queryClient.clear()` - Clears TanStack Query cache on success
- Type-safe response with TypeScript inference

**API Endpoint Assumption**: `DELETE /v1/account` (backend implementation required)

**Testing**:
- Mock API call succeeds
- Query cache cleared on success
- Error thrown on API failure
- Mutation hook returns proper loading states

---

#### Task 4.2: Create Delete Account Flow Coordinator Hook

**File**: `apps/mobile/hooks/use-delete-account-flow.ts` (NEW)

**Implementation**:

```typescript
import { useAuth } from '@clerk/clerk-expo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useState } from 'react'
import { useDeleteAccount } from '@/api/account/use-delete-account'
import { toast } from '@/components/ui/toasts'

export type DeleteAccountStep = 'initial' | 'first-confirm' | 'final-confirm' | 'deleting' | 'success'

/**
 * Hook to manage the account deletion flow
 * Coordinates dialogs, API calls, and cleanup
 */
export function useDeleteAccountFlow() {
  const [step, setStep] = useState<DeleteAccountStep>('initial')
  const deleteAccountMutation = useDeleteAccount()
  const { signOut } = useAuth()
  const router = useRouter()

  const handleStartDeletion = () => {
    setStep('first-confirm')
  }

  const handleFirstConfirm = () => {
    setStep('final-confirm')
  }

  const handleFinalConfirm = async () => {
    setStep('deleting')

    try {
      // 1. Call API to delete account
      await deleteAccountMutation.mutateAsync()

      // 2. Set logging out flag to suppress error toasts
      const { setLoggingOut } = await import('@/lib/api-client')
      setLoggingOut(true)

      // 3. Clear TanStack Query cache (already done in mutation hook)

      // 4. Clear token cache
      const { clearTokenCache } = await import('@/lib/api-client')
      clearTokenCache()

      // 5. Clear AsyncStorage (keep theme preference)
      const allKeys = await AsyncStorage.getAllKeys()
      const keysToKeep = ['theme']
      const keysToRemove = allKeys.filter((key) => !keysToKeep.includes(key))
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove)
      }

      // 6. Clear SecureStore (Clerk tokens)
      try {
        const clerkKeys = [
          '__clerk_client_jwt',
          '__clerk_refresh_token',
          '__clerk_session_id',
        ]
        for (const key of clerkKeys) {
          await SecureStore.deleteItemAsync(key).catch(() => {
            // Ignore errors if key doesn't exist
          })
        }
      } catch (error) {
        console.warn('Error clearing SecureStore:', error)
      }

      // 7. Sign out from Clerk
      await signOut()

      // 8. Show success step
      setStep('success')

      // 9. Redirect to sign-in after 3 seconds
      setTimeout(() => {
        try {
          router.dismissAll()
        } catch {
          // Ignore errors - user might already be signed out
        }
        router.replace('/(auth)/sign-in')

        // Reset logging out flag
        setTimeout(async () => {
          const { setLoggingOut } = await import('@/lib/api-client')
          setLoggingOut(false)
        }, 1000)
      }, 3000)

    } catch (error) {
      console.error('Account deletion error:', error)
      setStep('final-confirm') // Return to final confirmation
      toast.error('Không thể xóa tài khoản. Vui lòng thử lại.', {
        providerKey: 'PERSIST',
      })
    }
  }

  const handleCancel = () => {
    setStep('initial')
  }

  return {
    step,
    isDeleting: deleteAccountMutation.isPending || step === 'deleting',
    handleStartDeletion,
    handleFirstConfirm,
    handleFinalConfirm,
    handleCancel,
  }
}
```

**Key Features**:
1. **Step Management**: Tracks current step in flow
2. **Cleanup Logic**: Mirrors existing sign-out flow (from `user-settings-screen.tsx`)
3. **Error Handling**: Shows toast on failure, returns to confirmation
4. **Auto-redirect**: 3-second delay before redirecting to sign-in

**Pattern**: Follows existing `handleSignOut` implementation for consistency

**Testing**:
- Step transitions work correctly
- API call triggers cleanup flow
- Errors return to confirmation step
- Success triggers redirect after 3 seconds

---

### Phase 5: Success Screen (Est: 1 hour)

#### Task 5.1: Create Success Screen Component

**File**: `apps/mobile/components/user-settings/delete-account-success.tsx` (NEW)

**Implementation**:

```typescript
import { CheckCircle2Icon } from 'lucide-react-native'
import type { FC } from 'react'
import { View } from 'react-native'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { useColorPalette } from '@/hooks/use-color-palette'

export type DeleteAccountSuccessProps = {
  open: boolean
}

export const DeleteAccountSuccess: FC<DeleteAccountSuccessProps> = ({ open }) => {
  const { success } = useColorPalette()

  if (!open) return null

  return (
    <View
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
      accessibilityRole="alert"
      accessibilityLabel="Tài khoản đã được xóa thành công"
    >
      <View className="m-4 max-w-md rounded-lg bg-background p-8 shadow-lg">
        <View className="items-center gap-4">
          <Icon
            as={CheckCircle2Icon}
            size={64}
            className="text-success"
          />
          <Text
            variant="h2"
            className="text-center"
            accessibilityRole="header"
          >
            Tài khoản đã được xóa
          </Text>
          <Text className="text-center text-muted-foreground">
            Cảm ơn bạn đã sử dụng NV Internal
          </Text>
          <Text className="text-center text-xs text-muted-foreground">
            Đang chuyển hướng...
          </Text>
        </View>
      </View>
    </View>
  )
}
```

**Visual Design**:
- Full-screen overlay (semi-transparent black background)
- Centered card with white background
- Large green checkmark icon
- Vietnamese success message
- "Redirecting..." indicator

**Accessibility**:
- `accessibilityRole="alert"` - Announces immediately to screen reader
- `accessibilityLabel` - Full message for VoiceOver users
- Clear visual hierarchy

**Auto-dismiss**: Handled by parent component (3-second timer)

**Testing**:
- Screen displays when step is 'success'
- VoiceOver announces success message
- Overlay prevents interaction
- Auto-redirects after 3 seconds

---

### Phase 6: Integration & Flow (Est: 2 hours)

#### Task 6.1: Wire Up Complete Flow

**File**: `apps/mobile/components/user-settings/user-settings-screen.tsx`

**Action**: Update to use flow coordinator hook

**Implementation**:

```typescript
import { useDeleteAccountFlow } from '@/hooks/use-delete-account-flow'
import { DeleteAccountDialog } from './delete-account-dialog'
import { DeleteAccountFinal } from './delete-account-final'
import { DeleteAccountSuccess } from './delete-account-success'

export const UserSettingsScreen: FC<UserSettingsProps> = ({ isAdminView }) => {
  // ... existing code ...

  // Delete account flow
  const deleteAccountFlow = useDeleteAccountFlow()

  return (
    <View className="gap-4">
      {/* ... existing sections ... */}

      {/* Account Deletion Button - Feature Flag Controlled */}
      {isAccountDeletionEnabled && !isFlagLoading && (
        <MenuGroup>
          <MenuItem
            contentClassName="!text-destructive"
            label="Xóa tài khoản"
            leftIcon={TrashIcon}
            accessibilityLabel="Xóa tài khoản vĩnh viễn"
            accessibilityHint="Mở hộp thoại xác nhận xóa tài khoản"
            accessibilityRole="button"
            testID="settings-delete-account-button"
            onPress={deleteAccountFlow.handleStartDeletion}
          />
        </MenuGroup>
      )}

      {/* Delete Account Dialogs */}
      <DeleteAccountDialog
        open={deleteAccountFlow.step === 'first-confirm'}
        onOpenChange={(open) => {
          if (!open) deleteAccountFlow.handleCancel()
        }}
        onConfirm={deleteAccountFlow.handleFirstConfirm}
      />

      <DeleteAccountFinal
        open={deleteAccountFlow.step === 'final-confirm' || deleteAccountFlow.step === 'deleting'}
        onOpenChange={(open) => {
          if (!open && !deleteAccountFlow.isDeleting) {
            deleteAccountFlow.handleCancel()
          }
        }}
        onConfirm={deleteAccountFlow.handleFinalConfirm}
        isDeleting={deleteAccountFlow.isDeleting}
      />

      <DeleteAccountSuccess
        open={deleteAccountFlow.step === 'success'}
      />

      <VersionInfoFooter className="mt-8" />
    </View>
  )
}
```

**Flow Logic**:
1. User taps "Xóa tài khoản" → `step = 'first-confirm'`
2. User taps "Tiếp tục" → `step = 'final-confirm'`
3. User enters phrase + taps "Xóa tài khoản vĩnh viễn" → `step = 'deleting'`
4. API succeeds → `step = 'success'` → auto-redirect after 3s
5. Cancel at any point → `step = 'initial'`

**Testing**:
- Complete flow works end-to-end
- Cancel returns to initial state
- Back button handled correctly
- Errors don't break flow

---

### Phase 7: Error Handling & Edge Cases (Est: 1 hour)

#### Task 7.1: Add Network Error Handling

**File**: `apps/mobile/hooks/use-delete-account-flow.ts`

**Action**: Enhance error handling with specific messages

```typescript
// In handleFinalConfirm catch block
catch (error) {
  console.error('Account deletion error:', error)
  setStep('final-confirm') // Return to final confirmation

  // Determine error message
  let errorMessage = 'Không thể xóa tài khoản. Vui lòng thử lại.'

  if (error instanceof Error) {
    if (error.message.includes('network')) {
      errorMessage = 'Không có kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.'
    } else if (error.message.includes('401') || error.message.includes('403')) {
      errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    }
  }

  toast.error(errorMessage, {
    providerKey: 'PERSIST',
  })
}
```

**Error Scenarios**:
1. **Network Error**: "Không có kết nối mạng..."
2. **Auth Error**: "Phiên đăng nhập đã hết hạn..."
3. **Server Error**: "Không thể xóa tài khoản..."

**Testing**:
- Test with Airplane Mode on
- Test with expired token
- Test with server error (500)

---

#### Task 7.2: Add Loading State to Button

**File**: `apps/mobile/components/user-settings/delete-account-final.tsx`

**Action**: Already implemented with `isDeleting` prop

**Visual States**:
- Normal: "Xóa tài khoản vĩnh viễn" (red button, enabled)
- Loading: "Đang xóa..." (red button, disabled, opacity)
- Invalid: Button disabled (gray, opacity 50%)

**Testing**:
- Loading spinner shows during API call
- Button disabled during loading
- Can't submit multiple times

---

### Phase 8: Accessibility & Polish (Est: 1 hour)

#### Task 8.1: Verify Accessibility Props

**Checklist** (All Interactive Elements):

```typescript
// Settings Delete Button
accessibilityLabel="Xóa tài khoản vĩnh viễn"
accessibilityHint="Mở hộp thoại xác nhận xóa tài khoản"
accessibilityRole="button"
testID="settings-delete-account-button"

// First Dialog - Cancel
accessibilityLabel="Hủy xóa tài khoản"
accessibilityHint="Đóng hộp thoại và quay lại cài đặt"
accessibilityRole="button"
testID="delete-account-cancel-button"

// First Dialog - Continue
accessibilityLabel="Tiếp tục xóa tài khoản"
accessibilityHint="Chuyển đến bước xác nhận cuối cùng"
accessibilityRole="button"
testID="delete-account-continue-button"

// Final Dialog - Input
accessibilityLabel="Ô nhập xác nhận xóa tài khoản"
accessibilityHint="Nhập cụm từ XÓA TÀI KHOẢN để xác nhận"
accessibilityRole="text"
testID="delete-account-confirmation-input"

// Final Dialog - Cancel
accessibilityLabel="Hủy xóa tài khoản"
accessibilityHint="Đóng hộp thoại và quay lại cài đặt"
accessibilityRole="button"
testID="delete-account-final-cancel-button"

// Final Dialog - Confirm
accessibilityLabel={isDeleting ? 'Đang xóa tài khoản' : 'Xóa tài khoản vĩnh viễn'}
accessibilityHint="Xóa tài khoản và tất cả dữ liệu"
accessibilityRole="button"
testID="delete-account-final-confirm-button"

// Success Screen - Overlay
accessibilityRole="alert"
accessibilityLabel="Tài khoản đã được xóa thành công"
```

**Testing with VoiceOver**:
- Enable VoiceOver on iOS device
- Navigate through entire flow using gestures
- Verify all elements are announced correctly
- Test with TalkBack on Android

---

#### Task 8.2: Add Haptic Feedback (Optional)

**File**: `apps/mobile/hooks/use-delete-account-flow.ts`

**Action**: Add haptic feedback on success/error

```typescript
import * as Haptics from 'expo-haptics'

// On success (in handleFinalConfirm after API success)
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

// On error (in catch block)
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
```

**Testing**:
- Feel vibration on success
- Feel different vibration on error
- Works on both iOS and Android

---

## 🧪 Testing Plan

### Unit Tests

**File**: `apps/mobile/hooks/__tests__/use-delete-account-flow.test.ts` (NEW)

```typescript
import { renderHook, waitFor } from '@testing-library/react-native'
import { useDeleteAccountFlow } from '../use-delete-account-flow'

// Mock dependencies
jest.mock('@/api/account/use-delete-account')
jest.mock('@clerk/clerk-expo')

describe('useDeleteAccountFlow', () => {
  it('should initialize with initial step', () => {
    const { result } = renderHook(() => useDeleteAccountFlow())
    expect(result.current.step).toBe('initial')
  })

  it('should transition to first-confirm on handleStartDeletion', () => {
    const { result } = renderHook(() => useDeleteAccountFlow())
    act(() => {
      result.current.handleStartDeletion()
    })
    expect(result.current.step).toBe('first-confirm')
  })

  it('should transition to final-confirm on handleFirstConfirm', () => {
    const { result } = renderHook(() => useDeleteAccountFlow())
    act(() => {
      result.current.handleStartDeletion()
      result.current.handleFirstConfirm()
    })
    expect(result.current.step).toBe('final-confirm')
  })

  it('should handle API success and transition to success', async () => {
    const { result } = renderHook(() => useDeleteAccountFlow())
    act(() => {
      result.current.handleStartDeletion()
      result.current.handleFirstConfirm()
    })

    await act(async () => {
      await result.current.handleFinalConfirm()
    })

    await waitFor(() => {
      expect(result.current.step).toBe('success')
    })
  })

  it('should handle API error and return to final-confirm', async () => {
    // Mock API to throw error
    const { result } = renderHook(() => useDeleteAccountFlow())
    act(() => {
      result.current.handleStartDeletion()
      result.current.handleFirstConfirm()
    })

    await act(async () => {
      await result.current.handleFinalConfirm()
    })

    await waitFor(() => {
      expect(result.current.step).toBe('final-confirm')
    })
  })

  it('should reset to initial on handleCancel', () => {
    const { result } = renderHook(() => useDeleteAccountFlow())
    act(() => {
      result.current.handleStartDeletion()
      result.current.handleCancel()
    })
    expect(result.current.step).toBe('initial')
  })
})
```

---

### Component Tests

**File**: `apps/mobile/components/user-settings/__tests__/delete-account-dialog.test.tsx` (NEW)

```typescript
import { render, fireEvent } from '@testing-library/react-native'
import { DeleteAccountDialog } from '../delete-account-dialog'

describe('DeleteAccountDialog', () => {
  it('should render when open is true', () => {
    const { getByText } = render(
      <DeleteAccountDialog
        open={true}
        onOpenChange={jest.fn()}
        onConfirm={jest.fn()}
      />
    )
    expect(getByText('Xóa tài khoản?')).toBeTruthy()
  })

  it('should call onConfirm when Continue is pressed', () => {
    const onConfirm = jest.fn()
    const { getByTestId } = render(
      <DeleteAccountDialog
        open={true}
        onOpenChange={jest.fn()}
        onConfirm={onConfirm}
      />
    )
    fireEvent.press(getByTestId('delete-account-continue-button'))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('should call onOpenChange(false) when Cancel is pressed', () => {
    const onOpenChange = jest.fn()
    const { getByTestId } = render(
      <DeleteAccountDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={jest.fn()}
      />
    )
    fireEvent.press(getByTestId('delete-account-cancel-button'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('should have accessibility labels', () => {
    const { getByTestId } = render(
      <DeleteAccountDialog
        open={true}
        onOpenChange={jest.fn()}
        onConfirm={jest.fn()}
      />
    )
    const cancelButton = getByTestId('delete-account-cancel-button')
    expect(cancelButton.props.accessibilityLabel).toBe('Hủy xóa tài khoản')
  })
})
```

---

### Integration Test (Manual QA)

**Test Plan**:

```markdown
## Account Deletion QA Checklist

### Prerequisites
- [ ] Feature flag `account-deletion-enabled` is set to `true` in PostHog
- [ ] Test account created with sample data
- [ ] Test device has internet connection

### Happy Path
1. [ ] Open app → Navigate to Settings
2. [ ] Scroll down → Verify "Xóa tài khoản" button visible (red)
3. [ ] Tap "Xóa tài khoản" → First dialog opens
4. [ ] Read warning message → Verify all 4 data items listed
5. [ ] Tap "Hủy" → Dialog closes, returns to Settings
6. [ ] Tap "Xóa tài khoản" again → Dialog reopens
7. [ ] Tap "Tiếp tục" → Final confirmation dialog opens
8. [ ] Type incorrect phrase → Button remains disabled
9. [ ] Type "xóa tài khoản" (lowercase) → Button enables
10. [ ] Tap "Xóa tài khoản vĩnh viễn" → Loading spinner shows
11. [ ] Wait 2-5 seconds → Success screen appears
12. [ ] Wait 3 seconds → Redirected to sign-in screen
13. [ ] Try to sign in with deleted account → Should fail

### Error Scenarios
14. [ ] Start deletion flow → Enable Airplane Mode
15. [ ] Submit final confirmation → Verify network error message
16. [ ] Disable Airplane Mode → Retry → Should succeed

### Feature Flag
17. [ ] Set feature flag to `false` in PostHog
18. [ ] Restart app → Verify "Xóa tài khoản" button hidden
19. [ ] Set flag back to `true` → Button reappears

### Accessibility
20. [ ] Enable VoiceOver (iOS) or TalkBack (Android)
21. [ ] Navigate through entire flow using gestures
22. [ ] Verify all elements announced in Vietnamese
23. [ ] Verify button states announced correctly
24. [ ] Test with large text size → Verify no layout issues

### Cross-Platform
25. [ ] Repeat all tests on iOS simulator
26. [ ] Repeat all tests on Android emulator
27. [ ] Test on physical iOS device
28. [ ] Test on physical Android device

### Edge Cases
29. [ ] Background app during deletion → Resume → Should complete
30. [ ] Tap back button during dialogs → Should cancel
31. [ ] Tap outside dialog (backdrop) → Should cancel
32. [ ] Type confirmation phrase with spaces → Should work
33. [ ] Copy-paste confirmation phrase → Should work
```

---

## 📊 File Structure Summary

### New Files (9)

```
apps/mobile/
├── api/
│   └── account/
│       └── use-delete-account.ts              # NEW - API call
│
├── components/
│   └── user-settings/
│       ├── delete-account-dialog.tsx          # NEW - First confirmation
│       ├── delete-account-final.tsx           # NEW - Final confirmation
│       ├── delete-account-success.tsx         # NEW - Success screen
│       └── __tests__/
│           ├── delete-account-dialog.test.tsx # NEW - Component test
│           └── delete-account-final.test.tsx  # NEW - Component test
│
└── hooks/
    ├── use-delete-account-flow.ts             # NEW - Flow coordinator
    └── __tests__/
        └── use-delete-account-flow.test.ts    # NEW - Hook test
```

### Modified Files (2)

```
apps/mobile/
├── components/
│   └── user-settings/
│       └── user-settings-screen.tsx           # MODIFY - Add button + dialogs
│
└── hooks/
    └── use-feature-flag.ts                    # MODIFY - Add flag constant
```

---

## 🎨 User Flow Wireframes

### Screen 1: Settings (Entry Point)

```
┌─────────────────────────────────────┐
│  ← Cài đặt                          │
├─────────────────────────────────────┤
│                                     │
│  👤 [User Avatar]                   │
│     Nguyễn Văn A                    │
│     nva@example.com                 │
│                                     │
│  ───────────────────────────────    │
│                                     │
│  🌙  Giao diện              ›       │
│  📊  Báo cáo nhân viên      ›       │
│  🔁  Chuyển sang tài khoản thợ ›    │
│                                     │
│  ───────────────────────────────    │
│                                     │
│  🔒  Quản lý tài khoản      ›       │
│  🔑  Đổi mật khẩu           ›       │
│  🚪  Đăng xuất                      │
│                                     │
│  ───────────────────────────────    │
│                                     │
│  🗑️   Xóa tài khoản                 │ ← NEW (Red text)
│                                     │
│  Version 1.0.0 (Build 123)          │
└─────────────────────────────────────┘
```

---

### Screen 2: First Confirmation Dialog

```
┌─────────────────────────────────────┐
│                                     │
│     [Dimmed Background]             │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  Xóa tài khoản?             │   │
│   ├─────────────────────────────┤   │
│   │                             │   │
│   │  Hành động này không thể    │   │
│   │  hoàn tác. Tất cả dữ liệu   │   │
│   │  của bạn sẽ bị xóa vĩnh     │   │
│   │  viễn.                      │   │
│   │                             │   │
│   │  Dữ liệu sẽ bị xóa:         │   │
│   │    ❌ Thông tin cá nhân     │   │
│   │    ❌ Lịch sử công việc     │   │
│   │    ❌ Hình ảnh đã tải lên   │   │
│   │    ❌ Lịch sử check-in      │   │
│   │                             │   │
│   ├─────────────────────────────┤   │
│   │                             │   │
│   │   [Hủy]    [Tiếp tục]       │   │
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

### Screen 3: Final Confirmation Dialog

```
┌─────────────────────────────────────┐
│                                     │
│     [Dimmed Background]             │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  Xác nhận xóa tài khoản     │   │
│   ├─────────────────────────────┤   │
│   │                             │   │
│   │  Nhập "XÓA TÀI KHOẢN" để    │   │
│   │  xác nhận xóa tài khoản     │   │
│   │  vĩnh viễn.                 │   │
│   │                             │   │
│   │  ┌───────────────────────┐  │   │
│   │  │ XÓA TÀI KHOẢN         │  │   │ ← Input field
│   │  └───────────────────────┘  │   │
│   │                             │   │
│   │  ⚠️ Vui lòng nhập chính xác │   │ ← Error hint (if wrong)
│   │                             │   │
│   ├─────────────────────────────┤   │
│   │                             │   │
│   │   [Hủy]                     │   │
│   │   [Xóa tài khoản vĩnh viễn] │   │ ← Red, disabled until valid
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

### Screen 4: Deleting State

```
┌─────────────────────────────────────┐
│                                     │
│     [Dimmed Background]             │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  Xác nhận xóa tài khoản     │   │
│   ├─────────────────────────────┤   │
│   │                             │   │
│   │  Nhập "XÓA TÀI KHOẢN" để    │   │
│   │  xác nhận xóa tài khoản     │   │
│   │  vĩnh viễn.                 │   │
│   │                             │   │
│   │  ┌───────────────────────┐  │   │
│   │  │ XÓA TÀI KHOẢN         │  │   │ ← Input disabled
│   │  └───────────────────────┘  │   │
│   │                             │   │
│   ├─────────────────────────────┤   │
│   │                             │   │
│   │   [Hủy] (disabled)          │   │
│   │   [⏳ Đang xóa...]          │   │ ← Loading state
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

### Screen 5: Success Screen

```
┌─────────────────────────────────────┐
│                                     │
│     [Dimmed Background]             │
│                                     │
│   ┌─────────────────────────────┐   │
│   │                             │   │
│   │           ✅                │   │ ← Large green checkmark
│   │                             │   │
│   │    Tài khoản đã được xóa    │   │
│   │                             │   │
│   │  Cảm ơn bạn đã sử dụng      │   │
│   │  NV Internal                │   │
│   │                             │   │
│   │  Đang chuyển hướng...       │   │ ← Auto-redirect in 3s
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

### Screen 6: Sign-In (After Redirect)

```
┌─────────────────────────────────────┐
│                                     │
│        [Logo]                       │
│                                     │
│     Chào mừng đến NV Internal       │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Email                         │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Mật khẩu                      │  │
│  └───────────────────────────────┘  │
│                                     │
│     [Đăng nhập]                     │
│                                     │
│     Quên mật khẩu?                  │
│                                     │
└─────────────────────────────────────┘
```

---

## 🌍 Vietnamese Translations

### All UI Text

| English | Vietnamese |
|---------|-----------|
| Delete Account | Xóa tài khoản |
| Delete account permanently | Xóa tài khoản vĩnh viễn |
| Delete Account? | Xóa tài khoản? |
| Confirm Account Deletion | Xác nhận xóa tài khoản |
| This action cannot be undone | Hành động này không thể hoàn tác |
| All your data will be permanently deleted | Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn |
| Data to be deleted: | Dữ liệu sẽ bị xóa: |
| Personal information | Thông tin cá nhân |
| Task history | Lịch sử công việc |
| Uploaded photos | Hình ảnh đã tải lên |
| Check-in/check-out history | Lịch sử check-in/check-out |
| Cancel | Hủy |
| Continue | Tiếp tục |
| Type "DELETE ACCOUNT" to confirm | Nhập "XÓA TÀI KHOẢN" để xác nhận |
| Please type exactly: | Vui lòng nhập chính xác: |
| Deleting... | Đang xóa... |
| Account has been deleted | Tài khoản đã được xóa |
| Thank you for using NV Internal | Cảm ơn bạn đã sử dụng NV Internal |
| Redirecting... | Đang chuyển hướng... |
| Cannot delete account. Please try again. | Không thể xóa tài khoản. Vui lòng thử lại. |
| No network connection. Please check and try again. | Không có kết nối mạng. Vui lòng kiểm tra kết nối và thử lại. |
| Session expired. Please log in again. | Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại. |

---

## 🔒 Security Considerations

### Frontend Security

1. **Feature Flag Check**: Only show button when flag enabled (prevent unauthorized access)
2. **Two-Step Confirmation**: Prevent accidental deletion
3. **Text Input Validation**: Require exact phrase to proceed
4. **Disable During Loading**: Prevent duplicate submissions
5. **Token Cleanup**: Clear all auth tokens after deletion
6. **Local Data Cleanup**: Clear AsyncStorage and SecureStore

### API Integration

1. **Bearer Token Auth**: All API calls include Clerk JWT token
2. **Token Expiry Check**: Handle 401/403 errors gracefully
3. **Network Error Handling**: Retry mechanism, user-friendly errors
4. **Idempotent Endpoint**: Safe to retry if network fails mid-request

---

## 📈 Performance Considerations

### Optimizations

1. **Lazy Loading**: Dialogs only render when open
2. **Query Cache Clear**: Clear TanStack Query cache on success (reduce memory)
3. **Background Cleanup**: API handles photo deletion asynchronously (don't block UI)
4. **Auto-redirect Timer**: 3-second delay for user to read success message

### Bundle Size

- **New Components**: ~2-3 KB total (minimal impact)
- **New Hook**: ~1 KB
- **Dependencies**: All existing (no new libraries)

---

## 🐛 Potential Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Feature flag loads slowly** | Show skeleton/loading state while flag loads |
| **User backgrounds app during deletion** | API is idempotent, safe to retry on resume |
| **Network timeout during deletion** | Show error, allow retry, don't lose progress |
| **Clerk sign-out fails** | Still delete from our DB, log error, redirect anyway |
| **AsyncStorage clear fails** | Non-blocking, log error, continue with sign-out |
| **User regrets deletion** | (Future) Add 7-day grace period with undo option |

---

## 🚀 Deployment Checklist

### Before Merging PR

- [ ] All TypeScript errors resolved
- [ ] Biome lint/format passes
- [ ] All unit tests pass
- [ ] Component tests pass
- [ ] Manual QA completed on iOS simulator
- [ ] Manual QA completed on Android emulator
- [ ] Accessibility tested with VoiceOver
- [ ] Accessibility tested with TalkBack
- [ ] Feature flag tested (on/off)
- [ ] Error scenarios tested
- [ ] Backend API endpoint ready (PSN-12 completed)

### After Merging

- [ ] Feature flag set to `false` in PostHog production
- [ ] Test on TestFlight build
- [ ] Enable feature flag gradually (10% → 50% → 100%)
- [ ] Monitor PostHog analytics for deletion events
- [ ] Monitor Sentry for errors
- [ ] Update App Store Review notes with deletion instructions

---

## 📚 Related Documentation

- **Backend Implementation**: `.claude/specs/account-deletion-feature.md`
- **Linear Issue**: [PSN-13](https://linear.app/withdustin/issue/PSN-13/account-deletion)
- **Backend Issue**: [PSN-12](https://linear.app/withdustin/issue/PSN-12/account-deletion-backend)
- **Accessibility Pattern**: `docs/architecture/patterns/mobile-accessibility.md`
- **Feature Flags Guide**: `.claude/docs/feature-flags-guide.md`
- **App Store Guideline**: [5.1.1(v) Account Deletion](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage)

---

## 🎓 Key Learnings for Implementation

1. **Follow Existing Patterns**: Use established patterns from `user-settings-screen.tsx` (sign-out flow)
2. **Accessibility First**: Add all 4 required props from the start (don't retrofit later)
3. **Feature Flags**: Always gate new features behind flags for controlled rollout
4. **Vietnamese Language**: All user-facing text must be Vietnamese
5. **Error Handling**: Show user-friendly messages, log technical details
6. **Testing**: Test on real devices, not just simulators (haptics, performance)
7. **Code Quality**: Invoke `code-quality-enforcer` before committing

---

## ✅ Definition of Done

- [ ] All files created/modified as per plan
- [ ] Feature flag check implemented correctly
- [ ] Two-step confirmation flow works
- [ ] Text input validation works
- [ ] API integration successful
- [ ] Local data cleanup works
- [ ] Clerk sign-out works
- [ ] Success screen shows and auto-redirects
- [ ] Error handling covers all scenarios
- [ ] All 4 accessibility props on all interactive elements
- [ ] VoiceOver announces all content correctly
- [ ] TalkBack announces all content correctly
- [ ] Works on iOS simulator
- [ ] Works on Android emulator
- [ ] Works on physical iOS device
- [ ] Works on physical Android device
- [ ] Unit tests pass (>=80% coverage)
- [ ] Component tests pass
- [ ] Manual QA checklist completed
- [ ] No TypeScript errors
- [ ] Biome lint/format passes
- [ ] Code reviewed by senior engineer
- [ ] Documentation updated (this file + CLAUDE.md)

---

**Total Estimated Effort**: 10-12 hours (~1.5 days for 1 developer)

**Complexity**: Medium (follows existing patterns, but multi-step flow)

**Risk Level**: Low (feature flag controlled, follows Apple guidelines)

**Priority**: High (required for App Store approval)

---

**Created by**: Claude Code (2025-11-10)
**For**: Dương Đỗ (@duongdev)
**Last Updated**: 2025-11-10
