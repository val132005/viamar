import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { EmptyState } from './EmptyState'
import { SkeletonTable } from './Skeleton'
import { SearchField } from './FilterBar'
import { cn } from '../../lib/cn'

export type Column<T> = {
  key: string
  header: string
  className?: string
  align?: 'left' | 'right'
  render?: (row: T) => ReactNode
  /** Columna identificadora: recibe más peso tipográfico. */
  primary?: boolean
  /** Habilita el orden por esta columna. */
  sortable?: boolean
  /** Valor por el que ordenar; si se omite se usa el campo crudo. */
  sortValue?: (row: T) => string | number
  /** Ancho fijo, p. ej. '120px' o '1fr'. */
  width?: string
  /** Oculta la columna en pantallas estrechas, conservando la información clave. */
  secondary?: boolean
}

export type TableTab = {
  id: string
  label: string
  count?: number
  tone?: 'default' | 'danger'
}

export type RowAction<T> = {
  id: string
  label: string
  icon?: ReactNode
  onClick: (row: T) => void
  tone?: 'default' | 'danger'
}

type Density = 'compact' | 'default' | 'relaxed'

type Props<T> = {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  title?: ReactNode
  icon?: ReactNode
  tabs?: TableTab[]
  activeTab?: string
  onTabChange?: (id: string) => void
  search?: { value: string; onChange: (v: string) => void; placeholder?: string }
  actions?: ReactNode
  footNote?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  fill?: boolean
  /** Alias heredado de `density="compact"`. */
  dense?: boolean
  density?: Density
  loading?: boolean
  /** Acciones por fila: permanecen ocultas hasta el hover o el foco. */
  rowActions?: RowAction<T>[]
  onRowClick?: (row: T) => void
  /** Marca visualmente la fila abierta en una vista maestro/detalle. */
  isRowActive?: (row: T) => boolean
  /** Señala filas que requieren atención con una guía lateral. */
  rowTone?: (row: T) => 'default' | 'warn' | 'danger'
  /** Representación alternativa para pantallas estrechas. */
  renderMobile?: (row: T) => ReactNode
  className?: string
}

const HEAD_H = 36
const FOOT_H = 44
const MIN_ROWS = 4

const ROW_H: Record<Density, number> = {
  compact: 36,
  default: 44,
  relaxed: 52,
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  title,
  icon,
  tabs,
  activeTab,
  onTabChange,
  search,
  actions,
  footNote,
  emptyTitle = 'Sin registros',
  emptyDescription = 'No hay información que coincida con los filtros actuales.',
  emptyAction,
  fill = true,
  dense = false,
  density,
  loading = false,
  rowActions,
  onRowClick,
  isRowActive,
  rowTone,
  renderMobile,
  className,
}: Props<T>) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)

  const resolvedDensity: Density = density ?? (dense ? 'compact' : 'default')
  const rowH = ROW_H[resolvedDensity]

  /* La tabla llena el panel disponible: se pagina por altura real, no por un
     número fijo, para que no queden huecos ni se corten filas. */
  useEffect(() => {
    if (!fill) return
    const el = bodyRef.current
    if (!el) return
    const measure = () => {
      const available = el.clientHeight - HEAD_H
      const next = Math.max(MIN_ROWS, Math.floor(available / rowH) || MIN_ROWS)
      setPageSize(next)
    }
    measure()
    const obs = new ResizeObserver(measure)
    obs.observe(el)
    return () => obs.disconnect()
  }, [fill, rowH])

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return rows
    const read = (row: T): string | number => {
      if (col.sortValue) return col.sortValue(row)
      const raw = (row as Record<string, unknown>)[col.key]
      return typeof raw === 'number' ? raw : String(raw ?? '')
    }
    return [...rows].sort((a, b) => {
      const va = read(a)
      const vb = read(b)
      const cmp =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb), 'es', { numeric: true })
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [rows, sort, columns])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const slice = useMemo(
    () => sorted.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [sorted, safePage, pageSize],
  )

  useEffect(() => {
    setPage(0)
  }, [rows.length, pageSize, activeTab])

  const hasToolbar = Boolean(title || tabs?.length || search || actions)
  const from = sorted.length === 0 ? 0 : safePage * pageSize + 1
  const to = Math.min(sorted.length, (safePage + 1) * pageSize)

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  return (
    <section
      className={cn(
        'surface flex min-h-[220px] flex-col overflow-hidden',
        fill ? 'min-h-0 flex-1' : '',
        className,
      )}
    >
      {hasToolbar ? (
        <header className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-line px-3 py-2">
          {title ? (
            <h2 className="mr-1 flex items-center gap-2 whitespace-nowrap text-headline-md text-ink">
              {icon ? (
                <span className="text-ink-tertiary" aria-hidden="true">
                  {icon}
                </span>
              ) : null}
              {title}
            </h2>
          ) : null}

          {tabs?.length ? (
            <div role="tablist" className="flex items-center gap-0.5 rounded bg-neutral-100 p-0.5">
              {tabs.map((t) => {
                const on = t.id === activeTab
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => onTabChange?.(t.id)}
                    className={cn(
                      'inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 text-label-lg transition-colors duration-fast',
                      on ? 'bg-white text-ink shadow-xs' : 'text-ink-secondary hover:text-ink',
                      !on && t.tone === 'danger' && 'text-critical',
                    )}
                  >
                    {t.label}
                    {t.count !== undefined ? (
                      <span
                        className={cn('tabular-nums', on ? 'text-viamar-600' : 'text-ink-tertiary')}
                      >
                        {t.count}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ) : null}

          <div className="min-w-2 flex-1" />

          {search ? (
            <SearchField
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder ?? 'Filtrar…'}
              size="sm"
              className="min-w-[160px] max-w-[240px] flex-none"
            />
          ) : null}
          {actions}
        </header>
      ) : null}

      <div
        ref={bodyRef}
        className={cn('min-h-0 flex-1', renderMobile ? 'overflow-auto scroll-slim' : 'overflow-hidden')}
      >
        {loading ? (
          <SkeletonTable rows={Math.min(pageSize, 8)} columns={columns.length} />
        ) : sorted.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <EmptyState
              kind={search?.value ? 'no-results' : 'empty'}
              title={emptyTitle}
              description={emptyDescription}
              action={emptyAction}
              /* Si la tabla ocupa la pantalla, el vacío también: a media altura
                 se leería como un fallo de carga y no como una respuesta. */
              size={fill ? 'lg' : 'sm'}
            />
          </div>
        ) : (
          <>
            {/* Vista de tabla: a partir de pantallas medianas. */}
            <table
              className={cn(
                'w-full border-separate border-spacing-0 text-body-sm',
                renderMobile && 'hidden md:table',
              )}
            >
              <thead>
                <tr>
                  {columns.map((c) => {
                    const active = sort?.key === c.key
                    return (
                      <th
                        key={c.key}
                        scope="col"
                        style={c.width ? { width: c.width } : undefined}
                        className={cn(
                          /* Cabecera fija: el contexto de columna no se pierde al desplazar. */
                          'sticky top-0 z-10 h-9 border-b border-line bg-surface-subtle px-3',
                          'text-label-md font-semibold text-ink-secondary',
                          c.align === 'right' ? 'text-right' : 'text-left',
                          c.secondary && 'hidden lg:table-cell',
                          c.className,
                        )}
                      >
                        {c.sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(c.key)}
                            className={cn(
                              'group/sort -mx-1 inline-flex items-center gap-1 rounded-xs px-1 py-0.5 transition-colors duration-fast hover:text-ink',
                              c.align === 'right' && 'flex-row-reverse',
                              active && 'text-ink',
                            )}
                            aria-label={`Ordenar por ${c.header}`}
                          >
                            {c.header}
                            {active ? (
                              sort.dir === 'asc' ? (
                                <ArrowUp size={12} className="text-viamar-500" />
                              ) : (
                                <ArrowDown size={12} className="text-viamar-500" />
                              )
                            ) : (
                              <ChevronsUpDown
                                size={12}
                                className="text-ink-disabled opacity-0 transition-opacity group-hover/sort:opacity-100"
                              />
                            )}
                          </button>
                        ) : (
                          c.header
                        )}
                      </th>
                    )
                  })}
                  {rowActions?.length ? (
                    <th
                      scope="col"
                      className="sticky top-0 z-10 h-9 w-px border-b border-line bg-surface-subtle px-3"
                    >
                      <span className="sr-only">Acciones</span>
                    </th>
                  ) : null}
                </tr>
              </thead>

              <tbody>
                {slice.map((row) => {
                  const active = isRowActive?.(row)
                  const tone = rowTone?.(row) ?? 'default'
                  return (
                    <tr
                      key={rowKey(row)}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(
                        'group/row transition-colors duration-fast',
                        onRowClick && 'cursor-pointer',
                        active ? 'bg-surface-selected' : 'hover:bg-surface-hover',
                      )}
                    >
                      {columns.map((c, ci) => (
                        <td
                          key={c.key}
                          style={{ height: rowH }}
                          className={cn(
                            /* Solo separadores horizontales: sin rejilla vertical
                               la tabla deja de leerse como hoja de cálculo. */
                            'border-b border-line-subtle px-3 align-middle',
                            c.align === 'right' ? 'text-right tabular-nums' : 'text-left',
                            c.primary ? 'text-label-lg text-ink' : 'text-ink-secondary',
                            c.secondary && 'hidden lg:table-cell',
                            ci === 0 && 'relative',
                            c.className,
                          )}
                        >
                          {ci === 0 && tone !== 'default' ? (
                            <span
                              aria-hidden="true"
                              className={cn(
                                'absolute inset-y-0 left-0 w-0.5',
                                tone === 'danger' ? 'bg-critical' : 'bg-warning',
                              )}
                            />
                          ) : null}
                          {c.render
                            ? c.render(row)
                            : String((row as Record<string, unknown>)[c.key] ?? '')}
                        </td>
                      ))}

                      {rowActions?.length ? (
                        <td
                          style={{ height: rowH }}
                          className="border-b border-line-subtle px-2 align-middle"
                        >
                          {/* Acciones al hover: no compiten por atención en reposo,
                              pero siguen siendo alcanzables por teclado. */}
                          <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity duration-fast group-hover/row:opacity-100 focus-within:opacity-100">
                            {rowActions.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                title={a.label}
                                aria-label={a.label}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  a.onClick(row)
                                }}
                                className={cn(
                                  'inline-flex h-7 w-7 items-center justify-center rounded-sm transition-colors duration-fast',
                                  a.tone === 'danger'
                                    ? 'text-ink-tertiary hover:bg-critical-soft hover:text-critical'
                                    : 'text-ink-tertiary hover:bg-neutral-100 hover:text-ink',
                                )}
                              >
                                {a.icon}
                              </button>
                            ))}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Vista de lista enriquecida: conserva la operación en pantallas estrechas. */}
            {renderMobile ? (
              <ul className="divide-y divide-line-subtle md:hidden">
                {slice.map((row) => (
                  <li
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn('px-3 py-2.5', onRowClick && 'cursor-pointer active:bg-surface-active')}
                  >
                    {renderMobile(row)}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>

      <footer
        className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-3"
        style={{ height: FOOT_H }}
      >
        <p className="truncate text-body-xs text-ink-tertiary">
          {footNote ?? (
            <>
              <span className="tabular-nums text-ink-secondary">
                {from}–{to}
              </span>{' '}
              de <span className="tabular-nums font-semibold text-ink">{sorted.length}</span>
            </>
          )}
        </p>

        {pageCount > 1 ? (
          <nav aria-label="Paginación" className="flex shrink-0 items-center gap-0.5">
            <PagerButton
              label="Página anterior"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft size={15} />
            </PagerButton>
            {pageWindow(safePage, pageCount).map((n, i) =>
              n === '…' ? (
                <span key={`e${i}`} className="px-1 text-label-md text-ink-disabled">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  aria-current={n - 1 === safePage ? 'page' : undefined}
                  onClick={() => setPage(n - 1)}
                  className={cn(
                    'h-7 min-w-7 rounded-sm px-1.5 text-label-md tabular-nums transition-colors duration-fast',
                    n - 1 === safePage
                      ? 'bg-viamar-500 font-semibold text-white'
                      : 'text-ink-secondary hover:bg-neutral-100 hover:text-ink',
                  )}
                >
                  {n}
                </button>
              ),
            )}
            <PagerButton
              label="Página siguiente"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              <ChevronRight size={15} />
            </PagerButton>
          </nav>
        ) : null}
      </footer>
    </section>
  )
}

function PagerButton({
  children,
  disabled,
  onClick,
  label,
}: {
  children: ReactNode
  disabled: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-ink-secondary transition-colors duration-fast hover:bg-neutral-100 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}

/** Celda de dos niveles: el dato manda, el contexto acompaña. */
export function CellStack({
  primary,
  secondary,
  className,
}: {
  primary: ReactNode
  secondary?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="truncate text-label-lg text-ink">{primary}</div>
      {secondary ? (
        <div className="truncate text-body-xs text-ink-tertiary">{secondary}</div>
      ) : null}
    </div>
  )
}

function pageWindow(current: number, count: number): Array<number | '…'> {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const pages = new Set([1, count, current + 1, current, current + 2])
  const sorted = [...pages].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b)
  const out: Array<number | '…'> = []
  for (const n of sorted) {
    const prev = out[out.length - 1]
    if (typeof prev === 'number' && n - prev > 1) out.push('…')
    out.push(n)
  }
  return out
}
