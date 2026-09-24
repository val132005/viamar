import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'

type Props = {
  title: ReactNode
  /** Contexto bajo el título: qué mide el bloque o de qué período habla. */
  description?: ReactNode
  icon?: ReactNode
  /** Controles del bloque: selector de rango, segmentado, leyenda. */
  toolbar?: ReactNode
  /** Enlace de salida al detalle completo del bloque. */
  link?: { to: string; label?: string }
  /** Quita el relleno del cuerpo: para tablas y listas a sangre. */
  flush?: boolean
  /** El bloque crece hasta ocupar el alto disponible de su celda. */
  fill?: boolean
  footer?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

/**
 * Contenedor canónico de un bloque del workspace. Existe para que ningún
 * módulo vuelva a componer su propia cabecera de panel: la jerarquía entre
 * título, contexto y controles se decide aquí una vez.
 */
export function SectionCard({
  title,
  description,
  icon,
  toolbar,
  link,
  flush = false,
  fill = false,
  footer,
  children,
  className,
  bodyClassName,
}: Props) {
  return (
    <section
      className={cn(
        'surface flex min-w-0 flex-col overflow-hidden',
        fill && 'min-h-0 flex-1',
        className,
      )}
    >
      <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line px-3.5 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {icon ? (
            <span className="shrink-0 text-ink-tertiary" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="truncate text-headline-md text-ink">{title}</h2>
            {description ? (
              <p className="truncate text-body-xs text-ink-tertiary">{description}</p>
            ) : null}
          </div>
        </div>

        {toolbar ? <div className="flex shrink-0 items-center gap-2">{toolbar}</div> : null}

        {link ? (
          <Link
            to={link.to}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-sm px-1.5 py-1 text-label-md text-viamar-600 transition-colors duration-fast hover:bg-viamar-50 hover:text-viamar-700"
          >
            {link.label ?? 'Ver todos'}
            <ChevronRight size={14} />
          </Link>
        ) : null}
      </header>

      <div
        className={cn(
          'min-h-0 flex-1',
          flush ? '' : 'p-3.5',
          fill && 'scroll-slim overflow-y-auto',
          bodyClassName,
        )}
      >
        {children}
      </div>

      {footer ? (
        <footer className="shrink-0 border-t border-line px-3.5 py-2">{footer}</footer>
      ) : null}
    </section>
  )
}
