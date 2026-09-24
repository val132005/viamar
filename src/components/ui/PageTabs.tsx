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
 * La activa se eleva sobre el fondo —blanca, con sombra mínima y un filo azul
 * inferior— y las demás quedan hundidas en gris. Así la fila se lee como una
 * hilera de fichas y la seleccionada parece continuar en el panel de abajo,
 * que es justo la relación que tienen.
 */
export function PageTabs({ tabs, active, onChange, action, className }: Props) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-1.5', className)}>
      <div role="tablist" className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
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
                'relative inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-md px-3.5',
                'text-label-lg transition-colors duration-fast ease-brand',
                on
                  ? 'bg-white text-ink shadow-xs ring-1 ring-inset ring-line'
                  : 'bg-neutral-100 text-ink-secondary hover:bg-neutral-200/70 hover:text-ink',
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
                    'tabular-nums',
                    on
                      ? t.tone === 'danger'
                        ? 'text-critical'
                        : 'text-viamar-600'
                      : 'text-ink-tertiary',
                  )}
                >
                  {t.count}
                </span>
              ) : null}

              {/* Filo inferior: ata la pestaña activa al panel que hay debajo. */}
              {on ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-viamar-500"
                />
              ) : null}
            </button>
          )
        })}
      </div>

      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  )
}
