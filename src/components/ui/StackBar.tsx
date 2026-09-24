import { cn } from '../../lib/cn'

export type StackTone = 'brand' | 'ok' | 'warn' | 'danger' | 'accent' | 'neutral'

const FILL: Record<StackTone, string> = {
  brand: 'bg-viamar-500',
  ok: 'bg-success',
  warn: 'bg-warning',
  danger: 'bg-critical',
  accent: 'bg-info',
  neutral: 'bg-neutral-300',
}

/** Punto de leyenda del mismo tono que el segmento que representa. */
export function StackDot({ tone, className }: { tone: StackTone; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block h-2 w-2 shrink-0 rounded-xs', FILL[tone], className)}
    />
  )
}

export type StackSegment = {
  label: string
  value: number
  tone: StackTone
}

type Props = {
  segments: StackSegment[]
  /** Total sobre el que se calcula la proporción. Por defecto, la suma. */
  total?: number
  /** Deja visible el resto hasta el total como pista de cuánto falta. */
  showRemainder?: boolean
  height?: number
  className?: string
}

/**
 * Composición de un conjunto dentro de una celda.
 *
 * Responde «¿de qué está hecho este total?» sin gastar una columna por cada
 * parte: la longitud es la proporción y el color el rol. Al ir dentro de una
 * fila, no lleva etiquetas propias —la leyenda vive una vez en la cabecera de
 * la tabla— y expone el desglose como `title` para quien necesite la cifra.
 */
export function StackBar({ segments, total, showRemainder = true, height = 8, className }: Props) {
  const suma = segments.reduce((acc, s) => acc + Math.max(0, s.value), 0)
  const base = Math.max(total ?? suma, suma)
  if (base <= 0) {
    return (
      <div
        className={cn('w-full rounded-full bg-neutral-200/70', className)}
        style={{ height }}
        aria-hidden="true"
      />
    )
  }

  const resumen = segments
    .filter((s) => s.value > 0)
    .map((s) => `${s.label}: ${s.value}`)
    .join(' · ')

  return (
    <div
      className={cn('flex w-full overflow-hidden rounded-full bg-neutral-200/70', className)}
      style={{ height }}
      title={resumen || undefined}
      role="img"
      aria-label={resumen || 'Sin datos'}
    >
      {segments.map((s) =>
        s.value > 0 ? (
          <span
            key={s.label}
            className={cn('h-full', FILL[s.tone])}
            style={{ width: `${(s.value / base) * 100}%` }}
          />
        ) : null,
      )}
      {showRemainder ? <span className="h-full flex-1" /> : null}
    </div>
  )
}
