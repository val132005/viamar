import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { Pill, type PillTone } from './Pill'

export type FeedTone = 'brand' | 'ok' | 'warn' | 'danger' | 'accent' | 'neutral'

/* Los tonos salen de los tokens semánticos: un «ejecutado» verde debe ser
   exactamente el mismo verde en el feed, en la tabla y en el KPI. */
const ICONO: Record<FeedTone, string> = {
  brand: 'bg-viamar-50 text-viamar-700',
  ok: 'bg-success-soft text-success-text',
  warn: 'bg-warning-soft text-warning-text',
  danger: 'bg-critical-soft text-critical-text',
  accent: 'bg-info-soft text-info-text',
  neutral: 'bg-neutral-100 text-neutral-700',
}

/* Tarjeta teñida: el borde y el fondo dicen el estado antes de leer el texto. */
const TARJETA: Record<FeedTone, string> = {
  brand: 'border-viamar-200 bg-viamar-50/50',
  ok: 'border-success-border bg-success-soft/50',
  warn: 'border-warning-border bg-warning-soft/50',
  danger: 'border-critical-border bg-critical-soft/50',
  accent: 'border-info-border bg-info-soft/50',
  neutral: 'border-line bg-white',
}

const PILL: Record<FeedTone, PillTone> = {
  brand: 'brand',
  ok: 'ok',
  warn: 'warn',
  danger: 'danger',
  accent: 'info',
  neutral: 'neutral',
}

export type FeedItem = {
  id: string
  icon?: LucideIcon
  tone: FeedTone
  /** Titular del evento: qué registro es. */
  title: ReactNode
  /** Qué le ocurrió. */
  detail: ReactNode
  /** Estado resultante, como etiqueta. */
  estado?: string
  /** Contexto extra: origen, responsable, importe. */
  meta?: ReactNode
  /** Tiempo relativo: `Hace 2 horas`. */
  time: string
  /** Convierte el evento en el acceso al registro. */
  to?: string
}

type Props = {
  items: FeedItem[]
  /**
   * `cards` reparte los eventos recientes en una banda horizontal: sirve para
   * la franja de «actividad reciente» de un panel ejecutivo.
   * `list` los apila en vertical con hilo de continuidad: sirve para una
   * columna lateral con historia.
   */
  variant?: 'cards' | 'list'
  emptyMessage?: string
  className?: string
}

export function ActivityFeed({
  items,
  variant = 'list',
  emptyMessage = 'Sin actividad en el período.',
  className,
}: Props) {
  if (items.length === 0) {
    return (
      <p className={cn('px-1 py-6 text-center text-body-sm text-ink-tertiary', className)}>
        {emptyMessage}
      </p>
    )
  }

  if (variant === 'cards') {
    return (
      <ul className={cn('grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4', className)}>
        {items.map((it) => {
          const cuerpo = (
            <>
              <div className="flex items-start justify-between gap-2">
                {it.estado ? (
                  <Pill tone={PILL[it.tone]} dot>
                    {it.estado}
                  </Pill>
                ) : (
                  <span />
                )}
                <span className="shrink-0 pt-0.5 text-body-xs text-ink-tertiary">{it.time}</span>
              </div>
              <div className="mt-2 min-w-0">
                <div className="truncate text-label-lg text-ink">{it.title}</div>
                <div className="mt-0.5 truncate text-body-xs text-ink-secondary">{it.detail}</div>
                {it.meta ? (
                  <div className="mt-0.5 truncate text-body-xs text-ink-tertiary">{it.meta}</div>
                ) : null}
              </div>
            </>
          )
          const clase = cn(
            'block h-full rounded-md border px-3 py-2.5 transition-colors duration-fast ease-brand',
            TARJETA[it.tone],
            it.to && 'hover:border-viamar-300',
          )
          return (
            <li key={it.id} className="min-w-0">
              {it.to ? (
                <Link to={it.to} className={clase}>
                  {cuerpo}
                </Link>
              ) : (
                <article className={clase}>{cuerpo}</article>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <ul className={cn('flex flex-col', className)}>
      {items.map((it, i) => {
        const Icon = it.icon
        const cuerpo = (
          <>
            {/* Hilo del timeline: une los eventos sin encajonar cada uno. */}
            <span className="relative flex shrink-0 flex-col items-center">
              <span
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-full',
                  ICONO[it.tone],
                )}
                aria-hidden="true"
              >
                {Icon ? (
                  <Icon size={13} strokeWidth={2.2} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              {i < items.length - 1 ? (
                <span className="mt-1 w-px flex-1 bg-line" aria-hidden="true" />
              ) : null}
            </span>

            <span className="min-w-0 flex-1 pb-3.5">
              <span className="flex items-start justify-between gap-2">
                <span className="min-w-0 truncate text-label-lg text-ink">{it.title}</span>
                <span className="shrink-0 whitespace-nowrap text-body-xs text-ink-tertiary">
                  {it.time}
                </span>
              </span>
              <span className="mt-0.5 block text-body-sm leading-snug text-ink-secondary">
                {it.detail}
              </span>
              {it.meta ? (
                <span className="mt-1 flex flex-wrap items-center gap-1.5">{it.meta}</span>
              ) : null}
            </span>
          </>
        )
        return (
          <li key={it.id} className="min-w-0">
            {it.to ? (
              <Link
                to={it.to}
                className="-mx-1.5 flex gap-2.5 rounded-sm px-1.5 pt-0.5 transition-colors duration-fast hover:bg-surface-hover"
              >
                {cuerpo}
              </Link>
            ) : (
              <div className="flex gap-2.5 pt-0.5">{cuerpo}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Etiqueta menor dentro de un evento: origen, responsable o referencia. */
export function FeedTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-xs bg-neutral-100 px-1.5 py-0.5 text-label-sm text-ink-secondary">
      {children}
    </span>
  )
}
