import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Lightbulb,
  PieChart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { Insight, InsightTono } from '../../domain/analytics'
import { cn } from '../../lib/cn'
import { EmptyState } from './EmptyState'

const ICONOS = {
  'trend-up': TrendingUp,
  'trend-down': TrendingDown,
  share: PieChart,
  alert: AlertTriangle,
  money: DollarSign,
  clock: Clock,
  check: CheckCircle2,
} as const

const TONO: Record<InsightTono, string> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  ok: 'bg-success-soft text-success-text',
  warn: 'bg-warning-soft text-warning-text',
  danger: 'bg-critical-soft text-critical-text',
  info: 'bg-info-soft text-info-text',
}

/**
 * Lecturas derivadas de los datos del período.
 *
 * Cada línea es una conclusión, no una cifra suelta: el titular dice qué
 * ocurrió y el detalle enseña de dónde sale, para que el usuario pueda
 * desconfiar de ella. Los insights sin sustento no se rellenan con un texto
 * genérico — sencillamente no aparecen.
 */
export function InsightPanel({
  insights,
  emptyMessage = 'Aún no hay suficiente historia en el período para extraer lecturas.',
  className,
}: {
  insights: Insight[]
  emptyMessage?: string
  className?: string
}) {
  if (insights.length === 0) {
    return (
      <div className={cn('flex h-full items-center justify-center py-4', className)}>
        <EmptyState
          kind="empty"
          size="sm"
          title="Sin lecturas todavía"
          description={emptyMessage}
        />
      </div>
    )
  }

  return (
    <ul className={cn('flex flex-col gap-2.5', className)}>
      {insights.map((i) => {
        const Icon = ICONOS[i.icono] ?? Lightbulb
        return (
          <li key={i.id} className="flex gap-2.5">
            <span
              className={cn(
                'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm',
                TONO[i.tono],
              )}
              aria-hidden="true"
            >
              <Icon size={14} strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-label-lg leading-5 text-ink">{i.titulo}</span>
              <span className="mt-0.5 block text-body-xs leading-4 text-ink-tertiary">
                {i.detalle}
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
