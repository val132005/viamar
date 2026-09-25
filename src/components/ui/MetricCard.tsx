import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'
import type { Variacion } from '../../domain/analytics'
import { cn } from '../../lib/cn'
import { Sparkline } from './charts/Sparkline'

export type MetricTone = 'brand' | 'ok' | 'warn' | 'danger' | 'accent' | 'neutral'

/* Icono en círculo, igual que las tarjetas de Dashboard y Trazabilidad. */
const ICONO: Record<MetricTone, string> = {
  brand: 'bg-viamar-100/80 text-viamar-600',
  ok: 'bg-success-soft text-success',
  warn: 'bg-warning-soft text-warning',
  danger: 'bg-critical-soft text-critical',
  accent: 'bg-info-soft text-info',
  neutral: 'bg-neutral-100 text-ink',
}

/* Sólo lo crítico y lo resuelto tiñen la tarjeta: son los dos estados que el
   ojo tiene que separar de un vistazo. El resto queda en blanco. */
const CARCASA_TINTADA: Record<MetricTone, string> = {
  brand: 'border-line bg-white',
  ok: 'border-line bg-gradient-to-br from-white to-success-soft/60',
  warn: 'border-line bg-white',
  danger: 'border-critical-border/60 bg-gradient-to-br from-critical-soft/50 to-critical-soft/80',
  accent: 'border-line bg-white',
  neutral: 'border-line bg-gradient-to-br from-white to-neutral-50',
}

type Props = {
  label: string
  value: ReactNode
  /** Nota corta junto a la cifra: desglose, objetivo o unidad. */
  note?: ReactNode
  /** Variación contra el período anterior. `null` = sin base comparable. */
  change?: Variacion | null
  /** Contexto de la variación: `vs. mes anterior`. */
  changeLabel?: ReactNode
  /** Si subir es favorable. Decide el color, no la dirección de la flecha. */
  subirEsBueno?: boolean
  /**
   * Contexto que ocupa el lugar de la variación cuando no hay período
   * anterior con el que comparar. Debe ser un hecho del período actual, no
   * un relleno: es lo que el usuario leerá en su lugar.
   */
  context?: ReactNode
  /** Serie histórica que da silueta a la cifra. */
  trend?: number[]
  /** Tono del trazo, si difiere del de la tarjeta. */
  trendTone?: MetricTone
  icon: LucideIcon
  tone?: MetricTone
  /**
   * Tiñe la tarjeta con el color del rol. Sólo lo crítico y lo resuelto se
   * tiñen: el resto de tonos queda en blanco, como en el panel.
   */
  filled?: boolean
  to?: string
  className?: string
}

/**
 * Métrica con la piel de las tarjetas del panel: icono en círculo, etiqueta,
 * cifra con su nota y, a la derecha, la curva con la variación debajo. Si no
 * hay curva ni variación, el contexto baja bajo la cifra y ocupa el ancho.
 */
export function MetricCard({
  label,
  value,
  note,
  change,
  changeLabel,
  subirEsBueno = true,
  context,
  trend,
  trendTone,
  icon: Icon,
  tone = 'brand',
  filled,
  to,
  className,
}: Props) {
  /* Una serie sin relieve (toda a cero o constante) no es una tendencia. */
  const hayTendencia = Boolean(
    trend && trend.length > 1 && trend.some((v) => v !== trend[0]) && trend.some((v) => v !== 0),
  )
  const cambioBueno =
    change && change.direccion !== 'igual' ? (change.direccion === 'sube') === subirEsBueno : null
  const Flecha = !change
    ? ArrowRight
    : change.direccion === 'sube'
      ? ArrowUp
      : change.direccion === 'baja'
        ? ArrowDown
        : ArrowRight
  const columnaDerecha = hayTendencia || Boolean(change)

  const cuerpo = (
    <div className="flex h-full gap-3.5">
      <span
        className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full', ICONO[tone])}
        aria-hidden="true"
      >
        <Icon size={21} strokeWidth={2} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-body-sm text-ink-secondary">{label}</p>
        <div className="mt-1 flex flex-1 items-stretch justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="flex items-baseline gap-2">
              <span className="text-metric-xl leading-none tabular-nums text-ink">{value}</span>
              {note ? <span className="min-w-0 truncate text-body-xs text-ink-secondary">{note}</span> : null}
            </p>
            {!columnaDerecha && context ? (
              <p className="mt-2.5 truncate text-body-xs text-ink-secondary">{context}</p>
            ) : null}
            {columnaDerecha && change && changeLabel ? (
              <p className="mt-2.5 truncate text-body-xs text-ink-tertiary">{changeLabel}</p>
            ) : null}
            {columnaDerecha && !change && context ? (
              <p className="mt-2.5 truncate text-body-xs text-ink-secondary">{context}</p>
            ) : null}
          </div>

          {columnaDerecha ? (
            <div className="flex shrink-0 flex-col items-end justify-between gap-1">
              {hayTendencia ? (
                <Sparkline
                  data={trend!}
                  tone={trendTone ?? tone}
                  area
                  smooth
                  width={84}
                  height={34}
                  strokeWidth={1.6}
                  className="hidden sm:block"
                />
              ) : (
                <span className="h-[34px]" aria-hidden="true" />
              )}
              {change ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-label-md tabular-nums',
                    cambioBueno === null
                      ? 'bg-neutral-100 text-ink-secondary'
                      : cambioBueno
                        ? 'bg-success-soft text-success'
                        : 'bg-critical-soft text-critical',
                  )}
                >
                  <Flecha size={12} strokeWidth={2.6} aria-hidden="true" />
                  {change.label}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )

  const shell = cn(
    'block min-h-[104px] rounded-xl border p-4 text-left shadow-xs transition-[border-color,box-shadow,transform] duration-200 ease-brand hover:-translate-y-0.5 hover:shadow-md',
    (filled ?? tone === 'danger') ? CARCASA_TINTADA[tone] : 'border-line bg-white',
    to && 'hover:border-viamar-200 focus-visible:shadow-focus',
    className,
  )

  if (to) {
    return (
      <Link to={to} className={shell}>
        {cuerpo}
      </Link>
    )
  }
  return <article className={shell}>{cuerpo}</article>
}
