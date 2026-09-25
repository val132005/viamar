import { useState } from 'react'
import { cn } from '../../../lib/cn'
import type { SerieTono } from './TrendChart'

const COLOR: Record<SerieTono, string> = {
  brand: '#206AA9',
  accent: '#039BE5',
  ok: '#1F7A34',
  warn: '#4A5D78',
  danger: '#C0392F',
  neutral: '#CFD7E1',
}

/* Orden de asignación cuando el llamante no fija el tono: del azul corporativo
   al acento y de ahí a los neutros. Nunca se sale de la paleta de marca. */
const SECUENCIA: SerieTono[] = ['brand', 'accent', 'neutral', 'ok', 'warn', 'danger']

export type DonutSegmento = {
  id: string
  label: string
  valor: number
  tono?: SerieTono
  /** Destino al que lleva pulsar el segmento en la leyenda. */
  onClick?: () => void
}

type Props = {
  segmentos: DonutSegmento[]
  /** Texto bajo la cifra central: qué se está contando. */
  unidad?: string
  /** Sustituye el total calculado en el centro. */
  centroValor?: string
  size?: number
  grosor?: number
  emptyMessage?: string
  className?: string
}

function arco(cx: number, cy: number, r: number, desde: number, hasta: number): string {
  const p = (ang: number) => {
    const rad = ((ang - 90) * Math.PI) / 180
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
  }
  const [x1, y1] = p(desde)
  const [x2, y2] = p(hasta)
  const grande = hasta - desde > 180 ? 1 : 0
  return `M${x1},${y1} A${r},${r} 0 ${grande} 1 ${x2},${y2}`
}

/**
 * Distribución en anillo. El anillo da la proporción de un vistazo; la lectura
 * exacta vive en la leyenda, con su cifra y su porcentaje. El centro carga el
 * total, que es el dato que casi siempre se busca primero.
 */
export function DonutChart({
  segmentos,
  unidad = 'registros',
  centroValor,
  size = 168,
  grosor = 18,
  emptyMessage = 'Sin registros en el período.',
  className,
}: Props) {
  const [activo, setActivo] = useState<string | null>(null)
  const total = segmentos.reduce((a, s) => a + s.valor, 0)

  if (total === 0) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <p className="text-body-sm text-ink-tertiary">{emptyMessage}</p>
      </div>
    )
  }

  const r = (size - grosor) / 2
  const cx = size / 2
  const cy = size / 2
  let cursor = 0
  /* Separación mínima entre segmentos: el anillo se lee como partes, no como
     una banda continua. Con un único segmento la cuña completa se conserva. */
  const hueco = segmentos.length > 1 ? 2 : 0

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-x-5 gap-y-3', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={`Distribución de ${unidad}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F4F6FA" strokeWidth={grosor} />
          {segmentos.map((s, i) => {
            const barrido = (s.valor / total) * 360
            const desde = cursor
            const hasta = cursor + barrido
            cursor = hasta
            const tono = s.tono ?? SECUENCIA[i % SECUENCIA.length]
            const atenuado = activo !== null && activo !== s.id
            return (
              <path
                key={s.id}
                d={arco(cx, cy, r, desde + hueco / 2, Math.max(desde + hueco / 2, hasta - hueco / 2))}
                fill="none"
                stroke={COLOR[tono]}
                strokeWidth={activo === s.id ? grosor + 3 : grosor}
                strokeLinecap="butt"
                opacity={atenuado ? 0.3 : 1}
                className="transition-all duration-fast"
                onMouseEnter={() => setActivo(s.id)}
                onMouseLeave={() => setActivo(null)}
              >
                <title>{`${s.label}: ${s.valor} (${Math.round((s.valor / total) * 100)}%)`}</title>
              </path>
            )
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-metric tabular-nums text-ink">
            {centroValor ?? (activo ? segmentos.find((s) => s.id === activo)?.valor : total)}
          </span>
          <span className="text-body-xs text-ink-tertiary">
            {activo ? segmentos.find((s) => s.id === activo)?.label : unidad}
          </span>
        </div>
      </div>

      <ul className="flex min-w-[130px] flex-col gap-1.5">
        {segmentos.map((s, i) => {
          const tono = s.tono ?? SECUENCIA[i % SECUENCIA.length]
          const pct = Math.round((s.valor / total) * 100)
          const contenido = (
            <>
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: COLOR[tono] }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-label-lg text-ink">{s.label}</span>
                <span className="block text-body-xs tabular-nums text-ink-tertiary">
                  {s.valor} · {pct}%
                </span>
              </span>
            </>
          )
          const base = cn(
            'flex w-full items-start gap-2 rounded-sm px-1.5 py-1 text-left transition-colors duration-fast',
            activo === s.id && 'bg-surface-hover',
          )
          return (
            <li key={s.id}>
              {s.onClick ? (
                <button
                  type="button"
                  onClick={s.onClick}
                  onMouseEnter={() => setActivo(s.id)}
                  onMouseLeave={() => setActivo(null)}
                  className={cn(base, 'hover:bg-surface-hover')}
                >
                  {contenido}
                </button>
              ) : (
                <div
                  className={base}
                  onMouseEnter={() => setActivo(s.id)}
                  onMouseLeave={() => setActivo(null)}
                >
                  {contenido}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * Distribución en barras horizontales. Es la representación correcta cuando
 * las categorías son muchas o sus nombres largos: un anillo de ocho porciones
 * no se lee, una lista ordenada sí.
 */
export function BarDistribution({
  segmentos,
  formatValor = (n: number) => String(n),
  emptyMessage = 'Sin registros en el período.',
  className,
}: {
  segmentos: DonutSegmento[]
  formatValor?: (n: number) => string
  emptyMessage?: string
  className?: string
}) {
  const max = Math.max(1, ...segmentos.map((s) => s.valor))
  const total = segmentos.reduce((a, s) => a + s.valor, 0)

  if (total === 0) {
    return <p className={cn('py-6 text-center text-body-sm text-ink-tertiary', className)}>{emptyMessage}</p>
  }

  return (
    <ul className={cn('flex flex-col gap-2.5', className)}>
      {segmentos.map((s, i) => {
        const tono = s.tono ?? SECUENCIA[i % SECUENCIA.length]
        const fila = (
          <>
            <span className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-body-sm text-ink">{s.label}</span>
              <span className="shrink-0 text-label-lg tabular-nums text-ink">
                {formatValor(s.valor)}
              </span>
            </span>
            <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <span
                className="block h-full rounded-full transition-[width] duration-300 ease-brand"
                style={{ width: `${(s.valor / max) * 100}%`, background: COLOR[tono] }}
              />
            </span>
          </>
        )
        return (
          <li key={s.id}>
            {s.onClick ? (
              <button
                type="button"
                onClick={s.onClick}
                className="-mx-1.5 block w-[calc(100%+12px)] rounded-sm px-1.5 py-1 text-left transition-colors duration-fast hover:bg-surface-hover"
              >
                {fila}
              </button>
            ) : (
              <div>{fila}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
