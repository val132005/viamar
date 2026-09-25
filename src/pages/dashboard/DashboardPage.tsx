import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  BatteryWarning,
  Check,
  ClipboardCheck,
  Clock,
  Handshake,
  Hourglass,
  Plus,
  RefreshCw,
  ShieldAlert,
  Truck,
  Warehouse,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { RangeFilter } from '../../components/ui/RangeFilter'
import { TaskQueue, type QueueItem } from '../../components/ui/TaskQueue'
import { TrendChart } from '../../components/ui/charts/TrendChart'
import {
  mesLabelCorto,
  mesesDelPeriodo,
  particionar,
  periodoDe,
  porcentaje,
  serieMensual,
  tiempoRelativo,
  topEntidades,
  valores,
  variacion,
  type RangoId,
} from '../../domain/analytics'
import {
  DIAGNOSTICO_CATALOG,
  EVENT_LABEL,
  ORIGEN_CATALOG,
  UBICACION_LABEL,
} from '../../domain/catalogs'
import { formatDate } from '../../domain/dates'
import type { EventoHistorico, EventoTipo, UbicacionTipo } from '../../domain/entities'
import { useCan, useCanAny } from '../../hooks/usePermission'
import { useVisibleBatteries } from '../../hooks/useVisibleBatteries'
import { cn } from '../../lib/cn'
import { accountById } from '../../seed/demoAccounts'
import { useAuthStore } from '../../stores/authStore'
import { useCertificateStore } from '../../stores/certificateStore'
import { useHistoryStore } from '../../stores/historyStore'
import { useInspectionStore } from '../../stores/inspectionStore'
import { useWarrantyStore } from '../../stores/warrantyStore'
import {
  ActividadReciente,
  DonaEstado,
  PanelHeader,
  Ranking,
  RegistrosRecientes,
  ResumenCard,
  SelectPill,
  UnderlineTabs,
  type ItemActividad,
  type SegmentoDona,
} from '../../components/panel/PanelWidgets'
import { PANEL, TONO_HEX, type Tono } from '../../components/panel/tonos'
import { useFilasSerial } from '../../components/panel/useFilasSerial'

type TabId = 'resumen' | 'seriales' | 'analitica'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'seriales', label: 'Seriales' },
  { id: 'analitica', label: 'Analítica' },
]

/* Cada ubicación conserva su color en todo el panel. */
const UBICACION_TONO: Record<UbicacionTipo, Tono> = {
  DEALER: 'brand',
  VIAMAR: 'accent',
  CENTRO_CARGA: 'navy',
  CLIENTE: 'ok',
  RETIRADA: 'neutral',
}

/* Disco macizo para hechos cerrados; sólo trazo para lo que sigue en curso. */
const EVENTO_VISUAL: Record<EventoTipo, { tono: Tono; icon: LucideIcon; macizo: boolean }> = {
  INGRESO: { tono: 'brand', icon: Plus, macizo: true },
  VENTA_DEALER: { tono: 'ok', icon: Check, macizo: true },
  VENTA_CLIENTE: { tono: 'ok', icon: Check, macizo: true },
  CERTIFICADO: { tono: 'ok', icon: Check, macizo: true },
  CARGA_COMPLETADA: { tono: 'ok', icon: Check, macizo: true },
  CHEQUEO: { tono: 'warn', icon: Clock, macizo: false },
  DIAGNOSTICO: { tono: 'warn', icon: Clock, macizo: false },
  ENVIO_CARGA: { tono: 'warn', icon: Truck, macizo: false },
  SOLICITUD_GARANTIA: { tono: 'danger', icon: ShieldAlert, macizo: false },
  HONRA: { tono: 'accent', icon: RefreshCw, macizo: true },
  REEMPLAZO: { tono: 'accent', icon: RefreshCw, macizo: true },
}

const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/** «1 solicitud», «3 solicitudes»: el contexto de una tarjeta se lee como frase. */
const cuenta = (n: number, singular: string, plural = singular + 's') =>
  `${n} ${n === 1 ? singular : plural}`

export function DashboardPage() {
  const user = useAuthStore((s) => s.usuarioActual)
  const baterias = useVisibleBatteries()
  const certificados = useCertificateStore((s) => s.certificados)
  const honras = useWarrantyStore((s) => s.honras)
  const solicitudes = useInspectionStore((s) => s.solicitudes)
  const eventos = useHistoryStore((s) => s.eventos)
  const [rango, setRango] = useState<RangoId>('6m')
  const [tab, setTab] = useState<TabId>('resumen')
  const [origen, setOrigen] = useState('todos')
  const [topN, setTopN] = useState('5')

  /* El panel se ajusta a lo que el rol puede atender. Las cifras de inventario
     ya vienen acotadas por visibilidad, pero las colas de trabajo son globales:
     mostrárselas a un distribuidor sería enseñarle trabajo ajeno. */
  const puedeChequeos = useCan('crear_solicitud_chequeo')
  const puedeCarga = useCanAny(['enviar_carga', 'operar_carga'])
  const puedeAutorizarHonra = useCan('autorizar_honra_dealer')
  const verInventarioDealer = useCan('ver_inventario_dealer')

  const periodo = useMemo(() => periodoDe(rango), [rango])

  const visiblesSerial = useMemo(() => new Set(baterias.map((b) => b.serial)), [baterias])

  /* Sólo la historia de los seriales que el usuario puede ver: el panel de un
     distribuidor no debe medirse con el inventario de toda la red. */
  const propios = useMemo(
    () => eventos.filter((e) => visiblesSerial.has(e.serial)),
    [eventos, visiblesSerial],
  )

  const meses = useMemo(
    () =>
      mesesDelPeriodo(
        periodo,
        propios.map((e) => e.fecha),
      ),
    [periodo, propios],
  )
  const etiquetasMes = useMemo(() => meses.map(mesLabelCorto), [meses])

  /* Serie de un tipo de evento dentro del período visible. Cada métrica se
     apoya en el hecho que realmente la origina, no en un proxy cómodo. */
  const seriePorTipo = useMemo(() => {
    const cache = new Map<EventoHistorico['tipo'], number[]>()
    return (tipo: EventoHistorico['tipo']) => {
      const hit = cache.get(tipo)
      if (hit) return hit
      const serie = valores(
        serieMensual(
          propios.filter((e) => e.tipo === tipo),
          (e) => e.fecha,
          meses,
        ),
      )
      cache.set(tipo, serie)
      return serie
    }
  }, [propios, meses])

  /* Chequeos se miden sobre sus propios registros: la bitácora sólo anota el
     hito puntual y dejaría la serie casi vacía. */
  const serieChequeos = useMemo(
    () => valores(serieMensual(solicitudes, (s) => s.fechaCreacion, meses)),
    [solicitudes, meses],
  )
  const certVisibles = useMemo(
    () => certificados.filter((c) => visiblesSerial.has(c.serial)),
    [certificados, visiblesSerial],
  )

  /* Filas de la tabla y los resolutores de titular y artículo, compartidos con
     la trazabilidad. */
  const { filas: filasSerial, titularDe, articuloDe } = useFilasSerial(baterias)

  if (!user) return null

  const esDistribuidor = user.rol === 'DISTRIBUIDOR'

  const certE = certVisibles.filter((c) => c.estado === 'E').length
  const honrasPorAutorizar = honras.filter(
    (h) => h.origen === 'dealer' && h.estado === 'SOLICITADA',
  ).length
  const chequeosAbiertos = solicitudes.filter(
    (s) => s.estado === 'PENDIENTE' || s.estado === 'EN_PROCESO',
  ).length
  const chequeosPendientes = solicitudes.filter((s) => s.estado === 'PENDIENTE').length
  const enDealerLista = baterias.filter((b) => b.ubicacionTipo === 'DEALER')
  const enDealer = enDealerLista.length
  const paraGarantia = baterias.filter((b) => b.diagnosticoId === 'PARA_GARANTIA').length
  const descargadas = baterias.filter((b) => b.diagnosticoId === 'DESCARGADA').length
  const aged = enDealerLista.filter((b) => {
    const months = (Date.now() - new Date(b.fechaIngreso).getTime()) / (1000 * 60 * 60 * 24 * 30)
    return months >= 6
  }).length

  /* Comparación contra el período anterior: se hace sobre los hechos fechados
     —los eventos—, que son los únicos que permiten situar algo en el tiempo. */
  const compara = (tipo: EventoHistorico['tipo']) => {
    const { actuales, previos, comparable } = particionar(
      propios.filter((e) => e.tipo === tipo),
      (e) => e.fecha,
      periodo,
    )
    return {
      change: variacion(actuales.length, previos.length, comparable),
      actuales: actuales.length,
    }
  }

  const ingresos = compara('INGRESO')
  const solicitudesGarantia = compara('SOLICITUD_GARANTIA')
  const enviosCarga = compara('ENVIO_CARGA')
  const certEmitidos = compara('CERTIFICADO')
  const chequeosNuevos = particionar(solicitudes, (s) => s.fechaCreacion, periodo)

  /* Distribución por ubicación, acotable por el sistema que dio de alta el
     serial: así se ve, por ejemplo, dónde está lo que entró por el portal. */
  const porOrigen = origen === 'todos' ? baterias : baterias.filter((b) => b.origen === origen)
  const segmentosUbicacion: SegmentoDona[] = (Object.keys(UBICACION_TONO) as UbicacionTipo[]).map(
    (tipo) => ({
      id: tipo,
      label: UBICACION_LABEL[tipo] ?? tipo,
      valor: porOrigen.filter((b) => b.ubicacionTipo === tipo).length,
      tono: UBICACION_TONO[tipo],
      to:
        tipo === 'DEALER' && verInventarioDealer
          ? '/distribuidores'
          : tipo === 'CENTRO_CARGA' && puedeCarga
            ? '/carga'
            : undefined,
    }),
  )

  /* Un distribuidor sólo ve su propio inventario: rankear dealers le daría
     una lista de uno. Para él el ranking útil es por artículo. */
  const ranking = esDistribuidor
    ? topEntidades(enDealerLista, (b) => b.articuloId, articuloDe, Number(topN)).map((s) => ({
        id: s.id,
        label: s.label,
        valor: s.valor,
      }))
    : topEntidades(
        enDealerLista,
        (b) => b.ubicacionId,
        (id) => titularDe('DEALER', id),
        Number(topN),
      ).map((s) => ({
        id: s.id,
        label: s.label,
        valor: s.valor,
        to: verInventarioDealer ? `/distribuidores/${s.id}` : undefined,
      }))

  const actividad: ItemActividad[] = propios
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 4)
    .map((e) => {
      const visual = EVENTO_VISUAL[e.tipo]
      return {
        id: e.id,
        titulo: (
          <>
            {e.serial} <span className="font-normal text-ink-secondary">·</span>{' '}
            {minuscula(EVENT_LABEL[e.tipo] ?? e.tipo)}
          </>
        ),
        quien: accountById(e.usuarioId)?.nombre ?? 'Sistema',
        cuando: minuscula(tiempoRelativo(e.fecha)),
        cuandoExacto: formatDate(e.fecha),
        icon: visual.icon,
        tono: visual.tono,
        macizo: visual.macizo,
        to: `/serial/${e.serial}`,
      }
    })

  /* Cola de trabajo: lo que exige una decisión hoy. No repite la bitácora —
     la bitácora cuenta lo que ya pasó; esto, lo que falta por hacer. */
  const asuntos: QueueItem[] = [
    {
      id: 'chequeos',
      label: 'Chequeos por asignar',
      hint: 'Solicitudes sin técnico asignado',
      count: chequeosPendientes,
      to: '/gestion-tecnica',
      icon: ClipboardCheck,
      tone: 'default',
    },
    {
      id: 'honras',
      label: 'Honras por autorizar',
      hint: 'Solicitudes de distribuidor',
      count: honrasPorAutorizar,
      to: '/honras/dealer',
      icon: Handshake,
      tone: 'danger',
    },
    {
      id: 'garantia',
      label: 'Baterías para garantía',
      hint: 'Requieren evaluación técnica comercial',
      count: paraGarantia,
      to: '/buscar',
      icon: ShieldAlert,
      tone: 'danger',
    },
    {
      id: 'carga',
      label: 'Descargadas sin enviar',
      hint: 'Candidatas a proceso de carga',
      count: descargadas,
      to: '/carga',
      icon: BatteryWarning,
      tone: 'default',
    },
    {
      id: 'aged',
      label: 'Stock envejecido en dealer',
      hint: 'Más de 6 meses sin rotar',
      count: aged,
      to: '/distribuidores',
      icon: Hourglass,
      tone: 'default',
    },
  ]

  /* Un asunto que el rol no puede resolver no es una tarea suya: se omite en
     vez de mostrarse desactivado. */
  const atiende: Record<string, boolean> = {
    chequeos: puedeChequeos,
    honras: puedeAutorizarHonra,
    garantia: true,
    carga: puedeCarga,
    aged: verInventarioDealer,
  }
  const cola = asuntos.filter((i) => atiende[i.id])
  const pendientesTotales = cola.reduce((acc, i) => acc + i.count, 0)

  const estadosFiltro = DIAGNOSTICO_CATALOG.filter((d) =>
    baterias.some((b) => b.diagnosticoId === d.id),
  ).map((d) => ({ value: d.id, label: d.label }))
  const ubicacionesFiltro = (Object.keys(UBICACION_TONO) as UbicacionTipo[])
    .filter((t) => baterias.some((b) => b.ubicacionTipo === t))
    .map((t) => ({ value: t, label: UBICACION_LABEL[t] ?? t }))

  const origenesFiltro = ORIGEN_CATALOG.filter((o) => baterias.some((b) => b.origen === o.id)).map(
    (o) => ({ value: o.id, label: o.label }),
  )
  const articulosFiltro = [...new Set(filasSerial.map((f) => f.articulo))]
    .sort((x, y) => x.localeCompare(y, 'es'))
    .map((x) => ({ value: x, label: x }))

  const seriesMovimiento = [
    { id: 'ingreso', label: 'Ingresos', tono: 'brand' as const, data: seriePorTipo('INGRESO'), area: true },
    { id: 'certificado', label: 'Certificados', tono: 'ok' as const, data: seriePorTipo('CERTIFICADO') },
    { id: 'honra', label: 'Honras', tono: 'danger' as const, data: seriePorTipo('HONRA') },
  ]

  const tarjetas = (
    <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      <ResumenCard
        label="Seriales vivos"
        value={baterias.length}
        note={`${enDealer} en dealer`}
        icon={Warehouse}
        tone="brand"
        trend={seriePorTipo('INGRESO')}
        change={ingresos.change}
        context={`${cuenta(ingresos.actuales, 'alta')} en el período`}
        to="/buscar"
      />
      <ResumenCard
        label="Certificados vigentes"
        value={certE}
        note={`${porcentaje(certE, certVisibles.length)}% del total`}
        icon={BadgeCheck}
        tone="ok"
        trend={seriePorTipo('CERTIFICADO')}
        change={certEmitidos.change}
        context={cuenta(certEmitidos.actuales, 'emisión', 'emisiones')}
        to="/certificados"
      />
      <ResumenCard
        label="Para garantía"
        value={paraGarantia}
        note={`${porcentaje(paraGarantia, baterias.length)}% del parque`}
        icon={ShieldAlert}
        tone="danger"
        trend={seriePorTipo('SOLICITUD_GARANTIA')}
        change={solicitudesGarantia.change}
        context={cuenta(solicitudesGarantia.actuales, 'solicitud', 'solicitudes')}
        subirEsBueno={false}
        to="/buscar"
      />
      {puedeChequeos ? (
        <ResumenCard
          label="Chequeos abiertos"
          value={chequeosAbiertos}
          note={chequeosPendientes > 0 ? `${chequeosPendientes} sin asignar` : 'Todos asignados'}
          icon={Clock}
          tone="neutral"
          trend={serieChequeos}
          change={variacion(
            chequeosNuevos.actuales.length,
            chequeosNuevos.previos.length,
            chequeosNuevos.comparable,
          )}
          context={cuenta(chequeosNuevos.actuales.length, 'solicitud', 'solicitudes')}
          subirEsBueno={false}
          to="/gestion-tecnica"
        />
      ) : (
        <ResumenCard
          label="Descargadas"
          value={descargadas}
          note={`${porcentaje(descargadas, baterias.length)}% del parque`}
          icon={Clock}
          tone="neutral"
          trend={seriePorTipo('ENVIO_CARGA')}
          change={enviosCarga.change}
          context={`${cuenta(enviosCarga.actuales, 'envío')} a carga`}
          subirEsBueno={false}
        />
      )}
    </div>
  )

  const analitica = (
    <div className="grid gap-3.5 xl:grid-cols-[45fr_55fr]">
      <section className={cn(PANEL, 'min-w-0 px-4 pb-4 pt-3.5')}>
        <PanelHeader
          title="Distribución por ubicación"
          toolbar={
            <SelectPill
              value={origen}
              onChange={setOrigen}
              ariaLabel="Filtrar por origen del registro"
              options={[
                { value: 'todos', label: 'Todos los orígenes' },
                ...ORIGEN_CATALOG.map((o) => ({ value: o.id, label: o.label })),
              ]}
            />
          }
        />
        <div className="mt-3">
          <DonaEstado segmentos={segmentosUbicacion} unidad="seriales" />
        </div>
      </section>

      <section className={cn(PANEL, 'min-w-0 px-4 pb-3 pt-3.5')}>
        <PanelHeader title="Movimiento de seriales" />
        <ul className="mb-1 mt-1 flex flex-wrap items-center justify-center gap-x-7 gap-y-1">
          {seriesMovimiento.map((s) => (
            <li key={s.id} className="flex items-center gap-2 text-body-xs text-ink">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: TONO_HEX[s.tono] }}
                aria-hidden="true"
              />
              {s.label}
            </li>
          ))}
        </ul>
        <TrendChart
          labels={etiquetasMes}
          series={seriesMovimiento}
          height={150}
          emptyMessage="Todavía no hay movimientos registrados en el período."
        />
      </section>
    </div>
  )

  const rankingCard = (
    <section className={cn(PANEL, 'min-w-0 px-4 pb-3 pt-3.5')}>
      <PanelHeader
        title={esDistribuidor ? 'Top artículos en tu inventario' : 'Top dealers por inventario'}
        toolbar={
          <SelectPill
            value={topN}
            onChange={setTopN}
            ariaLabel="Cantidad del ranking"
            options={[
              { value: '5', label: 'Top 5' },
              { value: '10', label: 'Top 10' },
            ]}
          />
        }
      />
      <div className="mt-2">
        <Ranking filas={ranking} total={enDealer} />
      </div>
    </section>
  )

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeader
        title="Panorama operativo"
        description="Ciclo de vida post-factura: inventario en dealers, diagnóstico en centros de carga y honras de garantía."
        actions={
          <>
            <RangeFilter value={rango} onChange={setRango} periodo={periodo} />
            {puedeChequeos ? (
              <Link to="/gestion-tecnica/nueva">
                <Button leadingIcon={<Plus size={15} />}>Nueva solicitud</Button>
              </Link>
            ) : null}
          </>
        }
        tabs={<UnderlineTabs tabs={TABS} active={tab} onChange={setTab} />}
      />

      {tab !== 'seriales' ? tarjetas : null}
      {tab !== 'seriales' ? analitica : null}

      {tab === 'resumen' ? (
        <div className="grid gap-3.5 lg:grid-cols-2 xl:grid-cols-[1.13fr_1fr_1fr]">
          {rankingCard}

          <section className={cn(PANEL, 'min-w-0 px-4 pb-2 pt-3.5')}>
            <PanelHeader title="Actividad reciente" />
            <div className="mt-1.5">
              <ActividadReciente items={actividad} />
            </div>
          </section>

          {/* El diseño reserva este hueco para personalizar widgets; aquí lo
              ocupa la cola de trabajo, que es lo que el rol tiene pendiente. */}
          <section className={cn(PANEL, 'overflow-hidden pt-3.5 lg:col-span-2 xl:col-span-1')}>
            <PanelHeader
              className="px-4"
              title="Requiere atención"
              toolbar={
                <span className="text-body-xs text-ink-tertiary">
                  {pendientesTotales > 0 ? `${pendientesTotales} pendientes` : 'Sin cola'}
                </span>
              }
            />
            <div className="mt-1.5">
              <TaskQueue items={cola} />
            </div>
          </section>
        </div>
      ) : null}

      {tab === 'analitica' ? rankingCard : null}

      {tab !== 'analitica' ? (
        <RegistrosRecientes
          key={tab}
          filas={filasSerial}
          estados={estadosFiltro}
          ubicaciones={ubicacionesFiltro}
          origenes={origenesFiltro}
          articulos={articulosFiltro}
          tamanoInicial={tab === 'seriales' ? 20 : 5}
        />
      ) : null}
    </div>
  )
}
