import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'

export type Crumb = { label: string; to?: string }

type Props = {
  title: string
  description?: string
  /** Ruta de contexto: dice al usuario dónde está sin gastar una línea de título. */
  breadcrumbs?: Crumb[]
  chips?: ReactNode
  actions?: ReactNode
  /** Cifras de contexto que acompañan al título, en una sola línea. */
  meta?: Array<{ label: string; value: ReactNode; tone?: 'default' | 'critical' }>
  /** Tabs de sección, ancladas bajo el título. */
  tabs?: ReactNode
  className?: string
}

/**
 * Encabezado de página. No es una tarjeta: se apoya en el fondo y se separa
 * del contenido con una línea, de modo que no añade una caja más ni roba
 * altura al área de trabajo.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  chips,
  actions,
  meta,
  tabs,
  className,
}: Props) {
  return (
    <header className={cn('shrink-0', className)}>
      {breadcrumbs?.length ? (
        <nav aria-label="Ruta de navegación" className="mb-1.5 flex items-center gap-1">
          {breadcrumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
              {i > 0 ? (
                <ChevronRight size={13} className="text-ink-disabled" aria-hidden="true" />
              ) : null}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="text-body-xs text-ink-tertiary transition-colors duration-fast hover:text-viamar-600"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-body-xs text-ink-secondary">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-display text-ink">{title}</h1>
            {chips}
          </div>
          {description ? (
            <p className="mt-1 max-w-4xl text-body-md text-ink-secondary">{description}</p>
          ) : null}
        </div>

        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {meta?.length ? (
        <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
          {meta.map((m) => (
            <div key={m.label} className="flex items-baseline gap-1.5">
              <dt className="text-body-xs text-ink-tertiary">{m.label}</dt>
              <dd
                className={cn(
                  'text-label-lg tabular-nums',
                  m.tone === 'critical' ? 'text-critical-text' : 'text-ink',
                )}
              >
                {m.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {tabs ? <div className="mt-3">{tabs}</div> : null}
    </header>
  )
}
