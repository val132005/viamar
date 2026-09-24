import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  BatteryCharging,
  ClipboardList,
  Clock,
  Handshake,
  Plus,
  ScanLine,
  Shield,
  ShieldAlert,
  Truck,
  Warehouse,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { MetricCard } from '../../components/ui/MetricCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { RangeFilter } from '../../components/ui/RangeFilter'
import { SectionCard } from '../../components/ui/SectionCard'
import { TaskQueue, type QueueItem } from '../../components/ui/TaskQueue'
import { ChartLegend, TrendChart } from '../../components/ui/charts/TrendChart'
import {
  mesLabelCorto,
  mesesDelPeriodo,
  particionar,
  periodoDe,
  serieMensual,
  valores,
  variacion,
  type RangoId,
} from '../../domain/analytics'
import type { EventoHistorico } from '../../domain/entities'
import { useCan, useCanAny } from '../../hooks/usePermission'
import { useVisibleBatteries } from '../../hooks/useVisibleBatteries'
import { useAuthStore } from '../../stores/authStore'
import { useCertificateStore } from '../../stores/certificateStore'
import { useChargingStore } from '../../stores/chargingStore'
import { useHistoryStore } from '../../stores/historyStore'
import { useInspectionStore } from '../../stores/inspectionStore'
import { useWarrantyStore } from '../../stores/warrantyStore'

export function DashboardPage() {
  const user = useAuthStore((s) => s.usuarioActual)
  const baterias = useVisibleBatteries()
  const certificados = useCertificateStore((s) => s.certificados)
  const procesos = useChargingStore((s) => s.procesos)
  const honras = useWarrantyStore((s) => s.honras)
  const solicitudes = useInspectionStore((s) => s.solicitudes)
  const eventos = useHistoryStore((s) => s.eventos)
  const [rango, setRango] = useState<RangoId>('6m')

  /* El panel se ajusta a lo que el rol puede atender. Las cifras de inventario
     ya vienen acotadas por visibilidad, pero las colas de trabajo son globales:
     mostrárselas a un distribuidor sería enseñarle trabajo ajeno. */
  const puedeBuscar = useCan('buscar_serial')
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

  /* Chequeos y cargas se miden sobre sus propios registros: la bitácora sólo
     anota el hito puntual y dejaría la serie casi vacía. */
  const serieChequeos = useMemo(
    () => valores(serieMensual(solicitudes, (s) => s.fechaCreacion, meses)),
    [solicitudes, meses],
  )
  const serieCargas = useMemo(
    () => valores(serieMensual(procesos, (p) => p.fechaInicio, meses)),
    [procesos, meses],
  )
  const certVisibles = useMemo(
    () => certificados.filter((c) => visiblesSerial.has(c.serial)),
    [certificados, visiblesSerial],
  )

  if (!user) return null

  const certE = certVisibles.filter((c) => c.estado === 'E').length
  const certC = certVisibles.filter((c) => c.estado === 'C').length
  const honrasPorAutorizar = honras.filter(
    (h) => h.origen === 'dealer' && h.estado === 'SOLICITADA',
  ).length
  const chequeosAbiertos = solicitudes.filter(
    (s) => s.estado === 'PENDIENTE' || s.estado === 'EN_PROCESO',
  ).length
  const chequeosPendientes = solicitudes.filter((s) => s.estado === 'PENDIENTE').length
  const enDealer = baterias.filter((b) => b.ubicacionTipo === 'DEALER').length
  const enCarga = baterias.filter((b) => b.ubicacionTipo === 'CENTRO_CARGA').length
  const paraGarantia = baterias.filter((b) => b.diagnosticoId === 'PARA_GARANTIA').length
  const descargadas = baterias.filter((b) => b.diagnosticoId === 'DESCARGADA').length
  const aged = baterias.filter((b) => {
    const months = (Date.now() - new Date(b.fechaIngreso).getTime()) / (1000 * 60 * 60 * 24 * 30)
    return b.ubicacionTipo === 'DEALER' && months >= 6
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
  const cargasNuevas = particionar(procesos, (p) => p.fechaInicio, periodo)

  /* El rango exacto ya está escrito en el filtro de la cabecera: repetirlo en
     cada tarjeta alarga la línea hasta invadir la curva. */
  const comparaLabel = periodo.meses ? 'vs. período anterior' : undefined

  /* Cola de trabajo: lo que exige una decisión hoy. No repite la bitácora —
     la bitácora cuenta lo que ya pasó; esto, lo que falta por hacer. */
  const asuntos: QueueItem[] = [
    {
      id: 'chequeos',
      label: 'Chequeos por asignar',
      hint: 'Solicitudes sin técnico asignado',
      count: chequeosPendientes,
      to: '/gestion-tecnica',
      icon: ClipboardList,
      tone: 'warn',
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
      icon: Shield,
      tone: 'danger',
    },
    {
      id: 'carga',
      label: 'Descargadas sin enviar',
      hint: 'Candidatas a proceso de carga',
      count: descargadas,
      to: '/carga',
      icon: BatteryCharging,
      tone: 'warn',
    },
    {
      id: 'aged',
      label: 'Stock envejecido en dealer',
      hint: 'Más de 6 meses sin rotar',
      count: aged,
      to: '/distribuidores',
      icon: Clock,
      tone: 'warn',
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

  const etiquetasMes = useMemo(() => meses.map(mesLabelCorto), [meses])

  return (
    <div className="flex flex-col gap-5 pb-2">
      <PageHeader
        title="Panorama operativo"
        description="Ciclo de vida post-factura: inventario en dealers, diagnóstico en centros de carga y honras de garantía."
        actions={
          <>
            <RangeFilter value={rango} onChange={setRango} periodo={periodo} />
            {puedeBuscar ? (
              <Link to="/buscar">
                <Button variant="secondary" leadingIcon={<ScanLine size={15} />}>
                  Buscar serial
                </Button>
              </Link>
            ) : null}
            {puedeChequeos ? (
              <Link to="/gestion-tecnica/nueva">
                <Button leadingIcon={<Plus size={15} />}>Nueva solicitud</Button>
              </Link>
            ) : null}
          </>
        }
      />

      {/* Seis métricas en dos filas de tres: cada tarjeta tiene sitio para su
          cifra, su variación y su curva sin apelmazarse. */}
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Seriales vivos"
          value={baterias.length}
          note={`${enDealer} en dealer`}
          icon={Warehouse}
          tone="brand"
          trend={seriePorTipo('INGRESO')}
          change={ingresos.change}
          changeLabel={comparaLabel ? `altas ${comparaLabel}` : undefined}
          context={`${ingresos.actuales} altas en el período`}
          to="/buscar"
        />
        <MetricCard
          label="Para garantía"
          value={paraGarantia}
          note="por evaluar"
          icon={ShieldAlert}
          tone="danger"
          trend={seriePorTipo('SOLICITUD_GARANTIA')}
          trendTone="danger"
          change={solicitudesGarantia.change}
          changeLabel={comparaLabel ? `solicitudes ${comparaLabel}` : undefined}
          context={`${solicitudesGarantia.actuales} solicitudes en el período`}
          subirEsBueno={false}
          to="/buscar"
        />
        {puedeChequeos ? (
          <MetricCard
            label="Chequeos abiertos"
            value={chequeosAbiertos}
            note={chequeosPendientes > 0 ? `${chequeosPendientes} sin asignar` : 'todos asignados'}
            icon={ClipboardList}
            tone="warn"
            trend={serieChequeos}
            trendTone="warn"
            change={variacion(
              chequeosNuevos.actuales.length,
              chequeosNuevos.previos.length,
              chequeosNuevos.comparable,
            )}
            changeLabel={comparaLabel ? `solicitudes ${comparaLabel}` : undefined}
            context={`${chequeosNuevos.actuales.length} solicitudes en el período`}
            subirEsBueno={false}
            to="/gestion-tecnica"
          />
        ) : null}
        <MetricCard
          label="Descargadas"
          value={descargadas}
          note="pendientes o en evaluación"
          icon={BatteryCharging}
          tone="accent"
          trend={seriePorTipo('ENVIO_CARGA')}
          trendTone="accent"
          change={enviosCarga.change}
          changeLabel={comparaLabel ? `envíos ${comparaLabel}` : undefined}
          context={`${enviosCarga.actuales} envíos en el período`}
          to="/carga"
        />
        <MetricCard
          label="En centro de carga"
          value={enCarga}
          note="por orden de llegada"
          icon={Truck}
          tone="brand"
          trend={serieCargas}
          change={variacion(
            cargasNuevas.actuales.length,
            cargasNuevas.previos.length,
            cargasNuevas.comparable,
          )}
          changeLabel={comparaLabel ? `procesos abiertos ${comparaLabel}` : undefined}
          context={`${cargasNuevas.actuales.length} procesos en el período`}
          to="/carga"
        />
        <MetricCard
          label="Certificados vigentes"
          value={`${certE} / ${certVisibles.length}`}
          note={certC > 0 ? `${certC} cancelados` : 'ninguno cancelado'}
          icon={BadgeCheck}
          tone="ok"
          trend={seriePorTipo('CERTIFICADO')}
          trendTone="ok"
          change={certEmitidos.change}
          changeLabel={comparaLabel ? `emisiones ${comparaLabel}` : undefined}
          context={`${certEmitidos.actuales} emisiones en el período`}
          to="/certificados"
        />
      </div>

      {/* Movimiento a la izquierda, decisiones pendientes a la derecha: cómo va
          la operación y qué hay que hacer con ella, en la misma pantalla. */}
      <div className="grid gap-3.5 xl:grid-cols-3">
        <SectionCard
          title="Movimiento de seriales"
          description="Hechos registrados cada mes en la bitácora"
          className="xl:col-span-2"
        >
          <ChartLegend
            align="center"
            className="mb-3"
            items={[
              { id: 'ingreso', label: 'Ingresos', tono: 'brand' },
              { id: 'certificado', label: 'Certificados', tono: 'ok' },
              { id: 'honra', label: 'Honras', tono: 'danger' },
            ]}
          />
          <TrendChart
            labels={etiquetasMes}
            series={[
              {
                id: 'ingreso',
                label: 'Ingresos',
                tono: 'brand',
                data: seriePorTipo('INGRESO'),
                area: true,
              },
              {
                id: 'certificado',
                label: 'Certificados',
                tono: 'ok',
                data: seriePorTipo('CERTIFICADO'),
              },
              {
                id: 'honra',
                label: 'Honras',
                tono: 'danger',
                data: seriePorTipo('HONRA'),
              },
            ]}
            height={250}
            emptyMessage="Todavía no hay movimientos registrados en el período."
          />
        </SectionCard>

        <SectionCard
          title="Requiere atención"
          description={
            pendientesTotales > 0
              ? `${pendientesTotales} asuntos pendientes`
              : 'Sin trabajo en cola'
          }
          flush
        >
          <TaskQueue items={cola} />
        </SectionCard>
      </div>
    </div>
  )
}
