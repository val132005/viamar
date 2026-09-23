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
    <ol className="relative ml-2 pl-8">
      <span className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-viamar-500 via-viamar-200 to-app-border" />
      {events.map((e, i) => (
        <li key={e.id} className="relative mb-4 last:mb-0">
          {numbered ? (
            <span className="absolute -left-8 mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-viamar-500 text-[11px] font-bold text-white ring-4 ring-white">
              {i + 1}
            </span>
          ) : (
            <span className="absolute -left-[23px] mt-2 h-3 w-3 rounded-full bg-viamar-500 ring-4 ring-white" />
          )}
          <div className="rounded border border-app-border bg-app-surface-alt p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-label-md text-ink">{e.title}</p>
                {e.origenId ? <StatusBadge catalogId={e.origenId} /> : null}
              </div>
              <p className="text-body-sm text-ink-secondary">{e.date}</p>
            </div>
            {e.actor ? <p className="mt-1 text-body-sm text-ink-secondary">Actor: {e.actor}</p> : null}
            {e.description ? <p className="mt-1 text-body-sm">{e.description}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
