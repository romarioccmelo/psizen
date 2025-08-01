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
  forceUserInteraction: () => void
}

const ConversationContext = createContext<ConversationContextType | null>(null)

const WEBHOOK_URL =
  'https://workflow.usecurling.com/webhook/acd69b0c-3697-40dd-97d4-75f7b96c2c21'

// Função melhorada para converter base64 para blob
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  try {
    // Remover possíveis prefixos de data URL
    const base64Data = base64.replace(/^data:audio\/[^;]+;base64,/, '')
    
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    
    // Verificar se o MIME type é suportado no mobile
    const supportedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm']
    const finalMimeType = supportedTypes.includes(mimeType) ? mimeType : 'audio/mp3'
    
    console.log('Criando blob com MIME type:', finalMimeType)
    return new Blob([byteArray], { type: finalMimeType })
  } catch (error) {
    console.error('Erro ao converter base64 para blob:', error)
    throw new Error('Formato de áudio inválido')
  }
}

// Função para verificar compatibilidade de áudio
const checkAudioSupport = () => {
  const audio = new Audio()
  const supportedTypes = [
    'audio/mp3',
    'audio/mpeg', 
    'audio/wav',
    'audio/ogg',
    'audio/webm'
  ]
  
  const supported = supportedTypes.filter(type => {
    try {
      return audio.canPlayType(type) !== ''
    } catch {
      return false
    }
  })
  
  console.log('Formatos de áudio suportados:', supported)
  return supported
}

// Função para tentar diferentes métodos de obtenção do áudio
const getAudioFromServer = async (fileName: string, originalAudioBlob: Blob): Promise<Blob | null> => {
  const supportedTypes = checkAudioSupport()
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
  const [needsAudioPermission, setNeedsAudioPermission] = useState(false)
  const audioPlayer = useRef<HTMLAudioElement | null>(null)
  const lastUserAudioBlob = useRef<Blob | null>(null)
  const pendingAudioUrl = useRef<string | null>(null)

  useEffect(() => {
    audioPlayer.current = new Audio()
    
    // Configurar para mobile
    audioPlayer.current.preload = 'auto'
    audioPlayer.current.crossOrigin = 'anonymous'
    
    // Marcar que o usuário interagiu quando tocar na tela
    const handleUserInteraction = async () => {
      console.log('Usuário interagiu com a página')
      
      try {
        // Tentar reproduzir um áudio silencioso para ativar o contexto
        const silentAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeQ==')
        silentAudio.volume = 0
        await silentAudio.play()
        console.log('Contexto de áudio ativado com sucesso!')
      } catch (error) {
        console.log('Não foi possível ativar contexto de áudio:', error)
      }
      
      setNeedsAudioPermission(false)
      // Remover os listeners após a primeira interação
      document.removeEventListener('touchstart', handleUserInteraction)
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
      
      // Se há um áudio pendente, tentar reproduzir
      if (pendingAudioUrl.current) {
        console.log('Tentando reproduzir áudio pendente após interação:', pendingAudioUrl.current)
        setTimeout(() => {
          playAudio(pendingAudioUrl.current!)
          pendingAudioUrl.current = null
        }, 200)
      }
    }
    
    // Adicionar listeners para detectar interação do usuário
    document.addEventListener('touchstart', handleUserInteraction, { once: true })
    document.addEventListener('click', handleUserInteraction, { once: true })
    document.addEventListener('keydown', handleUserInteraction, { once: true })
    
    return () => {
      audioPlayer.current?.pause()
      audioPlayer.current = null
      document.removeEventListener('touchstart', handleUserInteraction)
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
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
        
        // Limpar URL anterior se for blob
        if (audioPlayer.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioPlayer.current.src)
        }
        
        audioPlayer.current.src = url
        
        // Adicionar event listeners para debug
        audioPlayer.current.onloadstart = () => console.log('Áudio começando a carregar...')
        audioPlayer.current.oncanplay = () => console.log('Áudio pronto para tocar...')
        audioPlayer.current.oncanplaythrough = () => console.log('Áudio pode tocar completamente...')
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
          console.error('Código do erro:', audioPlayer.current?.error?.code)
          console.error('Mensagem do erro:', audioPlayer.current?.error?.message)
          
          // Criar mensagem de erro detalhada
          let errorMessage = 'Não foi possível reproduzir o áudio.'
          
          if (audioPlayer.current?.error) {
            const error = audioPlayer.current.error
            switch (error.code) {
              case MediaError.MEDIA_ERR_ABORTED:
                errorMessage = 'Reprodução foi interrompida pelo usuário.'
                break
              case MediaError.MEDIA_ERR_NETWORK:
                errorMessage = 'Erro de rede ao carregar o áudio.'
                break
              case MediaError.MEDIA_ERR_DECODE:
                errorMessage = 'Formato de áudio não suportado pelo navegador.'
                break
              case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = 'Fonte de áudio não suportada.'
                break
              default:
                errorMessage = `Erro de áudio: ${error.message || 'Erro desconhecido'}`
            }
          }
          
          setError(errorMessage)
          setStatus('error')
          // Limpar URL do blob em caso de erro
          if (audioPlayer.current && audioPlayer.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioPlayer.current.src)
          }
        }
        
        // Tentar reproduzir com tratamento de erro melhorado
        const playPromise = audioPlayer.current.play()
        
        if (playPromise !== undefined) {
          playPromise.catch((e) => {
            console.error('Erro ao iniciar reprodução:', e)
            console.error('Tipo de erro:', e.name)
            console.error('Mensagem:', e.message)
            
            if (e.name === 'NotAllowedError') {
              setError('Toque na tela primeiro para permitir reprodução de áudio.')
              setStatus('error')
              // Guardar a URL para tentar reproduzir depois
              pendingAudioUrl.current = url
              return
            }
            
            // Tentar reproduzir novamente após um delay (comum em mobile)
            setTimeout(() => {
              if (audioPlayer.current) {
                audioPlayer.current.play().catch((retryError) => {
                  console.error('Erro na segunda tentativa:', retryError)
                  if (retryError.name === 'NotAllowedError') {
                    setError('Toque na tela primeiro para permitir reprodução de áudio.')
                    pendingAudioUrl.current = url
                  } else {
                    setError(`Falha na reprodução: ${retryError.name} - ${retryError.message}`)
                  }
                  setStatus('error')
                })
              }
            }, 100)
          })
        }
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
        console.log('Tipo de dados:', typeof fileInfo.data)
        console.log('Tamanho dos dados:', fileInfo.data ? fileInfo.data.length : 'undefined')
        console.log('MIME type:', fileInfo.mimeType)

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
            setError(`Erro ao processar áudio: ${base64Error instanceof Error ? base64Error.message : 'Erro desconhecido'}`)
            setStatus('error')
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
          
          // Mostrar erro específico
          const errorMessage = audioError instanceof Error 
            ? audioError.message 
            : 'Erro desconhecido ao buscar áudio'
          
          setError(`Erro ao buscar áudio: ${errorMessage}`)
          setStatus('error')
          
          // Se não conseguir buscar o áudio, simular fala após 3 segundos
          setTimeout(() => {
            console.log('Simulando fala por 3 segundos...')
            setStatus('speaking')
            setTimeout(() => setStatus('idle'), 3000)
          }, 3000)
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
    pendingAudioUrl.current = null
  }, [])

  // Função para forçar interação do usuário
  const forceUserInteraction = useCallback(async () => {
    console.log('Forçando interação do usuário...')
    
    if (!audioPlayer.current) {
      console.error('AudioPlayer não está disponível')
      return
    }
    
    try {
      // Criar um áudio de teste silencioso para "despertar" o contexto de áudio
      const silentAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccDDuO1fPOeQ==')
      silentAudio.volume = 0
      
      console.log('Tentando reproduzir áudio silencioso para ativar contexto...')
      await silentAudio.play()
      console.log('Áudio silencioso reproduzido com sucesso!')
      
      // Marcar que o usuário interagiu
      setNeedsAudioPermission(false)
      setError(null)
      setStatus('idle')
      
      // Se há um áudio pendente, tentar reproduzir
      if (pendingAudioUrl.current) {
        console.log('Tentando reproduzir áudio pendente:', pendingAudioUrl.current)
        setTimeout(() => {
          playAudio(pendingAudioUrl.current!)
          pendingAudioUrl.current = null
        }, 200)
      }
      
    } catch (error) {
      console.error('Erro ao forçar interação:', error)
      
      // Fallback: apenas marcar como interagido e tentar reproduzir
      setNeedsAudioPermission(false)
      setError(null)
      setStatus('idle')
      
      if (pendingAudioUrl.current) {
        console.log('Fallback: Tentando reproduzir áudio pendente:', pendingAudioUrl.current)
        setTimeout(() => {
          playAudio(pendingAudioUrl.current!)
          pendingAudioUrl.current = null
        }, 200)
      }
    }
  }, [playAudio])

  return {
    messages,
    status,
    error,
    setStatus,
    sendAudio,
    playAudio,
    retryLastMessage,
    clearConversation,
    forceUserInteraction,
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
