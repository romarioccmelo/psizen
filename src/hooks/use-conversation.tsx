import { useState, useCallback, useRef } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { useAudioPlayer } from '@/hooks/use-audio-player'
import { generateId } from '@/lib/utils'
import type { Message, InteractionStatus } from '@/lib/types'

const mockApiSendAudio = (
  audioBlob: Blob,
): Promise<{ text: string; audioUrl: string }> => {
  console.log('Simulating API call with audio blob:', audioBlob)
  return new Promise((resolve, reject) => {
    setTimeout(
      () => {
        if (Math.random() > 0.1) {
          resolve({
            text: 'Entendi. Conte-me mais sobre como você se sentiu com essa situação. Lembre-se que estou aqui para te ouvir sem julgamentos.',
            audioUrl:
              'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
          })
        } else {
          reject(
            new Error(
              'Falha na comunicação com o servidor. Por favor, tente novamente.',
            ),
          )
        }
      },
      2000 + Math.random() * 1500,
    )
  })
}

export const useConversation = () => {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial-message',
      sender: 'agent',
      text: 'Olá! Sou seu agente psicológico. Sinta-se à vontade para compartilhar o que estiver em sua mente. Pressione o microfone para começar a falar.',
      isLoading: false,
    },
  ])
  const [status, setStatus] = useState<InteractionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const lastAudioBlobRef = useRef<Blob | null>(null)

  const handlePlayStart = useCallback(() => setStatus('speaking'), [])
  const handlePlayEnd = useCallback(() => setStatus('idle'), [])

  const { playAudio, stopAudio } = useAudioPlayer(
    handlePlayStart,
    handlePlayEnd,
  )

  const sendAudio = useCallback(
    async (audioBlob: Blob) => {
      setStatus('processing')
      setError(null)
      lastAudioBlobRef.current = audioBlob

      const userMessageId = generateId()
      const agentMessageId = generateId()

      const userMessage: Message = {
        id: userMessageId,
        sender: 'user',
        text: '...',
        isLoading: true,
      }
      const agentLoadingMessage: Message = {
        id: agentMessageId,
        sender: 'agent',
        text: '',
        isLoading: true,
      }

      setMessages((prev) => [...prev, userMessage, agentLoadingMessage])

      try {
        const response = await mockApiSendAudio(audioBlob)
        const simulatedTranscript =
          'Eu tenho me sentido um pouco ansioso ultimamente.'

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === userMessageId)
              return { ...msg, text: simulatedTranscript, isLoading: false }
            if (msg.id === agentMessageId)
              return {
                ...msg,
                text: response.text,
                audioUrl: response.audioUrl,
                isLoading: false,
              }
            return msg
          }),
        )

        playAudio(response.audioUrl)
      } catch (e: any) {
        const errorMessage = e.message || 'Ocorreu um erro desconhecido.'
        setError(errorMessage)
        setStatus('error')
        toast({
          variant: 'destructive',
          title: 'Erro de Comunicação',
          description: errorMessage,
        })
        setMessages((prev) => {
          const withoutAgentLoading = prev.filter(
            (msg) => msg.id !== agentMessageId,
          )
          return withoutAgentLoading.map((msg) =>
            msg.id === userMessageId
              ? { ...msg, text: '(Falha ao enviar)', isLoading: false }
              : msg,
          )
        })
      }
    },
    [playAudio, toast],
  )

  const retryLastMessage = useCallback(() => {
    if (lastAudioBlobRef.current) {
      setMessages((prev) => {
        const lastUserMessageIndex = prev.findLastIndex(
          (m) => m.sender === 'user',
        )
        if (lastUserMessageIndex !== -1) {
          return prev.slice(0, lastUserMessageIndex)
        }
        return prev
      })
      sendAudio(lastAudioBlobRef.current)
    } else {
      toast({
        title: 'Nenhuma mensagem para tentar novamente',
        description: 'Não há áudio gravado recentemente para reenviar.',
      })
    }
  }, [sendAudio, toast])

  const clearConversation = useCallback(() => {
    stopAudio()
    setMessages([
      {
        id: 'initial-message-cleared',
        sender: 'agent',
        text: 'Sessão reiniciada. Como posso te ajudar hoje?',
        isLoading: false,
      },
    ])
    setStatus('idle')
    setError(null)
    lastAudioBlobRef.current = null
    toast({
      title: 'Conversa Limpa',
      description: 'O histórico da conversa foi apagado.',
    })
  }, [stopAudio, toast])

  const playAudioFromBubble = useCallback(
    (url: string) => {
      if (status === 'speaking') {
        stopAudio()
      }
      playAudio(url)
    },
    [status, playAudio, stopAudio],
  )

  return {
    messages,
    status,
    error,
    setStatus,
    sendAudio,
    playAudio: playAudioFromBubble,
    retryLastMessage,
    clearConversation,
  }
}
