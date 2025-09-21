import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { type ReactNode, useRef } from 'react'
import { Pressable } from 'react-native'
import { BottomSheet } from './bottom-sheet'

export type InlineEditableBottomSheetProps = {
  trigger: ReactNode
  bottomSheetContent: ReactNode
  onClose?: () => void
  snapPoints?: (string | number)[]
}

export function InlineEditableBottomSheet({
  trigger,
  bottomSheetContent,
  onClose,
  snapPoints = ['50%', '90%'],
}: InlineEditableBottomSheetProps) {
  const ref = useRef<BottomSheetModal>(null)

  const handleClose = async () => {
    if (onClose) {
      onClose()
    }
    ref.current?.dismiss()
  }

  return (
    <>
      <Pressable
        className="-mx-1 rounded px-1 active:bg-muted"
        onPress={() => {
          impactAsync(ImpactFeedbackStyle.Light)
          ref.current?.present()
        }}
      >
        {trigger}
      </Pressable>
      <BottomSheet
        containerStyle={{ flex: 1 }}
        enableDynamicSizing={false}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        onChange={(index) => {
          if (index === -1) {
            handleClose()
          }
        }}
        ref={ref}
        snapPoints={snapPoints}
      >
        {bottomSheetContent}
      </BottomSheet>
    </>
  )
}
