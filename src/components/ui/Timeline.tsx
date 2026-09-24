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
    return <p className="text-body-sm text-ink-secondary">Sin eventos todavía.</p>
  }
  return (
    <ol className="relative ml-1.5 pl-7">
      {/* Hilo continuo: da al historial una lectura de sucesión, no de lista. */}
      <span aria-hidden="true" className="absolute bottom-3 left-[9px] top-3 w-px bg-line" />
      {events.map((e, i) => (
        <li key={e.id} className="relative mb-3 last:mb-0">
          {numbered ? (
            <span className="absolute -left-7 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-viamar-500 text-label-sm font-bold tabular-nums text-white ring-4 ring-surface-sunken">
              {i + 1}
            </span>
          ) : (
            <span className="absolute -left-[22px] mt-1.5 h-2.5 w-2.5 rounded-full bg-viamar-500 ring-4 ring-surface-sunken" />
          )}
          <div className="rounded border border-line bg-white px-3 py-2">
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
