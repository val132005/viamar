import { addMonths, iso } from '../../domain/dates'
import type { Bateria, Certificado, Honra } from '../../domain/entities'
import { evaluarHonra, type EvaluacionHonra } from '../../domain/warranty/engine'
import { useAuthStore } from '../authStore'
import { useBatteryStore } from '../batteryStore'
import { useCertificateStore } from '../certificateStore'
import { useConfigStore } from '../configStore'
import { withHistory } from '../historyStore'
import { useIntegrationStore } from '../integrationStore'
import { useWarrantyStore } from '../warrantyStore'

export function nextSerial(): string {
  const nums = Object.keys(useBatteryStore.getState().baterias).map((s) =>
    Number(s.replace(/^CIB-/, '')),
  )
  const max = nums.reduce((a, b) => (Number.isFinite(b) ? Math.max(a, b) : a), 92_000_000)
  return `CIB-${max + 1}`
}

export function evaluarSerial(
  serial: string,
  opts: { capacidadMedida: number; fechaEvaluacion?: Date; fechaReclamo?: Date },
): EvaluacionHonra | { error: string } {
  const bateria = useBatteryStore.getState().baterias[serial]
  if (!bateria) return { error: 'Serial no encontrado' }
  const articulo = useBatteryStore.getState().articulos.find((a) => a.id === bateria.articuloId)
  if (!articulo) return { error: 'Artículo no encontrado' }
  const politicas = useConfigStore.getState().politicas
  const politica =
    politicas.find((p) => p.id === bateria.politicaId && p.version === bateria.politicaVersion) ??
    politicas.find((p) => p.id === bateria.politicaId)
  if (!politica) return { error: 'Política no encontrada' }
  const certs = useCertificateStore.getState().certificados.filter((c) => c.serial === serial)
  const certificado = certs[certs.length - 1]
  const formula = useConfigStore.getState().formulas.find((f) => f.id === politica.formulaId)
  const now = opts.fechaEvaluacion ?? new Date()
  return evaluarHonra({
    bateria,
    articulo,
    politica,
    certificado,
    formula,
    capacidadMedida: opts.capacidadMedida,
    fechaEvaluacion: now,
    fechaReclamo: opts.fechaReclamo ?? now,
    precioVigente: articulo.precioVigente,
    precioOriginal: articulo.precioVigente,
  })
}

export function ejecutarHonra(opts: {
  serial: string
  capacidadMedida: number
  origen: 'mostrador' | 'dealer'
  dtc?: string
}): { ok: true; honraId: string; reemplazo: string } | { ok: false; error: string } {
  const evalr = evaluarSerial(opts.serial, { capacidadMedida: opts.capacidadMedida })
  if ('error' in evalr) return { ok: false, error: evalr.error }
  if (!evalr.admisible) return { ok: false, error: evalr.motivoRechazo ?? 'Rechazada' }

  const user = useAuthStore.getState().usuarioActual
  const bateria = useBatteryStore.getState().baterias[opts.serial]
  const articulo = useBatteryStore.getState().articulos.find((a) => a.id === bateria.articuloId)!
  const certs = useCertificateStore.getState().certificados.filter((c) => c.serial === opts.serial)
  const cert = certs[certs.length - 1]
  const reemplazo = nextSerial()
  const now = new Date()
  const honraId = `honra-${crypto.randomUUID().slice(0, 8)}`

  const honra: Honra = {
    id: honraId,
    serialOriginal: opts.serial,
    serialReemplazo: reemplazo,
    politicaId: bateria.politicaId,
    politicaVersion: bateria.politicaVersion,
    origen: opts.origen,
    estado: 'EJECUTADA',
    resultadoCalculo: evalr,
    decisionVigencia: evalr.decisionVigencia,
    usuarioId: user?.id ?? 'sistema',
    fechaCalculo: iso(now),
  }

  withHistory(opts.serial, 'HONRA', `Honra ${evalr.decisionVigencia}${opts.dtc ? ` · ${opts.dtc}` : ''}`, () => {
    useBatteryStore.getState().patchBattery(opts.serial, {
      ubicacionTipo: 'RETIRADA',
      serialReemplazadoPor: reemplazo,
      diagnosticoId: 'PARA_GARANTIA',
    })
    useBatteryStore.getState().upsertBattery({
      ...bateria,
      serial: reemplazo,
      diagnosticoId: 'BUEN_ESTADO',
      ubicacionTipo: 'CLIENTE',
      ubicacionId: bateria.ubicacionId,
      fechaIngreso: iso(now),
      serialReemplazoDe: opts.serial,
      serialReemplazadoPor: undefined,
    })
    if (cert) {
      useCertificateStore.getState().upsert({ ...cert, estado: 'C' })
      const activacion = evalr.fechaActivacionReemplazo ?? iso(now)
      const nuevo: Certificado = {
        ...cert,
        id: `cert-${reemplazo}`,
        serial: reemplazo,
        estado: 'E',
        fechaVenta: iso(now),
        fechaActivacion: activacion,
        fechaFinFull: evalr.fechaFinFullReemplazo ?? iso(addMonths(now, 12)),
        fechaFinProrrateo: evalr.fechaFinProrrateoReemplazo ?? iso(addMonths(now, 24)),
        heredadoDe: cert.id,
      }
      useCertificateStore.getState().upsert(nuevo)
    }
    useWarrantyStore.getState().upsertHonra(honra)
    useWarrantyStore.getState().upsertReclamo({
      id: `rec-${honraId}`,
      honraId,
      fabricante: articulo.marcaId,
      estado: 'abierto',
      montoReclamado: evalr.montoAcreditar,
    })
    const enqueue = (verbo: string, payload: object) => {
      const st = useIntegrationStore.getState()
      st.load([
        ...st.eventos,
        {
          id: `int-${crypto.randomUUID().slice(0, 8)}`,
          verbo,
          payload: JSON.stringify(payload, null, 2),
          estado: 'pendiente',
          intentos: 0,
          fecha: iso(now),
          origenModulo: 'honra',
          origenRegistro: 'MANUAL',
        },
      ])
    }
    enqueue('RMA.CREAR', { serial: opts.serial, honraId, motivo: 'PARA_GARANTIA' })
    enqueue('NOTA_CREDITO.EMITIR', { serial: opts.serial, montoUsd: evalr.montoAcreditar, ncf: cert?.facturaNcf })
    enqueue('MOVIMIENTO_INVENTARIO.REGISTRAR', { origen: opts.serial, destino: reemplazo })
    enqueue('RECLAMO_FABRICANTE.CREAR', { honraId, fabricante: articulo.marcaId, montoUsd: evalr.montoAcreditar })
  }, { estadoNuevo: 'RETIRADA', referenciaId: reemplazo })

  withHistory(reemplazo, 'REEMPLAZO', `Reemplaza a ${opts.serial}`, () => undefined, {
    referenciaId: opts.serial,
    estadoNuevo: 'CLIENTE',
  })
  withHistory(reemplazo, 'CERTIFICADO', `CERT-E · vigencia ${honra.decisionVigencia}`, () => undefined, {
    estadoNuevo: 'E',
  })

  return { ok: true, honraId, reemplazo }
}

export function solicitarHonraDealer(serial: string, capacidadMedida: number) {
  const evalr = evaluarSerial(serial, { capacidadMedida })
  if ('error' in evalr) return { ok: false as const, error: evalr.error }
  const user = useAuthStore.getState().usuarioActual
  const bateria = useBatteryStore.getState().baterias[serial]
  const honra: Honra = {
    id: `honra-${crypto.randomUUID().slice(0, 8)}`,
    serialOriginal: serial,
    politicaId: bateria.politicaId,
    politicaVersion: bateria.politicaVersion,
    origen: 'dealer',
    estado: evalr.admisible ? 'SOLICITADA' : 'RECHAZADA',
    resultadoCalculo: evalr,
    decisionVigencia: evalr.decisionVigencia,
    usuarioId: user?.id ?? 'sistema',
    fechaCalculo: iso(new Date()),
  }
  withHistory(serial, 'SOLICITUD_GARANTIA', `Solicitud dealer · ${evalr.decisionVigencia}`, () => {
    useWarrantyStore.getState().upsertHonra(honra)
  })
  return { ok: true as const, honraId: honra.id, eval: evalr }
}

export function autorizarHonraDealer(honraId: string, motivo?: string) {
  const honra = useWarrantyStore.getState().honras.find((h) => h.id === honraId)
  if (!honra) return { ok: false as const, error: 'Solicitud no encontrada' }
  if (honra.estado !== 'SOLICITADA') return { ok: false as const, error: 'Ya no está pendiente' }
  const user = useAuthStore.getState().usuarioActual
  const nota = motivo?.trim() ? ` · ${motivo.trim()}` : ''
  withHistory(
    honra.serialOriginal,
    'SOLICITUD_GARANTIA',
    `Solicitud AUTORIZADA${nota}`,
    () => {
      useWarrantyStore.getState().upsertHonra({
        ...honra,
        estado: 'APROBADA',
        usuarioId: user?.id ?? honra.usuarioId,
      })
    },
    { estadoNuevo: 'APROBADA' },
  )
  return { ok: true as const, honraId }
}

export function rechazarHonraDealer(honraId: string, motivo: string) {
  const honra = useWarrantyStore.getState().honras.find((h) => h.id === honraId)
  if (!honra) return { ok: false as const, error: 'Solicitud no encontrada' }
  if (honra.estado !== 'SOLICITADA') return { ok: false as const, error: 'Ya no está pendiente' }
  if (!motivo.trim()) return { ok: false as const, error: 'Indique el motivo del rechazo' }
  withHistory(
    honra.serialOriginal,
    'SOLICITUD_GARANTIA',
    `Solicitud RECHAZADA · ${motivo.trim()}`,
    () => {
      useWarrantyStore.getState().upsertHonra({
        ...honra,
        estado: 'RECHAZADA',
        resultadoCalculo: {
          ...honra.resultadoCalculo,
          admisible: false,
          motivoRechazo: motivo.trim(),
        },
      })
    },
    { estadoNuevo: 'RECHAZADA' },
  )
  return { ok: true as const, honraId }
}

export function fifoCandidatos(honraId: string): Bateria[] {
  const honra = useWarrantyStore.getState().honras.find((h) => h.id === honraId)
  if (!honra) return []
  const baterias = useBatteryStore.getState().baterias
  const original = baterias[honra.serialOriginal]
  if (!original) return []
  return Object.values(baterias)
    .filter(
      (b) =>
        b.ubicacionTipo === 'VIAMAR' &&
        b.articuloId === original.articuloId &&
        b.serial !== honra.serialOriginal,
    )
    .sort((a, b) => a.fechaIngreso.localeCompare(b.fechaIngreso))
}

export function ejecutarReposicionDealer(
  honraId: string,
  reemplazoSerial: string,
): { ok: true; honraId: string; reemplazo: string } | { ok: false; error: string } {
  const honra = useWarrantyStore.getState().honras.find((h) => h.id === honraId)
  if (!honra) return { ok: false, error: 'Solicitud no encontrada' }
  if (honra.estado !== 'APROBADA') return { ok: false, error: 'La solicitud debe estar AUTORIZADA' }
  const st = useBatteryStore.getState()
  const original = st.baterias[honra.serialOriginal]
  const reemplazo = st.baterias[reemplazoSerial]
  if (!original || !reemplazo) return { ok: false, error: 'Serial no encontrado' }
  if (reemplazo.ubicacionTipo !== 'VIAMAR')
    return { ok: false, error: 'El reemplazo debe ser stock Viamar' }
  if (reemplazo.articuloId !== original.articuloId)
    return { ok: false, error: 'El reemplazo debe ser del mismo artículo' }
  const user = useAuthStore.getState().usuarioActual
  const evalr = honra.resultadoCalculo
  const extra = evalr as typeof evalr & {
    fechaActivacionReemplazo?: string
    fechaFinFullReemplazo?: string
    fechaFinProrrateoReemplazo?: string
  }
  const now = new Date()
  const certs = useCertificateStore.getState().certificados.filter((c) => c.serial === honra.serialOriginal)
  const cert = certs[certs.length - 1]
  const articulo = st.articulos.find((a) => a.id === original.articuloId)

  withHistory(
    honra.serialOriginal,
    'HONRA',
    `Reposición dealer ${reemplazoSerial} · ${honra.decisionVigencia}`,
    () => {
      useBatteryStore.getState().patchBattery(honra.serialOriginal, {
        ubicacionTipo: 'RETIRADA',
        serialReemplazadoPor: reemplazoSerial,
        diagnosticoId: 'PARA_GARANTIA',
      })
      useBatteryStore.getState().patchBattery(reemplazoSerial, {
        ubicacionTipo: 'CLIENTE',
        ubicacionId: original.ubicacionId,
        diagnosticoId: 'BUEN_ESTADO',
        serialReemplazoDe: honra.serialOriginal,
        serialReemplazadoPor: undefined,
      })
      if (cert) {
        useCertificateStore.getState().upsert({ ...cert, estado: 'C' })
        const activacion = extra.fechaActivacionReemplazo ?? iso(now)
        const nuevo: Certificado = {
          ...cert,
          id: `cert-${reemplazoSerial}`,
          serial: reemplazoSerial,
          estado: 'E',
          fechaVenta: iso(now),
          fechaActivacion: activacion,
          fechaFinFull: extra.fechaFinFullReemplazo ?? iso(addMonths(now, 12)),
          fechaFinProrrateo: extra.fechaFinProrrateoReemplazo ?? iso(addMonths(now, 24)),
          heredadoDe: cert.id,
        }
        useCertificateStore.getState().upsert(nuevo)
      }
      useWarrantyStore.getState().upsertHonra({
        ...honra,
        estado: 'EJECUTADA',
        serialReemplazo: reemplazoSerial,
        usuarioId: user?.id ?? honra.usuarioId,
      })
      useWarrantyStore.getState().upsertReclamo({
        id: `rec-${honra.id}`,
        honraId: honra.id,
        fabricante: articulo?.marcaId ?? '',
        estado: 'abierto',
        montoReclamado: evalr.montoAcreditar,
      })
      const enqueue = (verbo: string, payload: object) => {
        const ist = useIntegrationStore.getState()
        ist.load([
          ...ist.eventos,
          {
            id: `int-${crypto.randomUUID().slice(0, 8)}`,
            verbo,
            payload: JSON.stringify(payload, null, 2),
            estado: 'pendiente',
            intentos: 0,
            fecha: iso(now),
            origenModulo: 'honra',
            origenRegistro: 'MANUAL',
          },
        ])
      }
      enqueue('RMA.CREAR', { serial: honra.serialOriginal, honraId: honra.id, motivo: 'PARA_GARANTIA' })
      enqueue('NOTA_CREDITO.EMITIR', {
        serial: honra.serialOriginal,
        montoUsd: evalr.montoAcreditar,
        ncf: cert?.facturaNcf,
      })
      enqueue('MOVIMIENTO_INVENTARIO.REGISTRAR', { origen: honra.serialOriginal, destino: reemplazoSerial })
      enqueue('RECLAMO_FABRICANTE.CREAR', {
        honraId: honra.id,
        fabricante: articulo?.marcaId ?? '',
        montoUsd: evalr.montoAcreditar,
      })
    },
    { estadoNuevo: 'RETIRADA', referenciaId: reemplazoSerial },
  )

  withHistory(reemplazoSerial, 'REEMPLAZO', `Reemplaza a ${honra.serialOriginal} (FIFO)`, () => undefined, {
    referenciaId: honra.serialOriginal,
    estadoNuevo: 'CLIENTE',
  })
  withHistory(reemplazoSerial, 'CERTIFICADO', `CERT-E · vigencia ${honra.decisionVigencia}`, () => undefined, {
    estadoNuevo: 'E',
  })

  return { ok: true, honraId: honra.id, reemplazo: reemplazoSerial }
}
