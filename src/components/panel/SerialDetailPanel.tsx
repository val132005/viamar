import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  BatteryCharging,
  Car,
  CircleCheck,
  ClipboardCheck,
  Clock,
  FileText,
  Handshake,
  OctagonX,
  ScanBarcode,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  X,
} from 'lucide-react'
import { catalogById, EVENT_LABEL } from '../../domain/catalogs'
import { formatDate, monthsElapsed } from '../../domain/dates'
import type { Bateria, Certificado } from '../../domain/types'
import { honraEstadoLabel } from '../../domain/estados'
import { cn } from '../../lib/cn'
import { accountById } from '../../seed/demoAccounts'
import { useBatteryStore } from '../../stores/batteryStore'
import { useCertificateStore } from '../../stores/certificateStore'
import { useChargingStore } from '../../stores/chargingStore'
import { useHistoryStore } from '../../stores/historyStore'
import { useInspectionStore } from '../../stores/inspectionStore'
import { useWarrantyStore } from '../../stores/warrantyStore'
import { UnderlineTabs } from './PanelWidgets'
import { useFilasSerial } from './useFilasSerial'

type TabId = 'resumen' | 'historial' | 'documentos'

/* El icono dice el estado antes que el texto: un check sólo cuando todo va bien. */
const ICONO_DIAGNOSTICO: Record<string, LucideIcon> = {
  BUEN_ESTADO: CircleCheck,
  DESCARGADA: BatteryCharging,
  PARA_GARANTIA: ShieldAlert,
  DANADA: OctagonX,
  PENDIENTE: Clock,
}

/* Dónde está y qué significa su diagnóstico ahí: una frase que el usuario
   puede leer sin conocer los códigos del catálogo. */
const DONDE: Record<Bateria['ubicacionTipo'], string> = {
  DEALER: 'La batería se encuentra en inventario del dealer',
  VIAMAR: 'La batería está en el inventario de Grupo Viamar',
  CENTRO_CARGA: 'La batería está en un centro de carga',
  CLIENTE: 'La batería fue vendida a un cliente final',
  RETIRADA: 'La batería fue retirada del parque tras una honra',
}

function estadoEnFrase(b: Bateria): string {
  const enStock = b.ubicacionTipo === 'DEALER' || b.ubicacionTipo === 'VIAMAR'
  const complemento: Record<string, string> = {
    BUEN_ESTADO: enStock ? ', disponible para venta.' : b.ubicacionTipo === 'CLIENTE' ? ' y está en servicio.' : '.',
    DESCARGADA: ' y está descargada: requiere proceso de carga.',
    PARA_GARANTIA: ' y espera dictamen de garantía.',
    DANADA: ' y está dañada: no es apta para la venta.',
    PENDIENTE: '; aún no tiene diagnóstico registrado.',
  }
  return DONDE[b.ubicacionTipo] + (complemento[b.diagnosticoId] ?? '.')
}

/** Estado de la cobertura según el certificado más reciente del serial. */
function cobertura(cert: Certificado | undefined, ahora = new Date()) {
  if (!cert) {
    return {
      estado: 'Sin certificado',
      tono: 'neutral' as const,
      detalle: 'La garantía se activa con la venta al cliente final.',
    }
  }
  if (cert.estado === 'C') {
    return { estado: 'Cancelado', tono: 'danger' as const, detalle: `Certificado ${cert.id} cancelado.` }
  }
  const desde = new Date(cert.fechaActivacion)
  const hasta = new Date(cert.fechaFinProrrateo)
  const total = Math.max(1, monthsElapsed(desde, hasta))
  const usados = Math.min(total, monthsElapsed(desde, ahora))
  const vencida = ahora > hasta
  const enFull = ahora <= new Date(cert.fechaFinFull)
  return {
    estado: vencida ? 'Vencida' : 'Vigente',
    tono: vencida ? ('neutral' as const) : ('ok' as const),
    detalle: vencida ? 'La cobertura terminó.' : enFull ? 'Cobertura total' : 'En período de prorrateo',
    usados,
    total,
    desde: cert.fechaActivacion,
    hasta: cert.fechaFinProrrateo,
  }
}

function Seccion({ titulo, icono, children }: { titulo: string; icono?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-b border-line-subtle px-4 py-3.5 last:border-b-0">
      {icono}
      <h3 className="text-label-lg text-ink">{titulo}</h3>
      <div className="mt-2.5">{children}</div>
    </section>
  )
}

function Dato({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[108px_1fr] gap-3 py-1 text-body-sm">
      <dt className="text-ink-tertiary">{label}</dt>
      <dd className="min-w-0 text-ink">{children}</dd>
    </div>
  )
}

function Documento({
  icon: Icon,
  titulo,
  detalle,
  to,
}: {
  icon: LucideIcon
  titulo: string
  detalle: string
  to?: string
}) {
  const cuerpo = (
    <>
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-viamar-50 text-viamar-600">
        <Icon size={15} strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-label-lg text-ink">{titulo}</span>
        <span className="block truncate text-body-xs text-ink-tertiary">{detalle}</span>
      </span>
      {to ? <ArrowRight size={14} className="shrink-0 text-ink-tertiary" aria-hidden="true" /> : null}
    </>
  )
  const base = 'flex items-center gap-3 rounded-lg border border-line px-3 py-2.5'
  return to ? (
    <Link to={to} className={cn(base, 'transition-colors duration-fast hover:border-viamar-200 hover:bg-surface-hover')}>
      {cuerpo}
    </Link>
  ) : (
    <div className={base}>{cuerpo}</div>
  )
}

/**
 * Detalle del serial acoplado a la derecha de la lista: responde «¿qué es,
 * dónde está y qué cobertura tiene?» sin abandonar la búsqueda. En pantallas
 * estrechas flota sobre el contenido.
 */
export function SerialDetailPanel({ serial, onClose }: { serial: string; onClose: () => void }) {
  const [tab, setTab] = useState<TabId>('resumen')
  const bateria = useBatteryStore((s) => s.baterias[serial])
  const certificados = useCertificateStore((s) => s.certificados)
  const eventos = useHistoryStore((s) => s.eventos)
  const solicitudes = useInspectionStore((s) => s.solicitudes)
  const procesos = useChargingStore((s) => s.procesos)
  const honras = useWarrantyStore((s) => s.honras)
  const { filas } = useFilasSerial(bateria ? [bateria] : [])
  const fila = filas[0]

  /* Cambiar de serial vuelve al resumen: es lo primero que se busca. */
  useEffect(() => setTab('resumen'), [serial])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const cert = useMemo(
    () =>
      certificados
        .filter((c) => c.serial === serial)
        .sort((a, b) => b.fechaActivacion.localeCompare(a.fechaActivacion))[0],
    [certificados, serial],
  )
  const historia = useMemo(
    () => eventos.filter((e) => e.serial === serial).sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [eventos, serial],
  )
  const documentos = useMemo(() => {
    const docs: Array<{ id: string; icon: LucideIcon; titulo: string; detalle: string; to?: string }> = []
    for (const c of certificados.filter((x) => x.serial === serial)) {
      docs.push({
        id: c.id,
        icon: FileText,
        titulo: `Certificado ${c.id}`,
        detalle: `${c.estado === 'E' ? 'Emitido' : 'Cancelado'} · factura ${c.facturaNcf}`,
        to: `/certificados/${c.id}`,
      })
    }
    for (const s of solicitudes.filter((x) => x.lineas.some((l) => l.serial === serial))) {
      docs.push({
        id: s.id,
        icon: ClipboardCheck,
        titulo: `Chequeo ${s.numero}`,
        detalle: `Visita del ${formatDate(s.fechaVisita)}`,
        to: `/gestion-tecnica/${s.id}`,
      })
    }
    for (const p of procesos.filter((x) => x.serial === serial)) {
      docs.push({
        id: p.id,
        icon: BatteryCharging,
        titulo: `Proceso de carga ${p.id}`,
        detalle: `${p.porcentajeCarga}% · desde ${formatDate(p.fechaInicio)}`,
        to: '/carga',
      })
    }
    for (const h of honras.filter((x) => x.serialOriginal === serial)) {
      docs.push({
        id: h.id,
        icon: Handshake,
        titulo: `Honra ${h.id}`,
        detalle: `${honraEstadoLabel(h.estado, h.origen)} · ${formatDate(h.fechaCalculo)}`,
        to: '/honras',
      })
    }
    return docs
  }, [certificados, solicitudes, procesos, honras, serial])

  const diag = bateria ? catalogById(bateria.diagnosticoId) : undefined
  const cob = cobertura(cert)
  const IconoEstado = (bateria && ICONO_DIAGNOSTICO[bateria.diagnosticoId]) ?? CircleCheck

  return (
    <aside
      className={cn(
        'fixed inset-y-0 right-0 z-40 flex w-full max-w-[380px] flex-col border-l border-line bg-white shadow-lg',
        'min-[1440px]:sticky min-[1440px]:top-0 min-[1440px]:z-auto min-[1440px]:h-[calc(100vh-88px)] min-[1440px]:max-w-none min-[1440px]:rounded-xl min-[1440px]:border min-[1440px]:shadow-sm',
        'animate-[panel-in_220ms_ease-out]',
      )}
      aria-label={`Detalle de ${serial}`}
    >
      <header className="flex items-start gap-3 px-4 pb-1 pt-4">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-viamar-50 text-viamar-600">
          <ScanBarcode size={19} strokeWidth={2} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-headline-md text-ink">{serial}</h2>
          {diag ? (
            <span
              className="mt-1 inline-flex h-[21px] items-center rounded-[4px] border px-2 text-label-sm"
              style={{ background: diag.tone.bg, borderColor: diag.tone.border, color: diag.tone.fg }}
            >
              {diag.label}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-secondary transition-colors duration-fast hover:bg-surface-hover hover:text-ink"
        >
          <X size={17} />
        </button>
      </header>

      <div className="px-2">
        <UnderlineTabs
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'resumen', label: 'Resumen' },
            { id: 'historial', label: 'Historial', count: historia.length },
            { id: 'documentos', label: 'Documentos', count: documentos.length },
          ]}
        />
      </div>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">
        {!bateria || !fila ? (
          <p className="px-4 py-10 text-center text-body-sm text-ink-tertiary">
            No se encontró el serial {serial}.
          </p>
        ) : tab === 'resumen' ? (
          <div key={serial} className="animate-[fade-in_200ms_ease-out]">
            <Seccion
              titulo="Información general"
              icono={
                <span className="mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-viamar-50 text-viamar-600">
                  <Car size={17} strokeWidth={2} aria-hidden="true" />
                </span>
              }
            >
              <dl>
                <Dato label="Serial">{serial}</Dato>
                <Dato label="Artículo">{fila.articulo}</Dato>
                <Dato label="Ubicación">{fila.ubicacion}</Dato>
                <Dato label="Dealer / centro">{fila.titular}</Dato>
                <Dato label="Fecha de ingreso">{fila.fechaTexto}</Dato>
              </dl>
            </Seccion>

            <Seccion titulo="Estado actual">
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: diag?.tone.bg, color: diag?.tone.fg }}
                >
                  <IconoEstado size={18} strokeWidth={2.2} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  {diag ? (
                    <span
                      className="inline-flex h-[22px] items-center rounded-[4px] px-2 text-label-md"
                      style={{ background: diag.tone.bg, color: diag.tone.fg }}
                    >
                      {diag.label}
                    </span>
                  ) : null}
                  <p className="mt-1.5 text-body-sm text-ink-secondary">{estadoEnFrase(bateria)}</p>
                </div>
              </div>
            </Seccion>

            <Seccion titulo="Cobertura de garantía">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    cob.tono === 'ok'
                      ? 'bg-success-soft text-success'
                      : cob.tono === 'danger'
                        ? 'bg-critical-soft text-critical'
                        : 'bg-neutral-100 text-ink-secondary',
                  )}
                >
                  {cob.tono === 'ok' ? (
                    <ShieldCheck size={18} strokeWidth={2.2} aria-hidden="true" />
                  ) : (
                    <ShieldOff size={18} strokeWidth={2.2} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-label-lg',
                      cob.tono === 'ok' ? 'text-success' : cob.tono === 'danger' ? 'text-critical' : 'text-ink',
                    )}
                  >
                    {cob.estado}
                    {cob.tono === 'ok' ? (
                      <span className="ml-1.5 font-normal text-ink-tertiary">· {cob.detalle}</span>
                    ) : null}
                  </p>
                  {'total' in cob && cob.total ? (
                    <>
                      <span className="mt-2 block h-2 overflow-hidden rounded-full bg-neutral-100">
                        <span
                          className="block h-full rounded-full bg-success transition-[width] duration-500 ease-brand"
                          style={{ width: `${(cob.usados / cob.total) * 100}%` }}
                        />
                      </span>
                      <p className="mt-1 text-body-xs text-ink-tertiary">
                        {cob.usados} de {cob.total} meses
                      </p>
                      <dl className="mt-2.5 grid grid-cols-2 gap-3 text-body-sm">
                        <div>
                          <dt className="text-body-xs text-ink-tertiary">Desde</dt>
                          <dd className="text-ink">{formatDate(cob.desde)}</dd>
                        </div>
                        <div>
                          <dt className="text-body-xs text-ink-tertiary">Hasta</dt>
                          <dd className="text-ink">{formatDate(cob.hasta)}</dd>
                        </div>
                      </dl>
                    </>
                  ) : (
                    <p className="mt-1 text-body-sm text-ink-secondary">{cob.detalle}</p>
                  )}
                </div>
              </div>
            </Seccion>
          </div>
        ) : tab === 'historial' ? (
          historia.length === 0 ? (
            <p className="px-4 py-10 text-center text-body-sm text-ink-tertiary">Sin eventos registrados.</p>
          ) : (
            <ol className="relative px-4 py-3.5">
              {historia.map((e, i) => (
                <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < historia.length - 1 ? (
                    <span className="absolute left-[5px] top-4 h-full w-px bg-line" aria-hidden="true" />
                  ) : null}
                  <span
                    className={cn(
                      'relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ring-4 ring-white',
                      i === 0 ? 'bg-viamar-500' : 'bg-viamar-200',
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-label-lg text-ink">{EVENT_LABEL[e.tipo] ?? e.tipo}</p>
                    <p className="text-body-xs text-ink-tertiary">
                      {formatDate(e.fecha)} · {accountById(e.usuarioId)?.nombre ?? 'Sistema'}
                    </p>
                    {e.descripcion ? (
                      <p className="mt-0.5 text-body-sm text-ink-secondary">{e.descripcion}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )
        ) : documentos.length === 0 ? (
          <p className="px-4 py-10 text-center text-body-sm text-ink-tertiary">Sin documentos asociados.</p>
        ) : (
          <div className="flex flex-col gap-2 px-4 py-3.5">
            {documentos.map((d) => (
              <Documento key={d.id} icon={d.icon} titulo={d.titulo} detalle={d.detalle} to={d.to} />
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-line-subtle p-4">
        <Link
          to={`/serial/${serial}`}
          className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#cfe3f8] bg-[#eaf3fd] text-label-lg text-viamar-600 transition-colors duration-fast hover:bg-[#dcebfb]"
        >
          Ver historial completo
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </footer>
    </aside>
  )
}
