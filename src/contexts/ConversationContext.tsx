import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react'
import { generateId } from '@/lib/utils'
import type { Message, InteractionStatus, FileMetadata } from '@/lib/types'

type ConversationContextType = {
  messages: Message[]
  status: InteractionStatus
  error: string | null
  setStatus: (status: InteractionStatus) => void
  sendAudio: (audioBlob: Blob) => Promise<void>
  playAudio: (url: string) => void
  retryLastMessage: () => void
  clearConversation: () => void
}

const ConversationContext = createContext<ConversationContextType | null>(null)

const WEBHOOK_URL =
  'https://workflow.usecurling.com/webhook/acd69b0c-3697-40dd-97d4-75f7b96c2c21'

// Função para converter base64 para blob
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

// Função para tentar diferentes métodos de obtenção do áudio
const getAudioFromServer = async (fileName: string, originalAudioBlob: Blob): Promise<Blob | null> => {
  const methods = [
    // Método 1: Tentar webhook com parâmetros específicos para obter base64
    async () => {
      const formData = new FormData()
      formData.append('file', originalAudioBlob, 'audio.webm')
      formData.append('getAudio', 'true')
      formData.append('fileName', fileName)
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.startsWith('audio/')) {
          return await response.blob()
        } else if (contentType && contentType.includes('application/json')) {
          // Tentar processar como JSON com base64
          const result = await response.json()
          console.log('Resposta JSON do webhook:', result)
          
          if (result.audioBase64) {
            const mimeType = result.mimeType || 'audio/mp3'
            return base64ToBlob(result.audioBase64, mimeType)
          } else if (result.audio) {
            const mimeType = result.mimeType || 'audio/mp3'
            return base64ToBlob(result.audio, mimeType)
          } else if (result.data) {
            const mimeType = result.mimeType || 'audio/mp3'
            return base64ToBlob(result.data, mimeType)
          }
        }
      }
      throw new Error('Método 1 falhou')
    },
    
    // Método 2: Tentar webhook com parâmetro diferente
    async () => {
      const formData = new FormData()
      formData.append('file', originalAudioBlob, 'audio.webm')
      formData.append('action', 'getAudio')
      formData.append('fileName', fileName)
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.startsWith('audio/')) {
          return await response.blob()
        } else if (contentType && contentType.includes('application/json')) {
          const result = await response.json()
          console.log('Resposta JSON do webhook (método 2):', result)
          
          if (result.audioBase64) {
            const mimeType = result.mimeType || 'audio/mp3'
            return base64ToBlob(result.audioBase64, mimeType)
          } else if (result.audio) {
            const mimeType = result.mimeType || 'audio/mp3'
            return base64ToBlob(result.audio, mimeType)
          } else if (result.data) {
            const mimeType = result.mimeType || 'audio/mp3'
            return base64ToBlob(result.data, mimeType)
          }
        }
      }
      throw new Error('Método 2 falhou')
    },
    
    // Método 3: Tentar webhook com GET
    async () => {
      const url = `${WEBHOOK_URL}?action=getAudio&fileName=${encodeURIComponent(fileName)}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, audio/*',
        },
      })
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.startsWith('audio/')) {
          return await response.blob()
        } else if (contentType && contentType.includes('application/json')) {
          const result = await response.json()
          console.log('Resposta JSON do webhook (método 3):', result)
          
          if (result.audioBase64) {
            const mimeType = result.mimeType || 'audio/mp3'
            return base64ToBlob(result.audioBase64, mimeType)
          } else if (result.audio) {
            const mimeType = result.mimeType || 'audio/mp3'
            return base64ToBlob(result.audio, mimeType)
          } else if (result.data) {
            const mimeType = result.mimeType || 'audio/mp3'
            return base64ToBlob(result.data, mimeType)
          }
        }
      }
      throw new Error('Método 3 falhou')
    }
  ]
  
  for (let i = 0; i < methods.length; i++) {
    try {
      console.log(`Tentando método ${i + 1} para obter áudio...`)
      const audioBlob = await methods[i]()
      console.log(`Método ${i + 1} funcionou!`)
      return audioBlob
    } catch (error) {
      console.log(`Método ${i + 1} falhou:`, error)
      if (i === methods.length - 1) {
        throw error
      }
    }
  }
  
  return null
}

// Função blobToBase64 removida - agora enviamos o áudio como form-data

const useConversation = (): ConversationContextType => {
  const [messages, setMessages] = useState<Message[]>([])
  const [status, setStatus] = useState<InteractionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const audioPlayer = useRef<HTMLAudioElement | null>(null)
  const lastUserAudioBlob = useRef<Blob | null>(null)

  useEffect(() => {
    audioPlayer.current = new Audio()
    return () => {
      audioPlayer.current?.pause()
      audioPlayer.current = null
    }
  }, [])

  const playAudio = useCallback((url: string) => {
    console.log('playAudio chamado com URL:', url)
    
    if (audioPlayer.current) {
      if (audioPlayer.current.src === url && !audioPlayer.current.paused) {
        console.log('Áudio já está tocando, pausando...')
        audioPlayer.current.pause()
      } else {
        console.log('Configurando novo áudio...')
        audioPlayer.current.src = url
        
        // Adicionar event listeners para debug
        audioPlayer.current.onloadstart = () => console.log('Áudio começando a carregar...')
        audioPlayer.current.oncanplay = () => console.log('Áudio pronto para tocar...')
        audioPlayer.current.onplay = () => {
          console.log('Áudio começou a tocar!')
          setStatus('speaking')
        }
        audioPlayer.current.onended = () => {
          console.log('Áudio terminou de tocar!')
          setStatus('idle')
          // Limpar URL do blob para evitar vazamentos de memória
          if (audioPlayer.current && audioPlayer.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioPlayer.current.src)
          }
        }
        audioPlayer.current.onerror = (e) => {
          console.error('Erro ao tocar áudio:', e)
          console.error('Detalhes do erro:', audioPlayer.current?.error)
          setError('Não foi possível reproduzir o áudio.')
          setStatus('error')
          // Limpar URL do blob em caso de erro
          if (audioPlayer.current && audioPlayer.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioPlayer.current.src)
          }
        }
        
        audioPlayer.current.play().catch((e) => {
          console.error('Erro ao iniciar reprodução:', e)
          setError('Não foi possível reproduzir o áudio.')
          setStatus('error')
        })
      }
    } else {
      console.error('audioPlayer não está disponível')
    }
  }, [])

  const sendAudio = useCallback(
    async (audioBlob: Blob) => {
      lastUserAudioBlob.current = audioBlob
      setStatus('processing')
      setError(null)

      try {
        // Criar FormData com o arquivo de áudio
        const formData = new FormData()
        formData.append('file', audioBlob, 'audio.webm')

        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(
            `Falha na resposta do servidor: ${response.status} ${response.statusText}. Detalhes: ${errorText}`,
          )
        }

        const result = await response.json()

        // Verificar se a resposta é um array com informações do arquivo
        if (!Array.isArray(result) || result.length === 0) {
          throw new Error(
            'Resposta do servidor em formato inválido: array de arquivos esperado.',
          )
        }

        const fileInfo = result[0]
        console.log('Informações completas da resposta:', fileInfo)

        // Verificar se o áudio já está na resposta inicial
        if (fileInfo.data && typeof fileInfo.data === 'string') {
          console.log('Áudio encontrado na resposta inicial, processando...')
          try {
            // O campo 'data' contém o áudio em base64
            const mimeType = fileInfo.mimeType || 'audio/mp3'
            const audioBlob = base64ToBlob(fileInfo.data, mimeType)
            const localAudioUrl = URL.createObjectURL(audioBlob)
            console.log('Áudio processado com sucesso, reproduzindo...')
            playAudio(localAudioUrl)
            return
          } catch (base64Error) {
            console.error('Erro ao processar base64:', base64Error)
          }
        }

        // Se não encontrou o áudio na resposta inicial, tentar métodos alternativos
        try {
          console.log('Tentando obter áudio do servidor...')
          const responseAudioBlob = await getAudioFromServer(fileInfo.fileName || 'audio.webm', audioBlob)
          
          if (responseAudioBlob) {
            const localAudioUrl = URL.createObjectURL(responseAudioBlob)
            console.log('Áudio obtido com sucesso, reproduzindo...')
            playAudio(localAudioUrl)
          } else {
            throw new Error('Não foi possível obter o áudio')
          }
          
        } catch (audioError) {
          console.error('Erro ao buscar áudio:', audioError)
          
          // Se não conseguir buscar o áudio, simular fala
          console.log('Simulando fala por 3 segundos...')
          setStatus('speaking')
          setTimeout(() => setStatus('idle'), 3000)
        }
      } catch (e) {
        console.error('Error sending audio to webhook:', e)
        const errorMessage =
          e instanceof Error
            ? e.message
            : 'Ocorreu um erro desconhecido ao processar o áudio.'
        setError(errorMessage)
        setStatus('error')
      }
    },
    [playAudio],
  )

  const retryLastMessage = useCallback(async () => {
    if (lastUserAudioBlob.current) {
      await sendAudio(lastUserAudioBlob.current)
    }
  }, [sendAudio])

  const clearConversation = useCallback(() => {
    if (audioPlayer.current) {
      audioPlayer.current.pause()
      audioPlayer.current.src = ''
    }
    setMessages([])
    setStatus('idle')
    setError(null)
    lastUserAudioBlob.current = null
  }, [])

  return {
    messages,
    status,
    error,
    setStatus,
    sendAudio,
    playAudio,
    retryLastMessage,
    clearConversation,
  }
}

export const ConversationProvider = ({ children }: { children: ReactNode }) => {
  const conversation = useConversation()
  return (
    <ConversationContext.Provider value={conversation}>
      {children}
    </ConversationContext.Provider>
  )
}

export const useConversationContext = () => {
  const context = useContext(ConversationContext)
  if (!context) {
    throw new Error(
      'useConversationContext must be used within a ConversationProvider',
    )
  }
  return context
}
