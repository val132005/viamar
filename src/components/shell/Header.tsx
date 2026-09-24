import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Users } from 'lucide-react'
import { ROLE_LABEL } from '../../domain/permissions'
import type { Usuario } from '../../domain/types'
import { useAuthStore } from '../../stores/authStore'
import { UserAvatar } from '../brand/UserAvatar'
import { ViamarLogo } from '../brand/ViamarLogo'
import { GlobalSearch } from './GlobalSearch'
import { NotificationCenter } from './NotificationCenter'
import { cn } from '../../lib/cn'

/**
 * Barra superior. Tres zonas claras: búsqueda global a la izquierda, acciones
 * globales al centro y la identidad del usuario a la derecha. El rol vive bajo
 * el nombre, no como control suelto.
 */
export function Header({
  user,
  showSearch = true,
  showBrand = false,
  actions,
  onOpenPalette,
}: {
  user: Usuario
  showSearch?: boolean
  /** Muestra el logo en la propia barra: para pantallas sin sidebar (PDA). */
  showBrand?: boolean
  actions?: React.ReactNode
  /** Abre la paleta de comandos; sin ella el campo sólo busca seriales. */
  onOpenPalette?: () => void
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  /* Un menú abierto debe cerrarse al pulsar fuera o con Escape. */
  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className="sticky top-0 z-20 flex h-topbar shrink-0 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur-sm lg:px-6">
      {showBrand ? (
        <div className="flex flex-1 items-center">
          <ViamarLogo className="h-6 w-auto" />
        </div>
      ) : null}

      {showSearch ? (
        <GlobalSearch onOpenPalette={onOpenPalette} />
      ) : showBrand ? null : (
        <div className="flex-1" />
      )}

      {actions ? <div className="flex items-center gap-1.5">{actions}</div> : null}

      <NotificationCenter />

      <div className="h-5 w-px bg-line" aria-hidden="true" />

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            'flex items-center gap-2 rounded px-1.5 py-1 transition-colors duration-fast',
            open ? 'bg-surface-active' : 'hover:bg-surface-hover',
          )}
        >
          <UserAvatar user={user} size={28} />
          <span className="hidden min-w-0 flex-col items-start sm:flex">
            <span className="max-w-[160px] truncate text-label-lg leading-4 text-ink">
              {user.nombre}
            </span>
            <span className="max-w-[160px] truncate text-body-xs leading-4 text-ink-tertiary">
              {user.dealerNombre ?? ROLE_LABEL[user.rol]}
            </span>
          </span>
          <ChevronDown
            size={14}
            className={cn(
              'shrink-0 text-ink-tertiary transition-transform duration-fast',
              open && 'rotate-180',
            )}
          />
        </button>

        {open ? (
          <div
            role="menu"
            className="surface-raised absolute right-0 z-30 mt-1.5 w-60 overflow-hidden py-1"
          >
            <div className="border-b border-line-subtle px-3 py-2">
              <p className="truncate text-label-lg text-ink">{user.nombre}</p>
              <p className="truncate text-body-xs text-ink-tertiary">{user.email}</p>
              <p className="mt-1 text-body-xs text-ink-secondary">{ROLE_LABEL[user.rol]}</p>
            </div>
            <Link
              to="/login/cuentas"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-body-sm text-ink-secondary transition-colors duration-fast hover:bg-surface-hover hover:text-ink"
              onClick={() => setOpen(false)}
            >
              <Users size={14} />
              Cambiar de cuenta
            </Link>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-ink-secondary transition-colors duration-fast hover:bg-surface-hover hover:text-ink"
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
