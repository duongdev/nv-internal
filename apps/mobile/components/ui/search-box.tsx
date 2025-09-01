import { SearchIcon, XIcon } from 'lucide-react-native'
import { type FC, useRef, useState } from 'react'
import { Pressable, TextInput, type TextInputProps } from 'react-native'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Icon } from './icon'

export type SearchBoxProps = TextInputProps & {
  onChangeTextDebounced?: (text: string) => void
  className?: string
}

export const SearchBox: FC<SearchBoxProps> = ({
  value,
  onChangeText,
  onChangeTextDebounced,
  className,
}) => {
  const inputRef = useRef<TextInput>(null)
  const [val, setVal] = useState(value ?? '')

  const handleTextChange = (text: string) => {
    setVal(text)
    onChangeText?.(text)
  }
  const handleClear = () => {
    handleTextChange('')
    onChangeTextDebounced?.('')
    inputRef.current?.focus()
  }

  useDebounce(
    () => {
      onChangeTextDebounced?.(val)
    },
    300,
    [val],
  )

  return (
    <Pressable
      className={cn(
        'flex-row items-center gap-2 rounded-md bg-muted p-3',
        className,
      )}
      onPress={() => inputRef.current?.focus()}
    >
      <Icon as={SearchIcon} className="size-5 shrink-0 text-muted-foreground" />
      <TextInput
        className="flex-1"
        onChangeText={handleTextChange}
        placeholder="Tìm kiếm..."
        ref={inputRef}
        value={val}
      />
      {val && (
        <Button onPress={handleClear} size={null} variant={null}>
          <Icon as={XIcon} className="size-5 shrink-0 text-muted-foreground" />
        </Button>
      )}
    </Pressable>
  )
}
