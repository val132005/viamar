import type { ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../lib/cn'

export type ActiveFilter = {
  id: string
  label: string
  value: string
  onRemove: () => void
}

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  children?: ReactNode
  /** Filtros aplicados: siempre visibles y siempre reversibles de un clic. */
  active?: ActiveFilter[]
  onClearAll?: () => void
  className?: string
}

export function FilterBar({
  value,
  onChange,
  placeholder = 'Buscar…',
  children,
  active,
  onClearAll,
  className,
}: Props) {
  const hasActive = Boolean(active?.length)
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={value} onChange={onChange} placeholder={placeholder} />
        {children}
      </div>

      {hasActive ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-body-xs text-ink-tertiary">Filtros:</span>
          {active?.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={f.onRemove}
              className={cn(
                'group inline-flex h-[24px] items-center gap-1 rounded-full pl-2.5 pr-1.5',
                'bg-viamar-50 text-label-md text-viamar-700 ring-1 ring-inset ring-viamar-200',
                'transition-colors duration-fast hover:bg-viamar-100',
              )}
            >
              <span className="text-ink-tertiary">{f.label}:</span>
              {f.value}
              <X
                size={12}
                className="text-ink-tertiary transition-colors group-hover:text-critical"
                aria-label={`Quitar filtro ${f.label}`}
              />
            </button>
          ))}
          {onClearAll ? (
            <button
              type="button"
              onClick={onClearAll}
              className="ml-0.5 text-label-md text-ink-secondary underline-offset-2 transition-colors duration-fast hover:text-viamar-600 hover:underline"
            >
              Limpiar todo
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** Campo de búsqueda reutilizable, con botón de limpiado cuando hay texto. */
export function SearchField({
  value,
  onChange,
  placeholder = 'Buscar…',
  size = 'md',
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div className={cn('relative min-w-52 flex-1', className)}>
      <Search
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7d90]"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          /* Piel de los controles de la tabla del panel. */
          'w-full rounded-[6px] border border-[#d9e2ec] bg-white pl-8 pr-8 text-[12.5px] text-[#1c2b42]',
          'placeholder:text-[#8591a3]',
          'transition-colors duration-fast',
          'hover:border-viamar-300',
          'focus:border-viamar-400 focus:shadow-focus focus:outline-none',
          '[&::-webkit-search-cancel-button]:appearance-none',
          size === 'sm' ? 'h-[31px]' : 'h-[34px]',
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
          className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-xs text-ink-tertiary transition-colors duration-fast hover:bg-neutral-100 hover:text-ink"
        >
          <X size={13} />
        </button>
      ) : null}
    </div>
  )
}

/** Control segmentado: para alternar entre vistas excluyentes y pocas. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
}: {
  options: Array<{ id: T; label: string; count?: number }>
  value: T
  onChange: (id: T) => void
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-[7px] border border-[#e3eaf2] bg-[#f0f5fa] p-0.5',
        className,
      )}
    >
      {options.map((opt) => {
        const on = opt.id === value
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(opt.id)}
            className={cn(
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] px-2.5 font-semibold',
              'transition-colors duration-fast',
              size === 'sm' ? 'h-6 text-label-md' : 'h-7 text-label-lg',
              on
                ? 'bg-white text-viamar-600 shadow-xs'
                : 'text-ink-secondary hover:text-viamar-600',
            )}
          >
            {opt.label}
            {opt.count !== undefined ? (
              <span
                className={cn(
                  'tabular-nums',
                  on ? 'text-viamar-600' : 'text-ink-tertiary',
                )}
              >
                {opt.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
