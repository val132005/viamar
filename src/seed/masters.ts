import type {
  Articulo,
  CentroCarga,
  Dealer,
  Formula,
  Marca,
  PoliticaGarantia,
  TipoUso,
} from '../domain/entities'

export const MARCAS: Marca[] = [
  { id: 'viamax', nombre: 'Viamax' },
  { id: 'motorcraft', nombre: 'Ford Motorcraft' },
  { id: 'solite', nombre: 'Solite' },
]

export const TIPOS_USO: TipoUso[] = [
  { id: 'AUTOMOVIL', nombre: 'Automóvil', requiereVehiculo: true },
  { id: 'OTROS', nombre: 'Otros', requiereVehiculo: true },
]

export const FORMULAS: Formula[] = [
  {
    id: 'fdd-489',
    preset: 'FDD489',
    expresion: 'precioOriginal * (1 - mesesUso / mesesProrrateo)',
    variablesUsadas: ['precioOriginal', 'mesesUso', 'mesesProrrateo'],
  },
  {
    id: 'frd-489',
    preset: 'FRD489',
    expresion:
      'mesesUso <= mesesFull ? 0 : precioVigente - (precioOriginal - (precioOriginal / mesesProrrateo) * mesesUso)',
    variablesUsadas: ['mesesUso', 'mesesFull', 'precioVigente', 'precioOriginal', 'mesesProrrateo'],
  },
]

export const POLITICAS: PoliticaGarantia[] = [
  {
    id: 'gar-viamax-std',
    version: 1,
    nombre: 'Garantía Viamax estándar',
    mesesFull: 12,
    mesesProrrateo: 24,
    baseCalculo: 'PRECIO_ORIGINAL',
    estrategia: 'PRORRATEO_LINEAL',
    umbralMinimoCapacidad: 50,
    diasPlazoReclamo: 30,
    formulaId: 'fdd-489',
    vigenciaDesde: '2024-01-01',
    vigenciaHasta: '2025-12-31',
    estado: 'HISTORICA',
  },
  {
    id: 'gar-viamax-std',
    version: 2,
    nombre: 'Garantía Viamax estándar',
    mesesFull: 12,
    mesesProrrateo: 24,
    baseCalculo: 'PRECIO_ORIGINAL',
    estrategia: 'PRORRATEO_LINEAL',
    umbralMinimoCapacidad: 50,
    diasPlazoReclamo: 30,
    formulaId: 'fdd-489',
    vigenciaDesde: '2026-01-01',
    vigenciaHasta: null,
    estado: 'ACTIVA',
  },
  {
    id: 'gar-motorcraft',
    version: 1,
    nombre: 'Garantía Ford Motorcraft',
    mesesFull: 12,
    mesesProrrateo: 24,
    baseCalculo: 'PRECIO_ORIGINAL',
    estrategia: 'PRORRATEO_LINEAL',
    umbralMinimoCapacidad: 50,
    diasPlazoReclamo: 30,
    formulaId: 'fdd-489',
    vigenciaDesde: '2025-01-01',
    vigenciaHasta: null,
    estado: 'ACTIVA',
  },
  {
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
  },
]

export const ARTICULOS: Articulo[] = [
  { id: 'art-vmx-48', codigo: 'VMX-48-650', descripcion: 'Viamax Grupo 48 · 650 CCA · 12V', marcaId: 'viamax', capacidadNominal: 650, precioVigente: 145, politicaId: 'gar-viamax-std', porConfirmar: false },
  { id: 'art-vmx-55', codigo: 'VMX-55-700', descripcion: 'Viamax Grupo 55 · 700 CCA · 12V', marcaId: 'viamax', capacidadNominal: 700, precioVigente: 168, politicaId: 'gar-viamax-std', porConfirmar: false },
  { id: 'art-vmx-65', codigo: 'VMX-65-800', descripcion: 'Viamax Grupo 65 · 800 CCA · 12V', marcaId: 'viamax', capacidadNominal: 800, precioVigente: 198, politicaId: 'gar-viamax-std', porConfirmar: false },
  { id: 'art-vmx-78', codigo: 'VMX-78-900', descripcion: 'Viamax Grupo 78 · 900 CCA · 12V', marcaId: 'viamax', capacidadNominal: 900, precioVigente: 240, politicaId: 'gar-viamax-std', porConfirmar: false },
  { id: 'art-mc-48', codigo: 'MC-48-650', descripcion: 'Ford Motorcraft Grupo 48 · 650 CCA', marcaId: 'motorcraft', capacidadNominal: 650, precioVigente: 175, politicaId: 'gar-motorcraft', porConfirmar: false },
  { id: 'art-mc-65', codigo: 'MC-65-850', descripcion: 'Ford Motorcraft Grupo 65 · 850 CCA', marcaId: 'motorcraft', capacidadNominal: 850, precioVigente: 220, politicaId: 'gar-motorcraft', porConfirmar: false },
  { id: 'art-mc-78', codigo: 'MC-78-950', descripcion: 'Ford Motorcraft Grupo 78 · 950 CCA', marcaId: 'motorcraft', capacidadNominal: 950, precioVigente: 265, politicaId: 'gar-motorcraft', porConfirmar: false },
  { id: 'art-mc-ag', codigo: 'MC-AGM-1000', descripcion: 'Ford Motorcraft AGM H8 · 1000 CCA · alto valor', marcaId: 'motorcraft', capacidadNominal: 1000, precioVigente: 1000, politicaId: 'gar-motorcraft', porConfirmar: false },
  { id: 'art-sol-40', codigo: 'SOL-40-500', descripcion: 'Solite Auto Grupo 40 · 500 CCA · 12V', marcaId: 'solite', capacidadNominal: 500, precioVigente: 95, politicaId: 'gar-solite', porConfirmar: false },
  { id: 'art-sol-48', codigo: 'SOL-48-600', descripcion: 'Solite Auto Grupo 48 · 600 CCA · 12V', marcaId: 'solite', capacidadNominal: 600, precioVigente: 180, politicaId: 'gar-solite', porConfirmar: false },
  { id: 'art-sol-55', codigo: 'SOL-55-700', descripcion: 'Solite Auto Grupo 55 · 700 CCA · 12V', marcaId: 'solite', capacidadNominal: 700, precioVigente: 155, politicaId: 'gar-solite', porConfirmar: false },
  { id: 'art-sol-65', codigo: 'SOL-65-800', descripcion: 'Solite Auto Grupo 65 · 800 CCA · 12V', marcaId: 'solite', capacidadNominal: 800, precioVigente: 188, politicaId: 'gar-solite', porConfirmar: false },
]

export const DEALERS: Dealer[] = [
  { id: 'dealer-piloto', nombre: 'Auto Repuestos El Caribe SRL', rnc: '1-30-12345-6', localidad: 'Santo Domingo', vendedorAsignado: 'usr-fraisi', ultimaVisita: '', perfil: 'incidencias', porConfirmar: false },
  { id: 'dealer-sd-norte', nombre: 'Baterías y Servicios Ozama SRL', rnc: '1-30-22345-7', localidad: 'Santo Domingo Norte', vendedorAsignado: 'usr-fraisi', ultimaVisita: '', perfil: 'envejecido', porConfirmar: false },
  { id: 'dealer-santiago', nombre: 'Centro Automotriz Cibao SA', rnc: '1-31-32345-8', localidad: 'Santiago', vendedorAsignado: 'usr-fraisi', ultimaVisita: '', perfil: 'impecable', porConfirmar: false },
  { id: 'dealer-la-vega', nombre: 'Repuestos La Vega Real SRL', rnc: '1-32-42345-9', localidad: 'La Vega', vendedorAsignado: 'usr-fraisi', ultimaVisita: '', perfil: 'normal', porConfirmar: false },
  { id: 'dealer-san-pedro', nombre: 'Auto Piezas Macorís SRL', rnc: '1-33-52345-1', localidad: 'San Pedro de Macorís', vendedorAsignado: 'usr-fraisi', ultimaVisita: '', perfil: 'normal', porConfirmar: false },
  { id: 'dealer-la-romana', nombre: 'Multiservicios Romana SRL', rnc: '1-34-62345-2', localidad: 'La Romana', vendedorAsignado: 'usr-fraisi', ultimaVisita: '', perfil: 'normal', porConfirmar: false },
  { id: 'dealer-puerto-plata', nombre: 'Baterías del Atlántico SRL', rnc: '1-35-72345-3', localidad: 'Puerto Plata', vendedorAsignado: 'usr-fraisi', ultimaVisita: '', perfil: 'normal', porConfirmar: false },
  { id: 'dealer-bonao', nombre: 'Taller y Repuestos Bonao SRL', rnc: '1-36-82345-4', localidad: 'Bonao', vendedorAsignado: 'usr-fraisi', ultimaVisita: '', perfil: 'normal', porConfirmar: false },
]

export const CENTROS: CentroCarga[] = [
  { id: 'centro-sd', nombre: 'Centro de carga Viamar — Km 9 Autopista Duarte', localidad: 'Santo Domingo', porConfirmar: false },
  { id: 'centro-stgo', nombre: 'Centro de carga Viamar — Santiago Av. Estrella Sadhalá', localidad: 'Santiago', porConfirmar: false },
]
