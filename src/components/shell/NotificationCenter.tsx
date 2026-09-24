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
          'relative inline-flex h-control-md w-control-md items-center justify-center rounded-full border border-line transition-colors duration-fast',
          open ? 'border-viamar-200 bg-surface-active text-ink' : 'bg-surface-subtle text-ink-secondary hover:bg-surface-hover hover:text-ink',
        )}
      >
        <Bell size={17} />
        {total > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-label-sm tabular-nums text-white">
            {total}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Centro de avisos"
          className="surface-raised absolute right-0 z-30 mt-1.5 w-[22rem] overflow-hidden"
        >
          <header className="flex items-center justify-between gap-2 border-b border-line px-3.5 py-2.5">
            <h2 className="text-headline-md text-ink">Avisos</h2>
            <span className="text-body-xs text-ink-tertiary">
              {total > 0 ? `${total} requieren atención` : 'Todo al día'}
            </span>
          </header>

          {notificaciones.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <CheckCircle2 size={22} className="mx-auto text-success" aria-hidden="true" />
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
                      className="flex gap-2.5 px-3.5 py-2.5 transition-colors duration-fast hover:bg-surface-hover"
                    >
                      <span
                        className={cn(
                          'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm',
                          TONO[n.tone],
                        )}
                        aria-hidden="true"
                      >
                        <Icon size={14} strokeWidth={2.2} />
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
