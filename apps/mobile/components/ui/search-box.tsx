import { useRef, useState, type FC } from 'react';
import { Pressable, TextInput, TextInputProps, View } from 'react-native';
import { SearchIcon, XIcon } from 'lucide-react-native';
import { Icon } from './icon';
import { Button } from './button';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

export type SearchBoxProps = TextInputProps & {
  onChangeTextDebounced?: (text: string) => void;
  className?: string;
};

export const SearchBox: FC<SearchBoxProps> = ({
  value,
  onChangeText,
  onChangeTextDebounced,
  className,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [val, setVal] = useState(value ?? '');

  const handleTextChange = (text: string) => {
    setVal(text);
    onChangeText?.(text);
  };
  const handleClear = () => {
    handleTextChange('');
    inputRef.current?.focus();
  };

  useDebounce(
    () => {
      onChangeTextDebounced?.(val);
    },
    300,
    [val]
  );

  return (
    <Pressable
      className={cn('flex-row items-center gap-2 rounded-md bg-muted p-3', className)}
      onPress={() => inputRef.current?.focus()}>
      <Icon as={SearchIcon} className="size-5 shrink-0 text-muted-foreground" />
      <TextInput
        ref={inputRef}
        placeholder="Tìm kiếm..."
        className="flex-1"
        value={val}
        onChangeText={handleTextChange}
      />
      {val && (
        <Button variant={null} size={null} onPress={handleClear}>
          <Icon as={XIcon} className="size-5 shrink-0 text-muted-foreground" />
        </Button>
      )}
    </Pressable>
  );
};
