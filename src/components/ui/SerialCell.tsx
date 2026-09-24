import { Link } from 'react-router-dom'
import { ScanLine } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * Identificador de batería. El serial es el dato que el operario busca con la
 * vista, así que se trata como enlace tipográfico: sin recuadro de icono, que
 * repetido en cada fila solo añade ruido.
 */
export function SerialCell({
  serial,
  to,
  icon = false,
  className,
}: {
  serial: string
  to?: string
  /** Icono de apoyo: reservado a vistas donde el serial no es la columna guía. */
  icon?: boolean
  className?: string
}) {
  const href = to ?? `/serial/${serial}`
  return (
    <Link
      to={href}
      className={cn(
        'group inline-flex min-w-0 items-center gap-1.5 font-code-serial text-viamar-700',
        'transition-colors duration-fast hover:text-viamar-500 hover:underline underline-offset-2',
        className,
      )}
    >
      {icon ? (
        <ScanLine size={13} strokeWidth={2.2} className="shrink-0 text-ink-tertiary" aria-hidden="true" />
      ) : null}
      <span className="truncate">{serial}</span>
    </Link>
  )
}
