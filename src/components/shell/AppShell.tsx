import { useEffect, useState, type ReactNode } from 'react'
import type { PermissionMatrix } from '../../domain/types'
import type { Usuario } from '../../domain/types'
import { CommandPalette } from './CommandPalette'
import { Header } from './Header'
import { PrototypeBanner } from './PrototypeBanner'
import { Sidebar } from './Sidebar'

type Props = {
  user: Usuario
  matrix: PermissionMatrix
  variant: 'internal' | 'dealer'
  children: ReactNode
  showSearch?: boolean
}

export function AppShell({ user, matrix, variant, children, showSearch = true }: Props) {
  const [paleta, setPaleta] = useState(false)

  /* Ctrl/Cmd + K abre la paleta desde cualquier punto de la aplicación, salvo
     mientras se escribe en un campo — ahí el atajo pertenece al navegador. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'k' || !(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      setPaleta((v) => !v)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-surface-sunken">
      <Sidebar role={user.rol} matrix={matrix} variant={variant} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <PrototypeBanner />
        <Header user={user} showSearch={showSearch} onOpenPalette={() => setPaleta(true)} />
        <main className="min-h-0 flex-1 overflow-hidden px-4 py-4 lg:px-6">
          <div className="page-enter scroll-slim h-full min-h-0 overflow-y-auto">{children}</div>
        </main>
      </div>
      <CommandPalette open={paleta} onClose={() => setPaleta(false)} />
    </div>
  )
}
