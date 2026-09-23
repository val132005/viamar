export const STAR_SERIAL = 'CIB-90822173'
export const STAR_REPLACEMENT = 'CIB-90954410'
export const HONRA_FULL_SERIAL = 'CIB-90830001'
export const HONRA_PRORRA_SERIAL = 'CIB-90830002'

export type UbicacionTipo = 'VIAMAR' | 'DEALER' | 'CENTRO_CARGA' | 'CLIENTE' | 'RETIRADA'
export type CertificadoEstado = 'E' | 'C'
export type HonraEstado = 'SOLICITADA' | 'EN_EVALUACION' | 'APROBADA' | 'RECHAZADA' | 'EJECUTADA'
export type ChequeoEstado = 'BORRADOR' | 'PENDIENTE' | 'EN_PROCESO' | 'FINALIZADA' | 'CANCELADA'
export type CargaEstado = 'PENDIENTE' | 'EN_CARGA' | 'CARGA_COMPLETADA' | 'NO_RECUPERABLE'
export type DecisionVigencia = 'HEREDA' | 'RESETEA' | 'NO_APLICA'
export type OrigenRegistro = 'D365' | 'PORTAL' | 'SMART' | 'MANUAL'
export type EventoTipo =
  | 'INGRESO'
  | 'VENTA_DEALER'
  | 'CHEQUEO'
  | 'ENVIO_CARGA'
  | 'CARGA_COMPLETADA'
  | 'VENTA_CLIENTE'
  | 'CERTIFICADO'
  | 'SOLICITUD_GARANTIA'
  | 'DIAGNOSTICO'
  | 'HONRA'
  | 'REEMPLAZO'
export type IntegracionEstado = 'pendiente' | 'enviado' | 'error'
export type DocTipo = 'CEDULA' | 'RNC' | 'PASAPORTE'
export type DealerPerfil = 'envejecido' | 'impecable' | 'incidencias' | 'normal'

export type Marca = {
  id: string
  nombre: string
}

export type Articulo = {
  id: string
  codigo: string
  descripcion: string
  marcaId: string
  capacidadNominal: number
  precioVigente: number
  politicaId: string
  porConfirmar: boolean
}

export type Formula = {
  id: string
  expresion: string
  variablesUsadas: string[]
  preset: 'FDD489' | 'FRD489' | 'custom'
}

export type PoliticaGarantia = {
  id: string
  version: number
  nombre: string
  mesesFull: number
  mesesProrrateo: number
  baseCalculo: 'PRECIO_ORIGINAL' | 'PRECIO_VIGENTE'
  estrategia: 'COBERTURA_TOTAL' | 'PRORRATEO_LINEAL' | 'PRORRATEO_POR_TRAMOS'
  umbralMinimoCapacidad: number
  diasPlazoReclamo: number
  formulaId: string
  vigenciaDesde: string
  vigenciaHasta: string | null
  estado: 'ACTIVA' | 'HISTORICA'
}

export type Dealer = {
  id: string
  nombre: string
  rnc: string
  localidad: string
  vendedorAsignado: string
  ultimaVisita: string
  perfil: DealerPerfil
  porConfirmar: boolean
}

export type ClienteFinal = {
  id: string
  nombre: string
  tipoDoc: DocTipo
  documento: string
  email: string
  telefono: string
}

export type Bateria = {
  serial: string
  articuloId: string
  diagnosticoId: string
  ubicacionTipo: UbicacionTipo
  ubicacionId: string
  fechaFabricacion: string
  fechaIngreso: string
  origen: OrigenRegistro
  politicaId: string
  politicaVersion: number
  serialReemplazoDe?: string
  serialReemplazadoPor?: string
}

export type Certificado = {
  id: string
  serial: string
  clienteId: string
  dealerId?: string
  facturaNcf: string
  fechaVenta: string
  fechaActivacion: string
  fechaFinFull: string
  fechaFinProrrateo: string
  estado: CertificadoEstado
  heredadoDe?: string
  vehiculo: { marca: string; modelo: string; anio: number }
  tipoUsoId: string
}

export type LineaDiagnostico = {
  id: string
  serial: string
  voltaje: number
  densidad: number
  capacidadMedida: number
  diagnostico: string
  accionSugerida: string
  accionTomada?: string
}

export type SolicitudChequeo = {
  id: string
  numero: string
  dealerId: string
  vendedorId: string
  supervisorId: string
  estado: ChequeoEstado
  fechaCreacion: string
  fechaVisita: string
  centroId: string
  lineas: LineaDiagnostico[]
}

export type CentroCarga = {
  id: string
  nombre: string
  localidad: string
  porConfirmar: boolean
}

export type Estacion = {
  id: string
  centroId: string
  nombre: string
}

export type ProcesoCarga = {
  id: string
  serial: string
  centroId: string
  estacionId: string
  tecnicoId: string
  estadoInicial: string
  porcentajeCarga: number
  resultado: CargaEstado
  fechaInicio: string
  fechaFin?: string
}

export type ResultadoCalculo = {
  admisible: boolean
  motivoRechazo?: string
  mesesUso: number
  porcentajeUsado: number
  montoAcreditar: number
  montoCliente: number
  formulaAplicada: string
  variablesEntrada: Record<string, number | string>
}

export type Honra = {
  id: string
  serialOriginal: string
  serialReemplazo?: string
  politicaId: string
  politicaVersion: number
  origen: 'mostrador' | 'dealer'
  estado: HonraEstado
  resultadoCalculo: ResultadoCalculo
  decisionVigencia: DecisionVigencia
  usuarioId: string
  fechaCalculo: string
}

export type ReclamoFabricante = {
  id: string
  honraId: string
  fabricante: string
  estado: 'abierto' | 'enviado' | 'cerrado'
  montoReclamado: number
}

export type EventoHistorico = {
  id: string
  serial: string
  tipo: EventoTipo
  fecha: string
  usuarioId: string
  descripcion: string
  referenciaId?: string
  estadoAnterior?: string
  estadoNuevo?: string
  origen: OrigenRegistro
}

export type EventoIntegracion = {
  id: string
  verbo: string
  payload: string
  estado: IntegracionEstado
  intentos: number
  fecha: string
  origenModulo: string
  origenRegistro: OrigenRegistro
}

export type TipoUso = {
  id: string
  nombre: string
  requiereVehiculo: boolean
}

export type SeedSnapshot = {
  generatedAt: string
  fechaReferencia: string
  marcas: Marca[]
  articulos: Articulo[]
  formulas: Formula[]
  politicas: PoliticaGarantia[]
  tiposUso: TipoUso[]
  dealers: Dealer[]
  clientes: ClienteFinal[]
  centros: CentroCarga[]
  estaciones: Estacion[]
  baterias: Record<string, Bateria>
  certificados: Certificado[]
  solicitudes: SolicitudChequeo[]
  procesos: ProcesoCarga[]
  honras: Honra[]
  reclamosFabricante: ReclamoFabricante[]
  eventos: EventoHistorico[]
  integracion: EventoIntegracion[]
}
