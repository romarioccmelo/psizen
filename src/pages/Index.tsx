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
  const [isSupported, setIsSupported] = useState(true)
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

  // Verificar compatibilidade do navegador
  useEffect(() => {
    const checkSupport = () => {
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      const hasMediaRecorder = !!window.MediaRecorder
      const hasAudioContext = !!window.AudioContext
      
      if (!hasMediaDevices || !hasMediaRecorder || !hasAudioContext) {
        setIsSupported(false)
        toast({
          variant: 'destructive',
          title: 'Navegador não suportado',
          description: 'Seu navegador não suporta gravação de áudio. Use Chrome, Firefox ou Safari.',
        })
        return false
      }
      return true
    }

    checkSupport()
  }, [toast])

  const getPermission = useCallback(async () => {
    try {
      // Verificar se já temos permissão
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      })
      
      // Parar o stream imediatamente após verificar permissão
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (err) {
      console.error('Error getting microphone permission:', err)
      
      let errorMessage = 'Não foi possível acessar o microfone.'
      
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
            errorMessage = 'Permissão para microfone foi negada. Por favor, permita o acesso ao microfone nas configurações do seu navegador.'
            break
          case 'NotFoundError':
            errorMessage = 'Nenhum microfone encontrado. Verifique se há um microfone conectado.'
            break
          case 'NotSupportedError':
            errorMessage = 'Seu navegador não suporta gravação de áudio.'
            break
          default:
            errorMessage = `Erro de permissão: ${err.message}`
        }
      }
      
      toast({
        variant: 'destructive',
        title: 'Erro de Microfone',
        description: errorMessage,
      })
      
      setStatus('error')
      return false
    }
  }, [setStatus, toast])

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
    <div className="flex flex-col min-h-screen w-full bg-background">
      {/* Círculo centralizado */}
      <div className="flex flex-col items-center justify-center p-4 pt-20">
        <AnimatedCircle status={status} />
        {renderErrorMessage()}
      </div>

      {/* Botão de microfone na parte inferior */}
      <div className="w-full p-4 pb-50 mt-auto">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
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
                'w-16 h-16 md:w-20 md:h-20 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 border-2 touch-manipulation',
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
    </div>
  )
}

export default Index
