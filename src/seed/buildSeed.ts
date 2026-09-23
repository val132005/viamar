import {
  HONRA_FULL_SERIAL,
  HONRA_PRORRA_SERIAL,
  STAR_REPLACEMENT,
  STAR_SERIAL,
  type Bateria,
  type Certificado,
  type ClienteFinal,
  type EventoHistorico,
  type EventoIntegracion,
  type Honra,
  type ProcesoCarga,
  type SeedSnapshot,
  type SolicitudChequeo,
} from '../domain/entities'
import { addDays, addMonths, iso } from '../domain/dates'
import { ARTICULOS, CENTROS, DEALERS, FORMULAS, MARCAS, POLITICAS, TIPOS_USO } from './masters'

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rand: () => number, list: T[]): T {
  return list[Math.floor(rand() * list.length)]
}

function pad(n: number, w = 8) {
  return String(n).padStart(w, '0')
}

const CLIENT_NAMES = [
  'María Almonte',
  'Luis Peña',
  'Carolina Díaz',
  'José Cabrera',
  'Ana Rosario',
  'Pedro Núñez',
  'Laura Méndez',
  'Ricardo Guzmán',
  'Sofía Vargas',
  'Miguel Tejada',
  'Patricia Soto',
  'Daniel Herrera',
]

export function buildSeed(ref = new Date()): SeedSnapshot {
  const rand = rng(20260922)
  const eventos: EventoHistorico[] = []
  let ev = 0
  const pushEv = (e: Omit<EventoHistorico, 'id'>) => {
    eventos.push({ id: `ev-${pad(++ev, 4)}`, ...e })
  }

  const estaciones = CENTROS.flatMap((c) =>
    [1, 2, 3].map((n) => ({ id: `${c.id}-e${n}`, centroId: c.id, nombre: `Estación ${n}` })),
  )

  const dealers = DEALERS.map((d, i) => ({
    ...d,
    ultimaVisita: iso(addDays(ref, -((i + 1) * 4))),
  }))

  const clientes: ClienteFinal[] = CLIENT_NAMES.map((nombre, i) => ({
    id: `cli-${pad(i + 1, 2)}`,
    nombre,
    tipoDoc: 'CEDULA' as const,
    documento: `${pad(100 + i, 3)}-${pad(1000000 + i * 17, 7)}-${(i % 9) + 1}`,
    email: `${nombre.toLowerCase().replace(/ /g, '.')}@correo.demo`,
    telefono: `809-555-${pad(1000 + i, 4)}`,
  }))

  const politicaActiva = (id: string) =>
    POLITICAS.filter((p) => p.id === id).sort((a, b) => b.version - a.version)[0]

  const baterias: Record<string, Bateria> = {}
  const certificados: Certificado[] = []
  const honras: Honra[] = []
  const solicitudes: SolicitudChequeo[] = []
  const procesos: ProcesoCarga[] = []
  const integracion: EventoIntegracion[] = []

  function makeBattery(
    serial: string,
    articuloId: string,
    ubicacionTipo: Bateria['ubicacionTipo'],
    ubicacionId: string,
    monthsAgoIngreso: number,
    diagnosticoId: string,
    extra?: Partial<Bateria>,
  ): Bateria {
    const art = ARTICULOS.find((a) => a.id === articuloId)!
    const pol = politicaActiva(art.politicaId)
    const ingreso = addMonths(ref, -monthsAgoIngreso)
    const b: Bateria = {
      serial,
      articuloId,
      diagnosticoId,
      ubicacionTipo,
      ubicacionId,
      fechaFabricacion: iso(addMonths(ingreso, -3)),
      fechaIngreso: iso(ingreso),
      origen: 'D365',
      politicaId: pol.id,
      politicaVersion: pol.version,
      ...extra,
    }
    baterias[serial] = b
    pushEv({
      serial,
      tipo: 'INGRESO',
      fecha: b.fechaIngreso,
      usuarioId: 'usr-alvaro',
      descripcion: 'Ingreso a inventario Viamar y etiquetado de serial',
      origen: 'D365',
      estadoNuevo: 'VIAMAR',
    })
    return b
  }

  const starArt = 'art-sol-48'
  const starDealer = 'dealer-piloto'
  const starCliente = clientes[0]
  makeBattery(STAR_SERIAL, starArt, 'RETIRADA', 'honra', 18, 'PARA_GARANTIA', {
    serialReemplazadoPor: STAR_REPLACEMENT,
  })
  const t = (monthsAgo: number) => iso(addMonths(ref, -monthsAgo))
  pushEv({ serial: STAR_SERIAL, tipo: 'VENTA_DEALER', fecha: t(17), usuarioId: 'usr-andree', descripcion: `Venta a ${dealers[0].nombre}`, origen: 'D365', estadoAnterior: 'VIAMAR', estadoNuevo: 'DEALER' })
  pushEv({ serial: STAR_SERIAL, tipo: 'CHEQUEO', fecha: t(16), usuarioId: 'usr-elizabeth', descripcion: 'Chequeo en visita: densidad baja', origen: 'MANUAL' })
  pushEv({ serial: STAR_SERIAL, tipo: 'ENVIO_CARGA', fecha: t(16), usuarioId: 'usr-elizabeth', descripcion: 'Enviada a centro de carga Santo Domingo', origen: 'MANUAL', estadoNuevo: 'CENTRO_CARGA' })
  pushEv({ serial: STAR_SERIAL, tipo: 'CARGA_COMPLETADA', fecha: t(15), usuarioId: 'usr-tecnico', descripcion: 'Carga al 100 %, retorna a dealer', origen: 'MANUAL', estadoNuevo: 'DEALER' })
  pushEv({ serial: STAR_SERIAL, tipo: 'VENTA_CLIENTE', fecha: t(10), usuarioId: 'usr-dealer', descripcion: `Venta a ${starCliente.nombre}`, origen: 'PORTAL', estadoNuevo: 'CLIENTE' })
  const starVenta = addMonths(ref, -10)
  const starCert: Certificado = {
    id: 'cert-star',
    serial: STAR_SERIAL,
    clienteId: starCliente.id,
    dealerId: starDealer,
    facturaNcf: 'B0100001001',
    fechaVenta: iso(starVenta),
    fechaActivacion: iso(starVenta),
    fechaFinFull: iso(addMonths(starVenta, 12)),
    fechaFinProrrateo: iso(addMonths(starVenta, 24)),
    estado: 'C',
    vehiculo: { marca: 'KIA', modelo: 'Sportage', anio: 2022 },
    tipoUsoId: 'AUTOMOVIL',
  }
  certificados.push(starCert)
  pushEv({ serial: STAR_SERIAL, tipo: 'CERTIFICADO', fecha: iso(starVenta), usuarioId: 'usr-dealer', descripcion: 'Certificado E emitido (hoy cancelado por honra)', origen: 'PORTAL', estadoNuevo: 'E' })
  pushEv({ serial: STAR_SERIAL, tipo: 'SOLICITUD_GARANTIA', fecha: t(2), usuarioId: 'usr-andree', descripcion: 'Reclamo de mostrador — 8 meses de uso, cobertura full', origen: 'MANUAL' })
  pushEv({ serial: STAR_SERIAL, tipo: 'DIAGNOSTICO', fecha: t(2), usuarioId: 'usr-elizabeth', descripcion: 'Voltaje 11.2 V · densidad 1.12 · CCA 288/600 (48 %)', origen: 'MANUAL', estadoNuevo: 'PARA_GARANTIA' })
  honras.push({
    id: 'honra-star',
    serialOriginal: STAR_SERIAL,
    serialReemplazo: STAR_REPLACEMENT,
    politicaId: 'gar-solite',
    politicaVersion: 1,
    origen: 'mostrador',
    estado: 'EJECUTADA',
    resultadoCalculo: {
      admisible: true,
      mesesUso: 8,
      porcentajeUsado: 33,
      montoAcreditar: 180,
      montoCliente: 0,
      formulaAplicada: 'fdd-489',
      variablesEntrada: { mesesUso: 8, mesesFull: 12, precioOriginal: 180 },
    },
    decisionVigencia: 'HEREDA',
    usuarioId: 'usr-andree',
    fechaCalculo: t(2),
  })
  pushEv({ serial: STAR_SERIAL, tipo: 'HONRA', fecha: t(2), usuarioId: 'usr-andree', descripcion: 'Honra en full: cliente no paga, vigencia HEREDA (WI #2926)', origen: 'MANUAL', estadoNuevo: 'RETIRADA' })
  makeBattery(STAR_REPLACEMENT, starArt, 'CLIENTE', starCliente.id, 2, 'BUEN_ESTADO', {
    serialReemplazoDe: STAR_SERIAL,
  })
  certificados.push({
    id: 'cert-star-new',
    serial: STAR_REPLACEMENT,
    clienteId: starCliente.id,
    dealerId: starDealer,
    facturaNcf: 'B0100001002',
    fechaVenta: t(2),
    fechaActivacion: iso(starVenta),
    fechaFinFull: iso(addMonths(starVenta, 12)),
    fechaFinProrrateo: iso(addMonths(starVenta, 24)),
    estado: 'E',
    heredadoDe: 'cert-star',
    vehiculo: { marca: 'KIA', modelo: 'Sportage', anio: 2022 },
    tipoUsoId: 'AUTOMOVIL',
  })
  pushEv({ serial: STAR_SERIAL, tipo: 'REEMPLAZO', fecha: t(2), usuarioId: 'usr-andree', descripcion: `Reemplazada por ${STAR_REPLACEMENT}`, origen: 'MANUAL', referenciaId: STAR_REPLACEMENT })
  pushEv({ serial: STAR_REPLACEMENT, tipo: 'CERTIFICADO', fecha: t(2), usuarioId: 'usr-andree', descripcion: 'Certificado E con vigencia heredada de la original', origen: 'MANUAL', estadoNuevo: 'E' })

  function seedHonraDemo(serial: string, monthsSold: number, clienteIdx: number, vehiculo: { marca: string; modelo: string; anio: number }) {
    const cliente = clientes[clienteIdx]
    makeBattery(serial, starArt, 'CLIENTE', cliente.id, monthsSold + 2, 'BUEN_ESTADO')
    const venta = addMonths(ref, -monthsSold)
    pushEv({ serial, tipo: 'VENTA_DEALER', fecha: iso(addMonths(venta, -1)), usuarioId: 'usr-andree', descripcion: dealers[0].nombre, origen: 'D365', estadoNuevo: 'DEALER' })
    pushEv({ serial, tipo: 'VENTA_CLIENTE', fecha: iso(venta), usuarioId: 'usr-dealer', descripcion: cliente.nombre, origen: 'PORTAL', estadoNuevo: 'CLIENTE' })
    certificados.push({
      id: `cert-${serial}`,
      serial,
      clienteId: cliente.id,
      dealerId: starDealer,
      facturaNcf: monthsSold > 12 ? 'B0100003002' : 'B0100003001',
      fechaVenta: iso(venta),
      fechaActivacion: iso(venta),
      fechaFinFull: iso(addMonths(venta, 12)),
      fechaFinProrrateo: iso(addMonths(venta, 24)),
      estado: 'E',
      vehiculo,
      tipoUsoId: 'AUTOMOVIL',
    })
    pushEv({ serial, tipo: 'CERTIFICADO', fecha: iso(venta), usuarioId: 'usr-dealer', descripcion: 'Certificado E vigente — listo para honra de mostrador', origen: 'PORTAL', estadoNuevo: 'E' })
  }
  seedHonraDemo(HONRA_FULL_SERIAL, 8, 1, { marca: 'KIA', modelo: 'Rio', anio: 2023 })
  seedHonraDemo(HONRA_PRORRA_SERIAL, 14, 2, { marca: 'Ford', modelo: 'Ranger', anio: 2021 })

  let seq = 91000000
  const nextSerial = () => `CIB-${seq++}`

  const dealerBuckets: Record<string, number> = {
    'dealer-piloto': 10,
    'dealer-sd-norte': 14,
    'dealer-santiago': 8,
    'dealer-la-vega': 7,
    'dealer-san-pedro': 6,
    'dealer-la-romana': 5,
    'dealer-puerto-plata': 5,
    'dealer-bonao': 5,
  }
  for (const [dealerId, count] of Object.entries(dealerBuckets)) {
    const dealer = dealers.find((d) => d.id === dealerId)!
    for (let i = 0; i < count; i++) {
      const art = pick(rand, ARTICULOS)
      const months = dealer.perfil === 'envejecido' ? 10 + Math.floor(rand() * 8) : dealer.perfil === 'impecable' ? 1 + Math.floor(rand() * 3) : 2 + Math.floor(rand() * 8)
      const diag = dealer.perfil === 'incidencias' && i < 3 ? 'DESCARGADA' : 'BUEN_ESTADO'
      const serial = nextSerial()
      makeBattery(serial, art.id, 'DEALER', dealerId, months, diag)
      pushEv({ serial, tipo: 'VENTA_DEALER', fecha: iso(addMonths(ref, -(months - 1))), usuarioId: 'usr-andree', descripcion: `En inventario de ${dealer.nombre}`, origen: 'D365', estadoNuevo: 'DEALER' })
    }
  }

  for (let i = 0; i < 26; i++) {
    const art = pick(rand, ARTICULOS)
    makeBattery(nextSerial(), art.id, 'VIAMAR', 'alm-sd', 1 + Math.floor(rand() * 4), 'BUEN_ESTADO')
  }

  for (let i = 0; i < 12; i++) {
    const art = pick(rand, ARTICULOS)
    const centro = CENTROS[i % 2]
    const estacion = estaciones.find((e) => e.centroId === centro.id)!
    const serial = nextSerial()
    makeBattery(serial, art.id, 'CENTRO_CARGA', centro.id, 2, 'DESCARGADA')
    const resultados = ['PENDIENTE', 'EN_CARGA', 'CARGA_COMPLETADA', 'NO_RECUPERABLE'] as const
    const resultado = resultados[i % 4]
    procesos.push({
      id: `carga-${pad(i + 1, 2)}`,
      serial,
      centroId: centro.id,
      estacionId: estacion.id,
      tecnicoId: 'usr-tecnico',
      estadoInicial: 'DESCARGADA',
      porcentajeCarga: resultado === 'CARGA_COMPLETADA' ? 100 : resultado === 'EN_CARGA' ? 55 : 0,
      resultado,
      fechaInicio: iso(addDays(ref, -3)),
      fechaFin: resultado === 'CARGA_COMPLETADA' || resultado === 'NO_RECUPERABLE' ? iso(addDays(ref, -1)) : undefined,
    })
    pushEv({ serial, tipo: 'ENVIO_CARGA', fecha: iso(addDays(ref, -3)), usuarioId: 'usr-elizabeth', descripcion: `En ${centro.nombre}`, origen: 'MANUAL', estadoNuevo: 'CENTRO_CARGA' })
  }

  const soldSerials: string[] = []
  for (let i = 0; i < 43; i++) {
    const art = i === 0 ? ARTICULOS.find((a) => a.id === 'art-mc-ag')! : pick(rand, ARTICULOS)
    const dealer = pick(rand, dealers)
    const cliente = clientes[(i + 1) % clientes.length]
    const monthsSold = i < 4 ? 14 + (i % 6) : i < 8 ? 8 : 2 + Math.floor(rand() * 10)
    const serial = nextSerial()
    makeBattery(serial, art.id, 'CLIENTE', cliente.id, monthsSold + 2, 'BUEN_ESTADO')
    soldSerials.push(serial)
    const venta = addMonths(ref, -monthsSold)
    pushEv({ serial, tipo: 'VENTA_DEALER', fecha: iso(addMonths(venta, -1)), usuarioId: 'usr-andree', descripcion: dealer.nombre, origen: 'D365' })
    pushEv({ serial, tipo: 'VENTA_CLIENTE', fecha: iso(venta), usuarioId: 'usr-dealer', descripcion: cliente.nombre, origen: 'PORTAL', estadoNuevo: 'CLIENTE' })
    if (i < 19) {
      const estado = i < 14 ? 'E' : i < 18 ? 'C' : 'E'
      certificados.push({
        id: `cert-${pad(i + 1, 2)}`,
        serial,
        clienteId: cliente.id,
        dealerId: dealer.id,
        facturaNcf: `B0100002${pad(i + 10, 3)}`,
        fechaVenta: iso(venta),
        fechaActivacion: iso(venta),
        fechaFinFull: iso(addMonths(venta, 12)),
        fechaFinProrrateo: iso(addMonths(venta, 24)),
        estado,
        vehiculo: { marca: pick(rand, ['KIA', 'Ford', 'Mazda']), modelo: pick(rand, ['Rio', 'Ranger', 'CX-5']), anio: 2019 + (i % 6) },
        tipoUsoId: 'AUTOMOVIL',
      })
      pushEv({ serial, tipo: 'CERTIFICADO', fecha: iso(venta), usuarioId: 'usr-dealer', descripcion: `Certificado ${estado}`, origen: 'PORTAL', estadoNuevo: estado })
    }
  }

  const honraCases: { months: number; admisible: boolean; motivo?: string }[] = [
    { months: 6, admisible: true },
    { months: 9, admisible: true },
    { months: 11, admisible: true },
    { months: 14, admisible: true },
    { months: 16, admisible: true },
    { months: 18, admisible: true },
    { months: 20, admisible: true },
    { months: 40, admisible: false, motivo: 'FUERA_DE_PLAZO' },
    { months: 8, admisible: false, motivo: 'UMBRAL_CAPACIDAD' },
  ]
  honraCases.forEach((hc, i) => {
    const serial = soldSerials[i]
    if (!serial) return
    const full = hc.months <= 12
    const b = baterias[serial]
    const art = ARTICULOS.find((a) => a.id === b.articuloId)!
    const reemplazo = hc.admisible ? nextSerial() : undefined
    if (hc.admisible && reemplazo) {
      baterias[serial] = { ...b, ubicacionTipo: 'RETIRADA', diagnosticoId: 'PARA_GARANTIA', serialReemplazadoPor: reemplazo }
      makeBattery(reemplazo, b.articuloId, 'CLIENTE', b.ubicacionId, 1, 'BUEN_ESTADO', { serialReemplazoDe: serial })
    }
    honras.push({
      id: `honra-${pad(i + 1, 2)}`,
      serialOriginal: serial,
      serialReemplazo: reemplazo,
      politicaId: b.politicaId,
      politicaVersion: b.politicaVersion,
      origen: i % 3 === 0 ? 'dealer' : 'mostrador',
      estado: hc.admisible ? 'EJECUTADA' : 'RECHAZADA',
      resultadoCalculo: {
        admisible: hc.admisible,
        motivoRechazo: hc.motivo,
        mesesUso: hc.months,
        porcentajeUsado: Math.round((hc.months / 24) * 100),
        montoAcreditar: hc.admisible ? (full ? art.precioVigente : Math.round(art.precioVigente * (1 - hc.months / 24))) : 0,
        montoCliente: hc.admisible && !full ? Math.round(art.precioVigente * (hc.months / 24)) : 0,
        formulaAplicada: 'fdd-489',
        variablesEntrada: { mesesUso: hc.months, mesesFull: 12 },
      },
      decisionVigencia: !hc.admisible ? 'NO_APLICA' : full ? 'HEREDA' : 'RESETEA',
      usuarioId: 'usr-andree',
      fechaCalculo: iso(addDays(ref, -(20 - i))),
    })
    pushEv({
      serial,
      tipo: 'HONRA',
      fecha: iso(addDays(ref, -(20 - i))),
      usuarioId: 'usr-andree',
      descripcion: hc.admisible
        ? `Honra ${full ? 'full · HEREDA' : 'prorrateo · RESETEA'}`
        : `Rechazada: ${hc.motivo}`,
      origen: 'MANUAL',
    })
  })

  const chequeoEstados: SolicitudChequeo['estado'][] = [
    'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE',
    'EN_PROCESO', 'EN_PROCESO', 'EN_PROCESO', 'EN_PROCESO', 'EN_PROCESO',
    'FINALIZADA', 'FINALIZADA', 'FINALIZADA', 'FINALIZADA', 'FINALIZADA',
  ]
  chequeoEstados.forEach((estado, i) => {
    const dealer = dealers[i % dealers.length]
    const serials = Object.values(baterias).filter((b) => b.ubicacionTipo === 'DEALER' && b.ubicacionId === dealer.id).slice(0, 3)
    solicitudes.push({
      id: `sch-${pad(i + 1, 3)}`,
      numero: `SCH-2026-${pad(i + 1, 3)}`,
      dealerId: dealer.id,
      vendedorId: 'usr-fraisi',
      supervisorId: 'usr-elizabeth',
      estado,
      fechaCreacion: iso(addDays(ref, -(30 - i))),
      fechaVisita: iso(addDays(ref, -(28 - i))),
      centroId: i % 2 === 0 ? 'centro-sd' : 'centro-stgo',
      lineas: serials.map((b, li) => ({
        id: `lin-${i}-${li}`,
        serial: b.serial,
        voltaje: 12.4 - li * 0.4,
        densidad: 1.24 - li * 0.04,
        capacidadMedida: 80 - li * 15,
        diagnostico: li === 0 ? 'BUEN_ESTADO' : li === 1 ? 'DESCARGADA' : 'PENDIENTE',
        accionSugerida: li === 1 ? 'Enviar a carga' : 'Sin acción',
      })),
    })
  })

  const verbs = ['RMA.CREAR', 'NOTA_CREDITO.EMITIR', 'MOVIMIENTO_INVENTARIO.REGISTRAR', 'RECLAMO_FABRICANTE.CREAR']
  for (let i = 0; i < 18; i++) {
    integracion.push({
      id: `int-${pad(i + 1, 2)}`,
      verbo: verbs[i % 4],
      payload: JSON.stringify({ serial: STAR_SERIAL, i }, null, 2),
      estado: i === 17 ? 'error' : i >= 14 ? 'pendiente' : 'enviado',
      intentos: i === 17 ? 2 : 1,
      fecha: iso(addDays(ref, -(18 - i))),
      origenModulo: 'honra',
      origenRegistro: i % 2 === 0 ? 'D365' : 'PORTAL',
    })
  }

  return {
    generatedAt: iso(ref),
    fechaReferencia: iso(ref),
    marcas: MARCAS,
    articulos: ARTICULOS,
    formulas: FORMULAS,
    politicas: POLITICAS,
    tiposUso: TIPOS_USO,
    dealers,
    clientes,
    centros: CENTROS,
    estaciones,
    baterias,
    certificados,
    solicitudes,
    procesos,
    honras,
    reclamosFabricante: [
      { id: 'rec-001', honraId: 'honra-star', fabricante: 'Solite', estado: 'abierto', montoReclamado: 180 },
    ],
    eventos,
    integracion,
  }
}
