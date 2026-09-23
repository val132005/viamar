import type {
  Articulo,
  Bateria,
  Certificado,
  DecisionVigencia,
  Formula,
  PoliticaGarantia,
  ResultadoCalculo,
} from '../entities'
import { addMonths, iso } from '../dates'
import { evaluateFormula, type FormulaVars } from './formula'
import { diasEntre, mesesCalendarioEnteros, parseIso } from './months'
import { PRESET_FDD489, PRESET_FRD489 } from './presets'

export type EvaluarHonraInput = {
  bateria: Bateria
  articulo: Articulo
  politica: PoliticaGarantia
  certificado: Certificado | undefined
  formula: Formula | undefined
  capacidadMedida: number
  fechaEvaluacion: Date
  fechaReclamo: Date
  precioVigente: number
  precioOriginal?: number
}

export type EvaluacionHonra = ResultadoCalculo & {
  decisionVigencia: DecisionVigencia
  fechaActivacionReemplazo?: string
  fechaFinFullReemplazo?: string
  fechaFinProrrateoReemplazo?: string
}

function reject(
  motivo: string,
  extra: Partial<EvaluacionHonra> & Pick<EvaluacionHonra, 'mesesUso' | 'variablesEntrada'>,
): EvaluacionHonra {
  return {
    admisible: false,
    motivoRechazo: motivo,
    porcentajeUsado: 0,
    montoAcreditar: 0,
    montoCliente: 0,
    formulaAplicada: extra.formulaAplicada ?? '',
    decisionVigencia: 'NO_APLICA',
    ...extra,
  }
}

export function evaluarHonra(input: EvaluarHonraInput): EvaluacionHonra {
  const {
    articulo,
    politica,
    certificado,
    formula,
    capacidadMedida,
    fechaEvaluacion,
    fechaReclamo,
    precioVigente,
  } = input
  const precioOriginal = input.precioOriginal ?? articulo.precioVigente
  const precioBase = politica.baseCalculo === 'PRECIO_VIGENTE' ? precioVigente : precioOriginal
  const varsBase = {
    mesesFull: politica.mesesFull,
    mesesProrrateo: politica.mesesProrrateo,
    precioOriginal,
    precioVigente,
    precioBase,
  }

  if (!certificado || certificado.estado !== 'E') {
    return reject('NO_CERTIFICADO', {
      mesesUso: 0,
      formulaAplicada: formula?.expresion ?? '',
      variablesEntrada: varsBase,
    })
  }

  const diasReclamo = diasEntre(fechaReclamo, fechaEvaluacion)
  if (diasReclamo > politica.diasPlazoReclamo) {
    return reject('FUERA_DE_PLAZO', {
      mesesUso: 0,
      formulaAplicada: formula?.expresion ?? '',
      variablesEntrada: { ...varsBase, diasReclamo },
    })
  }

  if (capacidadMedida < politica.umbralMinimoCapacidad) {
    return reject('BAJO_UMBRAL', {
      mesesUso: 0,
      formulaAplicada: formula?.expresion ?? '',
      variablesEntrada: { ...varsBase, capacidadMedida, umbral: politica.umbralMinimoCapacidad },
    })
  }

  const fechaVenta = parseIso(certificado.fechaVenta)
  const mesesUso = mesesCalendarioEnteros(fechaVenta, fechaEvaluacion)
  const vars: FormulaVars = { ...varsBase, mesesUso }

  if (mesesUso > politica.mesesProrrateo) {
    return reject('FUERA_DE_GARANTIA', {
      mesesUso,
      porcentajeUsado: 100,
      formulaAplicada: formula?.expresion ?? '',
      variablesEntrada: vars,
    })
  }

  const expresion = formula?.expresion ?? PRESET_FDD489
  const bruto = evaluateFormula(expresion, vars)
  const esFrd = formula?.preset === 'FRD489' || expresion === PRESET_FRD489
  let montoAcreditar = esFrd ? Math.max(0, precioVigente - bruto) : Math.max(0, bruto)
  let montoCliente = esFrd ? Math.max(0, bruto) : Math.max(0, precioVigente - montoAcreditar)

  if (politica.estrategia === 'COBERTURA_TOTAL' && mesesUso <= politica.mesesFull) {
    montoAcreditar = precioBase
    montoCliente = 0
  }
  if (politica.estrategia === 'PRORRATEO_POR_TRAMOS') {
    if (mesesUso <= politica.mesesFull) {
      montoAcreditar = precioBase
      montoCliente = 0
    } else {
      montoAcreditar = precioBase * 0.5
      montoCliente = Math.max(0, precioVigente - montoAcreditar)
    }
  }

  const full = mesesUso <= politica.mesesFull
  if (full) {
    montoCliente = 0
    montoAcreditar = precioBase
  }

  const decisionVigencia: DecisionVigencia = full ? 'HEREDA' : 'RESETEA'
  const activacion = full ? parseIso(certificado.fechaActivacion) : fechaEvaluacion

  return {
    admisible: true,
    mesesUso,
    porcentajeUsado: Math.round((mesesUso / politica.mesesProrrateo) * 100),
    montoAcreditar: round2(montoAcreditar),
    montoCliente: round2(montoCliente),
    formulaAplicada: expresion,
    variablesEntrada: vars,
    decisionVigencia,
    fechaActivacionReemplazo: iso(activacion),
    fechaFinFullReemplazo: iso(addMonths(activacion, politica.mesesFull)),
    fechaFinProrrateoReemplazo: iso(addMonths(activacion, politica.mesesProrrateo)),
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function coberturaMes(month: number, mesesFull: number, mesesProrrateo: number): number {
  if (month <= mesesFull) return 100
  if (month > mesesProrrateo) return 0
  return Math.max(0, 100 - (month / mesesProrrateo) * 100)
}
