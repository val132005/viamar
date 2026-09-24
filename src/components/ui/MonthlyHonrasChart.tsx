import { cn } from '../../lib/cn'

export type MesHonra = { mes: string; acreditar: number; cliente: number }

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** `2026-07` → `jul 26`: un eje debe leerse sin descifrarlo. */
function mesCorto(iso: string): string {
  const [year, month] = iso.split('-')
  const idx = Number(month) - 1
  return `${MESES[idx] ?? month} ${year?.slice(2) ?? ''}`
}

function money(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`
  return `$${Math.round(v)}`
}

export function MonthlyHonrasChart({
  datos,
  className,
}: {
  datos: MesHonra[]
  className?: string
}) {
  const WIDTH = 560
  const HEIGHT = 190
  const PAD_L = 46
  const PAD_B = 24
  const PAD_T = 8
  const innerW = WIDTH - PAD_L - 12
  const innerH = HEIGHT - PAD_T - PAD_B
  const max = Math.max(1, ...datos.map((d) => Math.max(d.acreditar, d.cliente)))
  const n = Math.max(1, datos.length)
  const slot = innerW / n
  const barW = Math.min(22, slot / 3)
  const yFor = (v: number) => PAD_T + innerH * (1 - v / max)

  /* Tres guías horizontales bastan para estimar una magnitud; más rejilla
     compite con las barras. */
  const guias = [0, 0.5, 1]

  return (
    <figure className={cn('surface flex min-h-0 flex-col p-3', className)}>
      <figcaption className="flex items-center justify-between gap-2">
        <span className="text-headline-md text-ink">Honras por mes</span>
        <span className="inline-flex items-center gap-3 text-body-xs text-ink-secondary">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-xs bg-viamar-500" aria-hidden="true" />
            Acreditar
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-xs bg-viamar-accent" aria-hidden="true" />
            Cliente
          </span>
        </span>
      </figcaption>

      {datos.length === 0 ? (
        <p className="py-6 text-center text-body-sm text-ink-tertiary">
          Sin honras en el período visible.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="mt-2 min-h-[110px] w-full flex-1"
          role="img"
          aria-label="Importe de honras por mes, en dólares"
        >
          {guias.map((g) => {
            const y = PAD_T + innerH * (1 - g)
            return (
              <g key={g}>
                <line x1={PAD_L} y1={y} x2={WIDTH - 12} y2={y} stroke="#EEF1F6" strokeWidth="1" />
                <text x={PAD_L - 6} y={y + 3} fontSize="9" fill="#86929F" textAnchor="end">
                  {money(max * g)}
                </text>
              </g>
            )
          })}

          {datos.map((d, i) => {
            const cx = PAD_L + slot * i + slot / 2
            return (
              <g key={d.mes}>
                <rect
                  x={cx - barW - 1.5}
                  y={yFor(d.acreditar)}
                  width={barW}
                  height={Math.max(0, HEIGHT - PAD_B - yFor(d.acreditar))}
                  rx="2"
                  fill="#206AA9"
                >
                  <title>{`${mesCorto(d.mes)} · acreditar $${d.acreditar.toFixed(2)}`}</title>
                </rect>
                <rect
                  x={cx + 1.5}
                  y={yFor(d.cliente)}
                  width={barW}
                  height={Math.max(0, HEIGHT - PAD_B - yFor(d.cliente))}
                  rx="2"
                  fill="#039BE5"
                >
                  <title>{`${mesCorto(d.mes)} · cliente $${d.cliente.toFixed(2)}`}</title>
                </rect>
                <text
                  x={cx}
                  y={HEIGHT - PAD_B + 14}
                  fontSize="9"
                  fill="#86929F"
                  textAnchor="middle"
                >
                  {mesCorto(d.mes)}
                </text>
              </g>
            )
          })}
        </svg>
      )}
    </figure>
  )
}
