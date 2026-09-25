import { TrendingDown } from 'lucide-react'
import { coberturaMes } from '../../domain/warranty/engine'

type Props = {
  mesesFull?: number
  mesesProrrateo?: number
}

export function CoverageChart({ mesesFull = 12, mesesProrrateo = 24 }: Props) {
  const WIDTH = 520
  const HEIGHT = 180
  const PAD = 28
  const innerH = HEIGHT - PAD * 2
  const innerW = WIDTH - PAD * 2
  const xFor = (month: number) => PAD + (innerW * (month - 1)) / Math.max(1, mesesProrrateo - 1)
  const yFor = (month: number) => PAD + innerH * (1 - coberturaMes(month, mesesFull, mesesProrrateo) / 100)
  const points = Array.from({ length: mesesProrrateo }, (_, i) => {
    const month = i + 1
    return `${xFor(month)},${yFor(month)}`
  }).join(' ')
  const stepX = xFor(mesesFull + 1)
  const cob12 = coberturaMes(mesesFull, mesesFull, mesesProrrateo)
  const cob13 = coberturaMes(mesesFull + 1, mesesFull, mesesProrrateo)

  return (
    <figure className="surface px-4 pb-4 pt-3.5">
      <figcaption className="mb-2 flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-viamar-50 text-viamar-600">
          <TrendingDown size={15} aria-hidden="true" />
        </span>
        <span>
          <span className="block text-headline-sm text-ink">Curva de cobertura mes a mes</span>
          <span className="block text-body-xs text-ink-tertiary">El escalón no se corrige: se muestra.</span>
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-44" role="img" aria-label="Cobertura mes a mes">
        <defs>
          <linearGradient id="cobertura-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#206AA9" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#206AA9" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={PAD} y1={HEIGHT - PAD} x2={WIDTH - PAD} y2={HEIGHT - PAD} stroke="#E3E8EF" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={HEIGHT - PAD} stroke="#E3E8EF" />
        <polygon
          fill="url(#cobertura-area)"
          points={`${xFor(1)},${HEIGHT - PAD} ${points} ${xFor(mesesProrrateo)},${HEIGHT - PAD}`}
        />
        <line x1={stepX} y1={PAD} x2={stepX} y2={HEIGHT - PAD} stroke="#039BE5" strokeDasharray="4 3" />
        <polyline fill="none" stroke="#206AA9" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" points={points} />
        <text x={stepX + 6} y={PAD + 12} fontSize="11" fill="#1B5C93">
          mes {mesesFull + 1}
        </text>
        <text x={PAD - 4} y={PAD + 4} fontSize="10" fill="#86929F" textAnchor="end">
          100%
        </text>
        <text x={PAD - 4} y={HEIGHT - PAD + 4} fontSize="10" fill="#86929F" textAnchor="end">
          0
        </text>
      </svg>
      <p className="mt-2 rounded-lg border border-viamar-100 bg-viamar-50/70 px-3 py-2 text-body-sm text-viamar-800">
        Mes {mesesFull}: <strong>{cob12.toFixed(0)} %</strong> → mes {mesesFull + 1}:{' '}
        <strong>{cob13.toFixed(1)} %</strong>. Caída abrupta al terminar el full. Si el negocio quiere
        suavizarla, existe la estrategia PRORRATEO_POR_TRAMOS — no se cambia de oficio.
      </p>
    </figure>
  )
}
