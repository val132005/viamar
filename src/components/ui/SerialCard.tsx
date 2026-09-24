import { StatusBadge } from './StatusBadge'

type Props = {
  serial: string
  articulo?: string
  estadoId?: string
  ubicacion?: string
}

export function SerialCard({ serial, articulo, estadoId, ubicacion }: Props) {
  return (
    <article className="surface surface-hover p-4 flex flex-col gap-2">
      <p className="font-code-serial text-viamar-700">{serial}</p>
      {articulo ? <p className="text-body-md">{articulo}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        {estadoId ? <StatusBadge catalogId={estadoId} /> : null}
        {ubicacion ? <span className="text-body-sm text-ink-secondary">{ubicacion}</span> : null}
      </div>
    </article>
  )
}
