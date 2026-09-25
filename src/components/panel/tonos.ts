/* Mismos hex que TrendChart: el verde de la dona es el verde de la curva. */
export type Tono = 'brand' | 'accent' | 'navy' | 'ok' | 'warn' | 'danger' | 'neutral'

export const TONO_HEX: Record<Tono, string> = {
  brand: '#206AA9',
  accent: '#039BE5',
  navy: '#0E3453',
  ok: '#1F7A34',
  warn: '#4A5D78',
  danger: '#C0392F',
  neutral: '#9AA7B6',
}

/** Tono de una etiqueta (Pill) traducido al del panel, para donas y barras. */
export function tonoDePill(t: string): Tono {
  if (t === 'info') return 'accent'
  if (t === 'ok' || t === 'warn' || t === 'danger' || t === 'neutral' || t === 'brand' || t === 'accent') return t
  return 'neutral'
}

/** Tarjeta base de los bloques del panel: blanca, filo tenue, sombra mínima. */
export const PANEL = 'rounded-xl border border-line bg-white shadow-xs'
