import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsSheet } from '@/components/SettingsSheet'

export default function Layout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 h-[48px] flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <h1 className="text-xl font-light text-foreground tracking-tight flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-primary bg-transparent"></div>
          PsiZen
        </h1>
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <SettingsSheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      <main className="flex-1 flex flex-col pt-[48px]">
        <Outlet />
      </main>
    </div>
  )
}
