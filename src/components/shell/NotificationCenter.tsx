import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCircle2 } from 'lucide-react'
import { useNotifications, type NotificationTone } from '../../hooks/useNotifications'
import { cn } from '../../lib/cn'

const TONO: Record<NotificationTone, string> = {
  info: 'bg-info-soft text-info-text',
  warn: 'bg-warning-soft text-warning-text',
  danger: 'bg-critical-soft text-critical-text',
  ok: 'bg-success-soft text-success-text',
}

/**
 * Centro de avisos.
 *
 * Lo que muestra no es un buzón de mensajes sino el estado vivo de la
 * operación: cada línea es una cola de trabajo con una cifra real y un destino
 * donde resolverla. Sin nada pendiente, lo dice explícitamente en vez de
 * quedarse en blanco.
 */
export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const notificaciones = useNotifications()

  /* El contador refleja avisos que piden acción, no el histórico correcto. */
  const urgentes = notificaciones.filter((n) => n.tone === 'warn' || n.tone === 'danger')
  const total = urgentes.length

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={total > 0 ? `Avisos: ${total} requieren atención` : 'Avisos'}
        className={cn(
          'relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-fast',
          open ? 'bg-surface-active text-ink' : 'text-[#3e5a7c] hover:bg-surface-hover hover:text-ink',
        )}
      >
        <Bell size={20} strokeWidth={1.9} />
        {total > 0 ? (
          <span className="absolute right-0.5 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ea3a3e] px-1 text-[9px] font-bold tabular-nums text-white ring-2 ring-white">
            {total}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Centro de avisos"
          className="surface-raised absolute right-0 z-30 mt-1.5 w-[23rem] overflow-hidden"
        >
          <header className="flex items-center justify-between gap-2 border-b border-line-subtle px-4 py-3">
            <h2 className="text-headline-md text-ink">Avisos</h2>
            <span className="text-body-xs text-ink-tertiary">
              {total > 0 ? `${total} requieren atención` : 'Todo al día'}
            </span>
          </header>

          {notificaciones.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-success-soft text-success">
                <CheckCircle2 size={21} aria-hidden="true" />
              </span>
              <p className="mt-2 text-label-lg text-ink">No hay nada pendiente</p>
              <p className="mt-0.5 text-body-xs text-ink-tertiary">
                Las colas de trabajo de tu rol están vacías.
              </p>
            </div>
          ) : (
            <ul className="scroll-slim max-h-[24rem] divide-y divide-line-subtle overflow-y-auto">
              {notificaciones.map((n) => {
                const Icon = n.icon
                return (
                  <li key={n.id}>
                    <Link
                      to={n.to}
                      onClick={() => setOpen(false)}
                      className="flex gap-3 px-4 py-2.5 transition-colors duration-fast hover:bg-[#f7fafd]"
                    >
                      <span
                        className={cn(
                          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                          TONO[n.tone],
                        )}
                        aria-hidden="true"
                      >
                        <Icon size={16} strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-label-lg leading-5 text-ink">{n.title}</span>
                        <span className="mt-0.5 block text-body-xs leading-4 text-ink-tertiary">
                          {n.detail}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
