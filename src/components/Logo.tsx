import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Logo = ({ className, size = 'md' }: LogoProps) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={cn(
      'relative rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm',
      sizeClasses[size],
      className
    )}>
      {/* Círculo interno com gradiente */}
      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
      
      {/* Símbolo Psi (Ψ) estilizado */}
      <div className="relative z-10 text-white font-bold text-xs leading-none">
        Ψ
      </div>
      
      {/* Brilho superior */}
      <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white/40 rounded-full" />
    </div>
  )
} 