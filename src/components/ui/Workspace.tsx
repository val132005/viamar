import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * Rejilla del workspace modular.
 *
 * Todas las pantallas comparten el mismo sistema de composición, pero no el
 * mismo plano: cada módulo elige qué bloques tienen sentido y con qué reparto.
 * Estos contenedores sólo fijan el ritmo — separación, columnas y puntos de
 * ruptura — para que la variedad no se convierta en desorden.
 */

/** Fila de métricas. El número de columnas se deriva de cuántas hay. */
export function MetricGrid({
  columns = 4,
  children,
  className,
}: {
  columns?: 2 | 3 | 4 | 5 | 6
  children: ReactNode
  className?: string
}) {
  const COLS: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-6',
  }
  return (
    <div className={cn('grid shrink-0 gap-3.5', COLS[columns], className)}>{children}</div>
  )
}

export type WorkspaceLayout =
  /** Bloque ancho + panel lateral: tendencia acompañada de su desglose. */
  | 'split-2-1'
  /** Tres bloques de igual peso. */
  | 'thirds'
  /** Dos bloques iguales. */
  | 'halves'
  /** Bloque estrecho + bloque ancho: prioridades a la izquierda, detalle a la derecha. */
  | 'split-1-2'
  /** Bloque ancho + dos estrechos apilados en pantallas grandes. */
  | 'split-2-1-1'

const LAYOUTS: Record<WorkspaceLayout, string> = {
  'split-2-1': 'grid-cols-1 xl:grid-cols-3 [&>*:first-child]:xl:col-span-2',
  'split-1-2': 'grid-cols-1 xl:grid-cols-3 [&>*:last-child]:xl:col-span-2',
  'split-2-1-1': 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 [&>*:first-child]:xl:col-span-2',
  thirds: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  halves: 'grid-cols-1 lg:grid-cols-2',
}

/**
 * Fila de bloques analíticos. En móvil siempre colapsa a una columna: una
 * rejilla de tres columnas en 390 px no es densidad, es ilegibilidad.
 */
export function WorkspaceRow({
  layout = 'split-2-1',
  fill = false,
  children,
  className,
}: {
  layout?: WorkspaceLayout
  /** La fila absorbe el alto sobrante de la página. */
  fill?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid gap-3.5',
        LAYOUTS[layout],
        fill ? 'min-h-0 flex-1' : 'shrink-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * Dato con contexto. Sustituye al patrón «etiqueta + número suelto»: la cifra
 * viene acompañada de qué representa y de su proporción cuando la hay.
 */
export function DataPoint({
  label,
  value,
  context,
  align = 'left',
  className,
}: {
  label: ReactNode
  value: ReactNode
  context?: ReactNode
  align?: 'left' | 'right'
  className?: string
}) {
  return (
    <div className={cn('min-w-0', align === 'right' && 'text-right', className)}>
      <p className="truncate text-body-xs text-ink-tertiary">{label}</p>
      <p className="mt-0.5 text-metric tabular-nums text-ink">{value}</p>
      {context ? <p className="mt-0.5 truncate text-body-xs text-ink-secondary">{context}</p> : null}
    </div>
  )
}

/** Separador vertical entre datos de una misma fila. */
export function DataDivider() {
  return <div className="h-8 w-px shrink-0 self-center bg-line" aria-hidden="true" />
}
