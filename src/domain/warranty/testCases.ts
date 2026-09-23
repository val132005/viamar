import type { Articulo, Bateria, Certificado, Formula, PoliticaGarantia } from '../entities'
import { PRESET_FDD489 } from './presets'
import type { EvaluarHonraInput } from './engine'

const articulo: Articulo = {
  id: 'art-sol-48',
  codigo: 'SOL-48-600',
  descripcion: 'Solite Auto',
  marcaId: 'solite',
  capacidadNominal: 600,
  precioVigente: 180,
  politicaId: 'gar-solite',
  porConfirmar: true,
}

const articuloAlto: Articulo = { ...articulo, id: 'art-mc-ag', precioVigente: 1000, codigo: 'MC-AGM-1000' }

const politica: PoliticaGarantia = {
  id: 'gar-solite',
  version: 1,
  nombre: 'Garantía Solite Auto',
  mesesFull: 12,
  mesesProrrateo: 24,
  baseCalculo: 'PRECIO_ORIGINAL',
  estrategia: 'PRORRATEO_LINEAL',
  umbralMinimoCapacidad: 48,
  diasPlazoReclamo: 30,
  formulaId: 'fdd-489',
  vigenciaDesde: '2025-01-01',
  vigenciaHasta: null,
  estado: 'ACTIVA',
}

const politicaV1: PoliticaGarantia = { ...politica, version: 1, umbralMinimoCapacidad: 40 }
const formulaFdd: Formula = {
  id: 'fdd-489',
  expresion: PRESET_FDD489,
  variablesUsadas: ['mesesUso', 'mesesFull', 'precioBase', 'mesesProrrateo'],
  preset: 'FDD489',
}

function bat(serial: string, version = 1): Bateria {
  return {
    serial,
    articuloId: articulo.id,
    diagnosticoId: 'PARA_GARANTIA',
    ubicacionTipo: 'CLIENTE',
    ubicacionId: 'cli-01',
    fechaFabricacion: '2025-01-01T00:00:00.000Z',
    fechaIngreso: '2025-02-01T00:00:00.000Z',
    origen: 'D365',
    politicaId: politica.id,
    politicaVersion: version,
  }
}

function cert(serial: string, venta: string, estado: 'E' | 'C' = 'E'): Certificado {
  return {
    id: `cert-${serial}`,
    serial,
    clienteId: 'cli-01',
    facturaNcf: 'B0100000001',
    fechaVenta: venta,
    fechaActivacion: venta,
    fechaFinFull: '2026-03-15T00:00:00.000Z',
    fechaFinProrrateo: '2027-03-15T00:00:00.000Z',
    estado,
    vehiculo: { marca: 'KIA', modelo: 'Rio', anio: 2022 },
    tipoUsoId: 'AUTOMOVIL',
  }
}

export type CasoPrueba = {
  id: string
  nombre: string
  input: EvaluarHonraInput
  expect: {
    admisible: boolean
    motivoRechazo?: string
    mesesUso?: number
    decisionVigencia?: string
    montoCliente?: number
  }
}

export const WARRANTY_CASES: CasoPrueba[] = [
  {
    id: 'full',
    nombre: 'Honra en full (8 meses) — hereda, cliente no paga',
    input: {
      bateria: bat('CIB-FULL'),
      articulo,
      politica,
      certificado: cert('CIB-FULL', '2025-07-15T00:00:00.000Z'),
      formula: formulaFdd,
      capacidadMedida: 288,
      fechaEvaluacion: new Date('2026-03-15T00:00:00.000Z'),
      fechaReclamo: new Date('2026-03-15T00:00:00.000Z'),
      precioVigente: 180,
      precioOriginal: 180,
    },
    expect: { admisible: true, mesesUso: 8, decisionVigencia: 'HEREDA', montoCliente: 0 },
  },
  {
    id: 'prorrateo',
    nombre: 'Honra prorrateada (14 meses) — resetea, cliente paga',
    input: {
      bateria: bat('CIB-PRO'),
      articulo,
      politica,
      certificado: cert('CIB-PRO', '2025-01-15T00:00:00.000Z'),
      formula: formulaFdd,
      capacidadMedida: 300,
      fechaEvaluacion: new Date('2026-03-15T00:00:00.000Z'),
      fechaReclamo: new Date('2026-03-15T00:00:00.000Z'),
      precioVigente: 180,
      precioOriginal: 180,
    },
    expect: { admisible: true, mesesUso: 14, decisionVigencia: 'RESETEA', montoCliente: 105 },
  },
  {
    id: 'precio-subio',
    nombre: 'Precio vigente subió respecto al de venta',
    input: {
      bateria: bat('CIB-PX'),
      articulo,
      politica,
      certificado: cert('CIB-PX', '2025-01-15T00:00:00.000Z'),
      formula: formulaFdd,
      capacidadMedida: 300,
      fechaEvaluacion: new Date('2026-03-15T00:00:00.000Z'),
      fechaReclamo: new Date('2026-03-15T00:00:00.000Z'),
      precioVigente: 220,
      precioOriginal: 180,
    },
    expect: { admisible: true, decisionVigencia: 'RESETEA' },
  },
  {
    id: 'plazo',
    nombre: 'Fuera de plazo de reclamo (40 días, límite 30)',
    input: {
      bateria: bat('CIB-PLAZO'),
      articulo,
      politica,
      certificado: cert('CIB-PLAZO', '2025-07-15T00:00:00.000Z'),
      formula: formulaFdd,
      capacidadMedida: 300,
      fechaEvaluacion: new Date('2026-03-15T00:00:00.000Z'),
      fechaReclamo: new Date('2026-02-01T00:00:00.000Z'),
      precioVigente: 180,
      precioOriginal: 180,
    },
    expect: { admisible: false, motivoRechazo: 'FUERA_DE_PLAZO' },
  },
  {
    id: 'alto-valor',
    nombre: 'Batería de alto valor (USD 1.000) en full',
    input: {
      bateria: { ...bat('CIB-ALTO'), articuloId: articuloAlto.id },
      articulo: articuloAlto,
      politica,
      certificado: cert('CIB-ALTO', '2025-07-15T00:00:00.000Z'),
      formula: formulaFdd,
      capacidadMedida: 700,
      fechaEvaluacion: new Date('2026-03-15T00:00:00.000Z'),
      fechaReclamo: new Date('2026-03-15T00:00:00.000Z'),
      precioVigente: 1000,
      precioOriginal: 1000,
    },
    expect: { admisible: true, decisionVigencia: 'HEREDA', montoCliente: 0 },
  },
  {
    id: 'version-antigua',
    nombre: 'Política congelada en versión 1 (umbral 40, no 48)',
    input: {
      bateria: bat('CIB-V1', 1),
      articulo,
      politica: politicaV1,
      certificado: cert('CIB-V1', '2025-07-15T00:00:00.000Z'),
      formula: formulaFdd,
      capacidadMedida: 42,
      fechaEvaluacion: new Date('2026-03-15T00:00:00.000Z'),
      fechaReclamo: new Date('2026-03-15T00:00:00.000Z'),
      precioVigente: 180,
      precioOriginal: 180,
    },
    expect: { admisible: true, decisionVigencia: 'HEREDA' },
  },
  {
    id: 'umbral',
    nombre: 'Capacidad bajo el umbral — no calcula monto',
    input: {
      bateria: bat('CIB-UMBRAL'),
      articulo,
      politica,
      certificado: cert('CIB-UMBRAL', '2025-07-15T00:00:00.000Z'),
      formula: formulaFdd,
      capacidadMedida: 20,
      fechaEvaluacion: new Date('2026-03-15T00:00:00.000Z'),
      fechaReclamo: new Date('2026-03-15T00:00:00.000Z'),
      precioVigente: 180,
      precioOriginal: 180,
    },
    expect: { admisible: false, motivoRechazo: 'BAJO_UMBRAL' },
  },
]
