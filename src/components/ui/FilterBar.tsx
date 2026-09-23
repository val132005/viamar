import type { ReactNode } from 'react'
import { Search } from 'lucide-react'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  children?: ReactNode
}

export function FilterBar({ value, onChange, placeholder = 'Filtrar…', children }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative flex-1 min-w-56">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-secondary" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full pl-9 pr-3 rounded border border-app-border-strong bg-white"
        />
      </label>
      {children}
    </div>
  )
}
