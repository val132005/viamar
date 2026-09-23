import { addMonths } from '../dates'
import type { Articulo, Bateria, Certificado, Formula, PoliticaGarantia } from '../entities'
import { evaluarHonra, type EvaluacionHonra } from './engine'
import { PRESET_FDD489, PRESET_FRD489 } from './presets'

export type SimInputs = {
  mesesUso: number
  precioOriginal: number
  precioVigente: number
  capacidadMedida: number
}

export function simulatePolicy(
  politica: PoliticaGarantia,
  expresion: string,
  preset: Formula['preset'],
  sim: SimInputs,
): EvaluacionHonra {
  const evalDate = new Date()
  const venta = addMonths(evalDate, -sim.mesesUso)
  const articulo: Articulo = {
    id: 'sim',
    codigo: 'SIM',
    descripcion: 'Simulación',
    marcaId: 'viamax',
    capacidadNominal: 600,
    precioVigente: sim.precioVigente,
    politicaId: politica.id,
    porConfirmar: true,
  }
  const bateria: Bateria = {
    serial: 'CIB-SIM',
    articuloId: 'sim',
    diagnosticoId: 'PARA_GARANTIA',
    ubicacionTipo: 'CLIENTE',
    ubicacionId: 'sim',
    fechaFabricacion: venta.toISOString(),
    fechaIngreso: venta.toISOString(),
    origen: 'MANUAL',
    politicaId: politica.id,
    politicaVersion: politica.version,
  }
  const certificado: Certificado = {
    id: 'cert-sim',
    serial: 'CIB-SIM',
    clienteId: 'sim',
    facturaNcf: 'B01SIM',
    fechaVenta: venta.toISOString(),
    fechaActivacion: venta.toISOString(),
    fechaFinFull: addMonths(venta, politica.mesesFull).toISOString(),
    fechaFinProrrateo: addMonths(venta, politica.mesesProrrateo).toISOString(),
    estado: 'E',
    vehiculo: { marca: 'KIA', modelo: 'Sim', anio: 2022 },
    tipoUsoId: 'AUTOMOVIL',
  }
  const formula: Formula = { id: 'sim', expresion, variablesUsadas: [], preset }
  return evaluarHonra({
    bateria,
    articulo,
    politica,
    certificado,
    formula,
    capacidadMedida: sim.capacidadMedida,
    fechaEvaluacion: evalDate,
    fechaReclamo: evalDate,
    precioVigente: sim.precioVigente,
    precioOriginal: sim.precioOriginal,
  })
}

export function comparePresets(politica: PoliticaGarantia, sim: SimInputs) {
  return {
    fdd: simulatePolicy(politica, PRESET_FDD489, 'FDD489', sim),
    frd: simulatePolicy(politica, PRESET_FRD489, 'FRD489', sim),
  }
}
