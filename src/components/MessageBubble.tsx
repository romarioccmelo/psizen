import { Play, FileText } from 'lucide-react'
import { cn, formatFileSize } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Message, FileMetadata } from '@/lib/types'

interface MessageBubbleProps {
  message: Message
  onPlayAudio: (url: string) => void
}

const FileAttachment = ({ file }: { file: FileMetadata }) => (
  <div className="mt-2 flex items-center gap-3 rounded-md border border-border bg-background/50 p-2 text-sm">
    <FileText className="h-5 w-5 shrink-0 text-primary" />
    <div className="flex-grow overflow-hidden">
      <p className="font-medium truncate">{file.fileName}</p>
      <p className="text-xs text-muted-foreground">
        {formatFileSize(file.fileSize)}
      </p>
    </div>
  </div>
)

export const MessageBubble = ({ message, onPlayAudio }: MessageBubbleProps) => {
  const isUser = message.sender === 'user'

  return (
    <div
      className={cn(
        'flex w-full animate-fade-in-up',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'max-w-[90%] md:max-w-[70%] rounded-lg px-4 py-3 text-sm md:text-base',
          isUser
            ? 'bg-user-bubble text-foreground rounded-br-none'
            : 'bg-agent-bubble text-foreground rounded-bl-none',
        )}
      >
        <div className="flex items-center gap-3">
          {message.isLoading ? (
            <div className="loading-dots text-muted-foreground" />
          ) : (
            <p className="whitespace-pre-wrap flex-grow">{message.text}</p>
          )}
          {!isUser && message.audioUrl && !message.isLoading && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-foreground/80 hover:text-foreground"
              onClick={() => onPlayAudio(message.audioUrl!)}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
        </div>
        {message.files && message.files.length > 0 && (
          <div className="mt-2 space-y-2 border-t border-border/50 pt-2">
            {message.files.map((file) => (
              <FileAttachment key={file.fileName} file={file} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
