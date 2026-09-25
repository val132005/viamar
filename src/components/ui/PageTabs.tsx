import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type PageTab = {
  id: string
  label: string
  /** Cifra del conjunto que representa la pestaña. */
  count?: number
  tone?: 'default' | 'danger'
  icon?: ReactNode
}

type Props = {
  tabs: PageTab[]
  active: string
  onChange: (id: string) => void
  /** Acción alineada al extremo derecho de la fila (botón primario o enlace). */
  action?: ReactNode
  className?: string
}

/**
 * Pestañas de página: cambian el conjunto de datos que se está mirando, no
 * la sección de una tarjeta.
 *
 * Mismas pestañas subrayadas que Dashboard y Trazabilidad: texto sobre el
 * fondo, cifra en gris y un filo azul bajo la activa que se apoya en la línea
 * base de la fila.
 */
export function PageTabs({ tabs, active, onChange, action, className }: Props) {
  return (
    <div className={cn('flex flex-wrap items-end gap-x-3 gap-y-1.5 border-b border-line', className)}>
      <div role="tablist" className="flex min-w-0 flex-1 flex-wrap items-end gap-1">
        {tabs.map((t) => {
          const on = t.id === active
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onChange(t.id)}
              className={cn(
                'relative -mb-px inline-flex items-center gap-1.5 whitespace-nowrap px-4 pb-2.5 pt-1',
                'text-label-lg transition-colors duration-fast',
                on ? 'text-viamar-600' : 'text-ink hover:text-viamar-600',
              )}
            >
              {t.icon ? (
                <span className={cn(on ? 'text-viamar-500' : 'text-ink-tertiary')} aria-hidden="true">
                  {t.icon}
                </span>
              ) : null}
              {t.label}
              {t.count !== undefined ? (
                <span
                  className={cn(
                    'text-label-md tabular-nums',
                    t.tone === 'danger' ? 'text-critical' : on ? 'text-viamar-400' : 'text-ink-tertiary',
                  )}
                >
                  {t.count}
                </span>
              ) : null}
              <span
                aria-hidden="true"
                className={cn(
                  'absolute inset-x-0 bottom-0 h-[2.5px] rounded-full transition-colors duration-fast',
                  on ? 'bg-viamar-600' : 'bg-transparent',
                )}
              />
            </button>
          )
        })}
      </div>

      {action ? <div className="flex shrink-0 items-center gap-2 pb-2">{action}</div> : null}
    </div>
  )
}
