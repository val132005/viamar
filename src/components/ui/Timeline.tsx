import { StatusBadge } from './StatusBadge'

export type TimelineEvent = {
  id: string
  title: string
  description?: string
  date: string
  origenId?: string
  actor?: string
}

type Props = {
  events: TimelineEvent[]
  numbered?: boolean
}

export function Timeline({ events, numbered = true }: Props) {
  if (events.length === 0) {
    return <p className="py-8 text-center text-body-sm text-ink-tertiary">Sin eventos todavía.</p>
  }
  return (
    <ol className="relative ml-1 pl-10">
      {/* Hilo continuo: da al historial una lectura de sucesión, no de lista. */}
      <span aria-hidden="true" className="absolute bottom-4 left-[13px] top-4 w-[2px] rounded-full bg-viamar-100" />
      {events.map((e, i) => (
        <li key={e.id} className="relative mb-3 last:mb-0">
          {numbered ? (
            <span className="absolute -left-10 mt-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-viamar-500 text-label-md font-bold tabular-nums text-white ring-4 ring-white">
              {i + 1}
            </span>
          ) : (
            <span className="absolute -left-[31px] mt-3 h-2.5 w-2.5 rounded-full bg-viamar-500 ring-4 ring-white" />
          )}
          <div className="rounded-xl border border-line bg-white px-4 py-2.5 shadow-xs transition-[border-color,box-shadow] duration-fast hover:border-viamar-200 hover:shadow-md">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="text-label-lg text-ink">{e.title}</p>
                {e.origenId ? <StatusBadge catalogId={e.origenId} variant="quiet" /> : null}
              </div>
              <p className="shrink-0 text-body-xs text-ink-tertiary">{e.date}</p>
            </div>
            {e.description ? (
              <p className="mt-0.5 text-body-sm text-ink-secondary">{e.description}</p>
            ) : null}
            {e.actor ? <p className="mt-0.5 text-body-xs text-ink-tertiary">{e.actor}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
