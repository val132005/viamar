import type { ReactNode } from 'react'
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

export function Wizard({ steps, current, onBack, onNext, nextLabel = 'Siguiente', children }: Props) {
  return (
    <div className="surface overflow-hidden">
      <ol className="flex overflow-x-auto border-b border-app-border bg-gradient-to-r from-viamar-50 to-white">
        {steps.map((step, i) => (
          <li
            key={step.id}
            className={cn(
              'flex-1 min-w-36 px-4 py-4 border-r border-app-border last:border-r-0 flex items-start gap-3',
              i === current && 'bg-white',
            )}
          >
            <span
              className={cn(
                'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-label-sm',
                i < current && 'bg-viamar-500 text-white',
                i === current && 'bg-viamar-900 text-white shadow-brand-btn',
                i > current && 'bg-viamar-100 text-viamar-700',
              )}
            >
              {i + 1}
            </span>
            <span>
              <p className="text-label-sm uppercase tracking-[0.1em] text-ink-secondary">Paso {i + 1}</p>
              <p className={cn('text-label-md', i === current ? 'text-viamar-800' : 'text-ink')}>
                {step.title}
              </p>
            </span>
          </li>
        ))}
      </ol>
      <div className="p-5">{children}</div>
      <footer className="px-5 py-4 border-t border-app-border flex justify-between bg-app-surface-alt/60">
        <Button variant="outlined" onClick={onBack} disabled={!onBack || current === 0}>
          Atrás
        </Button>
        <Button onClick={onNext} disabled={!onNext}>
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
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-headline-sm">{title}</h3>
        {description ? <p className="text-body-sm text-ink-secondary mt-1">{description}</p> : null}
      </div>
      {children}
    </div>
  )
}
