import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CircleCheck,
  CircleX,
  Clock,
  Coins,
  FileText,
  Plus,
  Shield,
} from 'lucide-react'
import {
  ActividadReciente,
  DonaEstado,
  PanelHeader,
  ResumenCard,
  type ItemActividad,
} from '../../components/panel/PanelWidgets'
import { PANEL, TONO_HEX } from '../../components/panel/tonos'
import { cn } from '../../lib/cn'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { DetailDrawer, DrawerFacts, DrawerSection } from '../../components/ui/DetailDrawer'
import { InsightPanel } from '../../components/ui/InsightPanel'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pill } from '../../components/ui/Pill'
import { RangeFilter } from '../../components/ui/RangeFilter'
import { SerialCell } from '../../components/ui/SerialCell'
import { TwoLine } from '../../components/ui/TwoLine'
import { TrendChart } from '../../components/ui/charts/TrendChart'
import {
  compactar,
  insightConcentracion,
  insightPendientes,
  insightPromedio,
  insightVariacion,
  mesesDelPeriodo,
  particionar,
  periodoDe,
  serieMensual,
  tiempoRelativo,
  valores,
  variacion,
  type RangoId,
} from '../../domain/analytics'
import {
  honraEstadoLabel,
  honraEstadoTone,
  vigenciaLabel,
  vigenciaTone,
} from '../../domain/estados'
import { formatDate } from '../../domain/dates'
import { usd } from '../../domain/money'
import type { Honra } from '../../domain/entities'
import { accountById } from '../../seed/demoAccounts'
import { autorizarHonraDealer } from '../../stores/actions/honra'
import { useWarrantyStore } from '../../stores/warrantyStore'
import { useUiStore } from '../../stores/uiStore'
import { useCan } from '../../hooks/usePermission'

type TabId = 'todas' | 'mostrador' | 'dealer' | 'pendientes'

const MOTIVO_LABEL: Record<string, string> = {
  FUERA_DE_PLAZO: 'Fuera de plazo',
  UMBRAL_CAPACIDAD: 'Capacidad sobre el umbral',
  CERTIFICADO_CANCELADO: 'Certificado cancelado',
  SIN_CERTIFICADO: 'Sin certificado vigente',
}

function motivoLabel(motivo?: string): string {
  if (!motivo) return 'No admisible'
  return MOTIVO_LABEL[motivo] ?? motivo.replace(/_/g, ' ').toLowerCase()
}

/** Tono derivado del desenlace de la honra, compartido por feed y tabla. */
function tonoDe(h: Honra): 'ok' | 'danger' | 'warn' | 'brand' {
  if (h.estado === 'EJECUTADA' || h.estado === 'APROBADA') return 'ok'
  if (h.estado === 'RECHAZADA') return 'danger'
  if (h.estado === 'SOLICITADA') return 'warn'
  return 'brand'
}

export function HonrasListPage() {
  const honras = useWarrantyStore((s) => s.honras)
  const canAuth = useCan('autorizar_honra_dealer')
  const toast = useUiStore((s) => s.pushToast)
  const [tab, setTab] = useState<TabId>('todas')
  const [q, setQ] = useState('')
  const [rango, setRango] = useState<RangoId>('6m')
  const [detalleId, setDetalleId] = useState<string | null>(null)
  const [drawerTab, setDrawerTab] = useState('resumen')

  const periodo = useMemo(() => periodoDe(rango), [rango])

  const ordenadas = useMemo(
    () => honras.slice().sort((a, b) => b.fechaCalculo.localeCompare(a.fechaCalculo)),
    [honras],
  )

  /* Toda la analítica se calcula sobre el período elegido y el anterior de
     igual longitud: sin esa partición, «+20 %» no significaría nada. */
  const { actuales, previos, comparable } = useMemo(
    () => particionar(ordenadas, (h) => h.fechaCalculo, periodo),
    [ordenadas, periodo],
  )

  const meses = useMemo(
    () =>
      mesesDelPeriodo(
        periodo,
        ordenadas.map((h) => h.fechaCalculo),
      ),
    [periodo, ordenadas],
  )

  const ejecutadas = useMemo(
    () => actuales.filter((h) => h.estado === 'EJECUTADA' || h.estado === 'APROBADA'),
    [actuales],
  )
  const rechazadas = useMemo(() => actuales.filter((h) => h.estado === 'RECHAZADA'), [actuales])
  const pendientes = useMemo(() => actuales.filter((h) => h.estado === 'SOLICITADA'), [actuales])
  const prevEjecutadas = previos.filter((h) => h.estado === 'EJECUTADA' || h.estado === 'APROBADA')
  const prevRechazadas = previos.filter((h) => h.estado === 'RECHAZADA')

  const acreditado = actuales.reduce((a, h) => a + h.resultadoCalculo.montoAcreditar, 0)
  const prevAcreditado = previos.reduce((a, h) => a + h.resultadoCalculo.montoAcreditar, 0)
  const aCliente = actuales.reduce((a, h) => a + h.resultadoCalculo.montoCliente, 0)

  const serieTotal = useMemo(
    () => serieMensual(actuales, (h) => h.fechaCalculo, meses),
    [actuales, meses],
  )
  const serieEjecutadas = useMemo(
    () => serieMensual(ejecutadas, (h) => h.fechaCalculo, meses),
    [ejecutadas, meses],
  )
  const serieRechazadas = useMemo(
    () => serieMensual(rechazadas, (h) => h.fechaCalculo, meses),
    [rechazadas, meses],
  )
  const serieAcreditado = useMemo(
    () =>
      serieMensual(actuales, (h) => h.fechaCalculo, meses, (h) => h.resultadoCalculo.montoAcreditar),
    [actuales, meses],
  )

  const porOrigen = useMemo(
    () => [
      {
        id: 'mostrador',
        label: 'Mostrador',
        valor: actuales.filter((h) => h.origen === 'mostrador').length,
        tono: 'brand' as const,
      },
      {
        id: 'dealer',
        label: 'Distribuidor',
        valor: actuales.filter((h) => h.origen === 'dealer').length,
        tono: 'accent' as const,
      },
    ],
    [actuales],
  )

  const insights = useMemo(
    () =>
      compactar([
        insightVariacion({
          id: 'ejecutadas',
          concepto: 'Las honras ejecutadas',
          actual: ejecutadas.length,
          previo: prevEjecutadas.length,
          comparable,
        }),
        insightConcentracion(
          'origen',
          porOrigen.map((o) => ({
            id: o.id,
            label: o.label,
            valor: o.valor,
            pct: Math.round((o.valor / Math.max(1, actuales.length)) * 100),
          })),
          'honras',
        ),
        insightVariacion({
          id: 'rechazos',
          concepto: 'Los rechazos',
          actual: rechazadas.length,
          previo: prevRechazadas.length,
          comparable,
          subirEsBueno: false,
        }),
        insightPromedio('promedio', acreditado, actuales.length, 'Monto promedio por honra', usd),
        insightPendientes(
          'pendientes',
          pendientes.length,
          pendientes.length === 1 ? 'honra espera autorización' : 'honras esperan autorización',
          'Solicitudes de distribuidor sin resolver en el período.',
        ),
      ]),
    [
      ejecutadas.length,
      prevEjecutadas.length,
      rechazadas.length,
      prevRechazadas.length,
      comparable,
      porOrigen,
      actuales.length,
      acreditado,
      pendientes.length,
    ],
  )

  /* Actividad reciente: los últimos movimientos, no una segunda tabla. */
  const actividad = useMemo<ItemActividad[]>(
    () =>
      actuales.slice(0, 4).map((h) => {
        const tono = tonoDe(h)
        return {
          id: h.id,
          titulo: (
            <>
              {h.serialOriginal} <span className="font-normal text-ink-secondary">·</span>{' '}
              {honraEstadoLabel(h.estado, h.origen).toLowerCase()}
              <span className="font-normal text-ink-secondary">
                {' '}
                ·{' '}
                {h.resultadoCalculo.admisible
                  ? `acredita ${usd(h.resultadoCalculo.montoAcreditar)}`
                  : motivoLabel(h.resultadoCalculo.motivoRechazo).toLowerCase()}
              </span>
            </>
          ),
          quien: h.origen === 'dealer' ? 'Distribuidor' : 'Mostrador',
          cuando: tiempoRelativo(h.fechaCalculo),
          cuandoExacto: formatDate(h.fechaCalculo),
          icon: tono === 'ok' ? CircleCheck : tono === 'danger' ? CircleX : Clock,
          tono,
          macizo: tono !== 'warn',
          to: `/serial/${h.serialOriginal}`,
        }
      }),
    [actuales],
  )

  const rows = useMemo(() => {
    const needle = q.trim().toUpperCase()
    return actuales
      .filter((h) => {
        if (tab === 'mostrador') return h.origen === 'mostrador'
        if (tab === 'dealer') return h.origen === 'dealer'
        if (tab === 'pendientes') return h.estado === 'SOLICITADA'
        return true
      })
      .filter((h) => (needle ? h.serialOriginal.toUpperCase().includes(needle) : true))
  }, [actuales, tab, q])

  const detalle = actuales.find((h) => h.id === detalleId) ?? null

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', to: '/' }, { label: 'Honras de garantía' }]}
        title="Honras de garantía"
        description="Ejecución de honras en mostrador y autorización del piloto de distribuidores. El monto lo calcula el motor de fórmulas vigente en cada póliza."
        actions={
          <>
            <RangeFilter value={rango} onChange={setRango} periodo={periodo} />
            <Link to="/honras/nueva">
              <Button leadingIcon={<Plus size={15} />}>Nueva honra de mostrador</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <ResumenCard
          label="Total de registros"
          value={actuales.length}
          note="Registradas en el período"
          icon={FileText}
          tone="brand"
          trend={valores(serieTotal)}
          change={variacion(actuales.length, previos.length, comparable)}
          context={`${pendientes.length} pendientes`}
        />
        <ResumenCard
          label="Ejecutadas"
          value={ejecutadas.length}
          note={`${Math.round((ejecutadas.length / Math.max(1, actuales.length)) * 100)}% del total`}
          icon={CircleCheck}
          tone="ok"
          trend={valores(serieEjecutadas)}
          change={variacion(ejecutadas.length, prevEjecutadas.length, comparable)}
          context="Honras acreditadas"
        />
        <ResumenCard
          label="Rechazadas"
          value={rechazadas.length}
          note={`${Math.round((rechazadas.length / Math.max(1, actuales.length)) * 100)}% del total`}
          icon={CircleX}
          tone="danger"
          trend={valores(serieRechazadas)}
          change={variacion(rechazadas.length, prevRechazadas.length, comparable)}
          subirEsBueno={false}
          context="No admisibles"
        />
        <ResumenCard
          label="Acreditado"
          value={usd(acreditado)}
          note={`Cliente asume ${usd(aCliente)}`}
          icon={Coins}
          tone="accent"
          trend={valores(serieAcreditado)}
          change={variacion(acreditado, prevAcreditado, comparable)}
          context={`En ${ejecutadas.length} honras`}
        />
      </div>

      {/* Espacio analítico: de dónde viene y cómo evoluciona. */}
      <div className="grid gap-3.5 lg:grid-cols-[45fr_55fr]">
        <section className={cn(PANEL, 'min-w-0 px-4 pb-4 pt-3.5')}>
          <PanelHeader
            title="Distribución por origen"
            info="Mostrador frente a piloto de distribuidores. Pulsa un origen para filtrar la tabla."
          />
          <div className="mt-3">
            <DonaEstado
              unidad="honras"
              segmentos={porOrigen.map((o) => ({ id: o.id, label: o.label, valor: o.valor, tono: o.tono }))}
            />
          </div>
        </section>

        <section className={cn(PANEL, 'min-w-0 px-4 pb-3 pt-3.5')}>
          <PanelHeader title="Tendencia de honras" info="Volumen mensual por desenlace." />
          <ul className="mb-1 mt-1 flex flex-wrap items-center justify-center gap-x-7 gap-y-1">
            {[
              { id: 'total', label: 'Total', tono: 'brand' as const },
              { id: 'ok', label: 'Ejecutadas', tono: 'ok' as const },
              { id: 'ko', label: 'Rechazadas', tono: 'danger' as const },
            ].map((l) => (
              <li key={l.id} className="flex items-center gap-2 text-body-xs text-ink">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: TONO_HEX[l.tono] }} aria-hidden="true" />
                {l.label}
              </li>
            ))}
          </ul>
          <TrendChart
            labels={serieTotal.map((p) => p.label)}
            series={[
              { id: 'total', label: 'Total', tono: 'brand', data: valores(serieTotal), area: true },
              { id: 'ok', label: 'Ejecutadas', tono: 'ok', data: valores(serieEjecutadas) },
              { id: 'ko', label: 'Rechazadas', tono: 'danger', data: valores(serieRechazadas) },
            ]}
            height={150}
          />
        </section>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2">
        <section className={cn(PANEL, 'min-w-0 px-4 pb-2 pt-3.5')}>
          <PanelHeader title="Actividad reciente" />
          <div className="mt-1.5">
            <ActividadReciente items={actividad} />
          </div>
        </section>
        <section className={cn(PANEL, 'min-w-0 px-4 pb-4 pt-3.5')}>
          <PanelHeader title="Lecturas del período" info="Conclusiones derivadas de las cifras del período elegido." />
          <div className="mt-2">
            <InsightPanel insights={insights} />
          </div>
        </section>
      </div>

      {/* Capa de detalle: la tabla llega después del resumen, no antes. */}
      <DataTable
        title="Listado de honras"
        fill={false}
        tabs={[
          { id: 'todas', label: 'Todas', count: actuales.length },
          {
            id: 'mostrador',
            label: 'Mostrador',
            count: actuales.filter((h) => h.origen === 'mostrador').length,
          },
          {
            id: 'dealer',
            label: 'Dealer',
            count: actuales.filter((h) => h.origen === 'dealer').length,
          },
          { id: 'pendientes', label: 'Pendientes', count: pendientes.length, tone: 'danger' },
        ]}
        activeTab={tab}
        onTabChange={(id) => setTab(id as TabId)}
        search={{ value: q, onChange: setQ, placeholder: 'Buscar serial…' }}
        onRowClick={(h) => {
          setDetalleId(h.id)
          setDrawerTab('resumen')
        }}
        isRowActive={(h) => h.id === detalleId}
        rowTone={(h) =>
          h.estado === 'RECHAZADA' ? 'danger' : h.estado === 'SOLICITADA' ? 'warn' : 'default'
        }
        columns={[
          {
            key: 'serial',
            header: 'Serial honrado',
            primary: true,
            sortable: true,
            sortValue: (h) => h.serialOriginal,
            render: (h) => <SerialCell serial={h.serialOriginal} />,
          },
          {
            key: 'origen',
            header: 'Origen',
            sortable: true,
            sortValue: (h) => h.origen,
            render: (h) => (
              <TwoLine
                top={h.origen === 'dealer' ? 'Distribuidor' : 'Mostrador'}
                sub={h.origen === 'dealer' ? 'Piloto de honra' : 'Atención directa'}
              />
            ),
          },
          {
            key: 'estado',
            header: 'Estado',
            render: (h) => (
              <Pill tone={honraEstadoTone(h.estado)} dot>
                {honraEstadoLabel(h.estado, h.origen)}
              </Pill>
            ),
          },
          {
            key: 'vigencia',
            header: 'Vigencia',
            secondary: true,
            render: (h) => (
              <Pill tone={vigenciaTone(h.decisionVigencia)}>
                {vigenciaLabel(h.decisionVigencia)}
              </Pill>
            ),
          },
          {
            key: 'monto',
            header: 'Cobertura',
            align: 'right',
            sortable: true,
            sortValue: (h) => h.resultadoCalculo.montoAcreditar,
            render: (h) => {
              if (!h.resultadoCalculo.admisible) {
                return (
                  <span className="flex flex-col items-end leading-tight">
                    <span className="text-label-lg text-ink-secondary">Sin cobertura</span>
                    <span className="max-w-[180px] truncate text-body-xs text-ink-tertiary first-letter:uppercase">
                      {motivoLabel(h.resultadoCalculo.motivoRechazo)}
                    </span>
                  </span>
                )
              }
              const cliente = h.resultadoCalculo.montoCliente
              return (
                <span className="flex flex-col items-end leading-tight">
                  <span
                    className={
                      cliente === 0 ? 'text-label-lg text-success-text' : 'text-label-lg text-ink'
                    }
                  >
                    {cliente === 0 ? 'Full 100 %' : usd(cliente)}
                  </span>
                  <span className="text-body-xs text-ink-tertiary">
                    Acredita {usd(h.resultadoCalculo.montoAcreditar)}
                  </span>
                </span>
              )
            },
          },
          {
            key: 'fecha',
            header: 'Fecha',
            align: 'right',
            sortable: true,
            sortValue: (h) => h.fechaCalculo,
            width: '140px',
            render: (h) => (
              <span className="flex flex-col items-end leading-tight">
                <span className="whitespace-nowrap text-body-sm text-ink">
                  {formatDate(h.fechaCalculo)}
                </span>
                <span className="text-body-xs text-ink-tertiary">
                  {tiempoRelativo(h.fechaCalculo)}
                </span>
              </span>
            ),
          },
        ]}
        rowActions={[
          {
            id: 'ver',
            label: 'Ver detalle',
            icon: <FileText size={14} />,
            onClick: (h) => {
              setDetalleId(h.id)
              setDrawerTab('resumen')
            },
          },
        ]}
        rows={rows}
        rowKey={(h) => h.id}
        emptyTitle="Sin honras en el período"
        emptyDescription="No hay honras que coincidan con el filtro y el rango de fechas actuales."
        emptyAction={
          <Link to="/honras/nueva">
            <Button size="sm" leadingIcon={<Plus size={14} />}>
              Nueva honra
            </Button>
          </Link>
        }
        renderMobile={(h) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SerialCell serial={h.serialOriginal} />
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Pill tone={honraEstadoTone(h.estado)} dot>
                  {honraEstadoLabel(h.estado, h.origen)}
                </Pill>
                <span className="text-body-xs text-ink-tertiary">
                  {h.origen === 'dealer' ? 'Distribuidor' : 'Mostrador'}
                </span>
              </div>
            </div>
            <span className="shrink-0 text-right">
              <span className="block text-label-lg tabular-nums text-ink">
                {h.resultadoCalculo.admisible ? usd(h.resultadoCalculo.montoAcreditar) : '—'}
              </span>
              <span className="block text-body-xs text-ink-tertiary">
                {tiempoRelativo(h.fechaCalculo)}
              </span>
            </span>
          </div>
        )}
      />

      {/* Detalle sin abandonar la lista: el filtro y la página se conservan. */}
      <DetailDrawer
        open={detalle !== null}
        onClose={() => setDetalleId(null)}
        title={detalle?.serialOriginal ?? ''}
        subtitle={
          detalle
            ? `Honra de ${detalle.origen === 'dealer' ? 'distribuidor' : 'mostrador'} · ${formatDate(detalle.fechaCalculo)}`
            : undefined
        }
        chips={
          detalle ? (
            <Pill tone={honraEstadoTone(detalle.estado)} dot>
              {honraEstadoLabel(detalle.estado, detalle.origen)}
            </Pill>
          ) : null
        }
        tabs={[
          { id: 'resumen', label: 'Resumen' },
          { id: 'calculo', label: 'Cálculo' },
        ]}
        activeTab={drawerTab}
        onTabChange={setDrawerTab}
        fullView={
          detalle
            ? { to: `/serial/${detalle.serialOriginal}`, label: 'Ficha del serial' }
            : undefined
        }
        actions={
          detalle && canAuth && detalle.estado === 'SOLICITADA' ? (
            <Button
              leadingIcon={<Shield size={15} />}
              onClick={() => {
                const r = autorizarHonraDealer(detalle.id)
                toast(
                  r.ok ? 'Autorizada · pendiente de reposición FIFO' : r.error,
                  r.ok ? 'ok' : 'error',
                )
                if (r.ok) setDetalleId(null)
              }}
            >
              Autorizar honra
            </Button>
          ) : null
        }
      >
        {detalle ? (
          drawerTab === 'resumen' ? (
            <>
              <DrawerSection title="Identificación">
                <DrawerFacts
                  items={[
                    { label: 'Serial honrado', value: detalle.serialOriginal },
                    {
                      label: 'Serial de reemplazo',
                      value: detalle.serialReemplazo ?? 'Sin reemplazo registrado',
                    },
                    {
                      label: 'Origen',
                      value: detalle.origen === 'dealer' ? 'Distribuidor' : 'Mostrador',
                    },
                    {
                      label: 'Vigencia',
                      value: (
                        <Pill tone={vigenciaTone(detalle.decisionVigencia)}>
                          {vigenciaLabel(detalle.decisionVigencia)}
                        </Pill>
                      ),
                    },
                  ]}
                />
              </DrawerSection>

              <DrawerSection title="Resultado económico">
                <DrawerFacts
                  items={[
                    {
                      label: 'Acredita Viamar',
                      value: usd(detalle.resultadoCalculo.montoAcreditar),
                    },
                    { label: 'Asume el cliente', value: usd(detalle.resultadoCalculo.montoCliente) },
                    { label: 'Meses de uso', value: `${detalle.resultadoCalculo.mesesUso} meses` },
                    {
                      label: 'Porcentaje consumido',
                      value: `${detalle.resultadoCalculo.porcentajeUsado.toFixed(1)} %`,
                    },
                  ]}
                />
                {!detalle.resultadoCalculo.admisible ? (
                  <p className="mt-3 rounded-lg border border-critical-border/60 bg-critical-soft/70 px-3 py-2 text-body-sm text-critical-text">
                    No admisible: {motivoLabel(detalle.resultadoCalculo.motivoRechazo)}.
                  </p>
                ) : null}
              </DrawerSection>

              <DrawerSection title="Trazabilidad">
                <DrawerFacts
                  columns={1}
                  items={[
                    {
                      label: 'Registrada por',
                      value: accountById(detalle.usuarioId)?.nombre ?? detalle.usuarioId,
                    },
                    {
                      label: 'Fecha de cálculo',
                      value: `${formatDate(detalle.fechaCalculo)} · ${tiempoRelativo(detalle.fechaCalculo)}`,
                    },
                    {
                      label: 'Política aplicada',
                      value: `${detalle.politicaId} · versión ${detalle.politicaVersion}`,
                    },
                  ]}
                />
              </DrawerSection>
            </>
          ) : (
            <>
              <DrawerSection title="Fórmula aplicada">
                <pre className="scroll-slim overflow-x-auto rounded-lg border border-[#e6edf5] bg-[#f7fafd] px-3 py-2.5 font-mono text-body-xs text-ink">
                  {detalle.resultadoCalculo.formulaAplicada}
                </pre>
              </DrawerSection>

              <DrawerSection title="Variables de entrada">
                <DrawerFacts
                  items={Object.entries(detalle.resultadoCalculo.variablesEntrada).map(([k, v]) => ({
                    label: k,
                    value: typeof v === 'number' ? v.toLocaleString('es-DO') : String(v),
                  }))}
                />
              </DrawerSection>
            </>
          )
        ) : null}
      </DetailDrawer>
    </div>
  )
}
