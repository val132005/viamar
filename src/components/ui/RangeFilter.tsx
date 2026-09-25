import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown } from 'lucide-react'
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
        title={periodoLabel(periodo)}
        className={cn(
          'inline-flex items-center gap-2.5 rounded-[6px] border border-[#d9e2ec] bg-white px-3 text-left',
          'transition-colors duration-fast hover:border-line-brand focus-visible:shadow-focus',
          size === 'sm' ? 'h-control-sm' : 'h-control',
          open && 'border-viamar-400',
        )}
      >
        <CalendarDays size={15} className="shrink-0 text-[#1f2f47]" aria-hidden="true" />
        <span className="truncate text-body-sm text-ink">{actual.label}</span>
        <ChevronDown
          size={15}
          className={cn(
            'ml-1 shrink-0 text-[#3a4a60] transition-transform duration-fast',
            open && 'rotate-180',
          )}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="surface-raised absolute right-0 z-30 mt-1 w-56 overflow-hidden py-1"
        >
          <li className="border-b border-line-subtle px-3 pb-1.5 pt-1 text-body-xs text-ink-tertiary">
            {periodoLabel(periodo)}
          </li>
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
