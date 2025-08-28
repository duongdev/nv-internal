import { useMemo, type FC, type ReactNode } from 'react';
import { Image, ImageProps } from 'react-native';
import { View } from 'react-native';
import { Text } from './text';
import { ILLUSTRATION_MAP } from '@/lib/illustrations';

const IMAGE_MAP = ILLUSTRATION_MAP;

export type EmptyStateProps = {
  image?: keyof typeof IMAGE_MAP;
  source?: ImageProps['source'];
  messageTitle?: string;
  messageDescription?: string;
  message?: ReactNode;
};

export const EmptyState: FC<EmptyStateProps> = ({
  image = 'laziness',
  source,
  message,
  messageDescription,
  messageTitle,
}) => {
  const msgEl = useMemo(() => {
    if (message) return message;
    return (
      <View className="items-center">
        <Text variant="h4">{messageTitle}</Text>
        <Text variant="muted">{messageDescription}</Text>
      </View>
    );
  }, [message, messageDescription, messageTitle]);

  return (
    <View className="flex-1 items-center">
      <Image source={source || IMAGE_MAP[image]} className="h-64 w-64 rounded-lg" />
      {msgEl}
    </View>
  );
};
