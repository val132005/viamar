import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock,
  Info,
  Plus,
  Stethoscope,
} from 'lucide-react'
import { DataTable, CellStack } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { FormField } from '../../components/ui/FormField'
import { MetricCard } from '../../components/ui/MetricCard'
import { MetricGrid } from '../../components/ui/Workspace'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageTabs } from '../../components/ui/PageTabs'
import { Pill } from '../../components/ui/Pill'
import { estadoTone, humanizeEstado } from '../../domain/estados'
import { ProcessSteps, ProgressBar } from '../../components/ui/ProcessSteps'
import { SerialCell } from '../../components/ui/SerialCell'
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
import { cn } from '../../lib/cn'
import { DonaEstado, PanelHeader, Ranking, type SegmentoDona } from '../../components/panel/PanelWidgets'
import { PANEL, tonoDePill } from '../../components/panel/tonos'

/** Etapas por las que pasa una solicitud, en orden. */
const FLUJO: ChequeoEstado[] = ['BORRADOR', 'PENDIENTE', 'EN_PROCESO', 'FINALIZADA']

function dictaminadasDe(s: { lineas: Array<{ accionTomada?: string }> }): number {
  return s.lineas.filter((l) => l.accionTomada).length
}

export function InspectionListPage() {
  const solicitudes = useInspectionStore((s) => s.solicitudes)
  const dealers = useDistributorStore((s) => s.dealers)
  const [filtro, setFiltro] = useState<'TODOS' | ChequeoEstado>('TODOS')
  const [q, setQ] = useState('')

  const conteos = useMemo(() => {
    const map: Record<string, number> = { TODOS: solicitudes.length, CANCELADA: 0 }
    for (const e of [...FLUJO, 'CANCELADA' as ChequeoEstado]) {
      map[e] = solicitudes.filter((s) => s.estado === e).length
    }
    return map
  }, [solicitudes])

  const rows = useMemo(() => {
    const base = filtro === 'TODOS' ? solicitudes : solicitudes.filter((s) => s.estado === filtro)
    const needle = q.trim().toUpperCase()
    if (!needle) return base
    return base.filter((s) => {
      const dealer = dealers.find((d) => d.id === s.dealerId)?.nombre ?? ''
      return s.numero.toUpperCase().includes(needle) || dealer.toUpperCase().includes(needle)
    })
  }, [solicitudes, filtro, q, dealers])

  const abiertas = (conteos.PENDIENTE ?? 0) + (conteos.EN_PROCESO ?? 0)

  /* Trabajo real que queda por delante: líneas sin dictamen en las solicitudes
     que siguen abiertas. Es la cifra que dice cuánto falta, no cuántas
     solicitudes hay. */
  const lineasPendientes = useMemo(
    () =>
      solicitudes
        .filter((s) => s.estado === 'PENDIENTE' || s.estado === 'EN_PROCESO')
        .reduce((acc, s) => acc + (s.lineas.length - dictaminadasDe(s)), 0),
    [solicitudes],
  )

  const porEtapa: SegmentoDona[] = [...FLUJO, 'CANCELADA' as ChequeoEstado].map((e) => ({
    id: e,
    label: humanizeEstado(e),
    valor: conteos[e] ?? 0,
    tono: tonoDePill(estadoTone(e)),
  }))

  /* Dónde está el trabajo: baterías sin dictamen por distribuidor. */
  const pendientesPorDealer = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const s of solicitudes) {
      if (s.estado !== 'PENDIENTE' && s.estado !== 'EN_PROCESO') continue
      mapa.set(s.dealerId, (mapa.get(s.dealerId) ?? 0) + (s.lineas.length - dictaminadasDe(s)))
    }
    return [...mapa.entries()]
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, valor]) => ({
        id,
        label: dealers.find((d) => d.id === id)?.nombre ?? id,
        valor,
        to: `/distribuidores/${id}`,
      }))
  }, [solicitudes, dealers])

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeader
        title="Gestión técnica"
        description="Solicitudes de chequeo en sitio: cada visita dictamina las baterías del distribuidor."
        actions={
          <Link to="/gestion-tecnica/nueva">
            <Button leadingIcon={<Plus size={15} />}>Nueva solicitud</Button>
          </Link>
        }
        tabs={
          <PageTabs
            active={filtro}
            onChange={(id) => setFiltro(id as 'TODOS' | ChequeoEstado)}
            tabs={[
              { id: 'TODOS', label: 'Todas', count: conteos.TODOS ?? 0 },
              ...FLUJO.map((estado) => ({
                id: estado,
                label: humanizeEstado(estado),
                count: conteos[estado] ?? 0,
                tone: estado === 'PENDIENTE' ? ('danger' as const) : ('default' as const),
              })),
            ]}
          />
        }
      />

      <MetricGrid columns={4}>
        <MetricCard
          label="Solicitudes abiertas"
          value={abiertas}
          icon={ClipboardList}
          tone="warn"
          filled={abiertas > 0}
          context="Pendientes o en proceso"
        />
        <MetricCard
          label="Sin asignar"
          value={conteos.PENDIENTE ?? 0}
          icon={Clock}
          tone="danger"
          filled={(conteos.PENDIENTE ?? 0) > 0}
          context="Esperan visita técnica"
        />
        <MetricCard
          label="Líneas por dictaminar"
          value={lineasPendientes}
          icon={Stethoscope}
          tone="accent"
          filled={lineasPendientes > 0}
          context="Baterías sin resolución en visitas abiertas"
        />
        <MetricCard
          label="Finalizadas"
          value={conteos.FINALIZADA ?? 0}
          icon={CheckCircle2}
          tone="ok"
          filled={(conteos.FINALIZADA ?? 0) > 0}
          context={
            conteos.TODOS
              ? `${Math.round(((conteos.FINALIZADA ?? 0) / conteos.TODOS) * 100)}% del total`
              : undefined
          }
        />
      </MetricGrid>

      <div className="grid gap-3.5 lg:grid-cols-[45fr_55fr]">
        <section className={cn(PANEL, 'min-w-0 px-4 pb-4 pt-3.5')}>
          <PanelHeader title="Solicitudes por etapa" info="Estado actual de cada solicitud de chequeo." />
          <div className="mt-3">
            <DonaEstado segmentos={porEtapa} unidad="solicitudes" />
          </div>
        </section>
        <section className={cn(PANEL, 'min-w-0 px-4 pb-3 pt-3.5')}>
          <PanelHeader
            title="Baterías por dictaminar"
            info="Líneas sin dictamen en solicitudes abiertas, por distribuidor."
          />
          <div className="mt-1.5">
            {pendientesPorDealer.length ? (
              <Ranking filas={pendientesPorDealer} total={lineasPendientes} />
            ) : (
              <p className="py-10 text-center text-body-sm text-ink-tertiary">
                Todas las visitas abiertas están dictaminadas.
              </p>
            )}
          </div>
        </section>
      </div>

      {solicitudes.length === 0 ? (
        <EmptyState
          framed
          icon={ClipboardList}
          title="Sin solicitudes"
          description="Aún no hay solicitudes de chequeo registradas."
          action={
            <Link to="/gestion-tecnica/nueva">
              <Button leadingIcon={<Plus size={15} />}>Crear la primera</Button>
            </Link>
          }
        />
      ) : (
        <DataTable
          title="Ejecución técnica"
          fill={false}
          search={{ value: q, onChange: setQ, placeholder: 'Solicitud o dealer…' }}
          columns={[
            {
              key: 'numero',
              header: 'Solicitud',
              primary: true,
              sortable: true,
              width: '150px',
              render: (s) => (
                <Link
                  className="font-semibold text-viamar-500 underline-offset-2 transition-colors duration-fast hover:text-viamar-600 hover:underline"
                  to={`/gestion-tecnica/${s.id}`}
                >
                  {s.numero}
                </Link>
              ),
            },
            {
              key: 'dealer',
              header: 'Distribuidor',
              sortable: true,
              sortValue: (s) => dealers.find((d) => d.id === s.dealerId)?.nombre ?? s.dealerId,
              render: (s) => {
                const dealer = dealers.find((d) => d.id === s.dealerId)
                return <CellStack primary={dealer?.nombre ?? s.dealerId} secondary={dealer?.rnc} />
              },
            },
            {
              key: 'estado',
              header: 'Estado',
              width: '130px',
              sortable: true,
              render: (s) => (
                <Pill tone={estadoTone(s.estado)} dot>
                  {humanizeEstado(s.estado)}
                </Pill>
              ),
            },
            {
              key: 'progreso',
              header: 'Dictamen',
              width: '170px',
              sortable: true,
              sortValue: (s) => dictaminadasDe(s) / Math.max(1, s.lineas.length),
              render: (s) => <ProgressBar done={dictaminadasDe(s)} total={s.lineas.length} />,
            },
            {
              key: 'fecha',
              header: 'Visita',
              align: 'right',
              width: '120px',
              sortable: true,
              sortValue: (s) => s.fechaVisita,
              render: (s) => <span className="whitespace-nowrap">{formatDate(s.fechaVisita)}</span>,
            },
          ]}
          rows={rows}
          rowKey={(s) => s.id}
          rowTone={(s) => (s.estado === 'PENDIENTE' ? 'warn' : 'default')}
          emptyTitle="Sin coincidencias"
          emptyDescription="Ninguna solicitud coincide con la etapa y la búsqueda actuales."
          renderMobile={(s) => (
            <Link to={`/gestion-tecnica/${s.id}`} className="block">
              <div className="flex items-center justify-between gap-2">
                <span className="text-label-lg text-viamar-700">{s.numero}</span>
                <Pill tone={estadoTone(s.estado)} dot>
                  {humanizeEstado(s.estado)}
                </Pill>
              </div>
              <p className="mt-0.5 truncate text-body-sm text-ink-secondary">
                {dealers.find((d) => d.id === s.dealerId)?.nombre ?? s.dealerId}
              </p>
              <div className="mt-1.5">
                <ProgressBar done={dictaminadasDe(s)} total={s.lineas.length} />
              </div>
            </Link>
          )}
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
  if (!solicitud) {
    return (
      <EmptyState
        framed
        kind="no-results"
        title="Solicitud no encontrada"
        description="La solicitud que buscas no existe o fue eliminada."
        action={
          <Link to="/gestion-tecnica">
            <Button variant="secondary" leadingIcon={<ArrowLeft size={15} />}>
              Volver a gestión técnica
            </Button>
          </Link>
        }
      />
    )
  }
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
  const cancelada = solicitud.estado === 'CANCELADA'

  function editarMedicion(
    lineaId: string,
    field: 'voltaje' | 'densidad' | 'capacidadMedida',
    raw: string,
  ) {
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
        .procesos.find(
          (p) =>
            p.serial === linea.serial &&
            (p.resultado === 'PENDIENTE' || p.resultado === 'EN_CARGA'),
        )
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
      withHistory(
        l.serial,
        'CHEQUEO',
        `${solicitud.numero} cerrada · ${l.diagnostico}`,
        () => undefined,
        {
          referenciaId: solicitudId,
          estadoNuevo: l.diagnostico,
        },
      )
    }
  }

  const etapaActual = cancelada
    ? FLUJO.indexOf('EN_PROCESO')
    : Math.max(0, FLUJO.indexOf(solicitud.estado as ChequeoEstado))

  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Gestión técnica', to: '/gestion-tecnica' },
          { label: solicitud.numero },
        ]}
        title={solicitud.numero}
        chips={
          <Pill tone={estadoTone(solicitud.estado)} dot>
            {humanizeEstado(solicitud.estado)}
          </Pill>
        }
        actions={
          <Button
            disabled={!todasDictaminadas || cerrada}
            onClick={cerrar}
            variant={todasDictaminadas && !cerrada ? 'primary' : 'secondary'}
          >
            {cerrada ? 'Solicitud finalizada' : 'Cerrar solicitud'}
          </Button>
        }
      />

      {/* Estado del proceso: en qué punto está la visita y cuánto falta. */}
      <section className="surface shrink-0 px-4 pb-4 pt-3.5">
        <PanelHeader title="Avance de la visita" className="mb-3" />
        <ProcessSteps
          steps={FLUJO.map((e) => ({ id: e, label: humanizeEstado(e) }))}
          current={etapaActual}
          aborted={cancelada}
        />

        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line-subtle pt-3">
          <div className="min-w-[180px] flex-1">
            <p className="mb-1 text-body-xs text-ink-tertiary">Líneas dictaminadas</p>
            <ProgressBar done={dictaminadas} total={solicitud.lineas.length} />
          </div>
          <Dato label="Distribuidor" value={dealer?.nombre ?? solicitud.dealerId} />
          <Dato label="RNC" value={dealer?.rnc ?? '—'} />
          <Dato label="Centro" value={centro?.nombre ?? solicitud.centroId} />
          <Dato
            label="Supervisor"
            value={accountById(solicitud.supervisorId)?.nombre ?? solicitud.supervisorId}
          />
          <Dato
            label="Vendedor"
            value={accountById(solicitud.vendedorId)?.nombre ?? solicitud.vendedorId}
          />
          <Dato label="Visita" value={formatDate(solicitud.fechaVisita)} />
        </div>
      </section>

      <aside className="flex shrink-0 items-center gap-3 rounded-xl border border-info-border/70 bg-gradient-to-br from-white to-info-soft/70 px-4 py-2.5">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-info-soft text-info">
          <Info size={16} aria-hidden="true" />
        </span>
        <p className="text-body-sm text-info-text">
          El diagnóstico técnico no decide la cobertura económica: la garantía se evalúa aparte con
          la póliza vigente.
        </p>
      </aside>

      {/* Una tarjeta por batería: cada línea es una unidad de trabajo con sus
          mediciones y su dictamen, no una fila de datos. */}
      <ol className="flex flex-col gap-3">
        {solicitud.lineas.map((l, i) => {
          const enCola = procesos.some(
            (p) =>
              p.serial === l.serial && (p.resultado === 'PENDIENTE' || p.resultado === 'EN_CARGA'),
          )
          return (
            <li
              key={l.id}
              className={cn(
                'surface flex flex-col gap-3 p-4 transition-shadow duration-200 hover:shadow-md',
                l.accionTomada && 'bg-gradient-to-br from-white to-success-soft/40',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-viamar-50 text-label-md font-bold tabular-nums text-viamar-600">
                    {i + 1}
                  </span>
                  <SerialCell serial={l.serial} />
                  <StatusBadge catalogId={l.diagnostico} />
                </div>
                {l.accionTomada ? (
                  <Pill tone="ok" dot>
                    Dictamen: {l.accionTomada}
                  </Pill>
                ) : (
                  <Pill tone="neutral">Sin dictamen</Pill>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-subtle pt-3">
                <p className="text-body-sm text-ink-secondary">
                  Sugerencia automática:{' '}
                  <strong className="font-semibold text-ink">{l.accionSugerida}</strong>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DICTAMENES.map((d) => (
                    <Button
                      key={d.diagnostico}
                      variant={l.accionTomada === d.accion ? 'primary' : 'secondary'}
                      size="sm"
                      disabled={cerrada}
                      onClick={() => dictaminar(l.id, d.diagnostico, d.accion)}
                    >
                      {d.label}
                    </Button>
                  ))}
                </div>
              </div>

              {enCola ? (
                <p className="text-body-xs text-ink-tertiary">
                  En cola de carga ·{' '}
                  <Link className="font-semibold text-viamar-500 underline-offset-2 hover:underline" to="/carga">
                    ver proceso
                  </Link>
                </p>
              ) : null}
            </li>
          )
        })}
      </ol>

      {!todasDictaminadas && !cerrada ? (
        <p className="text-body-sm text-ink-secondary">
          Dicta las {solicitud.lineas.length - dictaminadas} líneas restantes para poder cerrar la
          solicitud.
        </p>
      ) : null}
    </div>
  )
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-body-xs text-ink-tertiary">{label}</p>
      <p className="truncate text-label-lg text-ink">{value}</p>
    </div>
  )
}
