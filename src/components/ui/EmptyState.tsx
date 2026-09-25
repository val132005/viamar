import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Inbox, Lock, SearchX, TriangleAlert } from 'lucide-react'
import { cn } from '../../lib/cn'

export type EmptyKind = 'empty' | 'no-results' | 'error' | 'forbidden'

type Props = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  /** Cambia icono y tono por defecto según el motivo del vacío. */
  kind?: EmptyKind
  /**
   * `sm` para el vacío de una celda o tarjeta; `lg` cuando el vacío ES la
   * pantalla y debe leerse como una respuesta, no como un hueco.
   */
  size?: 'sm' | 'md' | 'lg'
  /** Por defecto se dibuja sobre el fondo; `framed` lo envuelve en una tarjeta. */
  framed?: boolean
  className?: string
}

const DEFAULT_ICON: Record<EmptyKind, LucideIcon> = {
  empty: Inbox,
  'no-results': SearchX,
  error: TriangleAlert,
  forbidden: Lock,
}

const TONE: Record<EmptyKind, string> = {
  empty: 'bg-viamar-50 text-viamar-500',
  'no-results': 'bg-viamar-50 text-viamar-500',
  error: 'bg-critical-soft text-critical',
  forbidden: 'bg-warning-soft text-warning',
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  kind = 'empty',
  size = 'md',
  framed = false,
  className,
}: Props) {
  const Resolved = Icon ?? DEFAULT_ICON[kind]
  const compact = size === 'sm'
  const grande = size === 'lg'
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-4 py-8' : grande ? 'px-6 py-20' : 'px-6 py-12',
        framed && 'surface',
        className,
      )}
      role={kind === 'error' ? 'alert' : undefined}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center',
          /* En tamaño grande el disco se vuelve circular: a esa escala un
             cuadrado redondeado se lee como una tarjeta vacía más. */
          /* Disco circular, como los iconos de las tarjetas del panel. */
          'rounded-full',
          compact ? 'h-10 w-10' : grande ? 'h-20 w-20' : 'h-12 w-12',
          TONE[kind],
        )}
      >
        <Resolved size={compact ? 18 : grande ? 32 : 22} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <h2
        className={cn(
          'text-ink',
          grande ? 'mt-5 text-headline-lg' : 'mt-3',
          compact ? 'text-headline-sm' : grande ? '' : 'text-headline-md',
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            'mt-1.5 text-ink-secondary',
            grande ? 'max-w-md text-body-md' : 'max-w-sm text-body-sm',
          )}
        >
          {description}
        </p>
      ) : null}
      {action ? <div className={grande ? 'mt-5' : 'mt-4'}>{action}</div> : null}
    </div>
  )
}
