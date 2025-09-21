import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
  BottomSheetModal,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet'
import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { forwardRef, useCallback } from 'react'
import { View } from 'react-native'
import { FullWindowOverlay } from 'react-native-screens'
import { useColorPalette } from '@/hooks/use-color-palette'
import { Toasts } from './toasts'

export const BottomSheet = forwardRef<
  BottomSheetModalMethods,
  BottomSheetModalProps
>((props, ref) => {
  const { getColor } = useColorPalette()

  const backdropComponent = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        enableTouchThrough
        opacity={0.8}
      />
    ),
    [],
  )

  const containerComponent = useCallback(
    (props: { children?: React.ReactNode }) => (
      <FullWindowOverlay>
        {props.children}
        <Toasts />
      </FullWindowOverlay>
    ),
    [],
  )

  const backgroundComponent = useCallback(
    (props: BottomSheetBackgroundProps) => (
      <View className="overflow-hidden rounded-xl bg-background" {...props} />
    ),
    [],
  )

  return (
    <BottomSheetModal
      backdropComponent={backdropComponent}
      backgroundComponent={backgroundComponent}
      containerComponent={containerComponent}
      enableDismissOnClose
      enablePanDownToClose
      handleIndicatorStyle={{ backgroundColor: getColor('foreground') }}
      keyboardBehavior="extend"
      ref={ref}
      {...props}
    />
  )
})
