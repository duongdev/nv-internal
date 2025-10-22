import { ArrowUpIcon, ImagePlusIcon } from 'lucide-react-native'
import { type FC, useState } from 'react'
import { View } from 'react-native'
import { Button } from './ui/button'
import { Icon } from './ui/icon'
import { Text } from './ui/text'
import { Textarea } from './ui/textarea'

export type TaskCommentBoxProps = {
  taskId: number
  onCommentSent?: () => void
}

export const TaskCommentBox: FC<TaskCommentBoxProps> = ({
  taskId,
  onCommentSent,
}) => {
  const [commentText, setCommentText] = useState('')

  const handleSendComment = async () => {
    // TODO: Implement comment sending logic
    // This will create a new activity for the task
    console.log('Sending comment:', commentText, 'for task:', taskId)
    setCommentText('')
    onCommentSent?.()
  }

  const handleAddPhoto = () => {
    // TODO: Implement photo attachment for comments
    console.log('Add photo to comment')
  }

  return (
    <View className="gap-2">
      <Textarea
        className="!rounded-md !bg-background dark:!border-white/20"
        multiline
        numberOfLines={3}
        onChangeText={setCommentText}
        placeholder="Viết bình luận..."
        value={commentText}
      />
      <View className="flex-row justify-end gap-2">
        <Button
          className="dark:border-white/20"
          onPress={handleAddPhoto}
          size="sm"
          variant="outline"
        >
          <Icon as={ImagePlusIcon} />
          <Text>Thêm ảnh</Text>
        </Button>
        <Button
          disabled={!commentText.trim()}
          onPress={handleSendComment}
          size="sm"
        >
          <Icon as={ArrowUpIcon} className="text-primary-foreground" />
          <Text>Gửi</Text>
        </Button>
      </View>
    </View>
  )
}
