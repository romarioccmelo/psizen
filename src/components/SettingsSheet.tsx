import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Info, Mail, Shield } from 'lucide-react'

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const SettingsSheet = ({ open, onOpenChange }: SettingsSheetProps) => {
  const appVersion = '0.0.15'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[400px] bg-background text-foreground flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-2xl">Configurações</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Gerencie as preferências do aplicativo.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <div className="flex-grow space-y-1">
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Sobre</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Versão {appVersion}
            </span>
          </div>
          <a
            href="mailto:feedback@usecurling.com"
            className="flex items-center gap-3 hover:bg-accent p-2 rounded-md transition-colors text-sm"
          >
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span>Enviar Feedback</span>
          </a>
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 hover:bg-accent p-2 rounded-md transition-colors text-sm"
          >
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span>Política de Privacidade</span>
          </a>
        </div>
      </SheetContent>
    </Sheet>
  )
}
