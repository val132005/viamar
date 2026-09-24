import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'

export type QueueItem = {
  id: string
  label: string
  /** Qué hay que hacer con esos registros, no qué son. */
  hint?: string
  count: number
  to: string
  icon: LucideIcon
  tone?: 'default' | 'warn' | 'danger'
}

const TONE: Record<NonNullable<QueueItem['tone']>, { icon: string; count: string }> = {
  default: { icon: 'bg-viamar-50 text-viamar-600 ring-viamar-100', count: 'text-viamar-700' },
  warn: { icon: 'bg-warning-soft text-warning ring-warning-border/60', count: 'text-warning' },
  danger: { icon: 'bg-critical-soft text-critical ring-critical-border/60', count: 'text-critical' },
}

/**
 * Cola de trabajo: convierte el estado del sistema en tareas con destino.
 * Solo aparecen las entradas con pendientes, de modo que una lista vacía es
 * una respuesta útil —no queda trabajo— y no un hueco.
 */
export function TaskQueue({ items, className }: { items: QueueItem[]; className?: string }) {
  const pending = items.filter((i) => i.count > 0)

  if (pending.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center px-4 py-8 text-center', className)}>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-success-soft text-success">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="m5 13 4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="mt-2.5 text-headline-sm text-ink">Sin pendientes</p>
        <p className="mt-0.5 text-body-xs text-ink-tertiary">
          No hay trabajo en cola dentro de tu alcance.
        </p>
      </div>
    )
  }

  return (
    <ul className={cn('divide-y divide-line-subtle', className)}>
      {pending.map((item) => {
        const tone = TONE[item.tone ?? 'default']
        const Icon = item.icon
        return (
          <li key={item.id}>
            <Link
              to={item.to}
              className="group flex items-center gap-3 px-4 py-3 transition-colors duration-fast hover:bg-surface-hover"
            >
              <span
                className={cn(
                  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
                  tone.icon,
                )}
              >
                <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-label-lg text-ink">{item.label}</span>
                {item.hint ? (
                  <span className="block truncate text-body-xs text-ink-tertiary">{item.hint}</span>
                ) : null}
              </span>

              {/* La cifra es el dato que se busca al barrer la lista: pesa más
                  que el título y por eso va grande y en el color del rol. */}
              <span className={cn('shrink-0 text-metric-lg tabular-nums', tone.count)}>
                {item.count}
              </span>
              <ChevronRight
                size={15}
                className="shrink-0 text-ink-disabled transition-colors group-hover:text-ink-secondary"
                aria-hidden="true"
              />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
