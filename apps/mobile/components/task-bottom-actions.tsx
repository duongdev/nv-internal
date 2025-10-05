import BottomSheet, {
  type BottomSheetBackgroundProps,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { ArrowUpIcon, ImagePlusIcon } from 'lucide-react-native'
import { type FC, useRef } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import type { TextInput } from 'react-native-gesture-handler'
import { useColorPalette } from '@/hooks/use-color-palette'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Icon } from './ui/icon'
import { Text } from './ui/text'

export type TaskBottomActionsProps = {}

export const TaskBottomActions: FC<TaskBottomActionsProps> = () => {
  const { getColor } = useColorPalette()
  const inputRef = useRef<TextInput>(null)

  return (
    <BottomSheet
      backgroundComponent={BackgroundView}
      handleIndicatorStyle={{ backgroundColor: getColor('foreground') }}
      index={0}
      keyboardBlurBehavior="restore"
      snapPoints={['10%']}
      style={styles.shadowContainer}
    >
      <BottomSheetView>
        <View>
          <Pressable
            className={cn('gap-2 bg-back px-3 pt-2 pb-safe dark:bg-background')}
            onPress={() => inputRef.current?.focus()}
          >
            <BottomSheetTextInput
              className="min-h-[100px] flex-1 bg-transparent text-base text-foreground"
              multiline
              numberOfLines={4}
              placeholder="Viết bình luận..."
              placeholderTextColor={getColor('mutedForeground')}
              ref={inputRef}
              selectionColor={getColor('primary')}
            />
            <View className="flex-row items-center justify-end gap-2 border-t border-t-border pt-2">
              <Button className="dark:bg-secondary" size="sm" variant="outline">
                <Icon as={ImagePlusIcon} />
                <Text>Thêm ảnh</Text>
              </Button>
              {/* <View className="flex-1" /> */}
              <Button size="sm" variant="default">
                <Icon as={ArrowUpIcon} className="text-primary-foreground" />
                <Text className="text-primary-foreground">Gửi</Text>
              </Button>
            </View>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheet>
  )
}

const BackgroundView = (props: BottomSheetBackgroundProps) => (
  <View
    className="overflow-hidden rounded-xl bg-background dark:bg-secondary"
    {...props}
  />
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 200,
    backgroundColor: '#F5FCFF',
  },
  contentContainer: {
    padding: 16,
  },
  shadowContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // For Android
  },
})
