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
    <div className="bg-white border border-app-border rounded">
      <ol className="flex overflow-x-auto border-b border-app-border">
        {steps.map((step, i) => (
          <li
            key={step.id}
            className={cn(
              'flex-1 min-w-36 px-3 py-3 border-r border-app-border last:border-r-0',
              i === current && 'bg-viamar-50',
            )}
          >
            <p className="text-label-sm uppercase text-ink-secondary">Paso {i + 1}</p>
            <p className={cn('text-label-md', i === current ? 'text-viamar-800' : 'text-ink')}>
              {step.title}
            </p>
          </li>
        ))}
      </ol>
      <div className="p-4">{children}</div>
      <footer className="px-4 py-3 border-t border-app-border flex justify-between">
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
