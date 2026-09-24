import { cn } from '../../lib/cn'

/**
 * Estados de carga. Un esqueleto debe imitar la forma de lo que va a llegar:
 * así la página no salta cuando los datos entran.
 */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('skeleton block', className)} />
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3.5', i === lines - 1 ? 'w-2/5' : i % 2 ? 'w-4/5' : 'w-full')}
        />
      ))}
    </div>
  )
}

/** Esqueleto de tabla: respeta el número de columnas para no descuadrar el layout. */
export function SkeletonTable({
  rows = 6,
  columns = 5,
  className,
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={cn('w-full', className)} role="status" aria-label="Cargando datos">
      <div className="flex h-9 items-center gap-4 border-b border-line px-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-2.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex h-row items-center gap-4 border-b border-line-subtle px-4">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn('h-3.5 flex-1', c === 0 ? 'max-w-[140px]' : '')}
              // Ancho escalonado: evita el patrón de rejilla perfecta, que se lee como error.
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('surface p-4', className)} role="status" aria-label="Cargando">
      <Skeleton className="h-2.5 w-24" />
      <Skeleton className="mt-3 h-7 w-20" />
      <Skeleton className="mt-3 h-2.5 w-full" />
    </div>
  )
}
