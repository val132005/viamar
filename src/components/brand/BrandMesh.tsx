import { cn } from '../../lib/cn'

/**
 * Lienzo de marca. Se reserva a superficies públicas —acceso y consulta de
 * certificado—, donde la identidad manda. Dentro de la aplicación operativa no
 * se usa: ahí el fondo debe desaparecer detrás de los datos.
 */
export function BrandMesh({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('brand-canvas pointer-events-none absolute inset-0 overflow-hidden', className)}
    />
  )
}
