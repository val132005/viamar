import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, LogOut, Users } from 'lucide-react'
import { ROLE_LABEL } from '../../domain/permissions'
import type { Usuario } from '../../domain/types'
import { useAuthStore } from '../../stores/authStore'
import { UserAvatar } from '../brand/UserAvatar'
import { cn } from '../../lib/cn'

/**
 * Identidad del usuario con su menú de cuenta. Vive al pie del sidebar en la
 * aplicación y en la barra superior donde no hay sidebar (PDA); la lógica es
 * la misma, sólo cambia la piel y hacia dónde se abre el menú.
 */
export function UserMenu({
  user,
  placement,
  collapsed = false,
}: {
  user: Usuario
  placement: 'topbar' | 'sidebar'
  /** Sidebar reducido a iconos: sólo queda el avatar. */
  collapsed?: boolean
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

  const lateral = placement === 'sidebar'
  const subtitulo = user.dealerNombre ?? ROLE_LABEL[user.rol]
  /* Al pie de la pantalla el menú se abre hacia arriba: hacia abajo no cabe. */
  const Chevron = lateral ? ChevronUp : ChevronDown

  return (
    <div className={cn('relative', lateral && 'w-full')} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={lateral && collapsed ? `${user.nombre} · ${subtitulo}` : undefined}
        className={cn(
          'flex items-center transition-colors duration-fast',
          lateral
            ? cn(
                'w-full gap-2.5 rounded-lg py-2 text-left',
                collapsed ? 'justify-center px-0' : 'px-2',
                open ? 'bg-white/[0.13]' : 'hover:bg-white/[0.07]',
              )
            : cn('gap-2 rounded px-1.5 py-1', open ? 'bg-surface-active' : 'hover:bg-surface-hover'),
        )}
      >
        <span className={cn('inline-flex shrink-0 rounded-full', lateral && 'ring-2 ring-white/15')}>
          <UserAvatar user={user} size={lateral ? 34 : 28} />
        </span>
        {lateral && collapsed ? null : (
          <span
            className={cn(
              'min-w-0 flex-col items-start',
              lateral ? 'flex flex-1' : 'hidden sm:flex',
            )}
          >
            <span
              className={cn(
                'truncate text-label-lg leading-4',
                lateral ? 'max-w-full text-white' : 'max-w-[160px] text-ink',
              )}
            >
              {user.nombre}
            </span>
            <span
              className={cn(
                'truncate text-body-xs leading-4',
                lateral ? 'max-w-full text-white/55' : 'max-w-[160px] text-ink-tertiary',
              )}
            >
              {subtitulo}
            </span>
          </span>
        )}
        {lateral && collapsed ? null : (
          <Chevron
            size={14}
            className={cn(
              'shrink-0 transition-transform duration-fast',
              lateral ? 'text-white/55' : 'text-ink-tertiary',
              open && 'rotate-180',
            )}
          />
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            'surface-raised absolute z-30 w-60 overflow-hidden py-1',
            lateral
              ? collapsed
                ? 'bottom-0 left-full ml-2'
                : 'bottom-full left-0 mb-1.5'
              : 'right-0 mt-1.5',
          )}
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
  )
}
