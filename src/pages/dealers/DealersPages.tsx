import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  PackageSearch,
  Warehouse,
  XCircle,
} from 'lucide-react'
import { DataTable, CellStack } from '../../components/ui/DataTable'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { MetricCard } from '../../components/ui/MetricCard'
import { MetricGrid } from '../../components/ui/Workspace'
import { Pill, type PillTone } from '../../components/ui/Pill'
import { SerialCell } from '../../components/ui/SerialCell'
import { StackBar } from '../../components/ui/StackBar'
import { SegmentedControl } from '../../components/ui/FilterBar'
import { formatDate, iso } from '../../domain/dates'
import type { DealerPerfil } from '../../domain/entities'
import { useBatteryStore } from '../../stores/batteryStore'
import { useChargingStore } from '../../stores/chargingStore'
import { useDistributorStore } from '../../stores/distributorStore'
import { useInspectionStore } from '../../stores/inspectionStore'
import { withHistory } from '../../stores/historyStore'
import { useUiStore } from '../../stores/uiStore'
import { cn } from '../../lib/cn'

export const AGE_LIMIT_DAYS = 180

export function ageDays(fechaIngreso: string): number {
  const ms = Date.now() - new Date(fechaIngreso).getTime()
  return Math.max(0, Math.floor(ms / 86_400_000))
}

const PERFIL_TONE: Record<DealerPerfil, PillTone> = {
  envejecido: 'warn',
  impecable: 'ok',
  incidencias: 'danger',
  normal: 'neutral',
}

const PERFIL_LABEL: Record<DealerPerfil, string> = {
  envejecido: 'Envejecido',
  impecable: 'Impecable',
  incidencias: 'Incidencias',
  normal: 'Estándar',
}

export function PerfilBadge({ perfil }: { perfil: DealerPerfil }) {
  const tone = PERFIL_TONE[perfil] ?? 'neutral'
  const label = PERFIL_LABEL[perfil] ?? perfil
  return (
    <Pill tone={tone} dot>
      {label}
    </Pill>
  )
}

const INCIDENCIA_DIAG = new Set(['DESCARGADA', 'DANADA', 'PARA_GARANTIA'])

// =============================================================================
// LISTA GENERAL DE DISTRIBUIDORES
// =============================================================================

export function DealersListPage() {
  const dealers = useDistributorStore((s) => s.dealers)
  const baterias = useBatteryStore((s) => s.baterias)
  const [q, setQ] = useState('')

  const rows = useMemo(
    () =>
      dealers.map((d) => {
        const inv = Object.values(baterias).filter(
          (b) => b.ubicacionTipo === 'DEALER' && b.ubicacionId === d.id,
        )
        const aged = inv.filter((b) => ageDays(b.fechaIngreso) > AGE_LIMIT_DAYS).length
        const incidencias = inv.filter((b) => INCIDENCIA_DIAG.has(b.diagnosticoId)).length
        return { ...d, stock: inv.length, aged, incidencias }
      }),
    [dealers, baterias],
  )

  const totalStock = useMemo(() => rows.reduce((acc, r) => acc + r.stock, 0), [rows])
  const totalAged = useMemo(() => rows.reduce((acc, r) => acc + r.aged, 0), [rows])
  const totalIncidencias = useMemo(() => rows.reduce((acc, r) => acc + r.incidencias, 0), [rows])
  const impecables = rows.filter((r) => r.perfil === 'impecable').length

  const filtered = useMemo(() => {
    if (!q) return rows
    const needle = q.toLowerCase()
    return rows.filter(
      (r) =>
        r.nombre.toLowerCase().includes(needle) ||
        r.localidad.toLowerCase().includes(needle) ||
        r.rnc.toLowerCase().includes(needle),
    )
  }, [rows, q])

  return (
    <div className="page-fill">
      <PageHeader
        title="Red de distribuidores y dealers"
        description="Supervisión de inventario en consignación, control de rotación FIFO, salud del stock y baterías envejecidas en puntos de venta."
      />

      <MetricGrid columns={4}>
        <MetricCard
          label="Stock en distribuidores"
          value={totalStock}
          icon={Warehouse}
          tone="brand"
          context={`Repartido en ${dealers.length} puntos de venta`}
        />
        <MetricCard
          label="Baterías envejecidas"
          value={totalAged}
          icon={Clock}
          tone="warn"
          filled={totalAged > 0}
          context={
            totalStock
              ? `${Math.round((totalAged / totalStock) * 100)}% del stock · más de ${AGE_LIMIT_DAYS} días`
              : `Más de ${AGE_LIMIT_DAYS} días sin rotación`
          }
        />
        <MetricCard
          label="Con incidencias"
          value={totalIncidencias}
          icon={AlertTriangle}
          tone="danger"
          filled={totalIncidencias > 0}
          context="Descargadas, dañadas o para garantía"
        />
        <MetricCard
          label="Distribuidores impecables"
          value={`${impecables} / ${dealers.length}`}
          icon={CheckCircle2}
          tone="ok"
          filled={impecables > 0}
          context="Rotación al día, sin incidencias"
        />
      </MetricGrid>

      <DataTable
        title="Stock por dealer"
        icon={<Warehouse size={15} />}
        density="compact"
        search={{ value: q, onChange: setQ, placeholder: 'Filtrar por dealer, RNC o localidad…' }}
        columns={[
          {
            key: 'nombre',
            header: 'Distribuidor / Dealer',
            primary: true,
            sortable: true,
            render: (d) => (
              <Link
                className="block truncate text-viamar-700 font-semibold underline-offset-2 hover:text-viamar-500 hover:underline"
                to={`/distribuidores/${d.id}`}
                title={d.nombre}
              >
                {d.nombre}
              </Link>
            ),
          },
          {
            key: 'localidad',
            header: 'Localidad / RNC',
            sortable: true,
            render: (d) => <CellStack primary={d.localidad} secondary={`RNC ${d.rnc}`} />,
          },
          {
            key: 'perfil',
            header: 'Perfil de rotación',
            width: '140px',
            sortable: true,
            sortValue: (d) => d.perfil,
            render: (d) => <PerfilBadge perfil={d.perfil} />,
          },
          {
            /* Composición del stock del punto: cuánto está en regla, cuánto
               envejecido y cuánto con incidencia. Responde «¿cómo está este
               dealer?» antes de que haya que comparar tres columnas de cifras. */
            key: 'salud',
            header: 'Composición del stock',
            width: '170px',
            render: (d) => {
              const sano = Math.max(0, d.stock - d.aged - d.incidencias)
              return (
                <StackBar
                  total={d.stock}
                  segments={[
                    { label: 'En regla', value: sano, tone: 'ok' },
                    { label: `Envejecido (>${AGE_LIMIT_DAYS}d)`, value: d.aged, tone: 'warn' },
                    { label: 'Con incidencia', value: d.incidencias, tone: 'danger' },
                  ]}
                />
              )
            },
          },
          {
            key: 'stock',
            header: 'Stock actual',
            align: 'right',
            width: '110px',
            sortable: true,
            sortValue: (d) => d.stock,
            render: (d) => <span className="tabular-nums font-semibold text-ink">{d.stock}</span>,
          },
          {
            key: 'aged',
            header: `Envejecido (>180d)`,
            align: 'right',
            width: '140px',
            secondary: true,
            sortable: true,
            sortValue: (d) => d.aged,
            render: (d) => (
              <span
                className={cn(
                  'tabular-nums font-medium',
                  d.aged > 0 ? 'text-warning-text font-bold' : 'text-ink-tertiary',
                )}
              >
                {d.aged}
              </span>
            ),
          },
          {
            key: 'incidencias',
            header: 'Incidencias',
            align: 'right',
            width: '110px',
            secondary: true,
            sortable: true,
            sortValue: (d) => d.incidencias,
            render: (d) => (
              <span
                className={cn(
                  'tabular-nums font-medium',
                  d.incidencias > 0 ? 'text-critical-text font-bold' : 'text-ink-tertiary',
                )}
              >
                {d.incidencias}
              </span>
            ),
          },
          {
            key: 'visita',
            header: 'Última visita',
            align: 'right',
            width: '120px',
            sortable: true,
            sortValue: (d) => d.ultimaVisita ?? '',
            render: (d) => (d.ultimaVisita ? formatDate(d.ultimaVisita) : '—'),
          },
        ]}
        rows={filtered}
        rowKey={(d) => d.id}
        rowTone={(d) => (d.aged > 0 ? 'warn' : d.incidencias > 0 ? 'danger' : 'default')}
        emptyTitle="Sin distribuidores coincidentes"
        emptyDescription="No se encontraron dealers que coincidan con la búsqueda."
      />
    </div>
  )
}

// =============================================================================
// DETALLE DE INVENTARIO Y SANEAMIENTO POR DEALER
// =============================================================================

type TabFiltroInventario = 'todos' | 'aged' | 'normal'

export function DealerDetailPage() {
  const { id = '' } = useParams()
  const dealer = useDistributorStore((s) => s.dealers.find((d) => d.id === id))
  const baterias = useBatteryStore((s) => s.baterias)
  const articulos = useBatteryStore((s) => s.articulos)
  const marcas = useBatteryStore((s) => s.marcas)
  const solicitudes = useInspectionStore((s) => s.solicitudes)
  const addSolicitud = useInspectionStore((s) => s.addSolicitud)
  const centros = useChargingStore((s) => s.centros)
  const toast = useUiStore((s) => s.pushToast)
  const ask = useUiStore((s) => s.askConfirm)

  const [tab, setTab] = useState<TabFiltroInventario>('todos')
  const [q, setQ] = useState('')

  const inv = useMemo(
    () =>
      Object.values(baterias)
        .filter((b) => b.ubicacionTipo === 'DEALER' && b.ubicacionId === id)
        .map((b) => ({ ...b, edad: ageDays(b.fechaIngreso) }))
        .sort((a, b) => b.edad - a.edad),
    [baterias, id],
  )

  const agedCount = inv.filter((b) => b.edad > AGE_LIMIT_DAYS).length

  const filteredInv = useMemo(() => {
    return inv.filter((b) => {
      const matchTab =
        tab === 'todos' ||
        (tab === 'aged' && b.edad > AGE_LIMIT_DAYS) ||
        (tab === 'normal' && b.edad <= AGE_LIMIT_DAYS)
      const matchQ = !q || b.serial.toLowerCase().includes(q.toLowerCase())
      return matchTab && matchQ
    })
  }, [inv, tab, q])

  if (!dealer) {
    return (
      <EmptyState
        framed
        kind="no-results"
        title="Distribuidor no encontrado"
        description="El dealer solicitado no existe en los registros maestros."
        action={
          <Link to="/distribuidores">
            <Button variant="secondary">Volver a distribuidores</Button>
          </Link>
        }
      />
    )
  }

  async function marcarVerificado(serial: string) {
    const ok = await ask({
      title: 'Confirmar existencia física',
      message: `Marcar serial ${serial} como existencia verificada en el punto de ${dealer!.nombre}. Quedará registrado en la bitácora inmutable.`,
      confirmLabel: 'Marcar verificado',
    })
    if (!ok) return
    withHistory(
      serial,
      'CHEQUEO',
      `Saneamiento: existencia física verificada en dealer ${dealer!.nombre}`,
      () => undefined,
      { estadoNuevo: 'DEALER' },
    )
    toast(`Serial ${serial} verificado correctamente`, 'ok')
  }

  async function reportarFaltante(serial: string) {
    const ok = await ask({
      title: 'Reportar faltante de inventario',
      message: `La unidad ${serial} no fue localizada en el inventario de ${dealer!.nombre}. Se generará una solicitud de chequeo técnico urgente en Gestión Técnica.`,
      confirmLabel: 'Reportar faltante',
      danger: true,
    })
    if (!ok) return
    const n = solicitudes.length + 1
    const numero = `SCH-2026-${String(n).padStart(3, '0')}`
    const now = iso(new Date())
    addSolicitud({
      id: `sch-${crypto.randomUUID().slice(0, 8)}`,
      numero,
      dealerId: dealer!.id,
      vendedorId: dealer!.vendedorAsignado,
      supervisorId: 'usr-elizabeth',
      estado: 'PENDIENTE',
      fechaCreacion: now,
      fechaVisita: now,
      centroId: centros[0]?.id ?? 'centro-sd',
      lineas: [
        {
          id: `lin-${crypto.randomUUID().slice(0, 8)}`,
          serial,
          voltaje: 0,
          densidad: 0,
          capacidadMedida: 0,
          diagnostico: 'PENDIENTE',
          accionSugerida: 'Verificar faltante detectado en saneamiento',
        },
      ],
    })
    withHistory(
      serial,
      'CHEQUEO',
      `Saneamiento: faltante reportado en ${dealer!.nombre} · solicitud ${numero}`,
      () => undefined,
      { estadoNuevo: 'DEALER', referenciaId: numero },
    )
    toast(`Faltante registrado. Solicitud ${numero} creada en Gestión técnica`, 'ok')
  }

  return (
    <div className="page-fill">
      <PageHeader
        breadcrumbs={[
          { label: 'Distribuidores', to: '/distribuidores' },
          { label: dealer.nombre },
        ]}
        title={dealer.nombre}
        chips={<PerfilBadge perfil={dealer.perfil} />}
        meta={[
          { label: 'Localidad', value: dealer.localidad },
          { label: 'RNC', value: dealer.rnc },
          {
            label: 'Última visita',
            value: dealer.ultimaVisita ? formatDate(dealer.ultimaVisita) : 'Sin visitas',
          },
        ]}
      />

      {inv.length === 0 ? (
        <EmptyState
          framed
          icon={PackageSearch}
          title="Sin inventario en punto de venta"
          description="Este distribuidor no tiene seriales activos asignados en su inventario físico."
          action={
            <Link to="/distribuidores">
              <Button variant="secondary">Volver al listado</Button>
            </Link>
          }
        />
      ) : (
        <>
        <MetricGrid columns={3}>
          <MetricCard
            label="Total en stock"
            value={inv.length}
            icon={Warehouse}
            tone="brand"
            context="Unidades en consignación en el punto"
          />
          <MetricCard
            label={`Envejecidos (>${AGE_LIMIT_DAYS}d)`}
            value={agedCount}
            icon={Clock}
            tone="warn"
            filled={agedCount > 0}
            context={
              inv.length
                ? `${Math.round((agedCount / inv.length) * 100)}% del inventario del punto`
                : undefined
            }
          />
          <MetricCard
            label="En regla"
            value={inv.length - agedCount}
            icon={CheckCircle2}
            tone="ok"
            filled={inv.length - agedCount > 0}
            context={`Dentro de los ${AGE_LIMIT_DAYS} días`}
          />
        </MetricGrid>

        <section className="surface flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-line px-3.5 py-2.5">
            <SegmentedControl
              value={tab}
              onChange={(t) => setTab(t as TabFiltroInventario)}
              options={[
                { id: 'todos', label: 'Todo el inventario', count: inv.length },
                { id: 'aged', label: 'Envejecidos (>180d)', count: agedCount },
                { id: 'normal', label: 'En regla (≤180d)', count: inv.length - agedCount },
              ]}
            />
          </div>

          <DataTable
            density="compact"
            search={{ value: q, onChange: setQ, placeholder: 'Filtrar por serial…' }}
            columns={[
              {
                key: 'serial',
                header: 'Serial',
                primary: true,
                width: '160px',
                sortable: true,
                render: (b) => <SerialCell serial={b.serial} />,
              },
              {
                key: 'articulo',
                header: 'Artículo / Marca',
                sortable: true,
                render: (b) => {
                  const art = articulos.find((a) => a.id === b.articuloId)
                  const marca = marcas.find((m) => m.id === art?.marcaId)
                  return <CellStack primary={art?.codigo ?? b.articuloId} secondary={marca?.nombre} />
                },
              },
              {
                key: 'edad',
                header: 'Antigüedad en stock',
                width: '180px',
                sortable: true,
                sortValue: (b) => b.edad,
                render: (b) =>
                  b.edad > AGE_LIMIT_DAYS ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-warning-text">
                      <AlertTriangle size={13} className="text-warning" /> {b.edad} días (Envejecido)
                    </span>
                  ) : (
                    <span className="tabular-nums text-ink">{b.edad} días</span>
                  ),
              },
              {
                key: 'ingreso',
                header: 'Fecha de ingreso',
                width: '130px',
                sortable: true,
                sortValue: (b) => b.fechaIngreso,
                render: (b) => formatDate(b.fechaIngreso),
              },
              {
                key: 'diag',
                header: 'Estado diagnóstico',
                width: '160px',
                render: (b) => <StatusBadge catalogId={b.diagnosticoId} />,
              },
              {
                key: 'acciones',
                header: 'Saneamiento de inventario',
                align: 'right',
                width: '210px',
                render: (b) => (
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      leadingIcon={<BadgeCheck size={13} />}
                      onClick={() => void marcarVerificado(b.serial)}
                      title="Confirmar existencia física en el punto"
                    >
                      Verificado
                    </Button>
                    <Button
                      size="sm"
                      variant="danger-quiet"
                      leadingIcon={<XCircle size={13} />}
                      onClick={() => void reportarFaltante(b.serial)}
                      title="Reportar discrepancia física y generar visita técnica"
                    >
                      Faltante
                    </Button>
                  </div>
                ),
              },
            ]}
            rows={filteredInv}
            rowKey={(b) => b.serial}
            rowTone={(b) => (b.edad > AGE_LIMIT_DAYS ? 'warn' : 'default')}
            emptyTitle="Sin seriales en este criterio"
            emptyDescription="No se encontraron unidades en este rango de antigüedad o búsqueda."
          />
        </section>
        </>
      )}
    </div>
  )
}
