import { cn } from '@/lib/utils'
import type { InteractionStatus } from '@/lib/types'

interface AnimatedCircleProps {
  status: InteractionStatus
}

const Waveform = () => (
  <div className="waveform">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="waveform-bar" />
    ))}
  </div>
)

export const AnimatedCircle = ({ status }: AnimatedCircleProps) => {
  const baseClasses =
    'relative w-[250px] h-[250px] md:w-[300px] md:h-[300px] rounded-full transition-all duration-300 ease-in-out flex items-center justify-center'

  return (
    <div
      className={cn(baseClasses, 'bg-gradient-radial-blue-light', {
        'animate-pulse-organic': status === 'speaking',
        'scale-105': status === 'recording' || status === 'speaking',
        'animate-swirl': status === 'processing',
        'animate-tremor': status === 'error',
      })}
    >
      {/* Ripple for recording */}
      {status === 'recording' && (
        <>
          <div className="absolute h-full w-full rounded-full bg-white/30 animate-ripple delay-0" />
          <div className="absolute h-full w-full rounded-full bg-white/30 animate-ripple delay-700" />
        </>
      )}

      {/* Inner content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {status === 'speaking' && <Waveform />}
      </div>
    </div>
  )
}
