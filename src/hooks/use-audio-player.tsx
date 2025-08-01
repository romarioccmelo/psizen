import { useState, useCallback, useRef, useEffect } from 'react'

export const useAudioPlayer = (
  onPlayStart?: () => void,
  onPlayEnd?: () => void,
) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playAudio = useCallback(
    (url: string) => {
      if (audioRef.current) {
        audioRef.current.pause()
        // Detach old listeners to prevent memory leaks
        const oldAudio = audioRef.current
        oldAudio.onplay = null
        oldAudio.onended = null
        oldAudio.onpause = null
        oldAudio.onerror = null
      }

      const audio = new Audio(url)
      audioRef.current = audio

      const handlePlay = () => {
        setIsPlaying(true)
        onPlayStart?.()
      }

      const handleEnd = () => {
        setIsPlaying(false)
        onPlayEnd?.()
        // Clean up
        if (audioRef.current) {
          const currentAudio = audioRef.current
          currentAudio.onplay = null
          currentAudio.onended = null
          currentAudio.onpause = null
          currentAudio.onerror = null
          audioRef.current = null
        }
      }

      const handleError = (e: Event) => {
        console.error('Audio playback error', e)
        handleEnd() // Treat error as end of playback
      }

      // Assigning to properties is simpler than addEventListener for this case
      audio.onplay = handlePlay
      audio.onended = handleEnd
      audio.onpause = handleEnd // Also handle pause as end of "speaking" state
      audio.onerror = handleError

      audio.play().catch(handleError)
    },
    [onPlayStart, onPlayEnd],
  )

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [])

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return { isPlaying, playAudio, stopAudio }
}
