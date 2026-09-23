export type MesHonra = { mes: string; acreditar: number; cliente: number }

export function MonthlyHonrasChart({ datos }: { datos: MesHonra[] }) {
  const WIDTH = 560
  const HEIGHT = 200
  const PAD_L = 52
  const PAD_B = 26
  const PAD_T = 10
  const innerW = WIDTH - PAD_L - 12
  const innerH = HEIGHT - PAD_T - PAD_B
  const max = Math.max(1, ...datos.map((d) => Math.max(d.acreditar, d.cliente)))
  const n = Math.max(1, datos.length)
  const slot = innerW / n
  const barW = Math.min(26, slot / 3)
  const yFor = (v: number) => PAD_T + innerH * (1 - v / max)

  return (
    <figure className="bg-white border border-app-border rounded p-4">
      <figcaption className="text-label-md mb-1">Honras por mes (USD)</figcaption>
      <p className="text-body-sm text-ink-secondary mb-2">
        Acreditar (azul Viamar) frente a lo que paga el cliente (acento). Full puro se ve como
        barra azul sola; el prorrateo muestra las dos.
      </p>
      {datos.length === 0 ? (
        <p className="text-body-sm text-ink-secondary">Sin honras en el período visible.</p>
      ) : (
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-48"
          role="img"
          aria-label="Honras por mes en dólares"
        >
          <line
            x1={PAD_L}
            y1={HEIGHT - PAD_B}
            x2={WIDTH - 12}
            y2={HEIGHT - PAD_B}
            stroke="#E0E0E0"
          />
          <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={HEIGHT - PAD_B} stroke="#E0E0E0" />
          <text x={PAD_L - 6} y={PAD_T + 8} fontSize="10" fill="#6F6F6F" textAnchor="end">
            {max >= 1000 ? `${(max / 1000).toFixed(1)}k` : String(Math.round(max))}
          </text>
          <text x={PAD_L - 6} y={HEIGHT - PAD_B} fontSize="10" fill="#6F6F6F" textAnchor="end">
            0
          </text>
          {datos.map((d, i) => {
            const cx = PAD_L + slot * i + slot / 2
            return (
              <g key={d.mes}>
                <rect
                  x={cx - barW - 2}
                  y={yFor(d.acreditar)}
                  width={barW}
                  height={HEIGHT - PAD_B - yFor(d.acreditar)}
                  fill="#206AA9"
                >
                  <title>
                    {d.mes} · acreditar ${d.acreditar.toFixed(2)}
                  </title>
                </rect>
                <rect
                  x={cx + 2}
                  y={yFor(d.cliente)}
                  width={barW}
                  height={HEIGHT - PAD_B - yFor(d.cliente)}
                  fill="#039BE5"
                >
                  <title>
                    {d.mes} · cliente ${d.cliente.toFixed(2)}
                  </title>
                </rect>
                <text
                  x={cx}
                  y={HEIGHT - PAD_B + 16}
                  fontSize="10"
                  fill="#6F6F6F"
                  textAnchor="middle"
                >
                  {d.mes.slice(2)}
                </text>
              </g>
            )
          })}
        </svg>
      )}
      <div className="mt-1 flex gap-4 text-body-sm text-ink-secondary">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: '#206AA9' }} />
          USD acreditar
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: '#039BE5' }} />
          USD cliente
        </span>
      </div>
    </figure>
  )
}
