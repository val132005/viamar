import { Grip } from 'lucide-react'
import type { Usuario } from '../../domain/types'
import { ViamarLogo } from '../brand/ViamarLogo'
import { GlobalSearch } from './GlobalSearch'
import { NotificationCenter } from './NotificationCenter'
import { UserMenu } from './UserMenu'

/**
 * Barra superior. Búsqueda global a la izquierda; a la derecha, los avisos y
 * la cuadrícula que abre la paleta de comandos. La identidad del usuario vive al
 * pie del sidebar; sólo se muestra aquí en las pantallas sin sidebar (PDA).
 */
export function Header({
  user,
  showSearch = true,
  showBrand = false,
  showUser = true,
  actions,
  onOpenPalette,
}: {
  user: Usuario
  showSearch?: boolean
  /** Muestra el logo en la propia barra: para pantallas sin sidebar (PDA). */
  showBrand?: boolean
  /** Muestra el menú de cuenta; se apaga cuando el sidebar ya lo lleva. */
  showUser?: boolean
  actions?: React.ReactNode
  /** Abre la paleta de comandos; sin ella el campo sólo busca seriales. */
  onOpenPalette?: () => void
}) {
  return (
    <header className="sticky top-0 z-20 flex h-topbar shrink-0 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur-sm lg:px-6">
      {showBrand ? (
        <div className="flex flex-1 items-center">
          <ViamarLogo className="h-6 w-auto" />
        </div>
      ) : null}

      {showSearch ? <GlobalSearch onOpenPalette={onOpenPalette} /> : null}

      {/* Separa la búsqueda de las acciones, que se agrupan a la derecha. */}
      {showBrand ? null : <div className="flex-1" />}

      {actions ? <div className="flex items-center gap-1.5">{actions}</div> : null}

      <NotificationCenter />

      {onOpenPalette ? (
        <button
          type="button"
          onClick={onOpenPalette}
          title="Paleta de comandos (Ctrl + K)"
          aria-label="Paleta de comandos"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#3e5a7c] transition-colors duration-fast hover:bg-surface-hover hover:text-ink"
        >
          <Grip size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>
      ) : null}

      {showUser ? (
        <>
          <div className="h-5 w-px bg-line" aria-hidden="true" />
          <UserMenu user={user} placement="topbar" />
        </>
      ) : null}
    </header>
  )
}
