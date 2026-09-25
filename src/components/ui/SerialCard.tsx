import { StatusBadge } from './StatusBadge'

type Props = {
  serial: string
  articulo?: string
  estadoId?: string
  ubicacion?: string
}

export function SerialCard({ serial, articulo, estadoId, ubicacion }: Props) {
  return (
    <article className="surface flex flex-col gap-2 p-4 transition-shadow duration-200 hover:shadow-md">
      <p className="font-semibold tabular-nums text-viamar-500">{serial}</p>
      {articulo ? <p className="text-body-md">{articulo}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        {estadoId ? <StatusBadge catalogId={estadoId} /> : null}
        {ubicacion ? <span className="text-body-sm text-ink-secondary">{ubicacion}</span> : null}
      </div>
    </article>
  )
}
