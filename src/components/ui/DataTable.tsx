import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
} from 'lucide-react'
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
  /** Heredado: la tabla del panel no lleva icono junto al título. */
  icon?: ReactNode
  /** Cifra entre paréntesis tras el título. Por defecto, el total de filas. */
  count?: number | false
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
  /** Acciones por fila, en botones con filo como los de la tabla del panel. */
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

const HEAD_H = 34
const MIN_ROWS = 4

const ROW_H: Record<Density, number> = {
  compact: 36,
  default: 42,
  relaxed: 50,
}

/* Piel de la tabla de Trazabilidad y Dashboard, medida sobre la maqueta. */
const TH = 'sticky top-0 z-10 h-[34px] bg-[#f0f5fa] px-3 text-[11px] font-medium text-[#1c2b42]'
const TD = 'border-b border-[#edf1f6] px-3 align-middle text-[11.5px] text-[#1c2b42]'
const BOTON_ACCION =
  'inline-flex h-6 w-7 items-center justify-center rounded-[5px] border border-[#dbe3ed] bg-white text-viamar-500 transition-colors duration-fast hover:border-viamar-300 hover:bg-viamar-50'
const BOTON_PAGINA =
  'inline-flex h-[30px] min-w-[30px] items-center justify-center rounded-[6px] border px-2 text-[12.5px] transition-colors duration-fast'

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  title,
  count,
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
  const cifra = count === false ? null : (count ?? rows.length)

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  const ultima = rowActions?.length ? -1 : columns.length - 1

  return (
    <section
      className={cn(
        'surface flex min-h-[220px] flex-col overflow-hidden font-inter tracking-[-0.01em]',
        fill ? 'min-h-0 flex-1' : '',
        className,
      )}
    >
      {hasToolbar ? (
        <header className="flex shrink-0 flex-wrap items-center gap-x-2.5 gap-y-2 px-4 pb-3 pt-3.5">
          {title ? (
            <h2 className="mr-1 whitespace-nowrap text-[15.5px] font-semibold leading-5 text-[#0b1d3a]">
              {title}
              {cifra !== null ? <span className="ml-1 font-normal text-[#7a8799]">({cifra})</span> : null}
            </h2>
          ) : null}

          {tabs?.length ? (
            <div
              role="tablist"
              className="flex items-center gap-0.5 rounded-[7px] border border-[#e3eaf2] bg-[#f0f5fa] p-0.5"
            >
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
                      'inline-flex h-[25px] items-center gap-1.5 whitespace-nowrap rounded-[5px] px-2.5 text-[12px] font-semibold transition-colors duration-fast',
                      on ? 'bg-white text-viamar-600 shadow-xs' : 'text-[#5f6d80] hover:text-viamar-600',
                      !on && t.tone === 'danger' && 'text-critical',
                    )}
                  >
                    {t.label}
                    {t.count !== undefined ? (
                      <span
                        className={cn(
                          'font-medium tabular-nums',
                          t.tone === 'danger' ? 'text-critical' : on ? 'text-viamar-400' : 'text-[#8591a3]',
                        )}
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
              className="min-w-[170px] max-w-[279px] flex-none sm:w-[240px]"
            />
          ) : null}
          {actions}
        </header>
      ) : null}

      <div
        ref={bodyRef}
        className={cn(
          'min-h-0 flex-1 px-4',
          !hasToolbar && 'pt-3.5',
          renderMobile ? 'scroll-slim overflow-auto' : 'overflow-hidden',
        )}
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
                'w-full border-separate border-spacing-0',
                renderMobile && 'hidden md:table',
              )}
            >
              <thead>
                <tr>
                  {columns.map((c, ci) => {
                    const active = sort?.key === c.key
                    const Icono = !active ? ChevronsUpDown : sort.dir === 'asc' ? ChevronUp : ChevronDown
                    return (
                      <th
                        key={c.key}
                        scope="col"
                        aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                        style={c.width ? { width: c.width } : undefined}
                        className={cn(
                          TH,
                          c.align === 'right' ? 'text-right' : 'text-left',
                          'whitespace-nowrap',
                          ci === 0 && 'rounded-l-[4px]',
                          ci === ultima && 'rounded-r-[4px]',
                          c.secondary && 'hidden lg:table-cell',
                          c.className,
                        )}
                      >
                        {c.sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(c.key)}
                            className={cn(
                              'group/sort inline-flex items-center gap-1 transition-colors duration-fast hover:text-viamar-500',
                              c.align === 'right' && 'flex-row-reverse',
                              active && 'text-viamar-500',
                            )}
                            aria-label={`Ordenar por ${c.header}`}
                          >
                            {c.header}
                            <Icono
                              size={12}
                              strokeWidth={2.4}
                              className={cn(
                                active ? 'text-viamar-500' : 'text-[#9aa7b6] group-hover/sort:text-viamar-400',
                              )}
                              aria-hidden="true"
                            />
                          </button>
                        ) : (
                          c.header
                        )}
                      </th>
                    )
                  })}
                  {rowActions?.length ? (
                    <th scope="col" className={cn(TH, 'w-px rounded-r-[4px] text-center')}>
                      Acciones
                    </th>
                  ) : null}
                </tr>
              </thead>

              <tbody>
                {slice.map((row) => {
                  const active = isRowActive?.(row)
                  /* Como en Trazabilidad, el estado lo dice la etiqueta de la fila;
                     sólo lo crítico tiñe levemente el fondo. */
                  const tone = rowTone?.(row) ?? 'default'
                  return (
                    <tr
                      key={rowKey(row)}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      aria-selected={isRowActive ? Boolean(active) : undefined}
                      className={cn(
                        'group/row transition-colors duration-fast',
                        onRowClick && 'cursor-pointer',
                        active
                          ? 'bg-[#eaf3fd] shadow-[inset_3px_0_0_#0463dc]'
                          : tone === 'danger'
                            ? 'bg-critical-soft/30 hover:bg-critical-soft/50'
                            : 'hover:bg-[#f7fafd]',
                      )}
                    >
                      {columns.map((c, ci) => (
                        <td
                          key={c.key}
                          style={{ height: rowH }}
                          className={cn(
                            /* Solo separadores horizontales: sin rejilla vertical
                               la tabla deja de leerse como hoja de cálculo. */
                            TD,
                            c.align === 'right' ? 'text-right tabular-nums' : 'text-left',
                            c.primary && 'font-semibold text-[#0b1d3a]',
                            /* Las columnas de ancho fijo guardan datos cortos (fechas,
                               cifras, estados): en una línea se leen de un golpe. */
                            c.width && 'whitespace-nowrap',
                            c.secondary && 'hidden lg:table-cell',
                            ci === 0 && 'relative',
                            c.className,
                          )}
                        >
                          {c.render
                            ? c.render(row)
                            : String((row as Record<string, unknown>)[c.key] ?? '')}
                        </td>
                      ))}

                      {rowActions?.length ? (
                        <td style={{ height: rowH }} className={cn(TD, 'px-2')}>
                          <div className="flex items-center justify-center gap-1">
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
                                  BOTON_ACCION,
                                  a.tone === 'danger' &&
                                    'text-critical hover:border-critical-border hover:bg-critical-soft',
                                  '[&_svg]:h-[14px] [&_svg]:w-[14px]',
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
              <ul className="divide-y divide-[#edf1f6] md:hidden">
                {slice.map((row) => (
                  <li
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn('py-2.5', onRowClick && 'cursor-pointer active:bg-surface-active')}
                  >
                    {renderMobile(row)}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 pb-3.5 pt-3">
        <p className="truncate text-[12px] text-[#2b3a50]">
          {footNote ??
            (sorted.length === 0
              ? 'Sin registros'
              : `Mostrando ${from} - ${to} de ${sorted.length} registros`)}
        </p>

        {pageCount > 1 ? (
          <nav aria-label="Paginación" className="flex shrink-0 items-center gap-1.5">
            <PagerButton label="Primera página" disabled={safePage === 0} onClick={() => setPage(0)}>
              <ChevronsLeft size={15} />
            </PagerButton>
            <PagerButton
              label="Página anterior"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft size={15} />
            </PagerButton>
            {pageWindow(safePage, pageCount).map((n, i) =>
              n === '…' ? (
                <span key={`e${i}`} className="px-0.5 text-[12.5px] text-[#8591a3]">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  aria-current={n - 1 === safePage ? 'page' : undefined}
                  onClick={() => setPage(n - 1)}
                  className={cn(
                    BOTON_PAGINA,
                    'tabular-nums',
                    n - 1 === safePage
                      ? 'border-viamar-500 bg-viamar-500 font-semibold text-white'
                      : 'border-[#d9e2ec] bg-white font-medium text-[#1c2b42] hover:bg-[#f7fafd]',
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
            <PagerButton
              label="Última página"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage(pageCount - 1)}
            >
              <ChevronsRight size={15} />
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
      className={cn(BOTON_PAGINA, 'border-[#d9e2ec] bg-white text-[#1c2b42] hover:bg-[#f7fafd] disabled:opacity-40')}
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
      <div className="truncate text-[12px] font-semibold text-[#1c2b42]">{primary}</div>
      {secondary ? (
        <div className="mt-0.5 truncate text-[11px] text-[#7a8799]">{secondary}</div>
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
