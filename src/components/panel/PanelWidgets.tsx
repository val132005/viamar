import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Download,
  Filter,
  Info,
  MoreVertical,
  Search,
} from 'lucide-react'
import { Sparkline } from '../ui/charts/Sparkline'
import type { Variacion } from '../../domain/analytics'
import { catalogById } from '../../domain/catalogs'
import { cn } from '../../lib/cn'
import { PANEL, TONO_HEX, type Tono } from './tonos'

/* ===========================================================================
   CABECERA DE BLOQUE Y SELECTOR
   ======================================================================== */

export function PanelHeader({
  title,
  info,
  toolbar,
  className,
}: {
  title: ReactNode
  /** Qué mide el bloque: se lee al pasar sobre el icono de ayuda. */
  info?: string
  toolbar?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex min-h-[30px] items-center justify-between gap-3', className)}>
      <h2 className="flex min-w-0 items-center gap-1.5 text-headline-sm text-ink">
        <span className="truncate">{title}</span>
        {info ? (
          <span title={info} className="inline-flex shrink-0 cursor-help text-ink-tertiary hover:text-viamar-500">
            <Info size={14} strokeWidth={2} aria-label={info} />
          </span>
        ) : null}
      </h2>
      {toolbar ? <div className="flex shrink-0 items-center gap-2">{toolbar}</div> : null}
    </header>
  )
}

/**
 * Desplegable nativo con la piel del panel. Nativo a propósito: teclado,
 * lector de pantalla y móvil funcionan sin reimplementar un listbox.
 */
export function SelectPill<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: Array<{ value: T; label: string }>
  ariaLabel: string
  className?: string
}) {
  return (
    <span className={cn('relative inline-flex', className)}>
      <select
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-8 w-full cursor-pointer appearance-none rounded-sm border border-line-strong bg-white pl-2.5 pr-8 text-body-xs text-ink transition-colors duration-fast hover:border-viamar-300 focus-visible:shadow-focus focus-visible:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-secondary"
        aria-hidden="true"
      />
    </span>
  )
}

/* ===========================================================================
   PESTAÑAS SUBRAYADAS
   ======================================================================== */

export function UnderlineTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: T; label: string; count?: number; tone?: 'default' | 'danger' }>
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div role="tablist" className="flex items-end gap-1 border-b border-line">
      {tabs.map((t) => {
        const on = t.id === active
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn(
              'relative -mb-px px-4 pb-2.5 pt-1 text-label-lg transition-colors duration-fast',
              on ? 'text-viamar-600' : 'text-ink hover:text-viamar-600',
            )}
          >
            {t.label}
            {t.count !== undefined ? (
              <span
                className={cn(
                  'ml-1.5 text-label-md tabular-nums',
                  t.tone === 'danger' ? 'text-critical' : on ? 'text-viamar-400' : 'text-ink-tertiary',
                )}
              >
                {t.count}
              </span>
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-x-0 bottom-0 h-[2.5px] rounded-full transition-colors duration-fast',
                on ? 'bg-viamar-600' : 'bg-transparent',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

/* ===========================================================================
   TARJETA DE RESUMEN
   ======================================================================== */

const ICONO: Record<Tono, string> = {
  brand: 'bg-viamar-100/80 text-viamar-600',
  accent: 'bg-info-soft text-info',
  navy: 'bg-viamar-100 text-viamar-900',
  ok: 'bg-success-soft text-success',
  warn: 'bg-warning-soft text-warning',
  danger: 'bg-critical-soft text-critical',
  neutral: 'bg-neutral-100 text-ink',
}

/* Sólo aprobado y rechazado tiñen la tarjeta: son los dos estados que el ojo
   tiene que separar de un vistazo. El resto queda en blanco. */
const CARCASA: Record<Tono, string> = {
  brand: 'border-line bg-white',
  accent: 'border-line bg-white',
  navy: 'border-line bg-white',
  ok: 'border-line bg-gradient-to-br from-white to-success-soft/60',
  warn: 'border-line bg-white',
  danger: 'border-critical-border/60 bg-gradient-to-br from-critical-soft/50 to-critical-soft/80',
  neutral: 'border-line bg-gradient-to-br from-white to-neutral-50',
}

type ResumenProps = {
  label: string
  value: ReactNode
  /** Hecho que acompaña a la cifra: proporción, desglose o estado. */
  note?: ReactNode
  icon: LucideIcon
  tone?: Tono
  trend?: number[]
  change?: Variacion | null
  /** Si subir es favorable. Decide el color, no la dirección de la flecha. */
  subirEsBueno?: boolean
  /** Lo que se lee donde iría la variación cuando no hay período comparable. */
  context?: ReactNode
  to?: string
}

/**
 * Métrica del panel: icono en círculo, cifra con su nota a la izquierda y, a
 * la derecha, la curva con la variación debajo. La curva y la variación
 * comparten columna porque las dos responden a «¿hacia dónde va?».
 */
export function ResumenCard({
  label,
  value,
  note,
  icon: Icon,
  tone = 'brand',
  trend,
  change,
  subirEsBueno = true,
  context,
  to,
}: ResumenProps) {
  /* Una serie plana no es una tendencia: dibujarla sólo añade ruido. */
  const hayTendencia = Boolean(
    trend && trend.length > 1 && trend.some((v) => v !== trend[0]) && trend.some((v) => v !== 0),
  )
  const cambioBueno =
    change && change.direccion !== 'igual' ? (change.direccion === 'sube') === subirEsBueno : null
  const Flecha = !change
    ? ArrowRight
    : change.direccion === 'sube'
      ? ArrowUp
      : change.direccion === 'baja'
        ? ArrowDown
        : ArrowRight

  const cuerpo = (
    <div className="flex h-full gap-3.5">
      <span
        className={cn(
          'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
          ICONO[tone],
        )}
        aria-hidden="true"
      >
        <Icon size={21} strokeWidth={2} />
      </span>

      {/* La etiqueta ocupa todo el ancho; debajo, cifra y curva comparten fila. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-body-sm text-ink-secondary">{label}</p>
        <div className="mt-1 flex flex-1 items-stretch justify-between gap-2">
          <div className="min-w-0">
            <p className="text-metric-xl leading-none tabular-nums text-ink">{value}</p>
            {note ? <p className="mt-2.5 truncate text-body-xs text-ink-secondary">{note}</p> : null}
          </div>

          <div className="flex shrink-0 flex-col items-end justify-between gap-1">
            {hayTendencia ? (
              <Sparkline
                data={trend!}
                tone={tone === 'navy' ? 'brand' : tone}
                area
                smooth
                width={84}
                height={34}
                strokeWidth={1.6}
                className="hidden sm:block"
              />
            ) : (
              <span className="h-[34px]" aria-hidden="true" />
            )}
            {change ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-label-md tabular-nums',
                  cambioBueno === null
                    ? 'bg-neutral-100 text-ink-secondary'
                    : cambioBueno
                      ? 'bg-success-soft text-success'
                      : 'bg-critical-soft text-critical',
                )}
              >
                <Flecha size={12} strokeWidth={2.6} aria-hidden="true" />
                {change.label}
              </span>
            ) : context ? (
              <span className="max-w-[110px] truncate text-body-xs text-ink-tertiary">{context}</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )

  const shell = cn(
    'block min-h-[118px] rounded-xl border p-4 shadow-xs transition-[border-color,box-shadow,transform] duration-200 ease-brand hover:-translate-y-0.5 hover:shadow-md',
    CARCASA[tone],
    to && 'hover:border-viamar-200 focus-visible:shadow-focus',
  )

  return to ? (
    <Link to={to} className={shell}>
      {cuerpo}
    </Link>
  ) : (
    <article className={shell}>{cuerpo}</article>
  )
}

/* ===========================================================================
   DISTRIBUCIÓN EN ANILLO
   ======================================================================== */

export type SegmentoDona = { id: string; label: string; valor: number; tono: Tono; to?: string }

function arco(c: number, r: number, desde: number, hasta: number): string {
  const p = (ang: number) => {
    const rad = ((ang - 90) * Math.PI) / 180
    return [c + r * Math.cos(rad), c + r * Math.sin(rad)]
  }
  const [x1, y1] = p(desde)
  const [x2, y2] = p(hasta)
  return `M${x1},${y1} A${r},${r} 0 ${hasta - desde > 180 ? 1 : 0} 1 ${x2},${y2}`
}

/**
 * Anillo con la leyenda en columnas: nombre a la izquierda, cifra y
 * porcentaje alineados a la derecha, para comparar sin buscar los números.
 */
export function DonaEstado({
  segmentos,
  unidad,
  size = 142,
  grosor = 22,
}: {
  segmentos: SegmentoDona[]
  unidad: string
  size?: number
  grosor?: number
}) {
  const [activo, setActivo] = useState<string | null>(null)
  const visibles = segmentos.filter((s) => s.valor > 0)
  const total = visibles.reduce((a, s) => a + s.valor, 0)

  if (total === 0) {
    return <p className="py-12 text-center text-body-sm text-ink-tertiary">Sin {unidad} que mostrar.</p>
  }

  const r = (size - grosor) / 2
  const c = size / 2
  let cursor = 0
  const actual = visibles.find((s) => s.id === activo)

  return (
    <div className="flex flex-wrap items-center gap-x-9 gap-y-4 px-2">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={`Distribución de ${unidad}`}>
          {visibles.map((s) => {
            const barrido = (s.valor / total) * 360
            const desde = cursor
            cursor += barrido
            /* Un único segmento se dibuja como círculo: un arco de 360° no existe. */
            if (visibles.length === 1) {
              return (
                <circle key={s.id} cx={c} cy={c} r={r} fill="none" stroke={TONO_HEX[s.tono]} strokeWidth={grosor} />
              )
            }
            return (
              <path
                key={s.id}
                d={arco(c, r, desde, Math.max(desde + 0.5, cursor - 0.6))}
                fill="none"
                stroke={TONO_HEX[s.tono]}
                strokeWidth={activo === s.id ? grosor + 3 : grosor}
                opacity={activo && activo !== s.id ? 0.35 : 1}
                className="transition-all duration-fast"
                onMouseEnter={() => setActivo(s.id)}
                onMouseLeave={() => setActivo(null)}
              >
                <title>{`${s.label}: ${s.valor}`}</title>
              </path>
            )
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-metric-lg tabular-nums text-ink">{actual ? actual.valor : total}</span>
          <span className="max-w-[88px] truncate text-body-xs text-ink-secondary">
            {actual ? actual.label : unidad}
          </span>
        </div>
      </div>

      <ul className="flex min-w-[200px] flex-1 flex-col gap-1">
        {visibles.map((s) => {
          const pct = Math.round((s.valor / total) * 100)
          const fila = (
            <>
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: TONO_HEX[s.tono] }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-body-sm text-ink">{s.label}</span>
              <span className="shrink-0 text-label-lg tabular-nums text-ink">
                {s.valor} ({pct}%)
              </span>
            </>
          )
          const base = cn(
            'flex items-center gap-3 rounded-sm px-1.5 py-1 transition-colors duration-fast',
            activo === s.id && 'bg-surface-hover',
          )
          return (
            <li key={s.id} onMouseEnter={() => setActivo(s.id)} onMouseLeave={() => setActivo(null)}>
              {s.to ? (
                <Link to={s.to} className={cn(base, 'hover:bg-surface-hover')}>
                  {fila}
                </Link>
              ) : (
                <div className={base}>{fila}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ===========================================================================
   RANKING
   ======================================================================== */

export type FilaRanking = { id: string; label: string; valor: number; to?: string }

/**
 * Ranking con barra proporcional al primero. El porcentaje va aparte, en gris:
 * la barra compara posiciones; el porcentaje dice cuánto pesa cada uno.
 */
export function Ranking({ filas, total }: { filas: FilaRanking[]; total: number }) {
  if (filas.length === 0) {
    return <p className="py-10 text-center text-body-sm text-ink-tertiary">Sin inventario en dealers.</p>
  }
  const max = Math.max(1, ...filas.map((f) => f.valor))
  return (
    <ol className="divide-y divide-line-subtle">
      {filas.map((f, i) => {
        const pct = total > 0 ? Math.round((f.valor / total) * 100) : 0
        /* Cada puesto aclara un poco la barra: el orden se lee también por tono. */
        const opacidad = Math.max(0.45, 1 - i * 0.13)
        return (
          <li key={f.id} className="flex items-center gap-3 py-[7px]">
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-xs border border-line bg-surface-subtle text-label-sm tabular-nums text-ink">
              {i + 1}
            </span>
            {f.to ? (
              <Link to={f.to} title={f.label} className="min-w-0 flex-1 truncate text-body-sm text-ink hover:text-viamar-600">
                {f.label}
              </Link>
            ) : (
              <span title={f.label} className="min-w-0 flex-1 truncate text-body-sm text-ink">{f.label}</span>
            )}
            <span className="h-3.5 w-[24%] shrink-0 overflow-hidden rounded-xs bg-neutral-100">
              <span
                className="block h-full rounded-xs bg-gradient-to-r from-viamar-500 to-viamar-accent transition-[width] duration-300 ease-brand"
                style={{ width: `${(f.valor / max) * 100}%`, opacity: opacidad }}
              />
            </span>
            <span className="w-10 shrink-0 text-right text-label-lg tabular-nums text-ink">{f.valor}</span>
            <span className="w-9 shrink-0 text-right text-body-sm tabular-nums text-ink-tertiary">{pct}%</span>
          </li>
        )
      })}
    </ol>
  )
}

/* ===========================================================================
   COMPOSICIÓN POR GRUPO
   ======================================================================== */

export type TramoComposicion = { id: string; label: string; valor: number; tono: Tono }
export type FilaComposicion = { id: string; label: string; total: number; tramos: TramoComposicion[] }

/**
 * Una barra por grupo: su largo compara el tamaño de los grupos y sus tramos,
 * el estado de cada uno. La cifra dice cuánto hay; el porcentaje, cuánto pesa
 * el estado dominante, que es lo que cambia de una fila a otra.
 */
export function BarrasComposicion({ filas }: { filas: FilaComposicion[] }) {
  if (filas.length === 0) {
    return <p className="py-10 text-center text-body-sm text-ink-tertiary">Sin seriales que mostrar.</p>
  }
  const max = Math.max(1, ...filas.map((f) => f.total))
  return (
    <ul className="flex flex-col">
      {filas.map((f) => {
        const dominante = [...f.tramos].sort((a, b) => b.valor - a.valor)[0]
        const pct = dominante && f.total > 0 ? Math.round((dominante.valor / f.total) * 100) : 0
        return (
          <li
            key={f.id}
            className="group -mx-2 flex items-center gap-3 rounded-sm px-2 py-[6px] transition-colors duration-fast hover:bg-surface-hover"
          >
            <span title={f.label} className="w-[40%] min-w-0 shrink-0 truncate text-body-sm text-ink sm:w-[190px]">
              {f.label}
            </span>
            <span className="h-3.5 min-w-[60px] flex-1 overflow-hidden rounded-full bg-neutral-100">
              <span
                className="flex h-full overflow-hidden rounded-full transition-[width] duration-500 ease-brand"
                style={{ width: `${(f.total / max) * 100}%` }}
              >
                {f.tramos.map((t) =>
                  t.valor > 0 ? (
                    <span
                      key={t.id}
                      title={`${t.label}: ${t.valor}`}
                      className="h-full transition-opacity duration-fast group-hover:opacity-90"
                      style={{ width: `${(t.valor / f.total) * 100}%`, background: TONO_HEX[t.tono] }}
                    />
                  ) : null,
                )}
              </span>
            </span>
            <span className="w-9 shrink-0 text-right text-label-lg tabular-nums text-ink">{f.total}</span>
            <span
              title={dominante && dominante.valor > 0 ? `${pct}% ${dominante.label.toLowerCase()}` : 'Sin dictamen'}
              className="w-10 shrink-0 text-right text-body-xs tabular-nums text-ink-tertiary"
            >
              {dominante && dominante.valor > 0 ? `${pct}%` : '—'}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/* ===========================================================================
   ACTIVIDAD RECIENTE
   ======================================================================== */

export type ItemActividad = {
  id: string
  titulo: ReactNode
  quien: string
  cuando: string
  cuandoExacto: string
  icon: LucideIcon
  tono: Tono
  /** Icono sobre disco macizo (hecho cerrado) o solo trazo (en curso). */
  macizo: boolean
  to: string
}

const HALO: Record<Tono, string> = {
  brand: 'bg-viamar-50',
  accent: 'bg-info-soft',
  navy: 'bg-viamar-100',
  ok: 'bg-success-soft',
  warn: 'bg-warning-soft',
  danger: 'bg-critical-soft',
  neutral: 'bg-neutral-100',
}

export function ActividadReciente({ items }: { items: ItemActividad[] }) {
  if (items.length === 0) {
    return <p className="py-10 text-center text-body-sm text-ink-tertiary">Sin actividad registrada.</p>
  }
  return (
    <ul className="divide-y divide-line-subtle">
      {items.map((it) => {
        const Icon = it.icon
        return (
          <li key={it.id}>
            <Link
              to={it.to}
              className="group -mx-2 flex items-center gap-3 rounded-sm px-2 py-2 transition-colors duration-fast hover:bg-surface-hover"
            >
              <span
                className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full', HALO[it.tono])}
                aria-hidden="true"
              >
                {it.macizo ? (
                  <span
                    className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full text-white"
                    style={{ background: TONO_HEX[it.tono] }}
                  >
                    <Icon size={11} strokeWidth={3} />
                  </span>
                ) : (
                  <Icon size={19} strokeWidth={2} style={{ color: TONO_HEX[it.tono] }} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-label-lg text-ink">{it.titulo}</span>
                <span className="block truncate text-body-xs text-ink-tertiary">
                  {it.quien} •{' '}
                  <span title={it.cuandoExacto} className="underline decoration-line-strong underline-offset-2">
                    {it.cuando}
                  </span>
                </span>
              </span>
              <MoreVertical
                size={16}
                className="shrink-0 text-ink-secondary transition-colors group-hover:text-viamar-600"
                aria-hidden="true"
              />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/* ===========================================================================
   TABLA DE REGISTROS RECIENTES
   ======================================================================== */

export type FilaSerial = {
  serial: string
  ubicacion: string
  ubicacionTipo: string
  diagnosticoId: string
  origen: string
  articulo: string
  titular: string
  fecha: string
  fechaTexto: string
}

type Opcion = { value: string; label: string }

const PAGINAS_VISIBLES = 5

type ColumnaOrden = 'serial' | 'ubicacion' | 'estado' | 'articulo' | 'titular' | 'fecha'

const VALOR_ORDEN: Record<ColumnaOrden, (f: FilaSerial) => string> = {
  serial: (f) => f.serial,
  ubicacion: (f) => f.ubicacion,
  estado: (f) => catalogById(f.diagnosticoId)?.label ?? f.diagnosticoId,
  articulo: (f) => f.articulo,
  titular: (f) => f.titular,
  fecha: (f) => f.fecha,
}

const BOTON_ACCION =
  'inline-flex h-6 w-7 items-center justify-center rounded-[5px] border border-[#dbe3ed] bg-white text-viamar-500 transition-colors duration-fast hover:border-viamar-300 hover:bg-viamar-50'

function descargarCsv(filas: FilaSerial[]) {
  const celda = (v: string) => `"${v.replace(/"/g, '""')}"`
  const cabecera = ['Serial', 'Ubicación', 'Diagnóstico', 'Origen', 'Artículo', 'Dealer / centro', 'Fecha ingreso']
  const cuerpo = filas.map((f) =>
    [f.serial, f.ubicacion, f.diagnosticoId, f.origen, f.articulo, f.titular, f.fecha.slice(0, 10)]
      .map(celda)
      .join(','),
  )
  /* BOM para que Excel abra las tildes sin pedir codificación. */
  const blob = new Blob(['\uFEFF' + [cabecera.map(celda).join(','), ...cuerpo].join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `seriales-recientes-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* Piel de los controles de la tabla, medida sobre la maqueta aprobada. */
const CONTROL =
  'h-[31px] rounded-[6px] border border-[#d9e2ec] bg-white text-[12px] text-[#1c2b42] transition-colors duration-fast hover:border-viamar-300 focus-visible:border-viamar-400 focus-visible:shadow-focus focus-visible:outline-none'

function SelectTabla({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: string
  onChange: (v: string) => void
  options: Opcion[]
  ariaLabel: string
  className?: string
}) {
  return (
    <span className={cn('relative inline-flex', className)}>
      <select
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        className={cn(CONTROL, 'w-full cursor-pointer appearance-none pl-3 pr-8')}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#3a4a60]"
        aria-hidden="true"
      />
    </span>
  )
}

/** Estado en etiqueta de texto: fondo, filo y letra del tono del catálogo. */
function EtiquetaEstado({ diagnosticoId }: { diagnosticoId: string }) {
  const item = catalogById(diagnosticoId)
  if (!item) return <span className="text-[#5f6d80]">{diagnosticoId}</span>
  return (
    <span
      className="inline-flex h-[21px] items-center rounded-[4px] border px-2 text-[11.5px] font-semibold"
      style={{ background: item.tone.bg, borderColor: item.tone.border, color: item.tone.fg }}
    >
      {item.label}
    </span>
  )
}

/**
 * Seriales ordenados por ingreso. Búsqueda, filtros y exportación sobre lo
 * que se ve; si hay filas marcadas, se exportan sólo esas. La tipografía y la
 * piel son las de la maqueta aprobada.
 */
export function RegistrosRecientes({
  filas,
  estados,
  ubicaciones,
  origenes,
  articulos,
  titulo = 'Seriales recientes',
  query,
  onQueryChange,
  placeholder = 'Buscar por serial, dealer, artículo...',
  vacio = 'Ningún serial coincide con los filtros.',
  tamanoInicial = 5,
  seleccionado,
  onSeleccionar,
  className,
}: {
  filas: FilaSerial[]
  estados: Opcion[]
  ubicaciones: Opcion[]
  origenes: Opcion[]
  articulos: Opcion[]
  titulo?: string
  /**
   * Búsqueda controlada. Con ella la tabla no filtra por texto: el llamante ya
   * entrega las filas que coinciden (p. ej. por documento o nombre del cliente).
   */
  query?: string
  onQueryChange?: (q: string) => void
  placeholder?: string
  vacio?: string
  tamanoInicial?: number
  /** Serial abierto en el panel de detalle: su fila queda resaltada. */
  seleccionado?: string
  /** Con él, pulsar una fila la abre en el panel en vez de salir de la lista. */
  onSeleccionar?: (serial: string) => void
  className?: string
}) {
  const [orden, setOrden] = useState<{ col: ColumnaOrden; dir: 1 | -1 } | null>(null)
  const [qLocal, setQLocal] = useState('')
  const q = query ?? qLocal
  const setQ = onQueryChange ?? setQLocal
  const buscaAqui = query === undefined
  const [estado, setEstado] = useState('todos')
  const [ubicacion, setUbicacion] = useState('todas')
  const [origen, setOrigen] = useState('todos')
  const [articulo, setArticulo] = useState('todos')
  const [verFiltros, setVerFiltros] = useState(false)
  const [tamano, setTamano] = useState(String(tamanoInicial))
  const [pagina, setPagina] = useState(1)
  const [marcados, setMarcados] = useState<Set<string>>(new Set())

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase()
    return filas.filter(
      (f) =>
        (estado === 'todos' || f.diagnosticoId === estado) &&
        (ubicacion === 'todas' || f.ubicacionTipo === ubicacion) &&
        (origen === 'todos' || f.origen === origen) &&
        (articulo === 'todos' || f.articulo === articulo) &&
        (!buscaAqui ||
          !t ||
          f.serial.toLowerCase().includes(t) ||
          f.titular.toLowerCase().includes(t) ||
          f.articulo.toLowerCase().includes(t)),
    )
  }, [filas, q, buscaAqui, estado, ubicacion, origen, articulo])

  /* Cambiar el filtro devuelve a la primera página: quedarse en la 7 de un
     conjunto que ahora tiene 2 mostraría una tabla vacía sin motivo. */
  useEffect(() => setPagina(1), [q, estado, ubicacion, origen, articulo, tamano])

  const extrasActivos = (origen !== 'todos' ? 1 : 0) + (articulo !== 'todos' ? 1 : 0)

  /* Orden por columna: primer clic ascendente, segundo descendente, tercero
     vuelve al orden de ingreso. */
  const ordenadas = useMemo(() => {
    if (!orden) return filtradas
    const valor = VALOR_ORDEN[orden.col]
    return filtradas.slice().sort((a, b) => valor(a).localeCompare(valor(b), 'es', { numeric: true }) * orden.dir)
  }, [filtradas, orden])
  const ordenarPor = (col: ColumnaOrden) =>
    setOrden((o) => (!o || o.col !== col ? { col, dir: 1 } : o.dir === 1 ? { col, dir: -1 } : null))

  const porPagina = Number(tamano)
  const paginas = Math.max(1, Math.ceil(ordenadas.length / porPagina))
  const actual = Math.min(pagina, paginas)
  const desde = (actual - 1) * porPagina
  const vista = ordenadas.slice(desde, desde + porPagina)

  const primera = Math.max(1, Math.min(actual - Math.floor(PAGINAS_VISIBLES / 2), paginas - PAGINAS_VISIBLES + 1))
  const numeros = Array.from({ length: Math.min(PAGINAS_VISIBLES, paginas) }, (_, i) => primera + i)

  const todosMarcados = vista.length > 0 && vista.every((f) => marcados.has(f.serial))
  const alternarPagina = () =>
    setMarcados((prev) => {
      const next = new Set(prev)
      for (const f of vista) {
        if (todosMarcados) next.delete(f.serial)
        else next.add(f.serial)
      }
      return next
    })
  const alternar = (serial: string) =>
    setMarcados((prev) => {
      const next = new Set(prev)
      if (next.has(serial)) next.delete(serial)
      else next.add(serial)
      return next
    })

  const exportar = () =>
    descargarCsv(marcados.size > 0 ? ordenadas.filter((f) => marcados.has(f.serial)) : ordenadas)

  const cabecera = (col: ColumnaOrden, texto: string) => {
    const activa = orden?.col === col
    const Icono = !activa ? ChevronsUpDown : orden.dir === 1 ? ChevronUp : ChevronDown
    return (
      <th className={th} aria-sort={activa ? (orden.dir === 1 ? 'ascending' : 'descending') : undefined}>
        <button
          type="button"
          onClick={() => ordenarPor(col)}
          className={cn(
            'group inline-flex items-center gap-1 transition-colors duration-fast hover:text-viamar-500',
            activa && 'text-viamar-500',
          )}
        >
          {texto}
          <Icono
            size={12}
            strokeWidth={2.4}
            className={cn(activa ? 'text-viamar-500' : 'text-[#9aa7b6] group-hover:text-viamar-400')}
            aria-hidden="true"
          />
        </button>
      </th>
    )
  }

  const th = 'px-3 py-[8px] text-left text-[11px] font-medium text-[#1c2b42]'
  const td = 'border-b border-[#edf1f6] px-3 py-[7px] text-[11.5px] text-[#1c2b42]'
  const check = 'h-[15px] w-[15px] cursor-pointer rounded-[3px] accent-viamar-500'
  const botonPagina =
    'inline-flex h-[30px] min-w-[30px] items-center justify-center rounded-[6px] border px-2 text-[12.5px] transition-colors duration-fast'

  return (
    <section className={cn(PANEL, 'px-4 pb-4 pt-3.5 font-inter tracking-[-0.01em]', className)}>
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="mr-auto text-[15.5px] font-semibold leading-5 text-[#0b1d3a]">
          {titulo} <span className="font-normal text-[#7a8799]">({filas.length})</span>
        </h2>
        <label className="relative w-full sm:w-auto sm:min-w-[170px] sm:max-w-[279px] sm:flex-1">
          <span className="sr-only">Buscar serial</span>
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7d90]"
            aria-hidden="true"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className={cn(CONTROL, 'w-full pl-8 pr-3 placeholder:text-[#8591a3]')}
          />
        </label>
        <SelectTabla
          value={estado}
          onChange={setEstado}
          ariaLabel="Filtrar por diagnóstico"
          options={[{ value: 'todos', label: 'Todos los estados' }, ...estados]}
        />
        <SelectTabla
          value={ubicacion}
          onChange={setUbicacion}
          ariaLabel="Filtrar por ubicación"
          options={[{ value: 'todas', label: 'Todas las ubicaciones' }, ...ubicaciones]}
        />
        <button
          type="button"
          onClick={() => setVerFiltros((v) => !v)}
          aria-expanded={verFiltros}
          className={cn(
            'inline-flex h-[31px] items-center gap-2 rounded-[6px] border px-4 text-[12px] font-semibold text-viamar-500 transition-colors duration-fast',
            verFiltros || extrasActivos > 0
              ? 'border-viamar-300 bg-viamar-50'
              : 'border-[#cfdbe8] bg-white hover:bg-viamar-50',
          )}
        >
          <Filter size={14} strokeWidth={2} aria-hidden="true" />
          Filtros
          {extrasActivos > 0 ? (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-viamar-500 px-1 text-[10px] text-white">
              {extrasActivos}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={exportar}
          disabled={filtradas.length === 0}
          className="inline-flex h-[31px] items-center gap-2 rounded-[6px] bg-gradient-to-b from-[#0a6fe8] to-[#0463dc] px-4 text-[12px] font-semibold text-white shadow-[0_2px_6px_rgba(4,100,220,0.25)] transition-[filter] duration-fast hover:brightness-110 disabled:opacity-50"
        >
          <Download size={15} strokeWidth={2} aria-hidden="true" />
          {marcados.size > 0 ? `Exportar (${marcados.size})` : 'Exportar'}
        </button>
      </div>

      {verFiltros ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2.5 rounded-[6px] border border-[#e6edf5] bg-[#f7fafd] px-3 py-2">
          <span className="text-[11.5px] font-medium text-[#5f6d80]">Más filtros</span>
          <SelectTabla
            value={origen}
            onChange={setOrigen}
            ariaLabel="Filtrar por origen del registro"
            options={[{ value: 'todos', label: 'Todos los orígenes' }, ...origenes]}
          />
          <SelectTabla
            value={articulo}
            onChange={setArticulo}
            ariaLabel="Filtrar por artículo"
            className="max-w-[300px]"
            options={[{ value: 'todos', label: 'Todos los artículos' }, ...articulos]}
          />
          {extrasActivos > 0 ? (
            <button
              type="button"
              onClick={() => {
                setOrigen('todos')
                setArticulo('todos')
              }}
              className="text-[12px] font-semibold text-viamar-500 hover:underline"
            >
              Limpiar
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="scroll-slim mt-3 overflow-x-auto">
        <table className="w-full min-w-[820px] border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#f0f5fa]">
              <th className={cn(th, 'w-10 rounded-l-[4px]')}>
                <input
                  type="checkbox"
                  checked={todosMarcados}
                  onChange={alternarPagina}
                  aria-label="Marcar la página"
                  className={check}
                />
              </th>
              {cabecera('serial', 'Serial')}
              {cabecera('ubicacion', 'Ubicación')}
              {cabecera('estado', 'Estado')}
              {cabecera('articulo', 'Artículo')}
              {cabecera('titular', 'Dealer / centro')}
              {cabecera('fecha', 'Fecha ingreso')}
              <th className={cn(th, 'w-20 rounded-r-[4px] text-center')}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vista.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-[12.5px] text-[#7a8799]">
                  {vacio}
                </td>
              </tr>
            ) : (
              vista.map((f) => {
                const activa = f.serial === seleccionado
                return (
                <tr
                  key={f.serial}
                  onClick={onSeleccionar ? () => onSeleccionar(f.serial) : undefined}
                  aria-selected={onSeleccionar ? activa : undefined}
                  className={cn(
                    'transition-colors duration-fast',
                    onSeleccionar && 'cursor-pointer',
                    activa ? 'bg-[#eaf3fd] shadow-[inset_3px_0_0_#0463dc]' : 'hover:bg-[#f7fafd]',
                  )}
                >
                  <td className={td} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={marcados.has(f.serial)}
                      onChange={() => alternar(f.serial)}
                      aria-label={`Marcar ${f.serial}`}
                      className={check}
                    />
                  </td>
                  <td className={td}>
                    <Link
                      to={`/serial/${f.serial}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-viamar-500 hover:underline"
                    >
                      {f.serial}
                    </Link>
                  </td>
                  <td className={td}>{f.ubicacion}</td>
                  <td className={td}>
                    <EtiquetaEstado diagnosticoId={f.diagnosticoId} />
                  </td>
                  <td className={cn(td, 'max-w-[220px] truncate')}>{f.articulo}</td>
                  <td className={cn(td, 'max-w-[200px] truncate')}>{f.titular}</td>
                  <td className={cn(td, 'tabular-nums')}>{f.fechaTexto}</td>
                  <td className={cn(td, 'text-center')}>
                    {onSeleccionar ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSeleccionar(f.serial)
                        }}
                        aria-label={`Ver detalle de ${f.serial}`}
                        className={BOTON_ACCION}
                      >
                        <MoreVertical size={15} strokeWidth={2.4} />
                      </button>
                    ) : (
                      <Link to={`/serial/${f.serial}`} aria-label={`Abrir ${f.serial}`} className={BOTON_ACCION}>
                        <MoreVertical size={15} strokeWidth={2.4} />
                      </Link>
                    )}
                  </td>
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <footer className="mt-4 flex flex-wrap items-center gap-3">
        <p className="mr-auto text-[12px] text-[#2b3a50]">
          {ordenadas.length === 0
            ? 'Sin registros'
            : `Mostrando ${desde + 1} - ${desde + vista.length} de ${ordenadas.length} registros`}
        </p>
        <span className="text-[12px] text-[#2b3a50]">Filas por página</span>
        <SelectTabla
          value={tamano}
          onChange={setTamano}
          ariaLabel="Filas por página"
          className="w-[61px]"
          options={['5', '10', '20', '50'].map((v) => ({ value: v, label: v }))}
        />
        <nav className="ml-4 flex items-center gap-1.5" aria-label="Paginación">
          <button
            type="button"
            onClick={() => setPagina(1)}
            disabled={actual === 1}
            aria-label="Primera página"
            className={cn(botonPagina, 'border-[#d9e2ec] bg-white text-[#6a788c] hover:bg-[#f7fafd] disabled:opacity-40')}
          >
            <ChevronsLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => setPagina(actual - 1)}
            disabled={actual === 1}
            aria-label="Página anterior"
            className={cn(botonPagina, 'border-[#d9e2ec] bg-white text-[#6a788c] hover:bg-[#f7fafd] disabled:opacity-40')}
          >
            <ChevronLeft size={15} />
          </button>
          {numeros.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPagina(n)}
              aria-current={n === actual ? 'page' : undefined}
              className={cn(
                botonPagina,
                n === actual
                  ? 'border-viamar-500 bg-viamar-500 font-semibold text-white'
                  : 'border-[#d9e2ec] bg-white font-medium text-[#1c2b42] hover:bg-[#f7fafd]',
              )}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPagina(actual + 1)}
            disabled={actual === paginas}
            aria-label="Página siguiente"
            className={cn(botonPagina, 'border-[#d9e2ec] bg-white text-[#1c2b42] hover:bg-[#f7fafd] disabled:opacity-40')}
          >
            <ChevronRight size={15} />
          </button>
          <button
            type="button"
            onClick={() => setPagina(paginas)}
            disabled={actual === paginas}
            aria-label="Última página"
            className={cn(botonPagina, 'border-[#d9e2ec] bg-white text-[#1c2b42] hover:bg-[#f7fafd] disabled:opacity-40')}
          >
            <ChevronsRight size={15} />
          </button>
        </nav>
      </footer>
    </section>
  )
}
