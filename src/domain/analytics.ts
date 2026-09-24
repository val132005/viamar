/**
 * Derivaciones analíticas sobre los datos que ya viven en los stores.
 *
 * Regla que gobierna este módulo: **no se inventa ningún dato**. Todo lo que
 * devuelve sale de agrupar, contar, sumar o comparar registros existentes. Si
 * una serie no tiene suficiente historia, se devuelve vacía y la interfaz
 * muestra su estado vacío — nunca un número de relleno.
 *
 * Son funciones puras y agnósticas de la entidad: reciben el array y un
 * accesor. Así las usa cualquier módulo sin acoplar la capa visual al dominio.
 */

/* ===========================================================================
   PERÍODOS
   ======================================================================== */

export type RangoId = '3m' | '6m' | '12m' | 'todo'

export type RangoOption = { id: RangoId; label: string; meses: number | null }

/** Rangos ofrecidos en los selectores de período. `todo` no acota. */
export const RANGOS: RangoOption[] = [
  { id: '3m', label: 'Últimos 3 meses', meses: 3 },
  { id: '6m', label: 'Últimos 6 meses', meses: 6 },
  { id: '12m', label: 'Últimos 12 meses', meses: 12 },
  { id: 'todo', label: 'Todo el histórico', meses: null },
]

export type Periodo = {
  id: RangoId
  /** Inicio del período actual; `null` cuando el rango es todo el histórico. */
  desde: Date | null
  hasta: Date
  /** Inicio del período inmediatamente anterior, de igual longitud. */
  previoDesde: Date | null
  meses: number | null
}

const MESES_CORTOS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sept',
  'oct',
  'nov',
  'dic',
]

/** Primer día del mes, a medianoche: el corte por meses calendario enteros. */
function inicioDeMes(d: Date, desplazamiento = 0): Date {
  return new Date(d.getFullYear(), d.getMonth() + desplazamiento, 1)
}

/**
 * Construye el período actual y el de comparación. Los meses son calendario
 * enteros, la convención acordada para todo el producto.
 */
export function periodoDe(rango: RangoId, referencia = new Date()): Periodo {
  const opt = RANGOS.find((r) => r.id === rango) ?? RANGOS[1]
  if (opt.meses === null) {
    return { id: opt.id, desde: null, hasta: referencia, previoDesde: null, meses: null }
  }
  return {
    id: opt.id,
    desde: inicioDeMes(referencia, -(opt.meses - 1)),
    hasta: referencia,
    previoDesde: inicioDeMes(referencia, -(opt.meses * 2 - 1)),
    meses: opt.meses,
  }
}

/** Etiqueta legible del período: `Mar 2026 – Sept 2026`. */
export function periodoLabel(p: Periodo): string {
  if (!p.desde) return 'Todo el histórico'
  const f = (d: Date) => {
    const mes = MESES_CORTOS[d.getMonth()] ?? ''
    return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${d.getFullYear()}`
  }
  return `${f(p.desde)} – ${f(p.hasta)}`
}

/** Clave de mes `2026-09` a partir de una fecha ISO. */
export function claveMes(iso: string): string {
  return iso.slice(0, 7)
}

/** `2026-09` → `Sept 2026`. Un eje debe leerse sin descifrarlo. */
export function mesLabel(clave: string): string {
  const [year, month] = clave.split('-')
  const idx = Number(month) - 1
  const mes = MESES_CORTOS[idx] ?? month
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${year}`
}

/** `2026-09` → `Sept`, para ejes estrechos. */
export function mesLabelCorto(clave: string): string {
  const idx = Number(clave.split('-')[1]) - 1
  const mes = MESES_CORTOS[idx] ?? clave
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)}`
}

/** Claves de mes consecutivas que cubren el período, para ejes sin huecos. */
export function mesesDelPeriodo(p: Periodo, fechasDisponibles?: string[]): string[] {
  let inicio = p.desde
  if (!inicio) {
    /* Histórico completo: el eje arranca en el primer registro que exista. */
    if (!fechasDisponibles?.length) return []
    const min = fechasDisponibles.reduce((a, b) => (a < b ? a : b))
    const [y, m] = min.slice(0, 7).split('-').map(Number)
    inicio = new Date(y, m - 1, 1)
  }
  const out: string[] = []
  const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1)
  const fin = new Date(p.hasta.getFullYear(), p.hasta.getMonth(), 1)
  /* Tope de seguridad: un histórico largo no debe generar un eje ilegible. */
  while (cursor <= fin && out.length < 60) {
    out.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return out
}

/* ===========================================================================
   PARTICIÓN Y COMPARACIÓN
   ======================================================================== */

export type Particion<T> = {
  /** Registros dentro del período seleccionado. */
  actuales: T[]
  /** Registros del período anterior de igual longitud, para comparar. */
  previos: T[]
  /** `false` cuando el rango es todo el histórico: no hay con qué comparar. */
  comparable: boolean
}

export function particionar<T>(
  items: T[],
  getFecha: (item: T) => string,
  p: Periodo,
): Particion<T> {
  if (!p.desde || !p.previoDesde) {
    return { actuales: items, previos: [], comparable: false }
  }
  const desde = p.desde.getTime()
  const previoDesde = p.previoDesde.getTime()
  const actuales: T[] = []
  const previos: T[] = []
  for (const item of items) {
    const t = new Date(getFecha(item)).getTime()
    if (Number.isNaN(t)) continue
    if (t >= desde) actuales.push(item)
    else if (t >= previoDesde) previos.push(item)
  }
  return { actuales, previos, comparable: true }
}

export type Variacion = {
  /** Variación porcentual redondeada a un decimal. */
  pct: number
  /** Texto listo para mostrar: `+12.5%`. */
  label: string
  direccion: 'sube' | 'baja' | 'igual'
}

/**
 * Compara dos magnitudes. Devuelve `null` cuando no hay base de comparación
 * (período anterior vacío): mostrar «+100 %» sobre cero engaña al lector.
 */
export function variacion(actual: number, previo: number, comparable = true): Variacion | null {
  if (!comparable || previo === 0) return null
  const pct = ((actual - previo) / previo) * 100
  const redondeado = Math.round(pct * 10) / 10
  return {
    pct: redondeado,
    label: `${redondeado > 0 ? '+' : ''}${redondeado}%`,
    direccion: redondeado > 0 ? 'sube' : redondeado < 0 ? 'baja' : 'igual',
  }
}

/* ===========================================================================
   SERIES Y DISTRIBUCIONES
   ======================================================================== */

export type PuntoSerie = { clave: string; label: string; valor: number }

/**
 * Serie mensual continua. `getValor` por omisión cuenta registros; devolver
 * un importe la convierte en serie de dinero.
 */
export function serieMensual<T>(
  items: T[],
  getFecha: (item: T) => string,
  meses: string[],
  getValor: (item: T) => number = () => 1,
): PuntoSerie[] {
  const acc = new Map<string, number>()
  for (const m of meses) acc.set(m, 0)
  for (const item of items) {
    const mes = claveMes(getFecha(item))
    if (!acc.has(mes)) continue
    acc.set(mes, (acc.get(mes) ?? 0) + getValor(item))
  }
  return meses.map((m) => ({ clave: m, label: mesLabelCorto(m), valor: acc.get(m) ?? 0 }))
}

/** Valores sueltos de una serie: lo que consume un sparkline. */
export function valores(serie: PuntoSerie[]): number[] {
  return serie.map((p) => p.valor)
}

export type Segmento = {
  id: string
  label: string
  valor: number
  /** Porcentaje sobre el total, redondeado al entero. */
  pct: number
}

/** Distribución por clave, ordenada de mayor a menor. */
export function distribucion<T>(
  items: T[],
  getKey: (item: T) => string,
  labelDe: (key: string) => string = (k) => k,
): Segmento[] {
  const acc = new Map<string, number>()
  for (const item of items) {
    const k = getKey(item)
    acc.set(k, (acc.get(k) ?? 0) + 1)
  }
  const total = items.length || 1
  return [...acc.entries()]
    .map(([id, valor]) => ({
      id,
      label: labelDe(id),
      valor,
      pct: Math.round((valor / total) * 100),
    }))
    .sort((a, b) => b.valor - a.valor)
}

/** Ranking de entidades por número de registros, para paneles «Top N». */
export function topEntidades<T>(
  items: T[],
  getKey: (item: T) => string,
  labelDe: (key: string) => string,
  limite = 5,
): Segmento[] {
  return distribucion(items, getKey, labelDe).slice(0, limite)
}

/** Porcentaje entero y acotado, el formato que esperan barras y anillos. */
export function porcentaje(parte: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((parte / total) * 100)))
}

/* ===========================================================================
   TIEMPO RELATIVO
   ======================================================================== */

/** «Hace 2 horas», «Ayer»: contexto temporal legible para feeds de actividad. */
export function tiempoRelativo(iso: string, ahora = Date.now()): string {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const diff = ahora - t
  const minutos = Math.floor(diff / 60_000)
  if (minutos < 1) return 'Ahora mismo'
  if (minutos < 60) return `Hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'Ayer'
  if (dias < 30) return `Hace ${dias} días`
  const meses = Math.floor(dias / 30)
  if (meses < 12) return `Hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`
  const años = Math.floor(meses / 12)
  return `Hace ${años} ${años === 1 ? 'año' : 'años'}`
}

/* ===========================================================================
   INSIGHTS
   ======================================================================== */

export type InsightTono = 'neutral' | 'ok' | 'warn' | 'danger' | 'info'

export type Insight = {
  id: string
  /** Titular: la lectura, no el dato crudo. */
  titulo: string
  /** Sustento: de dónde sale la lectura. */
  detalle: string
  tono: InsightTono
  icono: 'trend-up' | 'trend-down' | 'share' | 'alert' | 'money' | 'clock' | 'check'
}

/**
 * Insight de variación entre períodos. Devuelve `null` si no hay base
 * comparable, de modo que el panel simplemente no muestra esa línea.
 */
export function insightVariacion(opts: {
  id: string
  concepto: string
  actual: number
  previo: number
  comparable: boolean
  /** Si subir es bueno (ejecuciones) o malo (rechazos). */
  subirEsBueno?: boolean
}): Insight | null {
  const v = variacion(opts.actual, opts.previo, opts.comparable)
  if (!v || v.direccion === 'igual') return null
  const sube = v.direccion === 'sube'
  const bueno = opts.subirEsBueno ?? true
  const positivo = sube === bueno
  return {
    id: opts.id,
    titulo: `${opts.concepto} ${sube ? 'aumentaron' : 'disminuyeron'} ${Math.abs(v.pct)}%`,
    detalle: `${opts.actual} en el período · ${opts.previo} en el anterior.`,
    tono: positivo ? 'ok' : 'warn',
    icono: sube ? 'trend-up' : 'trend-down',
  }
}

/** Insight de concentración: qué segmento domina la distribución. */
export function insightConcentracion(
  id: string,
  segmentos: Segmento[],
  sustantivo: string,
): Insight | null {
  const top = segmentos[0]
  if (!top || segmentos.length < 2 || top.pct < 50) return null
  return {
    id,
    titulo: `El ${top.pct}% proviene de ${top.label.toLowerCase()}`,
    detalle: `${top.valor} de ${segmentos.reduce((a, s) => a + s.valor, 0)} ${sustantivo} en el período.`,
    tono: 'info',
    icono: 'share',
  }
}

/** Insight de promedio monetario. Sin registros no hay promedio que dar. */
export function insightPromedio(
  id: string,
  total: number,
  registros: number,
  concepto: string,
  formato: (n: number) => string,
): Insight | null {
  if (registros === 0) return null
  return {
    id,
    titulo: `${concepto}: ${formato(total / registros)}`,
    detalle: `${formato(total)} repartidos en ${registros} registros.`,
    tono: 'neutral',
    icono: 'money',
  }
}

/** Insight de una cola de trabajo pendiente. */
export function insightPendientes(
  id: string,
  cantidad: number,
  concepto: string,
  detalle: string,
): Insight | null {
  if (cantidad === 0) return null
  return {
    id,
    titulo: `${cantidad} ${concepto}`,
    detalle,
    tono: 'warn',
    icono: 'alert',
  }
}

/** Compacta la lista descartando los insights que no tenían sustento. */
export function compactar(items: Array<Insight | null>): Insight[] {
  return items.filter((i): i is Insight => i !== null)
}
