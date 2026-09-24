import type { ReactNode } from 'react'

export function TwoLine({ top, sub }: { top: ReactNode; sub?: ReactNode }) {
  return (
    <span className="flex flex-col leading-tight min-w-0">
      <span className="text-label-lg text-ink truncate">{top}</span>
      {sub ? <span className="text-[11px] text-ink-secondary truncate mt-0.5">{sub}</span> : null}
    </span>
  )
}

export function MiniBar({ value, total, label }: { value: number; total: number; label?: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0
  return (
    <span className="flex flex-col gap-1 min-w-[84px]">
      <span className="text-label-md text-ink tabular-nums">{label ?? `${value} / ${total}`}</span>
      <span className="h-1.5 w-full rounded-full bg-viamar-100 overflow-hidden">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-viamar-accent to-viamar-500 transition-[width] duration-500 ease-brand"
          style={{ width: `${pct}%` }}
        />
      </span>
    </span>
  )
}
