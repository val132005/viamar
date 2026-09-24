import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BatteryCharging, MapPin, ScanLine, ShieldAlert, Warehouse } from 'lucide-react'
import { DIAGNOSTICO_CATALOG, UBICACION_LABEL } from '../../domain/catalogs'
import { DataTable, CellStack } from '../../components/ui/DataTable'
import { MetricCard } from '../../components/ui/MetricCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageTabs } from '../../components/ui/PageTabs'
import { SectionCard } from '../../components/ui/SectionCard'
import { SerialCell } from '../../components/ui/SerialCell'
import { StackBar, StackDot, type StackTone } from '../../components/ui/StackBar'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { MetricGrid } from '../../components/ui/Workspace'
import { searchVisible, useVisibleBatteries } from '../../hooks/useVisibleBatteries'
import { useAuthStore } from '../../stores/authStore'
import { useBatteryStore } from '../../stores/batteryStore'
import { useDistributorStore } from '../../stores/distributorStore'

type TabId = 'todos' | 'dealer' | 'carga' | 'garantia'

/* Los tres diagnósticos que importan para leer una ubicación de un vistazo.
   El resto cae en «otros» para que la barra no se fragmente en astillas. */
const COMPOSICION: Array<{ id: string; tone: StackTone }> = [
  { id: 'BUEN_ESTADO', tone: 'ok' },
  { id: 'DESCARGADA', tone: 'warn' },
  { id: 'PARA_GARANTIA', tone: 'danger' },
]

const LABEL_DIAGNOSTICO = (id: string) =>
  DIAGNOSTICO_CATALOG.find((d) => d.id === id)?.label ?? id

export function SearchPage() {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [tab, setTab] = useState<TabId>('todos')
  const user = useAuthStore((s) => s.usuarioActual)
  const articulos = useBatteryStore((s) => s.articulos)
  const marcas = useBatteryStore((s) => s.marcas)
  const dealers = useDistributorStore((s) => s.dealers)

  const visibles = useVisibleBatteries()
  const base = useMemo(() => (q.trim() ? searchVisible(q, user) : visibles), [q, user, visibles])
  const rows = useMemo(
    () =>
      base.filter((b) => {
        if (tab === 'dealer') return b.ubicacionTipo === 'DEALER'
        if (tab === 'carga') return b.ubicacionTipo === 'CENTRO_CARGA'
        if (tab === 'garantia') return b.diagnosticoId === 'PARA_GARANTIA'
        return true
      }),
    [base, tab],
  )

  const ubicacionDe = (b: (typeof base)[number]) =>
    b.ubicacionTipo === 'DEALER'
      ? (dealers.find((d) => d.id === b.ubicacionId)?.nombre ?? UBICACION_LABEL.DEALER)
      : (UBICACION_LABEL[b.ubicacionTipo] ?? b.ubicacionTipo)

  const enDealer = base.filter((b) => b.ubicacionTipo === 'DEALER').length
  const enCarga = base.filter((b) => b.ubicacionTipo === 'CENTRO_CARGA').length
  const paraGarantia = base.filter((b) => b.diagnosticoId === 'PARA_GARANTIA').length

  /* Dónde está el parque y en qué estado. Se deriva del mismo conjunto visible
     que alimenta la tabla, así que responde siempre al filtro activo. */
  const porUbicacion = useMemo(() => {
    const mapa = new Map<string, { nombre: string; total: number; conteo: Map<string, number> }>()
    for (const b of rows) {
      const nombre = ubicacionDe(b)
      const actual = mapa.get(nombre) ?? { nombre, total: 0, conteo: new Map() }
      actual.total += 1
      actual.conteo.set(b.diagnosticoId, (actual.conteo.get(b.diagnosticoId) ?? 0) + 1)
      mapa.set(nombre, actual)
    }
    return [...mapa.values()].sort((a, b) => b.total - a.total).slice(0, 6)
  }, [rows, dealers])

  const totalUbicaciones = porUbicacion.reduce((acc, u) => acc + u.total, 0)

  return (
    <div className="page-fill">
      <PageHeader
        title="Trazabilidad de seriales"
        description="Búsqueda por CIB, documento del cliente o nombre. El resultado respeta el alcance de visibilidad de tu rol."
        tabs={
          <PageTabs
            active={tab}
            onChange={(id) => setTab(id as TabId)}
            tabs={[
              { id: 'todos', label: 'Todos', count: base.length },
              { id: 'dealer', label: 'En dealer', count: enDealer },
              { id: 'carga', label: 'En carga', count: enCarga },
              { id: 'garantia', label: 'Para garantía', count: paraGarantia, tone: 'danger' },
            ]}
          />
        }
      />

      <MetricGrid columns={4}>
        <MetricCard
          label="Seriales visibles"
          value={visibles.length}
          icon={ScanLine}
          tone="brand"
          context={q.trim() ? `${base.length} coinciden con la búsqueda` : 'Alcance de tu rol'}
        />
        <MetricCard
          label="En dealer"
          value={enDealer}
          icon={Warehouse}
          tone="warn"
          filled
          context={
            base.length ? `${Math.round((enDealer / base.length) * 100)}% del parque` : undefined
          }
        />
        <MetricCard
          label="En carga"
          value={enCarga}
          icon={BatteryCharging}
          tone="accent"
          filled
          context={enCarga ? 'En centro de servicio' : 'Sin unidades en carga'}
        />
        <MetricCard
          label="Para garantía"
          value={paraGarantia}
          icon={ShieldAlert}
          tone="danger"
          filled
          context={paraGarantia ? 'Requieren dictamen' : 'Sin casos abiertos'}
        />
      </MetricGrid>

      {porUbicacion.length ? (
        <SectionCard
          title="Distribución por ubicación"
          description={`Estado de ${totalUbicaciones} seriales en las ubicaciones con más existencias`}
          icon={<MapPin size={15} />}
          toolbar={
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {COMPOSICION.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 text-body-xs text-ink-secondary"
                >
                  <StackDot tone={c.tone} />
                  {LABEL_DIAGNOSTICO(c.id)}
                </span>
              ))}
            </div>
          }
        >
          <ul className="space-y-2.5">
            {porUbicacion.map((u) => {
              const segmentos = COMPOSICION.map((c) => ({
                label: LABEL_DIAGNOSTICO(c.id),
                value: u.conteo.get(c.id) ?? 0,
                tone: c.tone,
              }))
              /* Se nombra el estado que domina la ubicación: es lo que cambia de
                 una fila a otra y lo que decide si hay que mirarla. */
              const dominante = [...segmentos].sort((a, b) => b.value - a.value)[0]
              return (
                <li key={u.nombre} className="flex items-center gap-3">
                  <span className="w-48 shrink-0 truncate text-label-lg text-ink" title={u.nombre}>
                    {u.nombre}
                  </span>
                  <StackBar segments={segmentos} total={u.total} className="flex-1" />
                  <span className="w-10 shrink-0 text-right text-label-lg tabular-nums text-ink">
                    {u.total}
                  </span>
                  <span className="hidden w-32 shrink-0 truncate text-right text-body-xs text-ink-tertiary sm:block">
                    {dominante && dominante.value > 0
                      ? `${Math.round((dominante.value / u.total) * 100)}% ${dominante.label.toLowerCase()}`
                      : 'Sin dictamen'}
                  </span>
                </li>
              )
            })}
          </ul>
        </SectionCard>
      ) : null}

      <DataTable
        title="Resultados"
        icon={<ScanLine size={15} />}
        density="compact"
        search={{ value: q, onChange: setQ, placeholder: 'Serial, documento o nombre…' }}
        columns={[
          {
            key: 'serial',
            header: 'Serial',
            primary: true,
            sortable: true,
            width: '150px',
            render: (r) => <SerialCell serial={r.serial} />,
          },
          {
            key: 'articulo',
            header: 'Artículo',
            sortable: true,
            sortValue: (r) => articulos.find((a) => a.id === r.articuloId)?.codigo ?? r.articuloId,
            render: (r) => {
              const art = articulos.find((a) => a.id === r.articuloId)
              const marca = marcas.find((m) => m.id === art?.marcaId)
              return <CellStack primary={art?.codigo ?? r.articuloId} secondary={marca?.nombre} />
            },
          },
          {
            key: 'ubicacion',
            header: 'Ubicación actual',
            sortable: true,
            sortValue: (r) => ubicacionDe(r),
            render: (r) => {
              const detalle = ubicacionDe(r)
              const tipo = UBICACION_LABEL[r.ubicacionTipo] ?? r.ubicacionTipo
              return (
                <CellStack primary={detalle} secondary={detalle === tipo ? undefined : tipo} />
              )
            },
          },
          {
            key: 'estado',
            header: 'Diagnóstico',
            width: '160px',
            sortable: true,
            render: (r) => <StatusBadge catalogId={r.diagnosticoId} />,
          },
          {
            /* Origen: en la práctica casi todo llega de Dynamics, así que se
               muestra sin relleno y solo en pantallas anchas. El dato sigue
               disponible, pero deja de repetirse como bloque de color. */
            key: 'origen',
            header: 'Origen',
            align: 'right',
            width: '140px',
            secondary: true,
            sortable: true,
            render: (r) => <StatusBadge catalogId={r.origen} variant="quiet" />,
          },
        ]}
        rows={rows}
        rowKey={(r) => r.serial}
        rowTone={(r) => (r.diagnosticoId === 'PARA_GARANTIA' ? 'danger' : 'default')}
        emptyTitle="Sin coincidencias"
        emptyDescription={
          q
            ? `No hay resultados para «${q}».`
            : 'Escriba un serial CIB, un documento o un nombre de cliente.'
        }
        renderMobile={(r) => {
          const art = articulos.find((a) => a.id === r.articuloId)
          return (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SerialCell serial={r.serial} />
                <p className="mt-0.5 truncate text-body-xs text-ink-tertiary">
                  {art?.codigo ?? r.articuloId} · {ubicacionDe(r)}
                </p>
              </div>
              <StatusBadge catalogId={r.diagnosticoId} />
            </div>
          )
        }}
      />
    </div>
  )
}
