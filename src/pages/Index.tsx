import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Copy, AlertTriangle, Trash2, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AnimatedCircle } from '@/components/AnimatedCircle'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { useConversationContext } from '@/contexts/ConversationContext'
import { MessageBubble } from '@/components/MessageBubble'
import { ScrollArea } from '@/components/ui/scroll-area'

const Index = () => {
  const {
    messages,
    status,
    error,
    setStatus,
    sendAudio,
    playAudio,
    retryLastMessage,
    clearConversation,
  } = useConversationContext()

  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getPermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      return true
    } catch (err) {
      console.error('Error getting microphone permission:', err)
      setStatus('error')
      return false
    }
  }, [setStatus])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        })
        await sendAudio(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setStatus('recording')
    } catch (err) {
      console.error('Error starting recording:', err)
      setStatus('error')
      setIsRecording(false)
    }
  }, [sendAudio, setStatus])

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [])

  const handleMicClick = async () => {
    if (isRecording) {
      stopRecording()
    } else {
      const hasPermission = await getPermission()
      if (hasPermission) {
        startRecording()
      }
    }
  }

  const renderErrorMessage = () => {
    if (status === 'error' && error) {
      return (
        <Alert
          variant="destructive"
          className="mt-4 max-w-md mx-auto animate-fade-in-up"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ocorreu um Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={retryLastMessage}>
              <RotateCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </Alert>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col h-full w-full items-center justify-between p-4 space-y-4 bg-background">
      {/* Círculo sempre visível no centro */}
      <div className="flex-grow flex flex-col items-center justify-center w-full">
        <AnimatedCircle status={status} />
        {renderErrorMessage()}
      </div>

      {/* Botão de microfone na parte inferior */}
      <div className="w-full max-w-2xl flex flex-col items-center space-y-4">
        <div className="flex items-center gap-4">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearConversation}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            className={cn(
              'w-16 h-16 md:w-20 md:h-20 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 border-2',
              status === 'recording'
                ? 'border-secondary text-secondary hover:bg-secondary/10'
                : 'border-primary text-primary hover:bg-primary/10',
            )}
            onClick={handleMicClick}
            disabled={status === 'processing' || status === 'speaking'}
          >
            <Mic className="h-8 w-8 md:h-10 md:w-10" />
          </Button>
          {messages.length > 0 && <div className="w-10" />}
        </div>
      </div>
    </div>
  )
}

export default Index
