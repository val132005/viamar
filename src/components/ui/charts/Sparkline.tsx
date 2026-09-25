import { useId } from 'react'
import { cn } from '../../../lib/cn'

export type SparkTone = 'brand' | 'ok' | 'warn' | 'danger' | 'accent' | 'neutral'

/* El trazo toma el color semántico de la métrica que acompaña: una línea de
   rechazos en rojo se lee sin tener que leer la etiqueta. */
const STROKE: Record<SparkTone, string> = {
  brand: '#206AA9',
  ok: '#1F7A34',
  warn: '#4A5D78',
  danger: '#C0392F',
  accent: '#039BE5',
  neutral: '#9AA7B6',
}

type Props = {
  /** Serie de valores en orden cronológico. */
  data: number[]
  tone?: SparkTone
  /** Rellena bajo la línea con un degradado muy tenue hacia transparente. */
  area?: boolean
  /** Marca el último punto: dónde está la serie hoy. */
  marcarUltimo?: boolean
  /** Traza la serie como curva continua en vez de quebrada. */
  smooth?: boolean
  /** Grosor del trazo. */
  strokeWidth?: number
  width?: number
  height?: number
  className?: string
  ariaLabel?: string
}

/** Trazo quebrado: honesto con los valores, sin suavizado. */
function poligonal(pts: ReadonlyArray<readonly [number, number]>): string {
  return pts.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ')
}

/**
 * Curva continua por Catmull-Rom convertida a Bézier cúbica. La tensión es
 * baja a propósito: suaviza la silueta sin inventar picos que los datos no
 * tienen ni desbordar por encima del máximo real.
 */
function curva(pts: ReadonlyArray<readonly [number, number]>): string {
  if (pts.length < 3) return poligonal(pts)
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

/**
 * Micro-gráfico de tendencia. No lleva ejes, rejilla ni etiquetas a propósito:
 * su trabajo es dar *forma* a una cifra, no permitir leer valores. Cuando el
 * usuario necesita el valor exacto, el sitio es el gráfico grande.
 */
export function Sparkline({
  data,
  tone = 'brand',
  area = true,
  marcarUltimo = true,
  smooth = true,
  strokeWidth = 1.5,
  width = 96,
  height = 28,
  className,
  ariaLabel,
}: Props) {
  const gradId = useId()

  /* Con menos de dos puntos no hay tendencia que dibujar; se reserva el hueco
     para que la tarjeta no cambie de alto cuando lleguen datos. */
  if (data.length < 2) {
    return <div className={cn('shrink-0', className)} style={{ width, height }} aria-hidden="true" />
  }

  const pad = 2
  const innerW = width - pad * 2
  const innerH = height - pad * 2
  const max = Math.max(...data)
  const min = Math.min(...data)
  /* Serie plana: se dibuja centrada en vez de pegada a un borde. */
  const span = max - min || 1
  const x = (i: number) => pad + (innerW * i) / (data.length - 1)
  const y = (v: number) =>
    max === min ? pad + innerH / 2 : pad + innerH * (1 - (v - min) / span)

  const puntos = data.map((v, i) => [x(i), y(v)] as const)
  const linea = smooth ? curva(puntos) : poligonal(puntos)
  const relleno = `${linea} L${x(data.length - 1).toFixed(1)},${height} L${x(0).toFixed(1)},${height} Z`
  const color = STROKE[tone]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn('shrink-0', className)}
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      {area ? (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={relleno} fill={`url(#${gradId})`} />
        </>
      ) : null}
      <path
        d={linea}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {marcarUltimo ? (
        <circle
          cx={x(data.length - 1)}
          cy={y(data[data.length - 1])}
          r="2"
          fill={color}
          stroke="#FFFFFF"
          strokeWidth="1"
        />
      ) : null}
    </svg>
  )
}

/**
 * Barras en miniatura. Se usa cuando la serie es de conteos discretos y bajos,
 * donde una línea sugiere una continuidad que los datos no tienen.
 */
export function Sparkbars({
  data,
  tone = 'brand',
  width = 96,
  height = 28,
  className,
}: Omit<Props, 'area' | 'marcarUltimo'>) {
  if (data.length === 0) {
    return <div className={cn('shrink-0', className)} style={{ width, height }} aria-hidden="true" />
  }
  const max = Math.max(...data, 1)
  const gap = 2
  const barW = Math.max(2, (width - gap * (data.length - 1)) / data.length)
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      {data.map((v, i) => {
        const h = Math.max(1, (height - 2) * (v / max))
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={height - h}
            width={barW}
            height={h}
            rx="1"
            fill={STROKE[tone]}
            /* La cola de la serie pesa más que su historia lejana. */
            opacity={0.35 + 0.65 * (i / Math.max(1, data.length - 1))}
          />
        )
      })}
    </svg>
  )
}
