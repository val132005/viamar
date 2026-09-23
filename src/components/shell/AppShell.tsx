import type { ReactNode } from 'react'
import type { PermissionMatrix } from '../../domain/types'
import type { Usuario } from '../../domain/types'
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
  return (
    <div className="min-h-screen flex bg-app-bg">
      <Sidebar role={user.rol} matrix={matrix} variant={variant} />
      <div className="flex-1 min-w-0 flex flex-col">
        <PrototypeBanner />
        <Header user={user} showSearch={showSearch} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
