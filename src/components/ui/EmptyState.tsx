import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-white border border-app-border rounded">
      {Icon ? <Icon className="text-viamar-400 mb-3" size={36} strokeWidth={1.6} /> : null}
      <h2 className="text-headline-sm text-viamar-800">{title}</h2>
      {description ? (
        <p className="text-body-sm text-ink-secondary mt-2 max-w-md">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
