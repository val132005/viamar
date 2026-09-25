import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Info } from 'lucide-react'
import { cn } from '../../lib/cn'

type Props = {
  title: ReactNode
  /** Contexto bajo el título: qué mide el bloque o de qué período habla. */
  description?: ReactNode
  icon?: ReactNode
  /** Qué mide el bloque: se lee al pasar sobre el icono de ayuda. */
  info?: string
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
 * Contenedor canónico de un bloque. Es la tarjeta del panel de Dashboard y
 * Trazabilidad: blanca, esquinas de 14 px, sombra mínima y la cabecera sin
 * línea divisoria —el título se apoya en el aire—, salvo cuando el cuerpo va a
 * sangre y la línea separa el título de la primera fila.
 */
export function SectionCard({
  title,
  description,
  icon,
  info,
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
      <header
        className={cn(
          'flex min-h-[46px] shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 px-4 pt-3.5',
          flush ? 'border-b border-line-subtle pb-3' : 'pb-1',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {icon ? (
            <span
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-viamar-50 text-viamar-600 [&_svg]:h-[15px] [&_svg]:w-[15px]"
              aria-hidden="true"
            >
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="flex min-w-0 items-center gap-1.5 text-headline-sm text-ink">
              <span className="truncate">{title}</span>
              {info ? (
                <span title={info} className="inline-flex shrink-0 cursor-help text-ink-tertiary hover:text-viamar-500">
                  <Info size={14} strokeWidth={2} aria-label={info} />
                </span>
              ) : null}
            </h2>
            {description ? (
              <p className="mt-0.5 truncate text-body-xs text-ink-tertiary">{description}</p>
            ) : null}
          </div>
        </div>

        {toolbar ? <div className="flex shrink-0 flex-wrap items-center gap-2">{toolbar}</div> : null}

        {link ? (
          <Link
            to={link.to}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-sm px-1.5 py-1 text-label-md text-viamar-500 transition-colors duration-fast hover:bg-viamar-50 hover:text-viamar-700"
          >
            {link.label ?? 'Ver todos'}
            <ChevronRight size={14} />
          </Link>
        ) : null}
      </header>

      <div
        className={cn(
          'min-h-0 flex-1',
          flush ? '' : 'px-4 pb-4 pt-2.5',
          fill && 'scroll-slim overflow-y-auto',
          bodyClassName,
        )}
      >
        {children}
      </div>

      {footer ? (
        <footer className="shrink-0 border-t border-line-subtle bg-surface-subtle/60 px-4 py-2.5">{footer}</footer>
      ) : null}
    </section>
  )
}
