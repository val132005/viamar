import type { ReactNode } from 'react'

export function TwoLine({ top, sub }: { top: ReactNode; sub?: ReactNode }) {
  return (
    <span className="flex flex-col leading-tight min-w-0">
      <span className="truncate text-[12px] font-semibold text-[#1c2b42]">{top}</span>
      {sub ? <span className="mt-0.5 truncate text-[11px] text-[#7a8799]">{sub}</span> : null}
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
