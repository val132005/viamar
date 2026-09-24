import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn } from '../../../lib/cn'

export type SerieTono = 'brand' | 'accent' | 'ok' | 'warn' | 'danger' | 'neutral'

const COLOR: Record<SerieTono, string> = {
  brand: '#206AA9',
  accent: '#039BE5',
  ok: '#1F7A34',
  warn: '#B4690E',
  danger: '#C0392F',
  neutral: '#9AA7B6',
}

export type Serie = {
  id: string
  label: string
  tono: SerieTono
  data: number[]
  /** Degradado tenue bajo la línea. Reservado a la serie que gobierna. */
  area?: boolean
}

type Props = {
  /** Etiquetas del eje horizontal; una por punto de cada serie. */
  labels: string[]
  series: Serie[]
  height?: number
  /** Formato del eje vertical y del tooltip. Por omisión, entero. */
  formatValor?: (n: number) => string
  emptyMessage?: string
  className?: string
}

const PAD_L = 40
const PAD_R = 10
const PAD_T = 10
const PAD_B = 26

/** Mide el ancho real del contenedor: sin él, las etiquetas se deformarían. */
function useAnchoMedido() {
  const ref = useRef<HTMLDivElement>(null)
  const [ancho, setAncho] = useState(560)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => setAncho(el.clientWidth || 560)
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, ancho] as const
}

/** Escala «bonita»: el eje termina en un número redondo, no en el máximo crudo. */
function techo(max: number): number {
  if (max <= 0) return 1
  const exp = Math.floor(Math.log10(max))
  const base = 10 ** exp
  for (const paso of [1, 2, 4, 5, 10]) {
    const candidato = base * paso
    if (candidato >= max) return candidato
  }
  return base * 10
}

/**
 * Gráfico de tendencia multi-serie. Rejilla horizontal únicamente: las guías
 * verticales compiten con las líneas sin aportar lectura. El valor exacto se
 * obtiene al apuntar, no saturando el lienzo con etiquetas.
 */
export function TrendChart({
  labels,
  series,
  height = 210,
  formatValor = (n) => String(Math.round(n)),
  emptyMessage = 'Sin datos suficientes en el período.',
  className,
}: Props) {
  const gradId = useId()
  const [ref, ancho] = useAnchoMedido()
  const [hover, setHover] = useState<number | null>(null)

  const puntos = labels.length
  const max = useMemo(
    () => techo(Math.max(1, ...series.flatMap((s) => s.data))),
    [series],
  )

  if (puntos === 0 || series.length === 0) {
    return (
      <div ref={ref} className={cn('flex items-center justify-center', className)} style={{ height }}>
        <p className="text-body-sm text-ink-tertiary">{emptyMessage}</p>
      </div>
    )
  }

  const innerW = Math.max(120, ancho - PAD_L - PAD_R)
  const innerH = height - PAD_T - PAD_B
  const x = (i: number) => PAD_L + (puntos === 1 ? innerW / 2 : (innerW * i) / (puntos - 1))
  const y = (v: number) => PAD_T + innerH * (1 - v / max)

  /* Tres guías bastan para estimar una magnitud; con más, la rejilla
     compite con las líneas en vez de servirlas. */
  const guias = [0, 0.5, 1]
  /* Con muchos meses, rotular todos apelmaza el eje: se muestra uno de cada n. */
  const salto = Math.ceil(puntos / Math.max(4, Math.floor(innerW / 64)))

  return (
    <div ref={ref} className={cn('relative w-full', className)}>
      <svg
        width={ancho}
        height={height}
        role="img"
        aria-label={`Tendencia de ${series.map((s) => s.label).join(', ')}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect()
          const rel = e.clientX - box.left - PAD_L
          const i = Math.round((rel / innerW) * (puntos - 1))
          setHover(Math.min(puntos - 1, Math.max(0, i)))
        }}
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.id} id={`${gradId}-${s.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR[s.tono]} stopOpacity="0.16" />
              <stop offset="100%" stopColor={COLOR[s.tono]} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {guias.map((g) => {
          const gy = PAD_T + innerH * (1 - g)
          return (
            <g key={g}>
              <line
                x1={PAD_L}
                y1={gy}
                x2={PAD_L + innerW}
                y2={gy}
                stroke="#EEF1F6"
                strokeWidth="1"
              />
              <text x={PAD_L - 8} y={gy + 3} fontSize="10" fill="#86929F" textAnchor="end">
                {formatValor(max * g)}
              </text>
            </g>
          )
        })}

        {/* Guía vertical del punto apuntado: ancla la lectura del tooltip. */}
        {hover !== null ? (
          <line
            x1={x(hover)}
            y1={PAD_T}
            x2={x(hover)}
            y2={PAD_T + innerH}
            stroke="#CFD7E1"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ) : null}

        {series.map((s) => {
          const linea = s.data
            .slice(0, puntos)
            .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
            .join(' ')
          return (
            <g key={s.id}>
              {s.area ? (
                <path
                  d={`${linea} L${x(puntos - 1)},${PAD_T + innerH} L${x(0)},${PAD_T + innerH} Z`}
                  fill={`url(#${gradId}-${s.id})`}
                />
              ) : null}
              <path
                d={linea}
                fill="none"
                stroke={COLOR[s.tono]}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {s.data.slice(0, puntos).map((v, i) => (
                <circle
                  key={i}
                  cx={x(i)}
                  cy={y(v)}
                  r={hover === i ? 4 : 2.5}
                  fill="#FFFFFF"
                  stroke={COLOR[s.tono]}
                  strokeWidth="2"
                />
              ))}
            </g>
          )
        })}

        {labels.map((l, i) =>
          i % salto === 0 || i === puntos - 1 ? (
            <text
              key={l + i}
              x={x(i)}
              y={height - 8}
              fontSize="10"
              fill="#86929F"
              textAnchor="middle"
            >
              {l}
            </text>
          ) : null,
        )}
      </svg>

      {/* Tooltip en HTML: hereda tipografía y tokens sin duplicarlos en SVG. */}
      {hover !== null ? (
        <div
          className="surface-raised pointer-events-none absolute z-10 min-w-[128px] px-2.5 py-2"
          style={{
            left: Math.min(Math.max(x(hover) - 64, 0), Math.max(0, ancho - 140)),
            top: 4,
          }}
        >
          <p className="text-label-md text-ink">{labels[hover]}</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {series.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-body-xs text-ink-secondary">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: COLOR[s.tono] }}
                    aria-hidden="true"
                  />
                  {s.label}
                </span>
                <span className="text-label-md tabular-nums text-ink">
                  {formatValor(s.data[hover] ?? 0)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

/** Leyenda compartida por los gráficos: un solo estilo en toda la aplicación. */
export function ChartLegend({
  items,
  align = 'start',
  className,
}: {
  items: Array<{ id: string; label: string; tono: SerieTono }>
  /** `center` la sitúa sobre el lienzo, como cabecera del propio gráfico. */
  align?: 'start' | 'center'
  className?: string
}) {
  return (
    <ul
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-1',
        align === 'center' ? 'justify-center' : '',
        className,
      )}
    >
      {items.map((i) => (
        <li key={i.id} className="flex items-center gap-1.5 text-body-xs text-ink-secondary">
          <span
            className="h-2.5 w-2.5 rounded-xs"
            style={{ background: COLOR[i.tono] }}
            aria-hidden="true"
          />
          {i.label}
        </li>
      ))}
    </ul>
  )
}
