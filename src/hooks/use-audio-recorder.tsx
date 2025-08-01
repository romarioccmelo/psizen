import { useState, useRef } from 'react'
import { useToast } from '@/components/ui/use-toast'

export const useAudioRecorder = () => {
  const { toast } = useToast()
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const getPermission = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        toast({
          variant: 'destructive',
          title: 'Erro de Gravação',
          description:
            'Seu navegador não suporta gravação de áudio. Tente usar um navegador moderno como Chrome ou Firefox.',
        })
        return false
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      return true
    } catch (error) {
      console.error('Error getting microphone permission:', error)
      let description =
        'Não foi possível acessar o microfone. Verifique as permissões do seu navegador.'
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        description =
          'Permissão para usar o microfone foi negada. Por favor, habilite nas configurações do seu navegador.'
      } else if (
        error instanceof DOMException &&
        error.name === 'NotFoundError'
      ) {
        description =
          'Nenhum microfone encontrado. Por favor, conecte um microfone e tente novamente.'
      }
      toast({
        variant: 'destructive',
        title: 'Permissão Negada',
        description,
      })
      return false
    }
  }

  const startRecording = async () => {
    if (isRecording) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstart = () => {
        setIsRecording(true)
      }

      recorder.start()
    } catch (error) {
      console.error('Failed to start recording:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao Gravar',
        description: 'Não foi possível iniciar a gravação. Tente novamente.',
      })
      throw error
    }
  }

  const stopRecording = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null)
        return
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        })
        audioChunksRef.current = []
        setIsRecording(false)
        mediaRecorderRef.current?.stream
          .getTracks()
          .forEach((track) => track.stop())
        mediaRecorderRef.current = null
        resolve(audioBlob.size > 0 ? audioBlob : null)
      }

      mediaRecorderRef.current.stop()
    })
  }

  return { isRecording, getPermission, startRecording, stopRecording }
}
