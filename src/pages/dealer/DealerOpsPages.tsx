import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  Clock,
  FileX2,
  Handshake,
  Package,
  Send,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react'
import { MetricCard } from '../../components/ui/MetricCard'
import { SectionCard } from '../../components/ui/SectionCard'
import { MetricGrid } from '../../components/ui/Workspace'
import { cn } from '../../lib/cn'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { FormField, SelectField } from '../../components/ui/FormField'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pill } from '../../components/ui/Pill'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Timeline } from '../../components/ui/Timeline'
import { SerialCell } from '../../components/ui/SerialCell'
import { EVENT_LABEL } from '../../domain/catalogs'
import { formatDate, iso, addMonths } from '../../domain/dates'
import { humanizeEstado, vigenciaLabel, vigenciaTone } from '../../domain/estados'
import { usd } from '../../domain/money'
import { useAuthStore } from '../../stores/authStore'
import { useBatteryStore } from '../../stores/batteryStore'
import { useCertificateStore } from '../../stores/certificateStore'
import { useDistributorStore } from '../../stores/distributorStore'
import { useWarrantyStore } from '../../stores/warrantyStore'
import { useHistoryStore, withHistory } from '../../stores/historyStore'
import { estadoDealerLabel } from '../honras/DealerAuthPage'
import { solicitarHonraDealer } from '../../stores/actions/honra'
import { useUiStore } from '../../stores/uiStore'
import { useVisibleBatteries } from '../../hooks/useVisibleBatteries'

// =============================================================================
// 1. REPORTAR VENTA (DEALER)
// =============================================================================

export function DealerSellPage() {
  const user = useAuthStore((s) => s.usuarioActual)
  const stock = useVisibleBatteries().filter((b) => b.ubicacionTipo === 'DEALER')
  const articulos = useBatteryStore((s) => s.articulos)
  const marcas = useBatteryStore((s) => s.marcas)
  const clientes = useDistributorStore((s) => s.clientes)
  const upsertCert = useCertificateStore((s) => s.upsert)
  const patch = useBatteryStore((s) => s.patchBattery)
  const toast = useUiStore((s) => s.pushToast)

  const [serial, setSerial] = useState(stock[0]?.serial ?? '')
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? '')

  const bateriaSel = stock.find((b) => b.serial === serial)
  const artSel = bateriaSel ? articulos.find((a) => a.id === bateriaSel.articuloId) : undefined
  const marcaSel = artSel ? marcas.find((m) => m.id === artSel.marcaId) : undefined
  const clienteSel = clientes.find((c) => c.id === clienteId)

  function vender() {
    const b = stock.find((x) => x.serial === serial)
    if (!b || !user?.dealerId) {
      toast('Seleccione un serial de su inventario disponible', 'warn')
      return
    }
    const now = new Date()
    patch(serial, { ubicacionTipo: 'CLIENTE', ubicacionId: clienteId })
    upsertCert({
      id: `cert-${serial}-${Date.now()}`,
      serial,
      clienteId,
      dealerId: user.dealerId,
      facturaNcf: `B01${String(Date.now()).slice(-8)}`,
      fechaVenta: iso(now),
      fechaActivacion: iso(now),
      fechaFinFull: iso(addMonths(now, 12)),
      fechaFinProrrateo: iso(addMonths(now, 24)),
      estado: 'E',
      vehiculo: { marca: 'KIA', modelo: 'Rio', anio: 2021 },
      tipoUsoId: 'AUTOMOVIL',
    })
    withHistory(serial, 'VENTA_CLIENTE', 'Venta reportada por el dealer', () => undefined, {
      estadoNuevo: 'CLIENTE',
    })
    withHistory(serial, 'CERTIFICADO', 'CERT-E emitido', () => undefined, { estadoNuevo: 'E' })
    toast('Venta registrada y certificado digital emitido con éxito', 'ok')
  }

  const certsMios = useCertificateStore((s) => s.certificados).filter((c) => c.dealerId === user?.dealerId)

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeader
        breadcrumbs={[
          { label: 'Portal distribuidor', to: '/dealer' },
          { label: 'Reportar venta' },
        ]}
        title="Reportar venta de batería"
        description="Emisión del certificado de garantía digital para el cliente final al momento de la venta en mostrador."
      />

      <MetricGrid columns={3}>
        <MetricCard label="Unidades en su inventario" value={stock.length} icon={Package} tone="brand" context="Disponibles para la venta" />
        <MetricCard
          label="Certificados emitidos"
          value={certsMios.length}
          icon={BadgeCheck}
          tone="ok"
          context={`${certsMios.filter((c) => c.estado === 'E').length} vigentes`}
        />
        <MetricCard label="Clientes registrados" value={clientes.length} icon={UserRound} tone="accent" context="Receptores posibles del certificado" />
      </MetricGrid>

      <div className="grid items-start gap-3.5 md:grid-cols-3">
        {/* Formulario */}
        <SectionCard
          title="Datos de la transacción"
          description="La venta activa la garantía digital desde hoy."
          icon={<Store />}
          className="md:col-span-2"
          bodyClassName="flex flex-col gap-3.5"
        >

          <SelectField
            label="Batería en inventario local"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
          >
            {stock.map((b) => (
              <option key={b.serial} value={b.serial}>
                {b.serial} · {articulos.find((a) => a.id === b.articuloId)?.descripcion ?? b.articuloId}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Cliente final receptor"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
          >
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} · {c.documento}
              </option>
            ))}
          </SelectField>

          <div className="pt-2 flex items-center gap-2">
            <Button onClick={vender} disabled={stock.length === 0} leadingIcon={<BadgeCheck size={15} />}>
              Emitir certificado digital
            </Button>
            {stock.length === 0 && (
              <span className="text-body-xs text-critical">No posee unidades en inventario para vender.</span>
            )}
          </div>
        </SectionCard>

        {/* Resumen lateral de la batería */}
        <SectionCard title="Ficha de la unidad" icon={<Package />}>
          {bateriaSel ? (
            <div className="flex flex-col gap-2.5 text-body-sm">
              <div>
                <span className="text-body-xs text-ink-tertiary block">Serial</span>
                <SerialCell serial={bateriaSel.serial} />
              </div>
              <div>
                <span className="text-body-xs text-ink-tertiary block">Artículo / Marca</span>
                <span className="text-ink font-medium">{artSel?.codigo ?? bateriaSel.articuloId}</span>
                {marcaSel ? <span className="block text-body-xs text-ink-secondary">{marcaSel.nombre}</span> : null}
              </div>
              <div>
                <span className="text-body-xs text-ink-tertiary block">Capacidad nominal</span>
                <span className="text-ink font-medium">{artSel?.capacidadNominal ?? '—'} CCA</span>
              </div>
              <div className="border-t border-line-subtle pt-2">
                <span className="text-body-xs text-ink-tertiary block">Cliente seleccionado</span>
                <span className="text-ink font-medium">{clienteSel?.nombre ?? '—'}</span>
                <span className="block text-body-xs text-ink-secondary">{clienteSel?.documento}</span>
              </div>
            </div>
          ) : (
            <p className="text-body-xs text-ink-disabled">Seleccione un serial para previsualizar especificaciones.</p>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

// =============================================================================
// 2. HONRA PILOTO (DEALER) — LAYOUT MASTER/DETAIL
// =============================================================================

export function DealerHonraPage() {
  const visibles = useVisibleBatteries()
  const vendidas = visibles.filter((b) => b.ubicacionTipo === 'CLIENTE')
  const honras = useWarrantyStore((s) => s.honras)
  const eventos = useHistoryStore((s) => s.eventos)
  const certificados = useCertificateStore((s) => s.certificados)
  const mine = useMemo(
    () => honras.filter((h) => visibles.some((b) => b.serial === h.serialOriginal)),
    [honras, visibles],
  )
  const toast = useUiStore((s) => s.pushToast)

  const [serial, setSerial] = useState(vendidas[0]?.serial ?? '')
  const [capacidad, setCapacidad] = useState('80')
  const [detalleId, setDetalleId] = useState(mine[0]?.id ?? '')

  const detalle = mine.find((h) => h.id === detalleId) ?? mine[0]
  const traza = detalle
    ? eventos
        .filter((e) => e.serial === detalle.serialOriginal || e.serial === detalle.serialReemplazo)
        .slice()
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
    : []
  const certOriginal = detalle
    ? certificados.filter((c) => c.serial === detalle.serialOriginal).slice(-1)[0]
    : undefined

  function solicitar() {
    const r = solicitarHonraDealer(serial, Number(capacidad) || 80)
    toast(r.ok ? 'Solicitud de honra enviada a Garantías' : r.error, r.ok ? 'ok' : 'error')
    if (r.ok && mine.length > 0) {
      setDetalleId(mine[0].id)
    }
  }

  const ejecutadas = mine.filter((h) => h.estado === 'EJECUTADA').length
  const enCurso = mine.filter((h) => h.estado === 'SOLICITADA' || h.estado === 'APROBADA').length
  const rechazadas = mine.filter((h) => h.estado === 'RECHAZADA').length

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeader
        breadcrumbs={[
          { label: 'Portal distribuidor', to: '/dealer' },
          { label: 'Mis honras de garantía' },
        ]}
        title="Solicitud y seguimiento de honras"
        description="Reporte de reclamos de garantía para baterías comercializadas a clientes y seguimiento de resoluciones y reposiciones de fábrica."
      />

      <MetricGrid columns={4}>
        <MetricCard label="Solicitudes" value={mine.length} icon={Handshake} tone="brand" context="Reclamos registrados por su punto" />
        <MetricCard label="En curso" value={enCurso} icon={Clock} tone="accent" context="Pendientes o por reponer" />
        <MetricCard label="Ejecutadas" value={ejecutadas} icon={ShieldCheck} tone="ok" filled={ejecutadas > 0} context="Con serial de reposición asignado" />
        <MetricCard label="Rechazadas" value={rechazadas} icon={FileX2} tone="danger" filled={rechazadas > 0} context="Con motivo de rechazo" />
      </MetricGrid>

      {/* Formulario compacto para nueva solicitud */}
      <SectionCard
        title="Nueva solicitud de garantía"
        description="Seleccione una batería vendida y la capacidad medida en mostrador."
        icon={<Handshake />}
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <SelectField
              label="Serial vendido a cliente"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
            >
              {vendidas.map((b) => (
                <option key={b.serial} value={b.serial}>
                  {b.serial}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="w-32">
            <FormField
              label="CCA medido (%)"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <Button onClick={solicitar} leadingIcon={<Send size={14} />}>
            Solicitar honra
          </Button>
        </div>
      </SectionCard>

      {/* Master / Detail Split Layout */}
      <div className="grid items-start gap-3.5 lg:grid-cols-12">
        {/* Columna Izquierda: Master List (7 cols) */}
        <div className="min-h-0 flex flex-col lg:col-span-7">
          <DataTable
            fill={false}
            title="Mis solicitudes registradas"
            columns={[
              {
                key: 'serialOriginal',
                header: 'Serial',
                primary: true,
                sortable: true,
                width: '150px',
                render: (h) => <SerialCell serial={h.serialOriginal} />,
              },
              {
                key: 'estado',
                header: 'Estado',
                width: '130px',
                sortable: true,
                render: (h) => {
                  const est = estadoDealerLabel(h.estado)
                  return (
                    <Pill tone={h.estado === 'EJECUTADA' || h.estado === 'APROBADA' ? 'ok' : h.estado === 'RECHAZADA' ? 'danger' : 'warn'} dot>
                      {humanizeEstado(est)}
                    </Pill>
                  )
                },
              },
              {
                key: 'decisionVigencia',
                header: 'Vigencia',
                width: '120px',
                render: (h) => (
                  <Pill tone={vigenciaTone(h.decisionVigencia)}>
                    {vigenciaLabel(h.decisionVigencia)}
                  </Pill>
                ),
              },
              {
                key: 'reemplazo',
                header: 'Serial sustituto',
                render: (h) =>
                  h.serialReemplazo ? (
                    <SerialCell serial={h.serialReemplazo} />
                  ) : (
                    <span className="text-ink-disabled">—</span>
                  ),
              },
              {
                key: 'fecha',
                header: 'Fecha',
                align: 'right',
                width: '110px',
                render: (h) => formatDate(h.fechaCalculo),
              },
            ]}
            rows={mine}
            rowKey={(h) => h.id}
            isRowActive={(h) => (detalle ? h.id === detalle.id : false)}
            onRowClick={(h) => setDetalleId(h.id)}
            emptyTitle="Sin solicitudes"
            emptyDescription="Aún no ha reportado solicitudes de garantía para sus clientes."
          />
        </div>

        {/* Columna Derecha: Detail Panel con Timeline (5 cols) */}
        <div className="min-h-0 flex flex-col lg:col-span-5">
          {detalle ? (
            <section className="surface flex min-h-0 flex-1 flex-col overflow-hidden">
              <header className="shrink-0 border-b border-line-subtle bg-gradient-to-br from-white to-viamar-50/70 px-4 pb-3 pt-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SerialCell serial={detalle.serialOriginal} className="text-label-lg font-bold" />
                    <Pill tone={detalle.estado === 'EJECUTADA' || detalle.estado === 'APROBADA' ? 'ok' : detalle.estado === 'RECHAZADA' ? 'danger' : 'warn'} dot>
                      {humanizeEstado(estadoDealerLabel(detalle.estado))}
                    </Pill>
                  </div>
                  <span className="text-body-xs text-ink-tertiary">
                    {formatDate(detalle.fechaCalculo)}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5 text-body-xs">
                  <div>
                    <span className="text-ink-tertiary block">Vigencia póliza</span>
                    <span className="text-ink font-semibold">{vigenciaLabel(detalle.decisionVigencia)}</span>
                  </div>
                  <div>
                    <span className="text-ink-tertiary block">Copago cliente</span>
                    <span className="text-ink font-semibold">{usd(detalle.resultadoCalculo.montoCliente)}</span>
                  </div>
                  {detalle.serialReemplazo && (
                    <div className="col-span-2">
                      <span className="text-ink-tertiary block">Serial de reposición asignado</span>
                      <SerialCell serial={detalle.serialReemplazo} />
                    </div>
                  )}
                  {detalle.resultadoCalculo.motivoRechazo && (
                    <div className="col-span-2 text-critical">
                      <span className="block text-ink-tertiary">Motivo de rechazo</span>
                      <span>{detalle.resultadoCalculo.motivoRechazo}</span>
                    </div>
                  )}
                  {certOriginal && (
                    <div className="col-span-2 text-ink-secondary">
                      Certificado original: <strong className="text-ink">{certOriginal.estado === 'C' ? 'Cancelado (C)' : 'Vigente (E)'}</strong>
                    </div>
                  )}
                </div>
              </header>

              <div className="scroll-slim max-h-[560px] min-h-0 flex-1 overflow-y-auto px-4 py-3.5">
                <h3 className="mb-3 text-headline-sm text-ink">
                  Línea de tiempo de eventos
                </h3>
                <Timeline
                  numbered={false}
                  events={traza.map((e) => ({
                    id: e.id,
                    title: EVENT_LABEL[e.tipo] ?? e.tipo,
                    description: e.descripcion,
                    date: formatDate(e.fecha),
                    origenId: e.origen,
                  }))}
                />
              </div>
            </section>
          ) : (
            <div className={cn('surface flex min-h-[240px] flex-1 items-center justify-center p-6 text-center')}>
              <p className="text-body-sm text-ink-tertiary">
                Seleccione una solicitud para inspeccionar su trazabilidad detallada.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// 3. MIS CERTIFICADOS (DEALER)
// =============================================================================

export function DealerCertsPage() {
  const user = useAuthStore((s) => s.usuarioActual)
  const certificados = useCertificateStore((s) => s.certificados)
  const [q, setQ] = useState('')

  const mine = useMemo(
    () => certificados.filter((c) => c.dealerId === user?.dealerId),
    [certificados, user?.dealerId],
  )

  const vigentes = mine.filter((c) => c.estado === 'E').length
  const cancelados = mine.filter((c) => c.estado === 'C').length

  const filtered = useMemo(() => {
    if (!q) return mine
    const needle = q.toLowerCase()
    return mine.filter(
      (c) => c.serial.toLowerCase().includes(needle) || c.facturaNcf.toLowerCase().includes(needle),
    )
  }, [mine, q])

  return (
    <div className="page-fill">
      <PageHeader
        breadcrumbs={[
          { label: 'Portal distribuidor', to: '/dealer' },
          { label: 'Mis certificados' },
        ]}
        title="Certificados emitidos"
        description="Garantías digitales activadas en mostrador para los clientes de su punto de venta."
      />

      <MetricGrid columns={3}>
        <MetricCard label="Certificados totales" value={mine.length} icon={BadgeCheck} tone="brand" context="Emitidos en su punto de venta" />
        <MetricCard label="Vigentes (CERT-E)" value={vigentes} icon={ShieldCheck} tone="ok" filled={vigentes > 0} context="Garantía activa del cliente" />
        <MetricCard
          label="Cancelados (CERT-C)"
          value={cancelados}
          icon={FileX2}
          tone="danger"
          filled={cancelados > 0}
          context="Bloquean la honra del serial"
        />
      </MetricGrid>

      <DataTable
        title="Mis certificados"
        search={{ value: q, onChange: setQ, placeholder: 'Buscar por serial o NCF…' }}
        columns={[
          {
            key: 'serial',
            header: 'Serial',
            primary: true,
            sortable: true,
            width: '160px',
            render: (c) => <SerialCell serial={c.serial} />,
          },
          {
            key: 'estado',
            header: 'Estado certificado',
            width: '150px',
            sortable: true,
            render: (c) => <StatusBadge catalogId={c.estado} />,
          },
          {
            key: 'ncf',
            header: 'Factura / NCF',
            sortable: true,
            render: (c) => <span className="tabular-nums font-medium text-ink">{c.facturaNcf}</span>,
          },
          {
            key: 'venta',
            header: 'Fecha venta',
            width: '130px',
            sortable: true,
            sortValue: (c) => c.fechaVenta,
            render: (c) => formatDate(c.fechaVenta),
          },
          {
            key: 'vencimiento',
            header: 'Fin período full',
            width: '130px',
            sortable: true,
            sortValue: (c) => c.fechaFinFull,
            render: (c) => formatDate(c.fechaFinFull),
          },
        ]}
        rows={filtered}
        rowKey={(c) => c.id}
        emptyTitle="Sin certificados emitidos"
        emptyDescription="Aún no ha emitido certificados digitales en este punto de venta."
      />
    </div>
  )
}

export function DealerHonraNuevaPage() {
  return <DealerHonraPage />
}
