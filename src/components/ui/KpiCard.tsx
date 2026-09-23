import type { LucideIcon } from 'lucide-react'

type Props = {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
}

export function KpiCard({ label, value, hint, icon: Icon }: Props) {
  return (
    <article className="bg-white border border-app-border rounded p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-label-md text-ink-secondary">{label}</p>
        {Icon ? <Icon size={18} className="text-viamar-400" /> : null}
      </div>
      <p className="text-headline-lg text-viamar-800 mt-2">{value}</p>
      {hint ? <p className="text-body-sm text-ink-secondary mt-1">{hint}</p> : null}
    </article>
  )
}
