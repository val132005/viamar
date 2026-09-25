import { Check, X } from 'lucide-react'
import { cn } from '../../lib/cn'

export type ProcessStep = {
  id: string
  label: string
  /** Detalle breve: fecha, responsable o cuántos elementos hay en esta etapa. */
  hint?: string
}

type Props = {
  steps: ProcessStep[]
  /** Índice de la etapa actual. Las anteriores se dan por completadas. */
  current: number
  /** Marca el proceso como interrumpido en la etapa actual. */
  aborted?: boolean
  className?: string
}

/**
 * Indicador de etapas. Responde a una pregunta que una tabla no puede
 * contestar de un vistazo: en qué punto del recorrido está esto y qué falta.
 */
export function ProcessSteps({ steps, current, aborted = false, className }: Props) {
  return (
    <ol className={cn('flex flex-wrap items-center gap-x-1 gap-y-2', className)}>
      {steps.map((step, i) => {
        const done = i < current
        const active = i === current
        const failed = active && aborted

        return (
          <li key={step.id} className="flex items-center gap-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-label-md font-bold tabular-nums transition-colors duration-fast',
                  failed && 'bg-critical text-white',
                  !failed && done && 'bg-success-soft text-success',
                  !failed && active && 'bg-viamar-500 text-white shadow-[0_0_0_4px_rgba(32,106,169,0.14)]',
                  !failed && !done && !active && 'bg-neutral-100 text-ink-tertiary',
                )}
              >
                {failed ? (
                  <X size={14} strokeWidth={3} />
                ) : done ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  i + 1
                )}
              </span>

              <span className="min-w-0">
                <span
                  className={cn(
                    'block whitespace-nowrap',
                    active ? 'text-label-lg text-ink' : 'text-label-md',
                    done && 'text-ink-secondary',
                    !done && !active && 'text-ink-tertiary',
                    failed && 'text-critical-text',
                  )}
                >
                  {step.label}
                </span>
                {step.hint ? (
                  <span className="block whitespace-nowrap text-body-xs text-ink-tertiary">
                    {step.hint}
                  </span>
                ) : null}
              </span>
            </div>

            {i < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn('mx-2.5 h-[3px] w-10 shrink-0 rounded-full', done ? 'bg-success/70' : 'bg-neutral-200')}
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

/** Barra de avance con su cifra: sustituye a un «0/3» suelto en una celda. */
export function ProgressBar({
  done,
  total,
  className,
  showLabel = true,
}: {
  done: number
  total: number
  className?: string
  showLabel?: boolean
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const complete = total > 0 && done === total

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="h-2 w-full min-w-[44px] max-w-[96px] overflow-hidden rounded-full bg-neutral-100"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <span
          className={cn(
            'block h-full rounded-full transition-[width] duration-300 ease-brand',
            complete ? 'bg-success' : 'bg-gradient-to-r from-viamar-500 to-viamar-accent',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel ? (
        <span
          className={cn(
            'shrink-0 text-label-md tabular-nums',
            complete ? 'text-success-text' : 'text-ink-secondary',
          )}
        >
          {done}/{total}
        </span>
      ) : null}
    </div>
  )
}
