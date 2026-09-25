import { useCallback, useMemo, useState } from 'react'
import { Check, CheckCircle2, Coins, Handshake, PackagePlus, ShieldCheck, ShieldX, X } from 'lucide-react'
import { DonaEstado, PanelHeader, Ranking, type SegmentoDona } from '../../components/panel/PanelWidgets'
import { PANEL } from '../../components/panel/tonos'
import { cn } from '../../lib/cn'
import { Button } from '../../components/ui/Button'
import { DataTable, CellStack } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { SelectField, TextAreaField } from '../../components/ui/FormField'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageTabs } from '../../components/ui/PageTabs'
import { MetricCard } from '../../components/ui/MetricCard'
import { MetricGrid } from '../../components/ui/Workspace'
import { Pill } from '../../components/ui/Pill'
import { SerialCell } from '../../components/ui/SerialCell'
import { formatDate } from '../../domain/dates'
import { humanizeEstado, vigenciaLabel, vigenciaTone } from '../../domain/estados'

export function estadoDealerLabel(estado: string): string {
  if (estado === 'SOLICITADA') return 'PENDIENTE'
  if (estado === 'APROBADA') return 'AUTORIZADA'
  return estado
}
import { usd } from '../../domain/money'
import { useBatteryStore } from '../../stores/batteryStore'
import { useCertificateStore } from '../../stores/certificateStore'
import { useDistributorStore } from '../../stores/distributorStore'
import { useWarrantyStore } from '../../stores/warrantyStore'
import { useUiStore } from '../../stores/uiStore'
import {
  autorizarHonraDealer,
  ejecutarReposicionDealer,
  fifoCandidatos,
  rechazarHonraDealer,
} from '../../stores/actions/honra'

type TabBandeja = 'pendientes' | 'autorizadas' | 'historial'

export function DealerAuthPage() {
  const honras = useWarrantyStore((s) => s.honras)
  const baterias = useBatteryStore((s) => s.baterias)
  const certificados = useCertificateStore((s) => s.certificados)
  const dealers = useDistributorStore((s) => s.dealers)
  const toast = useUiStore((s) => s.pushToast)

  const [tab, setTab] = useState<TabBandeja>('pendientes')
  const [q, setQ] = useState('')

  // Modales de acción
  const [autorizarId, setAutorizarId] = useState<string | null>(null)
  const [rechazoId, setRechazoId] = useState<string | null>(null)
  const [reposicionId, setReposicionId] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [reemplazo, setReemplazo] = useState('')

  const dealerDe = useCallback(
    (serial: string): string => {
      const certs = certificados.filter((c) => c.serial === serial)
      const dealerId = certs[certs.length - 1]?.dealerId ?? baterias[serial]?.ubicacionId
      return dealers.find((d) => d.id === dealerId)?.nombre ?? dealerId ?? '—'
    },
    [certificados, baterias, dealers],
  )

  const pendientes = useMemo(
    () =>
      honras
        .filter((h) => h.origen === 'dealer' && h.estado === 'SOLICITADA')
        .slice()
        .sort((a, b) => b.fechaCalculo.localeCompare(a.fechaCalculo)),
    [honras],
  )
  const autorizadas = useMemo(
    () =>
      honras
        .filter((h) => h.origen === 'dealer' && h.estado === 'APROBADA')
        .slice()
        .sort((a, b) => b.fechaCalculo.localeCompare(a.fechaCalculo)),
    [honras],
  )
  const historial = useMemo(
    () =>
      honras
        .filter((h) => h.origen === 'dealer' && h.estado !== 'SOLICITADA' && h.estado !== 'APROBADA')
        .slice()
        .sort((a, b) => b.fechaCalculo.localeCompare(a.fechaCalculo)),
    [honras],
  )

  const candidatos = reposicionId ? fifoCandidatos(reposicionId) : []

  function ejecutarAutorizacion() {
    if (!autorizarId) return
    const r = autorizarHonraDealer(autorizarId, motivo.trim() ? motivo.trim() : undefined)
    toast(r.ok ? 'Solicitud autorizada · habilitada para reposición FIFO' : r.error, r.ok ? 'ok' : 'error')
    if (r.ok) {
      setAutorizarId(null)
      setMotivo('')
    }
  }

  function rechazar() {
    if (!rechazoId) return
    if (!motivo.trim()) {
      toast('El motivo del rechazo es obligatorio.', 'warn')
      return
    }
    const r = rechazarHonraDealer(rechazoId, motivo)
    toast(r.ok ? 'Solicitud rechazada' : r.error, r.ok ? 'ok' : 'error')
    if (r.ok) {
      setRechazoId(null)
      setMotivo('')
    }
  }

  function confirmarReposicion() {
    if (!reposicionId || !reemplazo) {
      toast('Seleccione el serial de reemplazo (FIFO)', 'warn')
      return
    }
    const r = ejecutarReposicionDealer(reposicionId, reemplazo)
    toast(r.ok ? `Reposición ejecutada · serial ${r.reemplazo}` : r.error, r.ok ? 'ok' : 'error')
    if (r.ok) {
      setReposicionId(null)
      setReemplazo('')
    }
  }

  // Filtrado por buscador
  const needle = q.toLowerCase().trim()

  const pendientesFiltradas = useMemo(() => {
    if (!needle) return pendientes
    return pendientes.filter(
      (h) => h.serialOriginal.toLowerCase().includes(needle) || dealerDe(h.serialOriginal).toLowerCase().includes(needle),
    )
  }, [pendientes, needle, dealerDe])

  const autorizadasFiltradas = useMemo(() => {
    if (!needle) return autorizadas
    return autorizadas.filter(
      (h) => h.serialOriginal.toLowerCase().includes(needle) || dealerDe(h.serialOriginal).toLowerCase().includes(needle),
    )
  }, [autorizadas, needle, dealerDe])

  const historialFiltrado = useMemo(() => {
    if (!needle) return historial
    return historial.filter(
      (h) => h.serialOriginal.toLowerCase().includes(needle) || dealerDe(h.serialOriginal).toLowerCase().includes(needle),
    )
  }, [historial, needle, dealerDe])

  const delDealer = honras.filter((h) => h.origen === 'dealer')
  const ejecutadasDealer = historial.filter((h) => h.estado === 'EJECUTADA')
  const acreditadoDealer = ejecutadasDealer.reduce((a, h) => a + h.resultadoCalculo.montoAcreditar, 0)
  const porDesenlace: SegmentoDona[] = [
    { id: 'pend', label: 'Pendientes', valor: pendientes.length, tono: 'warn' },
    { id: 'aut', label: 'Autorizadas por reponer', valor: autorizadas.length, tono: 'accent' },
    { id: 'ejec', label: 'Ejecutadas', valor: ejecutadasDealer.length, tono: 'ok' },
    { id: 'rech', label: 'Rechazadas', valor: historial.filter((h) => h.estado === 'RECHAZADA').length, tono: 'danger' },
  ]
  const porDealer = (() => {
    const mapa = new Map<string, number>()
    for (const h of delDealer) {
      const n = dealerDe(h.serialOriginal)
      mapa.set(n, (mapa.get(n) ?? 0) + 1)
    }
    return [...mapa.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, valor]) => ({ id: label, label, valor }))
  })()

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeader
        title="Autorización de honras de distribuidores"
        description="Bandeja de validación técnica y comercial de reclamos de garantía reportados desde el portal de dealers. Tras autorizar, la reposición se atiende por FIFO desde el inventario central."
        tabs={
          <PageTabs
            active={tab}
            onChange={(id) => setTab(id as TabBandeja)}
            tabs={[
              {
                id: 'pendientes',
                label: 'Pendientes',
                count: pendientes.length,
                tone: pendientes.length > 0 ? 'danger' : 'default',
              },
              { id: 'autorizadas', label: 'Por reponer', count: autorizadas.length },
              { id: 'historial', label: 'Historial', count: historial.length },
            ]}
          />
        }
      />

      <MetricGrid columns={4}>
        <MetricCard
          label="Pendientes de autorización"
          value={pendientes.length}
          context="Reclamos de dealers pendientes de dictamen"
          icon={Handshake}
          tone="warn"
          filled={pendientes.length > 0}
        />
        <MetricCard
          label="Autorizadas por reponer"
          value={autorizadas.length}
          context="Aprobadas listas para asignación de serial FIFO"
          icon={PackagePlus}
          tone="accent"
        />
        <MetricCard
          label="Histórico resuelto"
          value={historial.length}
          context="Solicitudes ejecutadas o rechazadas"
          icon={CheckCircle2}
          tone="ok"
          filled={historial.length > 0}
        />
        <MetricCard
          label="Acreditado a dealers"
          value={usd(acreditadoDealer)}
          context={`En ${ejecutadasDealer.length} reposiciones ejecutadas`}
          icon={Coins}
          tone="brand"
        />
      </MetricGrid>

      <div className="grid gap-3.5 lg:grid-cols-[45fr_55fr]">
        <section className={cn(PANEL, 'min-w-0 px-4 pb-4 pt-3.5')}>
          <PanelHeader title="Solicitudes por desenlace" info="Todas las solicitudes de honra registradas por distribuidores." />
          <div className="mt-3">
            <DonaEstado segmentos={porDesenlace} unidad="solicitudes" />
          </div>
        </section>
        <section className={cn(PANEL, 'min-w-0 px-4 pb-3 pt-3.5')}>
          <PanelHeader title="Solicitudes por distribuidor" info="Punto de venta que registró cada reclamo." />
          <div className="mt-1.5">
            <Ranking filas={porDealer} total={delDealer.length} />
          </div>
        </section>
      </div>

        {/* Bandeja: pendientes de autorización */}
        {tab === 'pendientes' && (
          <DataTable
            title="Pendientes de autorización"
            fill={false}
            search={{ value: q, onChange: setQ, placeholder: 'Buscar por serial o dealer…' }}
            columns={[
              {
                key: 'serial',
                header: 'Serial reclamado',
                primary: true,
                width: '160px',
                sortable: true,
                render: (h) => <SerialCell serial={h.serialOriginal} />,
              },
              {
                key: 'dealer',
                header: 'Distribuidor solicitante',
                sortable: true,
                render: (h) => {
                  const nombre = dealerDe(h.serialOriginal)
                  return <CellStack primary={nombre} secondary="Portal dealer" />
                },
              },
              {
                key: 'dx',
                header: 'Diagnóstico técnico',
                width: '160px',
                render: (h) => {
                  const b = baterias[h.serialOriginal]
                  return b ? <StatusBadge catalogId={b.diagnosticoId} /> : <span className="text-ink-disabled">—</span>
                },
              },
              {
                key: 'vigencia',
                header: 'Vigencia póliza',
                width: '140px',
                sortable: true,
                sortValue: (h) => h.decisionVigencia,
                render: (h) => (
                  <Pill tone={vigenciaTone(h.decisionVigencia)}>
                    {vigenciaLabel(h.decisionVigencia)}
                  </Pill>
                ),
              },
              {
                key: 'usd',
                header: 'Cobro a cliente',
                align: 'right',
                width: '130px',
                sortable: true,
                sortValue: (h) => h.resultadoCalculo.montoCliente,
                render: (h) => <span className="tabular-nums font-semibold text-ink">{usd(h.resultadoCalculo.montoCliente)}</span>,
              },
              {
                key: 'fecha',
                header: 'Solicitud',
                width: '120px',
                sortable: true,
                sortValue: (h) => h.fechaCalculo,
                render: (h) => formatDate(h.fechaCalculo),
              },
              {
                key: 'acciones',
                header: 'Decisión',
                align: 'right',
                width: '180px',
                render: (h) => (
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="primary"
                      leadingIcon={<Check size={13} />}
                      onClick={() => {
                        setAutorizarId(h.id)
                        setMotivo('')
                      }}
                    >
                      Autorizar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      leadingIcon={<X size={13} />}
                      onClick={() => {
                        setRechazoId(h.id)
                        setMotivo('')
                      }}
                    >
                      Rechazar
                    </Button>
                  </div>
                ),
              },
            ]}
            rows={pendientesFiltradas}
            rowKey={(h) => h.id}
            emptyTitle="Sin solicitudes pendientes"
            emptyDescription="No hay reclamos de distribuidores pendientes de aprobación en este momento."
          />
        )}

        {/* Autorizadas, a la espera de serial de reemplazo */}
        {tab === 'autorizadas' && (
          <DataTable
            title="Autorizadas por reponer"
            fill={false}
            search={{ value: q, onChange: setQ, placeholder: 'Buscar por serial o dealer…' }}
            columns={[
              {
                key: 'serial',
                header: 'Serial autorizado',
                primary: true,
                width: '160px',
                sortable: true,
                render: (h) => <SerialCell serial={h.serialOriginal} />,
              },
              {
                key: 'dealer',
                header: 'Distribuidor destino',
                sortable: true,
                render: (h) => dealerDe(h.serialOriginal),
              },
              {
                key: 'estado',
                header: 'Estado de honra',
                width: '150px',
                render: () => (
                  <Pill tone="info" dot>
                    Autorizada (FIFO)
                  </Pill>
                ),
              },
              {
                key: 'fecha',
                header: 'Fecha autorización',
                width: '140px',
                sortable: true,
                sortValue: (h) => h.fechaCalculo,
                render: (h) => formatDate(h.fechaCalculo),
              },
              {
                key: 'acciones',
                header: 'Reposición',
                align: 'right',
                width: '160px',
                render: (h) => (
                  <Button
                    size="sm"
                    variant="primary"
                    leadingIcon={<PackagePlus size={13} />}
                    onClick={() => {
                      setReposicionId(h.id)
                      setReemplazo('')
                    }}
                  >
                    Reponer (FIFO)
                  </Button>
                ),
              },
            ]}
            rows={autorizadasFiltradas}
            rowKey={(h) => h.id}
            emptyTitle="Sin reposiciones pendientes"
            emptyDescription="Todas las honras autorizadas ya tienen asignado su serial de reemplazo."
          />
        )}

        {/* Historial de solicitudes ya resueltas */}
        {tab === 'historial' && (
          <DataTable
            title="Historial de solicitudes"
            fill={false}
            search={{ value: q, onChange: setQ, placeholder: 'Buscar en historial…' }}
            columns={[
              {
                key: 'serial',
                header: 'Serial original',
                primary: true,
                width: '160px',
                sortable: true,
                render: (h) => <SerialCell serial={h.serialOriginal} />,
              },
              {
                key: 'estado',
                header: 'Dictamen final',
                width: '140px',
                sortable: true,
                render: (h) => {
                  const est = estadoDealerLabel(h.estado)
                  return (
                    <Pill tone={h.estado === 'EJECUTADA' ? 'ok' : 'danger'} dot>
                      {humanizeEstado(est)}
                    </Pill>
                  )
                },
              },
              {
                key: 'reemplazo',
                header: 'Serial de reposición',
                width: '170px',
                render: (h) =>
                  h.serialReemplazo ? (
                    <SerialCell serial={h.serialReemplazo} />
                  ) : (
                    <span className="text-ink-disabled">—</span>
                  ),
              },
              {
                key: 'motivo',
                header: 'Motivo / Nota',
                render: (h) => (
                  <span className="truncate text-body-sm text-ink-secondary">
                    {h.resultadoCalculo.motivoRechazo ?? '—'}
                  </span>
                ),
              },
              {
                key: 'fecha',
                header: 'Fecha resolución',
                align: 'right',
                width: '130px',
                sortable: true,
                sortValue: (h) => h.fechaCalculo,
                render: (h) => formatDate(h.fechaCalculo),
              },
            ]}
            rows={historialFiltrado}
            rowKey={(h) => h.id}
            emptyTitle="Sin historial"
            emptyDescription="Las solicitudes decididas y resueltas aparecerán en esta lista."
          />
        )}

      {/* Modal: Confirmación de Autorización con nota */}
      <Modal
        open={autorizarId !== null}
        title="Autorizar solicitud de garantía de dealer"
        icon={ShieldCheck}
        tone="ok"
        onClose={() => setAutorizarId(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAutorizarId(null)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={ejecutarAutorizacion}>
              Confirmar autorización
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-body-sm text-ink-secondary">
            Al autorizar esta solicitud, el sistema habilitará el despacho de un serial sustituto desde el stock central Viamar bajo la regla FIFO (más antiguo primero).
          </p>
          <TextAreaField
            label="Nota de autorización (opcional, queda registrada en la bitácora)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Aprobado según reporte de chequeo #..."
          />
        </div>
      </Modal>

      {/* Modal: Rechazo con Motivo Obligatorio */}
      <Modal
        open={rechazoId !== null}
        title="Rechazar solicitud de garantía"
        icon={ShieldX}
        tone="danger"
        onClose={() => setRechazoId(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRechazoId(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={rechazar}>
              Rechazar solicitud
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-body-sm text-ink-secondary">
            Indica claramente el motivo del rechazo para que el distribuidor y el cliente final tengan trazabilidad del dictamen.
          </p>
          <TextAreaField
            label="Motivo del rechazo (obligatorio)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Batería fuera de plazo de garantía contractual..."
          />
        </div>
      </Modal>

      {/* Modal: Asignación FIFO de Reposición */}
      <Modal
        open={reposicionId !== null}
        title="Reposición FIFO desde inventario central Viamar"
        icon={PackagePlus}
        onClose={() => setReposicionId(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReposicionId(null)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={confirmarReposicion} disabled={!reemplazo}>
              Confirmar reposición
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-body-sm text-ink-secondary">
            El motor de inventario selecciona los seriales disponibles del mismo artículo ordenados por fecha de ingreso (el más antiguo primero).
          </p>
          <SelectField
            label="Serial de reemplazo (mismo artículo, FIFO)"
            value={reemplazo}
            onChange={(e) => setReemplazo(e.target.value)}
          >
            <option value="">Seleccione serial…</option>
            {candidatos.map((b, i) => (
              <option key={b.serial} value={b.serial}>
                {b.serial} · ingreso {b.fechaIngreso.slice(0, 10)}{i === 0 ? ' · RECOMENDADO FIFO' : ''}
              </option>
            ))}
          </SelectField>
          {candidatos.length === 0 ? (
            <p className="rounded-lg border border-critical-border/60 bg-critical-soft/70 px-3 py-2 text-body-sm text-critical-text">
              No hay stock central disponible de este artículo para reposición inmediata.
            </p>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}
