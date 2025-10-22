import type { VideoPlayer } from 'expo-video'
import { useVideoPlayer, VideoView } from 'expo-video'
import { PlayIcon } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import type { Attachment } from '@/api/attachment/use-attachments'
import { Icon } from './ui/icon'

interface AttachmentViewerVideoProps {
  attachment: Attachment
}

export function AttachmentViewerVideo({
  attachment,
}: AttachmentViewerVideoProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)

  const player = useVideoPlayer(attachment.url, (player: VideoPlayer) => {
    player.loop = false
    player.muted = false
  })

  useEffect(() => {
    // Listen to player status changes
    const subscription = player.addListener('statusChange', (status) => {
      setIsLoading(status.status === 'loading')
    })

    return () => {
      subscription.remove()
    }
  }, [player])

  const handlePlayPress = () => {
    setHasStarted(true)
    player.play()
  }

  return (
    <View className="h-full w-full items-center justify-center bg-black">
      <VideoView
        className="h-full w-full"
        contentFit="contain"
        fullscreenOptions={{
          enable: true,
        }}
        nativeControls={hasStarted}
        player={player}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View className="absolute inset-0 items-center justify-center">
          <ActivityIndicator color="#ffffff" size="large" />
        </View>
      )}

      {/* Play button overlay - shown before video starts */}
      {!hasStarted && !isLoading && (
        <Pressable
          className="absolute inset-0 items-center justify-center"
          onPress={handlePlayPress}
        >
          <View className="rounded-full bg-white/20 p-6">
            <Icon as={PlayIcon} className="text-white" size={48} />
          </View>
        </Pressable>
      )}
    </View>
  )
}
