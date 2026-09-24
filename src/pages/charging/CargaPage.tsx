import { useMemo, useState } from 'react'
import {
  BatteryCharging,
  CheckCircle2,
  PlugZap,
  Truck,
  Undo2,
} from 'lucide-react'
import { Pill } from '../../components/ui/Pill'
import { estadoTone, humanizeEstado } from '../../domain/estados'
import { DataTable, CellStack } from '../../components/ui/DataTable'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageTabs } from '../../components/ui/PageTabs'
import { MetricCard } from '../../components/ui/MetricCard'
import { MetricGrid } from '../../components/ui/Workspace'
import { SerialCell } from '../../components/ui/SerialCell'
import { useChargingStore } from '../../stores/chargingStore'
import { useBatteryStore } from '../../stores/batteryStore'
import { useDistributorStore } from '../../stores/distributorStore'
import { useInspectionStore } from '../../stores/inspectionStore'
import { withHistory } from '../../stores/historyStore'
import { formatDate, iso } from '../../domain/dates'
import type { ProcesoCarga } from '../../domain/entities'
import { cn } from '../../lib/cn'

function diasEnCola(fechaInicio: string): number {
  const ms = Date.now() - new Date(fechaInicio).getTime()
  return Math.max(0, Math.floor(ms / 86_400_000))
}

function esActivo(p: ProcesoCarga): boolean {
  return p.resultado === 'PENDIENTE' || p.resultado === 'EN_CARGA'
}

type TabVista = 'estaciones' | 'cola' | 'retorno' | 'historico'

export function CargaPage() {
  const procesos = useChargingStore((s) => s.procesos)
  const centros = useChargingStore((s) => s.centros)
  const estaciones = useChargingStore((s) => s.estaciones)
  const updateProceso = useChargingStore((s) => s.updateProceso)
  const baterias = useBatteryStore((s) => s.baterias)
  const patchBattery = useBatteryStore((s) => s.patchBattery)
  const dealers = useDistributorStore((s) => s.dealers)
  const solicitudes = useInspectionStore((s) => s.solicitudes)

  const [tab, setTab] = useState<TabVista>('estaciones')
  const [centroFiltro, setCentroFiltro] = useState<string>('todos')
  const [estacionSel, setEstacionSel] = useState<Record<string, string>>({})
  const [q, setQ] = useState('')

  const cola = useMemo(
    () => procesos.filter(esActivo).sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio)),
    [procesos],
  )
  const terminados = useMemo(
    () =>
      procesos
        .filter((p) => !esActivo(p))
        .sort((a, b) => (b.fechaFin ?? b.fechaInicio).localeCompare(a.fechaFin ?? a.fechaInicio)),
    [procesos],
  )

  const pendientesRetorno = useMemo(
    () => terminados.filter((p) => baterias[p.serial]?.ubicacionTipo === 'CENTRO_CARGA'),
    [terminados, baterias],
  )

  const centroDe = (id: string) => centros.find((c) => c.id === id)?.nombre ?? id
  const dealerOrigen = (serial: string): string => {
    const sol = solicitudes.find((s) => s.lineas.some((l) => l.serial === serial))
    return sol?.dealerId ?? dealers[0]?.id ?? ''
  }
  const estacionOcupadaPor = (estacionId: string): ProcesoCarga | undefined =>
    procesos.find((p) => esActivo(p) && p.estacionId === estacionId)

  const totalEstaciones = estaciones.length
  const ocupadasTotal = estaciones.filter((e) => estacionOcupadaPor(e.id)).length
  const pctOcupacion = totalEstaciones > 0 ? Math.round((ocupadasTotal / totalEstaciones) * 100) : 0

  function completar(id: string) {
    const proc = procesos.find((p) => p.id === id)
    if (!proc) return
    updateProceso(id, {
      resultado: 'CARGA_COMPLETADA',
      porcentajeCarga: 100,
      fechaFin: iso(new Date()),
    })
    patchBattery(proc.serial, { diagnosticoId: 'BUEN_ESTADO' })
    withHistory(proc.serial, 'CARGA_COMPLETADA', 'Carga al 100 %', () => undefined, {
      referenciaId: id,
      estadoNuevo: 'BUEN_ESTADO',
    })
  }

  function asignarEstacion(id: string) {
    const proc = procesos.find((p) => p.id === id)
    const estacionId = estacionSel[id]
    if (!proc || !estacionId || estacionOcupadaPor(estacionId)) return
    updateProceso(id, {
      estacionId,
      resultado: 'EN_CARGA',
      porcentajeCarga: Math.max(proc.porcentajeCarga, 10),
    })
    const est = estaciones.find((e) => e.id === estacionId)
    withHistory(
      proc.serial,
      'ENVIO_CARGA',
      `Asignada ${est?.nombre ?? estacionId} en ${centroDe(proc.centroId)}`,
      () => undefined,
      { referenciaId: id, estadoNuevo: 'EN_CARGA' },
    )
  }

  function devolver(id: string) {
    const proc = procesos.find((p) => p.id === id)
    if (!proc) return
    const dealerId = dealerOrigen(proc.serial)
    if (!dealerId) return
    const prev = baterias[proc.serial]
    withHistory(
      proc.serial,
      'CARGA_COMPLETADA',
      `Retorno a ${dealers.find((d) => d.id === dealerId)?.nombre ?? dealerId}`,
      () => {
        patchBattery(proc.serial, {
          diagnosticoId: 'BUEN_ESTADO',
          ubicacionTipo: 'DEALER',
          ubicacionId: dealerId,
        })
      },
      { referenciaId: id, estadoAnterior: prev?.diagnosticoId, estadoNuevo: 'BUEN_ESTADO' },
    )
    if (proc.resultado !== 'CARGA_COMPLETADA') {
      updateProceso(id, {
        resultado: 'CARGA_COMPLETADA',
        porcentajeCarga: 100,
        fechaFin: iso(new Date()),
      })
    }
  }

  const colaFiltrada = useMemo(() => {
    return cola.filter((p) => {
      const matchCentro = centroFiltro === 'todos' || p.centroId === centroFiltro
      const matchQ = !q || p.serial.toLowerCase().includes(q.toLowerCase())
      return matchCentro && matchQ
    })
  }, [cola, centroFiltro, q])

  const retornoFiltrado = useMemo(() => {
    return pendientesRetorno.filter((p) => {
      const matchCentro = centroFiltro === 'todos' || p.centroId === centroFiltro
      const matchQ = !q || p.serial.toLowerCase().includes(q.toLowerCase())
      return matchCentro && matchQ
    })
  }, [pendientesRetorno, centroFiltro, q])

  const historicoFiltrado = useMemo(() => {
    return terminados.filter((p) => {
      const matchCentro = centroFiltro === 'todos' || p.centroId === centroFiltro
      const matchQ = !q || p.serial.toLowerCase().includes(q.toLowerCase())
      return matchCentro && matchQ
    })
  }, [terminados, centroFiltro, q])

  return (
    <div className="page-fill">
      <PageHeader
        title="Proceso de carga y mantenimiento"
        description="Recepción en centros de servicio, asignación de estaciones por orden FIFO y retorno de inventario recuperado a distribuidores."
        tabs={
          <PageTabs
            active={tab}
            onChange={(id) => setTab(id as TabVista)}
            tabs={[
              { id: 'estaciones', label: 'Estaciones', count: totalEstaciones },
              { id: 'cola', label: 'Cola FIFO', count: cola.length },
              { id: 'retorno', label: 'Retorno a dealer', count: pendientesRetorno.length },
              { id: 'historico', label: 'Histórico', count: terminados.length },
            ]}
            action={
              <label className="flex items-center gap-2">
                <span className="text-body-xs text-ink-tertiary">Centro</span>
                <select
                  value={centroFiltro}
                  onChange={(e) => setCentroFiltro(e.target.value)}
                  className="h-9 max-w-[220px] rounded-md border border-line-strong bg-white px-2.5 text-body-sm text-ink focus:border-viamar-500 focus:shadow-focus focus:outline-none"
                >
                  <option value="todos">Todos los centros</option>
                  {centros.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </label>
            }
          />
        }
      />

      <MetricGrid columns={4}>
        <MetricCard
          label="En cola de carga"
          value={cola.length}
          icon={BatteryCharging}
          tone="warn"
          filled={cola.length > 0}
          context="Prioridad por orden de llegada"
        />
        <MetricCard
          label="Estaciones activas"
          value={`${ocupadasTotal} / ${totalEstaciones}`}
          icon={PlugZap}
          tone="brand"
          filled
          context={`${pctOcupacion}% de ocupación · ${totalEstaciones - ocupadasTotal} disponibles`}
        />
        <MetricCard
          label="Listas para retorno"
          value={pendientesRetorno.length}
          icon={Truck}
          tone="ok"
          filled={pendientesRetorno.length > 0}
          context="Baterías recuperadas esperando despacho"
        />
        <MetricCard
          label="Cargas finalizadas"
          value={terminados.length}
          icon={CheckCircle2}
          tone="neutral"
          context="Total procesado en el histórico"
        />
      </MetricGrid>

      {/* Tablero visual de estaciones por centro */}
      {tab === 'estaciones' ? (
      <section className="surface min-h-0 flex-1 overflow-y-auto scroll-slim p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-headline-sm text-ink">
            <PlugZap size={15} className="text-viamar-500" />
            Tablero de estaciones de carga
          </h2>
          <span className="text-body-xs text-ink-tertiary">
            Ocupación actual por centro de servicio
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {centros
            .filter((c) => centroFiltro === 'todos' || c.id === centroFiltro)
            .map((c) => {
            const ests = estaciones.filter((e) => e.centroId === c.id)
            const ocupadas = ests.filter((e) => estacionOcupadaPor(e.id)).length
            const pct = ests.length > 0 ? Math.round((ocupadas / ests.length) * 100) : 0

            return (
              <div key={c.id} className="rounded border border-line bg-surface-subtle p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-label-lg font-semibold text-ink">{c.nombre}</h3>
                    <p className="text-body-xs text-ink-tertiary">{c.localidad}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-label-lg font-semibold tabular-nums text-ink">
                      {ocupadas}/{ests.length}
                    </span>
                    <span className="ml-1 text-body-xs text-ink-tertiary">({pct}%)</span>
                  </div>
                </div>

                {/* Barra de capacidad */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      pct >= 90 ? 'bg-critical' : pct >= 60 ? 'bg-warning' : 'bg-viamar-500',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Slots individuales de estaciones */}
                <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {ests.map((e) => {
                    const ocup = estacionOcupadaPor(e.id)
                    return (
                      <div
                        key={e.id}
                        className={cn(
                          'flex flex-col rounded-md border px-2 py-1.5 text-left transition-colors duration-fast',
                          /* La estación ocupada se tiñe: en un tablero de
                             capacidad lo que se busca de un vistazo es qué
                             está tomado, no qué está libre. */
                          ocup
                            ? 'border-viamar-200 bg-viamar-50/70'
                            : 'border-line-subtle bg-white',
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-body-xs font-semibold text-ink">
                            {e.nombre}
                          </span>
                          <span
                            className={cn(
                              'h-1.5 w-1.5 shrink-0 rounded-full',
                              ocup ? 'bg-warning' : 'bg-success',
                            )}
                          />
                        </div>
                        {ocup ? (
                          <div className="mt-1 truncate">
                            <SerialCell serial={ocup.serial} className="text-body-xs" />
                            <span className="block text-[10px] tabular-nums text-ink-tertiary">
                              {ocup.porcentajeCarga}% · {diasEnCola(ocup.fechaInicio)}d
                            </span>
                          </div>
                        ) : (
                          <span className="mt-1 text-[11px] font-medium text-success-text">
                            Libre
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>
      ) : null}

        {/* Cola FIFO activa */}
        {tab === 'cola' && (
          <DataTable
            title="Cola FIFO activa"
            icon={<BatteryCharging size={15} />}
            density="compact"
            search={{ value: q, onChange: setQ, placeholder: 'Filtrar por serial…' }}
            columns={[
              {
                key: 'serial',
                header: 'Serial',
                primary: true,
                width: '150px',
                sortable: true,
                render: (p) => <SerialCell serial={p.serial} />,
              },
              {
                key: 'centro',
                header: 'Centro de carga',
                sortable: true,
                sortValue: (p) => centroDe(p.centroId),
                render: (p) => centroDe(p.centroId),
              },
              {
                key: 'ingreso',
                header: 'Ingreso',
                width: '110px',
                sortable: true,
                sortValue: (p) => p.fechaInicio,
                render: (p) => formatDate(p.fechaInicio),
              },
              {
                key: 'dias',
                header: 'Días en cola',
                width: '110px',
                align: 'right',
                sortable: true,
                sortValue: (p) => diasEnCola(p.fechaInicio),
                render: (p) => {
                  const dias = diasEnCola(p.fechaInicio)
                  return (
                    <span
                      className={cn(
                        'tabular-nums font-medium',
                        dias >= 5
                          ? 'font-bold text-critical-text'
                          : dias >= 3
                            ? 'text-warning-text'
                            : 'text-ink',
                      )}
                    >
                      {dias} d
                    </span>
                  )
                },
              },
              {
                key: 'resultado',
                header: 'Estado',
                width: '120px',
                sortable: true,
                render: (p) => (
                  <Pill tone={estadoTone(p.resultado)} dot>
                    {humanizeEstado(p.resultado)}
                  </Pill>
                ),
              },
              {
                key: 'estacion',
                header: 'Estación asignada',
                width: '160px',
                render: (p) => {
                  const est = estaciones.find((e) => e.id === p.estacionId)
                  return est ? (
                    <span className="font-medium text-ink">{est.nombre}</span>
                  ) : (
                    <span className="italic text-ink-disabled">Sin estación</span>
                  )
                },
              },
              {
                key: 'acciones',
                header: 'Acción operativa',
                align: 'right',
                render: (p) => {
                  const libres = estaciones.filter(
                    (e) => e.centroId === p.centroId && !estacionOcupadaPor(e.id),
                  )
                  return (
                    <div className="flex items-center justify-end gap-1.5">
                      {p.resultado === 'PENDIENTE' && libres.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={estacionSel[p.id] ?? ''}
                            onChange={(e) =>
                              setEstacionSel((prev) => ({ ...prev, [p.id]: e.target.value }))
                            }
                            className="h-control-sm rounded border border-line-strong bg-white px-1.5 text-body-xs text-ink"
                          >
                            <option value="">Estación…</option>
                            {libres.map((e) => (
                              <option key={e.id} value={e.id}>
                                {e.nombre}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!estacionSel[p.id]}
                            onClick={() => asignarEstacion(p.id)}
                            leadingIcon={<PlugZap size={13} />}
                          >
                            Asignar
                          </Button>
                        </div>
                      ) : null}

                      <Button
                        size="sm"
                        variant={p.resultado === 'EN_CARGA' ? 'primary' : 'secondary'}
                        onClick={() => completar(p.id)}
                        leadingIcon={<CheckCircle2 size={13} />}
                      >
                        Completar
                      </Button>
                    </div>
                  )
                },
              },
            ]}
            rows={colaFiltrada}
            rowKey={(p) => p.id}
            emptyTitle="Cola de carga vacía"
            emptyDescription="No hay baterías pendientes de carga en los centros seleccionados."
          />
        )}

        {/* Retorno a distribuidores */}
        {tab === 'retorno' && (
          <DataTable
            title="Retorno a dealer"
            icon={<Truck size={15} />}
            density="compact"
            search={{ value: q, onChange: setQ, placeholder: 'Filtrar por serial…' }}
            columns={[
              {
                key: 'serial',
                header: 'Serial',
                primary: true,
                width: '160px',
                sortable: true,
                render: (p) => <SerialCell serial={p.serial} />,
              },
              {
                key: 'centro',
                header: 'Centro de origen',
                sortable: true,
                render: (p) => centroDe(p.centroId),
              },
              {
                key: 'dealer',
                header: 'Distribuidor destino',
                sortable: true,
                render: (p) => {
                  const d = dealers.find((item) => item.id === dealerOrigen(p.serial))
                  return <CellStack primary={d?.nombre ?? '—'} secondary={d?.localidad} />
                },
              },
              {
                key: 'resultado',
                header: 'Condición',
                width: '150px',
                render: (p) => (
                  <Pill tone={estadoTone(p.resultado)} dot>
                    {humanizeEstado(p.resultado)}
                  </Pill>
                ),
              },
              {
                key: 'acciones',
                header: 'Despacho',
                align: 'right',
                width: '180px',
                render: (p) => (
                  <Button
                    size="sm"
                    variant="primary"
                    leadingIcon={<Undo2 size={13} />}
                    onClick={() => devolver(p.id)}
                  >
                    Devolver a dealer
                  </Button>
                ),
              },
            ]}
            rows={retornoFiltrado}
            rowKey={(p) => p.id}
            emptyTitle="Sin baterías pendientes de retorno"
            emptyDescription="Todas las baterías cargadas ya fueron despachadas a sus distribuidores."
          />
        )}

        {/* Histórico de procesos cerrados */}
        {tab === 'historico' && (
          <DataTable
            title="Histórico de cargas"
            icon={<CheckCircle2 size={15} />}
            density="compact"
            search={{ value: q, onChange: setQ, placeholder: 'Filtrar histórico…' }}
            columns={[
              {
                key: 'serial',
                header: 'Serial',
                primary: true,
                width: '160px',
                sortable: true,
                render: (p) => <SerialCell serial={p.serial} />,
              },
              {
                key: 'centro',
                header: 'Centro',
                sortable: true,
                render: (p) => centroDe(p.centroId),
              },
              {
                key: 'inicio',
                header: 'Fecha inicio',
                width: '120px',
                sortable: true,
                render: (p) => formatDate(p.fechaInicio),
              },
              {
                key: 'fin',
                header: 'Fecha fin',
                width: '120px',
                sortable: true,
                render: (p) => (p.fechaFin ? formatDate(p.fechaFin) : '—'),
              },
              {
                key: 'resultado',
                header: 'Resultado',
                width: '150px',
                render: (p) => (
                  <Pill tone={estadoTone(p.resultado)} dot>
                    {humanizeEstado(p.resultado)}
                  </Pill>
                ),
              },
              {
                key: 'ubicacion',
                header: 'Ubicación actual',
                render: (p) => {
                  const b = baterias[p.serial]
                  if (!b) return '—'
                  if (b.ubicacionTipo === 'DEALER') {
                    const d = dealers.find((item) => item.id === b.ubicacionId)
                    return `Dealer · ${d?.nombre ?? b.ubicacionId}`
                  }
                  return b.ubicacionTipo
                },
              },
            ]}
            rows={historicoFiltrado}
            rowKey={(p) => p.id}
            emptyTitle="Sin historial"
            emptyDescription="No se encontraron registros de procesos anteriores."
          />
        )}
    </div>
  )
}
