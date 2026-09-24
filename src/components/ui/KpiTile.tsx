import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { Variacion } from '../../domain/analytics'
import { cn } from '../../lib/cn'
import { Sparkbars, Sparkline } from './charts/Sparkline'

export type KpiTone = 'brand' | 'ok' | 'warn' | 'danger' | 'accent' | 'neutral'

/**
 * Énfasis: es lo que da jerarquía a una fila de métricas. Si todas las cifras
 * pesan igual, ninguna destaca y el panel se lee plano.
 *   lead     — la cifra que gobierna la pantalla.
 *   default  — contexto de apoyo.
 *   attention— requiere acción; se tiñe según el tono semántico.
 */
export type StatEmphasis = 'lead' | 'default' | 'attention'

const ACCENT: Record<KpiTone, string> = {
  brand: 'text-viamar-600',
  ok: 'text-success',
  warn: 'text-warning',
  danger: 'text-critical',
  accent: 'text-viamar-accent',
  neutral: 'text-ink-tertiary',
}

/* Cuadro del icono: ancla visual estable para la métrica, sin teñir la tarjeta
   entera salvo cuando pide atención. */
const ICON_BOX: Record<KpiTone, string> = {
  brand: 'bg-viamar-50 text-viamar-600',
  ok: 'bg-success-soft text-success-text',
  warn: 'bg-warning-soft text-warning-text',
  danger: 'bg-critical-soft text-critical-text',
  accent: 'bg-info-soft text-info-text',
  neutral: 'bg-neutral-100 text-ink-secondary',
}

const ATTENTION_RING: Record<KpiTone, string> = {
  brand: 'ring-viamar-200 bg-viamar-50/60',
  ok: 'ring-success-border bg-success-soft/60',
  warn: 'ring-warning-border bg-warning-soft/60',
  danger: 'ring-critical-border bg-critical-soft/60',
  accent: 'ring-viamar-200 bg-viamar-50/60',
  neutral: 'ring-line bg-white',
}

const BAR_FILL: Record<KpiTone, string> = {
  brand: 'bg-viamar-500',
  ok: 'bg-success',
  warn: 'bg-warning',
  danger: 'bg-critical',
  accent: 'bg-viamar-accent',
  neutral: 'bg-neutral-400',
}

type StatCardProps = {
  label: string
  value: ReactNode
  /** Texto de contexto bajo la cifra: comparación, desglose o siguiente paso. */
  hint?: ReactNode
  /** Dato secundario junto a la cifra (por ejemplo, cuántos requieren acción). */
  delta?: { value: string; tone?: KpiTone }
  /**
   * Variación respecto al período anterior. Es `null` cuando no hay base de
   * comparación y entonces la tarjeta no la dibuja: un «+100 %» calculado
   * sobre cero informa peor que no decir nada.
   */
  change?: Variacion | null
  /** Con qué se compara: `vs. 6 meses anteriores`. */
  changeLabel?: string
  /** Si subir es bueno. Decide el color de la variación, no su dirección. */
  subirEsBueno?: boolean
  /** Serie histórica de la métrica: da forma a la cifra. */
  trend?: number[]
  trendKind?: 'line' | 'bars'
  /** Proporción que representa la cifra sobre un total. */
  progress?: { value: number; total: number; label?: ReactNode }
  tone?: KpiTone
  emphasis?: StatEmphasis
  icon?: LucideIcon
  /** Si se indica, la métrica se vuelve el acceso al listado que la explica. */
  to?: string
  onClick?: () => void
  className?: string
}

/**
 * Métrica con contexto.
 *
 * Una tarjeta con sólo etiqueta y número obliga al usuario a saber de memoria
 * si ese número es bueno. Por eso admite variación contra el período anterior,
 * serie histórica y proporción sobre un total: cada pieza es opcional y sólo
 * se dibuja cuando hay datos reales que la sostengan.
 */
export function StatCard({
  label,
  value,
  hint,
  delta,
  change,
  changeLabel,
  subirEsBueno = true,
  trend,
  trendKind = 'line',
  progress,
  tone = 'brand',
  emphasis = 'default',
  icon: Icon,
  to,
  onClick,
  className,
}: StatCardProps) {
  const interactive = Boolean(to || onClick)
  const hayTendencia = Boolean(trend && trend.length > 1)

  const cambioBueno =
    change && change.direccion !== 'igual' ? (change.direccion === 'sube') === subirEsBueno : null
  const ArrowIcon =
    change?.direccion === 'sube'
      ? ArrowUpRight
      : change?.direccion === 'baja'
        ? ArrowDownRight
        : Minus

  const body = (
    <>
      <div className="flex items-start gap-2.5">
        {Icon ? (
          <span
            className={cn(
              'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm',
              ICON_BOX[tone],
            )}
            aria-hidden="true"
          >
            <Icon size={16} strokeWidth={2} />
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="truncate text-label-md text-ink-secondary">{label}</p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span
              className={cn(
                'tabular-nums text-ink',
                emphasis === 'lead' ? 'text-metric-xl' : 'text-metric-lg',
              )}
            >
              {value}
            </span>
            {delta ? (
              <span className={cn('text-label-lg tabular-nums', ACCENT[delta.tone ?? tone])}>
                {delta.value}
              </span>
            ) : null}
          </div>
        </div>

        {hayTendencia ? (
          <div className="mt-1 hidden shrink-0 sm:block">
            {trendKind === 'bars' ? (
              <Sparkbars data={trend!} tone={tone} width={72} height={26} />
            ) : (
              <Sparkline data={trend!} tone={tone} width={72} height={26} />
            )}
          </div>
        ) : null}
      </div>

      {/* La variación va primero porque responde antes que nada a «¿va bien?». */}
      {change ? (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-body-xs">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-label-md tabular-nums',
              cambioBueno === null
                ? 'text-ink-tertiary'
                : cambioBueno
                  ? 'text-success-text'
                  : 'text-critical-text',
            )}
          >
            <ArrowIcon size={12} strokeWidth={2.4} aria-hidden="true" />
            {change.label}
          </span>
          {changeLabel ? <span className="truncate text-ink-tertiary">{changeLabel}</span> : null}
        </p>
      ) : null}

      {progress ? (
        <div className="mt-2">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100"
            role="progressbar"
            aria-valuenow={progress.value}
            aria-valuemin={0}
            aria-valuemax={progress.total}
          >
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-300 ease-brand',
                BAR_FILL[tone],
              )}
              style={{
                width: `${Math.min(100, Math.max(0, (progress.value / Math.max(1, progress.total)) * 100))}%`,
              }}
            />
          </div>
          {progress.label ? (
            <p className="mt-1 truncate text-body-xs text-ink-tertiary">{progress.label}</p>
          ) : null}
        </div>
      ) : null}

      {hint ? <p className="mt-1 truncate text-body-xs text-ink-tertiary">{hint}</p> : null}
    </>
  )

  const shell = cn(
    'block rounded-md px-3.5 py-3 text-left ring-1 ring-inset',
    emphasis === 'attention' ? ATTENTION_RING[tone] : 'bg-white ring-line',
    emphasis === 'lead' && 'ring-line-brand',
    interactive &&
      'transition-colors duration-fast ease-brand hover:bg-surface-hover hover:ring-line-brand focus-visible:shadow-focus',
    className,
  )

  if (to) {
    return (
      <Link to={to} className={shell}>
        {body}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(shell, 'w-full')}>
        {body}
      </button>
    )
  }
  return <article className={shell}>{body}</article>
}

/* ---------------------------------------------------------------------------
   Compatibilidad con las pantallas que aún no se han recompuesto.
   ------------------------------------------------------------------------ */

export function KpiTile({
  label,
  value,
  chip,
  chipTone,
  foot,
  tone = 'brand',
  icon,
}: {
  label: string
  value: string
  chip?: string
  chipTone?: KpiTone
  foot: string
  tone?: KpiTone
  icon: LucideIcon
}) {
  return (
    <StatCard
      label={label}
      value={value}
      hint={foot}
      delta={chip ? { value: chip, tone: chipTone ?? tone } : undefined}
      tone={tone}
      icon={icon}
      emphasis={tone === 'danger' || tone === 'warn' ? 'attention' : 'default'}
    />
  )
}
