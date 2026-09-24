import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, X } from 'lucide-react'
import { cn } from '../../lib/cn'

export type DrawerTab = { id: string; label: string; count?: number }

type Props = {
  open: boolean
  onClose: () => void
  /** Identificador del registro: serial, número de certificado, nombre. */
  title: ReactNode
  /** Qué es el registro y en qué estado está. */
  subtitle?: ReactNode
  /** Etiquetas de estado junto al título. */
  chips?: ReactNode
  /** Secciones del panel. Con una sola, la barra de pestañas no se dibuja. */
  tabs?: DrawerTab[]
  activeTab?: string
  onTabChange?: (id: string) => void
  /** Acceso a la ficha completa, cuando el panel no agota la información. */
  fullView?: { to: string; label?: string }
  /** Acciones del registro, ancladas al pie. */
  actions?: ReactNode
  width?: 'md' | 'lg'
  children: ReactNode
}

/**
 * Panel lateral de detalle.
 *
 * Existe para responder «¿qué es este registro?» sin abandonar la lista: el
 * usuario conserva su filtro, su página y su posición de scroll. Cuando la
 * respuesta no cabe aquí, `fullView` lleva a la ficha — pero eso es una
 * decisión del usuario, no un salto que la aplicación le impone.
 */
export function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  chips,
  tabs,
  activeTab,
  onTabChange,
  fullView,
  actions,
  width = 'md',
  children,
}: Props) {
  const panelRef = useRef<HTMLElement>(null)
  /* Se desmonta tras la salida para no dejar un panel invisible capturando
     clics, pero se mantiene durante la animación para que se vea cerrarse. */
  const [montado, setMontado] = useState(open)

  useEffect(() => {
    if (open) {
      setMontado(true)
      return
    }
    const t = window.setTimeout(() => setMontado(false), 200)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    /* El foco entra al panel: con teclado, el detalle debe ser alcanzable. */
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!montado) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Cerrar panel de detalle"
        onClick={onClose}
        className={cn(
          'flex-1 bg-viamar-950/25 transition-opacity duration-200 ease-brand',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />

      <aside
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'flex h-full w-full flex-col border-l border-line bg-white shadow-lg outline-none',
          'transition-transform duration-200 ease-brand',
          width === 'lg' ? 'max-w-2xl' : 'max-w-md',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="shrink-0 border-b border-line px-4 pb-3 pt-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-headline-lg text-ink">{title}</h2>
                {chips}
              </div>
              {subtitle ? (
                <p className="mt-0.5 text-body-sm text-ink-secondary">{subtitle}</p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {fullView ? (
                <Link
                  to={fullView.to}
                  className="inline-flex h-8 items-center gap-1 rounded-sm px-2 text-label-md text-viamar-600 transition-colors duration-fast hover:bg-viamar-50"
                >
                  {fullView.label ?? 'Ficha completa'}
                  <ArrowUpRight size={14} />
                </Link>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-tertiary transition-colors duration-fast hover:bg-neutral-100 hover:text-ink"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {tabs && tabs.length > 1 ? (
            <div role="tablist" className="mt-3 flex items-center gap-0.5 rounded bg-neutral-100 p-0.5">
              {tabs.map((t) => {
                const on = t.id === activeTab
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => onTabChange?.(t.id)}
                    className={cn(
                      'inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-sm px-2 text-label-lg transition-colors duration-fast',
                      on ? 'bg-white text-ink shadow-xs' : 'text-ink-secondary hover:text-ink',
                    )}
                  >
                    {t.label}
                    {t.count !== undefined ? (
                      <span className={cn('tabular-nums', on ? 'text-viamar-600' : 'text-ink-tertiary')}>
                        {t.count}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ) : null}
        </header>

        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-4 py-3.5">{children}</div>

        {actions ? (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line px-4 py-3">
            {actions}
          </footer>
        ) : null}
      </aside>
    </div>
  )
}

/**
 * Bloque de pares etiqueta/valor dentro del panel. Dos columnas en el panel
 * ancho, una en el estrecho: los valores nunca se parten a media palabra.
 */
export function DrawerSection({
  title,
  action,
  children,
  className,
}: {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('mb-4 last:mb-0', className)}>
      {title ? (
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-label-lg text-ink-secondary">{title}</h3>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

/** Lista de propiedades del registro. */
export function DrawerFacts({
  items,
  columns = 2,
}: {
  items: Array<{ label: ReactNode; value: ReactNode; full?: boolean }>
  columns?: 1 | 2
}) {
  return (
    <dl className={cn('grid gap-x-4 gap-y-2.5', columns === 2 ? 'sm:grid-cols-2' : '')}>
      {items.map((f, i) => (
        <div key={i} className={cn('min-w-0', f.full && 'sm:col-span-2')}>
          <dt className="text-body-xs text-ink-tertiary">{f.label}</dt>
          <dd className="mt-0.5 text-body-sm text-ink">{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}
