import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from './Button'

export type WizardStep = {
  id: string
  title: string
  description?: string
}

type Props = {
  steps: WizardStep[]
  current: number
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  children: ReactNode
}

/**
 * Asistente por pasos con la piel del panel: tarjeta blanca, pasos en círculo
 * unidos por un trazo que se tiñe al avanzar, y un pie gris azulado para las
 * acciones —el mismo pie que los diálogos—.
 */
export function Wizard({ steps, current, onBack, onNext, nextLabel = 'Siguiente', children }: Props) {
  const pct = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 0
  return (
    <div className="surface overflow-hidden">
      <div className="px-5 pb-4 pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-label-md text-ink-secondary">
            Paso <span className="text-ink">{current + 1}</span> de {steps.length}
          </p>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-neutral-100">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-viamar-500 to-viamar-accent transition-[width] duration-300 ease-brand"
              style={{ width: `${Math.max(6, pct)}%` }}
            />
          </div>
        </div>
        <ol className="scroll-slim flex items-center overflow-x-auto pb-1">
          {steps.map((step, i) => {
            const hecho = i < current
            const activo = i === current
            return (
              <li key={step.id} className="flex min-w-0 flex-1 items-center last:flex-none">
                <div className="flex shrink-0 items-center gap-2.5">
                  <span
                    className={cn(
                      'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-label-md font-bold tabular-nums transition-colors duration-fast',
                      hecho && 'bg-success-soft text-success',
                      activo && 'bg-viamar-500 text-white shadow-[0_0_0_4px_rgba(32,106,169,0.14)]',
                      !hecho && !activo && 'bg-neutral-100 text-ink-tertiary',
                    )}
                  >
                    {hecho ? <Check size={15} strokeWidth={3} /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      'whitespace-nowrap text-label-lg',
                      activo ? 'text-viamar-600' : hecho ? 'text-ink' : 'text-ink-tertiary',
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {i < steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mx-3 h-[3px] min-w-6 flex-1 rounded-full transition-colors duration-300',
                      hecho ? 'bg-success/60' : 'bg-neutral-200',
                    )}
                  />
                ) : null}
              </li>
            )
          })}
        </ol>
      </div>
      <div className="border-t border-line-subtle px-5 py-5">{children}</div>
      <footer className="flex justify-between gap-3 border-t border-[#edf1f6] bg-[#f7fafd] px-5 py-3">
        <Button
          variant="outlined"
          leadingIcon={<ArrowLeft size={15} />}
          onClick={onBack}
          disabled={!onBack || current === 0}
        >
          Atrás
        </Button>
        <Button onClick={onNext} disabled={!onNext} trailingIcon={<ArrowRight size={15} />}>
          {current === steps.length - 1 ? 'Finalizar' : nextLabel}
        </Button>
      </footer>
    </div>
  )
}

export function WizardStepPanel({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="flex max-w-4xl flex-col gap-3.5">
      <div>
        <h3 className="text-headline-md text-ink">{title}</h3>
        {description ? <p className="mt-0.5 text-body-sm text-ink-secondary">{description}</p> : null}
      </div>
      {children}
    </div>
  )
}
