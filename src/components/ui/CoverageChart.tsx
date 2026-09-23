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
    <figure className="bg-white border border-app-border rounded p-4">
      <figcaption className="text-label-md mb-2">
        Curva de cobertura mes a mes — el escalón no se corrige: se muestra
      </figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-44" role="img" aria-label="Cobertura mes a mes">
        <line x1={PAD} y1={HEIGHT - PAD} x2={WIDTH - PAD} y2={HEIGHT - PAD} stroke="#E0E0E0" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={HEIGHT - PAD} stroke="#E0E0E0" />
        <line x1={stepX} y1={PAD} x2={stepX} y2={HEIGHT - PAD} stroke="#039BE5" strokeDasharray="4 3" />
        <polyline fill="none" stroke="#206AA9" strokeWidth="2.5" points={points} />
        <text x={stepX + 6} y={PAD + 12} fontSize="11" fill="#185587">
          mes {mesesFull + 1}
        </text>
        <text x={PAD - 4} y={PAD + 4} fontSize="10" fill="#6F6F6F" textAnchor="end">
          100%
        </text>
        <text x={PAD - 4} y={HEIGHT - PAD + 4} fontSize="10" fill="#6F6F6F" textAnchor="end">
          0
        </text>
      </svg>
      <p className="mt-2 rounded bg-viamar-50 px-3 py-2 text-body-sm text-viamar-800">
        Mes {mesesFull}: <strong>{cob12.toFixed(0)} %</strong> → mes {mesesFull + 1}:{' '}
        <strong>{cob13.toFixed(1)} %</strong>. Caída abrupta al terminar el full. Si el negocio quiere
        suavizarla, existe la estrategia PRORRATEO_POR_TRAMOS — no se cambia de oficio.
      </p>
    </figure>
  )
}
