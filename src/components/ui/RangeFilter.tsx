import { useEffect, useRef, useState } from 'react'
import { CalendarRange, Check, ChevronDown } from 'lucide-react'
import { RANGOS, periodoLabel, type Periodo, type RangoId } from '../../domain/analytics'
import { cn } from '../../lib/cn'

/**
 * Selector de período.
 *
 * Muestra el rango elegido **y** las fechas que abarca: «Últimos 6 meses» sin
 * decir cuáles obliga al usuario a calcularlas de cabeza cada vez que lee una
 * cifra comparada.
 */
export function RangeFilter({
  value,
  onChange,
  periodo,
  size = 'md',
  className,
}: {
  value: RangoId
  onChange: (id: RangoId) => void
  periodo: Periodo
  size?: 'sm' | 'md'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const actual = RANGOS.find((r) => r.id === value) ?? RANGOS[1]

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-2 rounded border border-line-strong bg-white px-2.5 text-left',
          'transition-colors duration-fast hover:border-line-brand focus-visible:shadow-focus',
          size === 'sm' ? 'h-control-sm' : 'h-control-md',
          open && 'border-viamar-500',
        )}
      >
        <CalendarRange size={15} className="shrink-0 text-ink-tertiary" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block truncate text-label-md leading-4 text-ink">{actual.label}</span>
          {size === 'md' ? (
            <span className="block truncate text-body-xs leading-4 text-ink-tertiary">
              {periodoLabel(periodo)}
            </span>
          ) : null}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 text-ink-tertiary transition-transform duration-fast',
            open && 'rotate-180',
          )}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="surface-raised absolute right-0 z-30 mt-1 w-56 overflow-hidden py-1"
        >
          {RANGOS.map((r) => {
            const on = r.id === value
            return (
              <li key={r.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => {
                    onChange(r.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-body-sm transition-colors duration-fast',
                    on ? 'bg-surface-selected text-ink' : 'text-ink-secondary hover:bg-surface-hover hover:text-ink',
                  )}
                >
                  {r.label}
                  {on ? <Check size={14} className="text-viamar-600" /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
