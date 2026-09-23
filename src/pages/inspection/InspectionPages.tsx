import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ClipboardList, Plus } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { FormField } from '../../components/ui/FormField'
import { formatDate, iso } from '../../domain/dates'
import { sugerirDiagnostico } from '../../domain/diagnosis'
import type { ChequeoEstado } from '../../domain/entities'
import { useDistributorStore } from '../../stores/distributorStore'
import { useInspectionStore } from '../../stores/inspectionStore'
import { useBatteryStore } from '../../stores/batteryStore'
import { useChargingStore } from '../../stores/chargingStore'
import { useAuthStore } from '../../stores/authStore'
import { withHistory } from '../../stores/historyStore'
import { accountById } from '../../seed/demoAccounts'

const ESTADOS: Array<'TODOS' | ChequeoEstado> = [
  'TODOS',
  'PENDIENTE',
  'EN_PROCESO',
  'FINALIZADA',
  'CANCELADA',
  'BORRADOR',
]

function progreso(s: { lineas: Array<{ accionTomada?: string }> }): string {
  const done = s.lineas.filter((l) => l.accionTomada).length
  return `${done}/${s.lineas.length}`
}

export function InspectionListPage() {
  const solicitudes = useInspectionStore((s) => s.solicitudes)
  const dealers = useDistributorStore((s) => s.dealers)
  const [filtro, setFiltro] = useState<(typeof ESTADOS)[number]>('TODOS')

  const rows = useMemo(
    () => (filtro === 'TODOS' ? solicitudes : solicitudes.filter((s) => s.estado === filtro)),
    [solicitudes, filtro],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-headline-lg text-viamar-800">Gestión técnica</h1>
        <Link to="/gestion-tecnica/nueva">
          <Button>
            <Plus size={16} /> Nueva solicitud
          </Button>
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {ESTADOS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setFiltro(e)}
            className={
              filtro === e
                ? 'rounded bg-viamar-500 px-3 py-1.5 text-label-md font-semibold text-white'
                : 'rounded border border-app-border-strong bg-white px-3 py-1.5 text-label-md text-ink-secondary hover:text-ink'
            }
          >
            {e === 'TODOS' ? `Todos (${solicitudes.length})` : e}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin solicitudes"
          description={
            filtro === 'TODOS'
              ? 'Aún no hay solicitudes de chequeo. Crea la primera.'
              : `No hay solicitudes en estado ${filtro}.`
          }
        />
      ) : (
        <DataTable
          columns={[
            {
              key: 'numero',
              header: 'Solicitud',
              render: (s) => (
                <Link className="text-viamar-700" to={`/gestion-tecnica/${s.id}`}>
                  {s.numero}
                </Link>
              ),
            },
            {
              key: 'dealer',
              header: 'Dealer',
              render: (s) => dealers.find((d) => d.id === s.dealerId)?.nombre ?? s.dealerId,
            },
            { key: 'estado', header: 'Estado' },
            { key: 'fecha', header: 'Visita', render: (s) => formatDate(s.fechaVisita) },
            { key: 'progreso', header: 'Progreso', render: (s) => progreso(s) },
            { key: 'lineas', header: 'Líneas', render: (s) => String(s.lineas.length) },
          ]}
          rows={rows}
          rowKey={(s) => s.id}
        />
      )}
    </div>
  )
}

const DICTAMENES = [
  { diagnostico: 'BUEN_ESTADO', accion: 'Sin acción', label: 'Buen estado' },
  { diagnostico: 'DESCARGADA', accion: 'Enviar a carga', label: 'Enviar a carga' },
  { diagnostico: 'PARA_GARANTIA', accion: 'Analizar garantía', label: 'Para garantía' },
] as const

export function InspectionDetailPage() {
  const { id = '' } = useParams()
  const solicitud = useInspectionStore((s) => s.solicitudes.find((x) => x.id === id))
  if (!solicitud) return <p>Solicitud no encontrada.</p>
  return <InspectionDetailBody solicitudId={id} />
}

function InspectionDetailBody({ solicitudId }: { solicitudId: string }) {
  const solicitud = useInspectionStore((s) => s.solicitudes.find((x) => x.id === solicitudId))!
  const updateLinea = useInspectionStore((s) => s.updateLinea)
  const patchSolicitud = useInspectionStore((s) => s.patchSolicitud)
  const dealers = useDistributorStore((s) => s.dealers)
  const centros = useChargingStore((s) => s.centros)
  const procesos = useChargingStore((s) => s.procesos)
  const addProceso = useChargingStore((s) => s.addProceso)
  const patchBattery = useBatteryStore((s) => s.patchBattery)
  const usuario = useAuthStore((s) => s.usuarioActual)

  const dealer = dealers.find((d) => d.id === solicitud.dealerId)
  const centro = centros.find((c) => c.id === solicitud.centroId)
  const dictaminadas = solicitud.lineas.filter((l) => l.accionTomada).length
  const todasDictaminadas = solicitud.lineas.length > 0 && dictaminadas === solicitud.lineas.length
  const cerrada = solicitud.estado === 'FINALIZADA'

  function editarMedicion(lineaId: string, field: 'voltaje' | 'densidad' | 'capacidadMedida', raw: string) {
    const value = Number(raw)
    if (Number.isNaN(value)) return
    const linea = solicitud.lineas.find((l) => l.id === lineaId)
    if (!linea) return
    const next = { ...linea, [field]: value }
    const sug = sugerirDiagnostico(next.voltaje, next.densidad, next.capacidadMedida)
    updateLinea(solicitudId, lineaId, {
      [field]: value,
      diagnostico: sug.diagnostico,
      accionSugerida: sug.accion,
    })
  }

  function dictaminar(lineaId: string, diagnostico: string, accion: string) {
    const linea = solicitud.lineas.find((l) => l.id === lineaId)
    if (!linea || cerrada) return
    updateLinea(solicitudId, lineaId, {
      diagnostico,
      accionSugerida: accion,
      accionTomada: accion,
    })
    const prev = useBatteryStore.getState().baterias[linea.serial]

    if (diagnostico === 'DESCARGADA') {
      const activo = useChargingStore
        .getState()
        .procesos.find((p) => p.serial === linea.serial && (p.resultado === 'PENDIENTE' || p.resultado === 'EN_CARGA'))
      withHistory(
        linea.serial,
        'DIAGNOSTICO',
        `${solicitud.numero}: DESCARGADA · Enviar a carga`,
        () => {
          patchBattery(linea.serial, {
            diagnosticoId: 'DESCARGADA',
            ubicacionTipo: 'CENTRO_CARGA',
            ubicacionId: solicitud.centroId,
          })
        },
        { estadoAnterior: prev?.diagnosticoId, estadoNuevo: 'DESCARGADA' },
      )
      if (!activo) {
        const proceso = {
          id: `carga-${Date.now()}-${linea.serial}`,
          serial: linea.serial,
          centroId: solicitud.centroId,
          estacionId: '',
          tecnicoId: usuario?.id ?? solicitud.supervisorId,
          estadoInicial: 'DESCARGADA',
          porcentajeCarga: 0,
          resultado: 'PENDIENTE' as const,
          fechaInicio: iso(new Date()),
        }
        withHistory(
          linea.serial,
          'ENVIO_CARGA',
          `${solicitud.numero}: envío a ${centro?.nombre ?? solicitud.centroId}`,
          () => {
            addProceso(proceso)
          },
          { referenciaId: proceso.id, estadoNuevo: 'CENTRO_CARGA' },
        )
      }
    } else {
      withHistory(
        linea.serial,
        'DIAGNOSTICO',
        `${solicitud.numero}: ${diagnostico} · ${accion}`,
        () => {
          patchBattery(linea.serial, { diagnosticoId: diagnostico })
        },
        { estadoAnterior: prev?.diagnosticoId, estadoNuevo: diagnostico },
      )
    }
    if (solicitud.estado === 'PENDIENTE') patchSolicitud(solicitudId, { estado: 'EN_PROCESO' })
  }

  function cerrar() {
    if (!todasDictaminadas || cerrada) return
    patchSolicitud(solicitudId, { estado: 'FINALIZADA' })
    for (const l of solicitud.lineas) {
      withHistory(l.serial, 'CHEQUEO', `${solicitud.numero} cerrada · ${l.diagnostico}`, () => undefined, {
        referenciaId: solicitudId,
        estadoNuevo: l.diagnostico,
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Link className="text-label-md text-viamar-700" to="/gestion-tecnica">
        ← Volver a gestión técnica
      </Link>
      <section className="rounded border border-app-border bg-white p-5 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-headline-lg text-viamar-800">{solicitud.numero}</h1>
          <StatusBadge item={{ id: solicitud.estado, label: solicitud.estado, tone: { bg: '#ECEFF1', border: '#B0BEC5', fg: '#37474F' }, icon: 'pending' }} />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div><dt className="text-label-sm text-ink-secondary">Dealer</dt><dd className="text-label-md">{dealer?.nombre ?? solicitud.dealerId}</dd></div>
          <div><dt className="text-label-sm text-ink-secondary">RNC</dt><dd className="text-label-md">{dealer?.rnc ?? '—'}</dd></div>
          <div><dt className="text-label-sm text-ink-secondary">Centro</dt><dd className="text-label-md">{centro?.nombre ?? solicitud.centroId}</dd></div>
          <div><dt className="text-label-sm text-ink-secondary">Supervisor</dt><dd className="text-label-md">{accountById(solicitud.supervisorId)?.nombre ?? solicitud.supervisorId}</dd></div>
          <div><dt className="text-label-sm text-ink-secondary">Vendedor</dt><dd className="text-label-md">{accountById(solicitud.vendedorId)?.nombre ?? solicitud.vendedorId}</dd></div>
          <div><dt className="text-label-sm text-ink-secondary">Creación</dt><dd className="text-label-md">{formatDate(solicitud.fechaCreacion)}</dd></div>
          <div><dt className="text-label-sm text-ink-secondary">Visita</dt><dd className="text-label-md">{formatDate(solicitud.fechaVisita)}</dd></div>
          <div><dt className="text-label-sm text-ink-secondary">Dictamen</dt><dd className="text-label-md">{dictaminadas}/{solicitud.lineas.length} líneas</dd></div>
        </dl>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-app-border">
          <span
            className="block h-full bg-viamar-500"
            style={{ width: solicitud.lineas.length ? `${(dictaminadas / solicitud.lineas.length) * 100}%` : '0%' }}
          />
        </div>
        <p className="mt-3 rounded bg-viamar-50 p-2 text-body-sm text-viamar-800">
          El diagnóstico técnico NO decide la cobertura económica: la garantía se evalúa aparte con la póliza vigente.
        </p>
      </section>

      {solicitud.lineas.map((l) => (
        <div key={l.id} className="rounded border border-app-border bg-white p-4 shadow-panel flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link className="font-code-serial text-viamar-700" to={`/serial/${l.serial}`}>
              {l.serial}
            </Link>
            <StatusBadge catalogId={l.diagnostico} />
            {l.accionTomada ? (
              <span className="rounded bg-viamar-100 px-2 py-0.5 text-label-sm text-viamar-800">
                Dictamen: {l.accionTomada}
              </span>
            ) : (
              <span className="rounded bg-app-surface-alt px-2 py-0.5 text-label-sm text-ink-secondary">
                Sin dictamen
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField
              label="Voltaje (V)"
              type="number"
              step="0.1"
              value={l.voltaje}
              disabled={cerrada}
              onChange={(e) => editarMedicion(l.id, 'voltaje', e.target.value)}
            />
            <FormField
              label="Densidad (g/cm³)"
              type="number"
              step="0.01"
              value={l.densidad}
              disabled={cerrada}
              onChange={(e) => editarMedicion(l.id, 'densidad', e.target.value)}
            />
            <FormField
              label="CCA medido (%)"
              type="number"
              step="1"
              value={l.capacidadMedida}
              disabled={cerrada}
              onChange={(e) => editarMedicion(l.id, 'capacidadMedida', e.target.value)}
            />
          </div>
          <p className="text-body-sm text-ink-secondary">
            Sugerencia automática: <strong className="text-ink">{l.accionSugerida}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            {DICTAMENES.map((d) => (
              <Button
                key={d.diagnostico}
                variant="outlined"
                className="h-8 text-label-md"
                disabled={cerrada}
                onClick={() => dictaminar(l.id, d.diagnostico, d.accion)}
              >
                {d.label}
              </Button>
            ))}
          </div>
          {procesos.some((p) => p.serial === l.serial && (p.resultado === 'PENDIENTE' || p.resultado === 'EN_CARGA')) ? (
            <p className="text-body-sm text-ink-secondary">
              En cola de carga · <Link className="text-viamar-700" to="/carga">ver proceso</Link>
            </p>
          ) : null}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={!todasDictaminadas || cerrada} onClick={cerrar}>
          {cerrada ? 'Solicitud finalizada' : 'Cerrar solicitud'}
        </Button>
        {!todasDictaminadas && !cerrada ? (
          <p className="text-body-sm text-ink-secondary">
            Dicta todas las líneas ({dictaminadas}/{solicitud.lineas.length}) para cerrar.
          </p>
        ) : null}
      </div>
    </div>
  )
}
