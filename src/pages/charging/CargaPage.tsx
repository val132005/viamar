import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BatteryCharging, PlugZap, Undo2 } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { SelectField } from '../../components/ui/FormField'
import { useChargingStore } from '../../stores/chargingStore'
import { useBatteryStore } from '../../stores/batteryStore'
import { useDistributorStore } from '../../stores/distributorStore'
import { useInspectionStore } from '../../stores/inspectionStore'
import { withHistory } from '../../stores/historyStore'
import { formatDate, iso } from '../../domain/dates'
import type { ProcesoCarga } from '../../domain/entities'

function diasEnCola(fechaInicio: string): number {
  const ms = Date.now() - new Date(fechaInicio).getTime()
  return Math.max(0, Math.floor(ms / 86_400_000))
}

function esActivo(p: ProcesoCarga): boolean {
  return p.resultado === 'PENDIENTE' || p.resultado === 'EN_CARGA'
}

export function CargaPage() {
  const procesos = useChargingStore((s) => s.procesos)
  const centros = useChargingStore((s) => s.centros)
  const estaciones = useChargingStore((s) => s.estaciones)
  const updateProceso = useChargingStore((s) => s.updateProceso)
  const baterias = useBatteryStore((s) => s.baterias)
  const patchBattery = useBatteryStore((s) => s.patchBattery)
  const dealers = useDistributorStore((s) => s.dealers)
  const solicitudes = useInspectionStore((s) => s.solicitudes)
  const [estacionSel, setEstacionSel] = useState<Record<string, string>>({})

  const cola = useMemo(
    () => procesos.filter(esActivo).sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio)),
    [procesos],
  )
  const terminados = useMemo(
    () => procesos.filter((p) => !esActivo(p)).sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio)),
    [procesos],
  )

  const centroDe = (id: string) => centros.find((c) => c.id === id)?.nombre ?? id
  const dealerOrigen = (serial: string): string => {
    const sol = solicitudes.find((s) => s.lineas.some((l) => l.serial === serial))
    return sol?.dealerId ?? dealers[0]?.id ?? ''
  }
  const estacionOcupadaPor = (estacionId: string): ProcesoCarga | undefined =>
    procesos.find((p) => esActivo(p) && p.estacionId === estacionId)

  function completar(id: string) {
    const proc = procesos.find((p) => p.id === id)
    if (!proc) return
    updateProceso(id, { resultado: 'CARGA_COMPLETADA', porcentajeCarga: 100, fechaFin: iso(new Date()) })
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
    updateProceso(id, { estacionId, resultado: 'EN_CARGA', porcentajeCarga: Math.max(proc.porcentajeCarga, 10) })
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
      updateProceso(id, { resultado: 'CARGA_COMPLETADA', porcentajeCarga: 100, fechaFin: iso(new Date()) })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline-lg text-viamar-800">Proceso de carga</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-sm text-viamar-800">Tablero de estaciones</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {centros.map((c) => {
            const ests = estaciones.filter((e) => e.centroId === c.id)
            const ocupadas = ests.filter((e) => estacionOcupadaPor(e.id)).length
            return (
              <div key={c.id} className="rounded border border-app-border bg-white p-4 shadow-panel">
                <p className="text-label-lg">{c.nombre}</p>
                <p className="text-body-sm text-ink-secondary">
                  {ocupadas}/{ests.length} ocupadas
                </p>
                <ul className="mt-2 flex flex-col gap-1">
                  {ests.map((e) => {
                    const ocup = estacionOcupadaPor(e.id)
                    return (
                      <li
                        key={e.id}
                        className="flex items-center justify-between gap-2 rounded bg-app-surface-alt px-2 py-1"
                      >
                        <span className="text-body-sm">{e.nombre}</span>
                        {ocup ? (
                          <span className="text-label-sm text-ink-secondary">
                            Ocupada · <span className="font-code-serial">{ocup.serial}</span>
                          </span>
                        ) : (
                          <span className="text-label-sm font-semibold text-viamar-700">Libre</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-sm text-viamar-800">Cola por centro (FIFO · {cola.length})</h2>
        {cola.length === 0 ? (
          <EmptyState
            icon={BatteryCharging}
            title="Cola vacía"
            description="No hay baterías en proceso de carga. Envía seriales desde gestión técnica."
          />
        ) : (
          centros.map((c) => {
            const delCentro = cola.filter((p) => p.centroId === c.id)
            if (delCentro.length === 0) return null
            const libres = estaciones.filter((e) => e.centroId === c.id && !estacionOcupadaPor(e.id))
            return (
              <div key={c.id} className="flex flex-col gap-2">
                <h3 className="text-label-lg text-viamar-700">
                  {c.nombre} · {delCentro.length}
                </h3>
                <DataTable
                  columns={[
                    {
                      key: 'serial',
                      header: 'Serial',
                      render: (p) => (
                        <Link className="font-code-serial text-viamar-700" to={`/serial/${p.serial}`}>
                          {p.serial}
                        </Link>
                      ),
                    },
                    { key: 'ingreso', header: 'Ingreso', render: (p) => formatDate(p.fechaInicio) },
                    { key: 'dias', header: 'Días en cola', render: (p) => String(diasEnCola(p.fechaInicio)) },
                    { key: 'resultado', header: 'Estado' },
                    {
                      key: 'estacion',
                      header: 'Estación',
                      render: (p) =>
                        estaciones.find((e) => e.id === p.estacionId)?.nombre ?? 'Sin asignar',
                    },
                    {
                      key: 'acc',
                      header: '',
                      render: (p) => (
                        <span className="flex flex-wrap gap-2">
                          {p.resultado === 'PENDIENTE' && libres.length > 0 ? (
                            <span className="flex items-center gap-1">
                              <SelectField
                                label=""
                                value={estacionSel[p.id] ?? ''}
                                onChange={(e) =>
                                  setEstacionSel((prev) => ({ ...prev, [p.id]: e.target.value }))
                                }
                              >
                                <option value="">Estación…</option>
                                {libres.map((e) => (
                                  <option key={e.id} value={e.id}>
                                    {e.nombre}
                                  </option>
                                ))}
                              </SelectField>
                              <Button
                                variant="outlined"
                                className="h-8 text-label-md"
                                disabled={!estacionSel[p.id]}
                                onClick={() => asignarEstacion(p.id)}
                              >
                                <PlugZap size={14} /> Asignar estación
                              </Button>
                            </span>
                          ) : null}
                          <Button
                            variant="outlined"
                            className="h-8 text-label-md"
                            onClick={() => completar(p.id)}
                          >
                            Completar
                          </Button>
                        </span>
                      ),
                    },
                  ]}
                  rows={delCentro}
                  rowKey={(p) => p.id}
                />
              </div>
            )
          })
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-sm text-viamar-800">Cargas completadas (retorno a dealer)</h2>
        {terminados.filter((p) => baterias[p.serial]?.ubicacionTipo === 'CENTRO_CARGA').length === 0 ? (
          <p className="text-body-sm text-ink-secondary">Nada pendiente de retorno.</p>
        ) : (
          <DataTable
            columns={[
              {
                key: 'serial',
                header: 'Serial',
                render: (p) => (
                  <Link className="font-code-serial text-viamar-700" to={`/serial/${p.serial}`}>
                    {p.serial}
                  </Link>
                ),
              },
              { key: 'centro', header: 'Centro', render: (p) => centroDe(p.centroId) },
              { key: 'resultado', header: 'Resultado' },
              {
                key: 'dealer',
                header: 'Retorna a',
                render: (p) => dealers.find((d) => d.id === dealerOrigen(p.serial))?.nombre ?? '—',
              },
              {
                key: 'acc',
                header: '',
                render: (p) => (
                  <Button variant="outlined" className="h-8 text-label-md" onClick={() => devolver(p.id)}>
                    <Undo2 size={14} /> Devolver a dealer
                  </Button>
                ),
              },
            ]}
            rows={terminados.filter((p) => baterias[p.serial]?.ubicacionTipo === 'CENTRO_CARGA')}
            rowKey={(p) => p.id}
          />
        )}
      </section>
    </div>
  )
}
