import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ScanBarcode, ShieldAlert, Truck, Warehouse } from 'lucide-react'
import {
  BarrasComposicion,
  DonaEstado,
  PanelHeader,
  RegistrosRecientes,
  ResumenCard,
  SelectPill,
  UnderlineTabs,
  type FilaComposicion,
  type SegmentoDona,
} from '../../components/panel/PanelWidgets'
import { PANEL, TONO_HEX, type Tono } from '../../components/panel/tonos'
import { SerialDetailPanel } from '../../components/panel/SerialDetailPanel'
import { useFilasSerial } from '../../components/panel/useFilasSerial'
import { PageHeader } from '../../components/ui/PageHeader'
import { RangeFilter } from '../../components/ui/RangeFilter'
import {
  mesesDelPeriodo,
  particionar,
  periodoDe,
  porcentaje,
  serieMensual,
  valores,
  variacion,
  type RangoId,
} from '../../domain/analytics'
import { DIAGNOSTICO_CATALOG, ORIGEN_CATALOG, UBICACION_LABEL } from '../../domain/catalogs'
import type { EventoTipo, UbicacionTipo } from '../../domain/entities'
import { searchVisible, useVisibleBatteries } from '../../hooks/useVisibleBatteries'
import { cn } from '../../lib/cn'
import { useAuthStore } from '../../stores/authStore'
import { useHistoryStore } from '../../stores/historyStore'

type TabId = 'todos' | 'dealer' | 'carga' | 'garantia'

/* Mismo color que la etiqueta de estado de la tabla: el verde de la dona es el
   verde de «Buen estado» dos bloques más abajo. */
const DIAGNOSTICO_TONO: Record<string, Tono> = {
  BUEN_ESTADO: 'ok',
  DESCARGADA: 'warn',
  PARA_GARANTIA: 'danger',
  DANADA: 'navy',
  PENDIENTE: 'neutral',
}

/* Los tres diagnósticos que importan para leer una ubicación de un vistazo.
   El resto no se pinta para que la barra no se fragmente en astillas. */
const COMPOSICION = ['BUEN_ESTADO', 'DESCARGADA', 'PARA_GARANTIA']

const LABEL_DIAGNOSTICO = (id: string) =>
  DIAGNOSTICO_CATALOG.find((d) => d.id === id)?.label ?? id

const UBICACIONES = Object.keys(UBICACION_LABEL) as UbicacionTipo[]

/* A partir de este ancho el detalle se acopla junto a la lista; por debajo
   flota sobre ella y sólo se abre cuando el usuario lo pide. */
const ANCHO_ACOPLADO = '(min-width: 1440px)'

function useAcoplado() {
  const [acoplado, setAcoplado] = useState(() => window.matchMedia(ANCHO_ACOPLADO).matches)
  useEffect(() => {
    const mq = window.matchMedia(ANCHO_ACOPLADO)
    const onChange = (e: MediaQueryListEvent) => setAcoplado(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return acoplado
}

/** «1 solicitud», «3 solicitudes»: el contexto de una tarjeta se lee como frase. */
const cuenta = (n: number, singular: string, plural = singular + 's') =>
  `${n} ${n === 1 ? singular : plural}`

export function SearchPage() {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [tab, setTab] = useState<TabId>('todos')
  const [rango, setRango] = useState<RangoId>('6m')
  const [vistaUbicacion, setVistaUbicacion] = useState<'todas' | UbicacionTipo>('todas')
  /* undefined: sigue al primer resultado; null: el usuario cerró el panel. */
  const [seleccion, setSeleccion] = useState<string | null | undefined>(undefined)
  const acoplado = useAcoplado()
  const user = useAuthStore((s) => s.usuarioActual)
  const eventos = useHistoryStore((s) => s.eventos)

  const visibles = useVisibleBatteries()
  /* La búsqueda cubre CIB, documento y nombre del cliente; por eso se resuelve
     aquí y la tabla recibe ya las filas que coinciden. */
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

  const { filas, titularDe } = useFilasSerial(rows)

  const activo =
    seleccion === undefined ? (acoplado ? filas[0]?.serial : undefined) : (seleccion ?? undefined)
  const cerrarDetalle = useCallback(() => setSeleccion(null), [])
  const conDetalle = Boolean(activo) && acoplado

  const periodo = useMemo(() => periodoDe(rango), [rango])

  /* La historia de los seriales buscados: las curvas y las variaciones
     responden a la búsqueda, igual que las cifras. */
  const seriales = useMemo(() => new Set(base.map((b) => b.serial)), [base])
  const propios = useMemo(() => eventos.filter((e) => seriales.has(e.serial)), [eventos, seriales])
  const meses = useMemo(
    () =>
      mesesDelPeriodo(
        periodo,
        propios.map((e) => e.fecha),
      ),
    [periodo, propios],
  )

  /* Dónde está el parque y en qué estado. Se deriva del mismo conjunto que
     alimenta la tabla, así que responde siempre a la búsqueda y a la pestaña. */
  const porUbicacion: FilaComposicion[] = useMemo(() => {
    const mapa = new Map<string, { label: string; total: number; conteo: Map<string, number> }>()
    /* «Todas» agrupa por tipo salvo los dealers, que se nombran uno a uno;
       al elegir un tipo, se desglosa por quien tiene cada serial. */
    const desglosa = (t: UbicacionTipo) =>
      vistaUbicacion === 'todas' ? t === 'DEALER' : t === 'DEALER' || t === 'CENTRO_CARGA' || t === 'CLIENTE'
    for (const b of rows) {
      if (vistaUbicacion !== 'todas' && b.ubicacionTipo !== vistaUbicacion) continue
      const label = desglosa(b.ubicacionTipo)
        ? titularDe(b.ubicacionTipo, b.ubicacionId)
        : (UBICACION_LABEL[b.ubicacionTipo] ?? b.ubicacionTipo)
      const actual = mapa.get(label) ?? { label, total: 0, conteo: new Map() }
      actual.total += 1
      actual.conteo.set(b.diagnosticoId, (actual.conteo.get(b.diagnosticoId) ?? 0) + 1)
      mapa.set(label, actual)
    }
    return [...mapa.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map((u) => ({
        id: u.label,
        label: u.label,
        total: u.total,
        tramos: COMPOSICION.map((id) => ({
          id,
          label: LABEL_DIAGNOSTICO(id),
          valor: u.conteo.get(id) ?? 0,
          tono: DIAGNOSTICO_TONO[id],
        })),
      }))
  }, [rows, titularDe, vistaUbicacion])

  const tendencia = (tipo: EventoTipo) => {
    const deTipo = propios.filter((e) => e.tipo === tipo)
    const { actuales, previos, comparable } = particionar(deTipo, (e) => e.fecha, periodo)
    return {
      serie: valores(serieMensual(deTipo, (e) => e.fecha, meses)),
      change: variacion(actuales.length, previos.length, comparable),
      actuales: actuales.length,
    }
  }

  const enDealer = base.filter((b) => b.ubicacionTipo === 'DEALER').length
  const enCarga = base.filter((b) => b.ubicacionTipo === 'CENTRO_CARGA').length
  const paraGarantia = base.filter((b) => b.diagnosticoId === 'PARA_GARANTIA').length

  const ingresos = tendencia('INGRESO')
  const ventasDealer = tendencia('VENTA_DEALER')
  const enviosCarga = tendencia('ENVIO_CARGA')
  const solicitudes = tendencia('SOLICITUD_GARANTIA')

  const segmentosDiagnostico: SegmentoDona[] = DIAGNOSTICO_CATALOG.map((d) => ({
    id: d.id,
    label: d.label,
    valor: rows.filter((b) => b.diagnosticoId === d.id).length,
    tono: DIAGNOSTICO_TONO[d.id] ?? 'neutral',
  }))

  const totalUbicaciones = porUbicacion.reduce((acc, u) => acc + u.total, 0)

  const estadosFiltro = DIAGNOSTICO_CATALOG.filter((d) =>
    rows.some((b) => b.diagnosticoId === d.id),
  ).map((d) => ({ value: d.id, label: d.label }))
  const ubicacionesFiltro = UBICACIONES.filter((t) => rows.some((b) => b.ubicacionTipo === t)).map(
    (t) => ({ value: t, label: UBICACION_LABEL[t] ?? t }),
  )
  const origenesFiltro = ORIGEN_CATALOG.filter((o) => rows.some((b) => b.origen === o.id)).map(
    (o) => ({ value: o.id, label: o.label }),
  )
  const articulosFiltro = [...new Set(filas.map((f) => f.articulo))]
    .sort((x, y) => x.localeCompare(y, 'es'))
    .map((x) => ({ value: x, label: x }))

  const buscando = q.trim().length > 0

  return (
    <div
      className={cn(
        'pb-2',
        activo && 'min-[1440px]:grid min-[1440px]:grid-cols-[minmax(0,1fr)_360px] min-[1440px]:items-start min-[1440px]:gap-4',
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <PageHeader
          title="Trazabilidad de seriales"
          description="Búsqueda por CIB, documento del cliente o nombre. El resultado respeta el alcance de visibilidad de tu rol."
          actions={<RangeFilter value={rango} onChange={setRango} periodo={periodo} />}
          tabs={
            <UnderlineTabs
              active={tab}
              onChange={setTab}
              tabs={[
                { id: 'todos', label: 'Todos', count: base.length },
                { id: 'dealer', label: 'En dealer', count: enDealer },
                { id: 'carga', label: 'En carga', count: enCarga },
                { id: 'garantia', label: 'Para garantía', count: paraGarantia, tone: 'danger' },
              ]}
            />
          }
        />

        {/* Con el detalle acoplado queda menos ancho: las tarjetas pasan a dos
            por fila hasta que vuelve a haber sitio para las cuatro. */}
        <div
          className={cn(
            'grid gap-3.5 sm:grid-cols-2',
            conDetalle ? 'min-[1720px]:grid-cols-4' : 'xl:grid-cols-4',
          )}
        >
          <ResumenCard
            label="Seriales visibles"
            value={buscando ? base.length : visibles.length}
            note={buscando ? `de ${visibles.length} visibles` : 'Alcance de tu rol'}
            icon={ScanBarcode}
            tone="brand"
            trend={ingresos.serie}
            change={ingresos.change}
            context={`${cuenta(ingresos.actuales, 'alta')} en el período`}
          />
          <ResumenCard
            label="En dealer"
            value={enDealer}
            note={`${porcentaje(enDealer, base.length)}% del parque`}
            icon={Warehouse}
            tone="navy"
            trend={ventasDealer.serie}
            change={ventasDealer.change}
            context={`${cuenta(ventasDealer.actuales, 'venta')} a dealer`}
          />
          <ResumenCard
            label="En carga"
            value={enCarga}
            note={`${porcentaje(enCarga, base.length)}% del parque`}
            icon={Truck}
            tone="neutral"
            trend={enviosCarga.serie}
            change={enviosCarga.change}
            context={`${cuenta(enviosCarga.actuales, 'envío')} a carga`}
            subirEsBueno={false}
          />
          <ResumenCard
            label="Para garantía"
            value={paraGarantia}
            note={`${porcentaje(paraGarantia, base.length)}% del parque`}
            icon={ShieldAlert}
            tone="danger"
            trend={solicitudes.serie}
            change={solicitudes.change}
            context={cuenta(solicitudes.actuales, 'solicitud', 'solicitudes')}
            subirEsBueno={false}
          />
        </div>

        <div
          className={cn(
            'grid gap-3.5',
            conDetalle ? 'min-[1720px]:grid-cols-[45fr_55fr]' : 'lg:grid-cols-[45fr_55fr]',
          )}
        >
          <section className={cn(PANEL, 'min-w-0 px-4 pb-4 pt-3.5')}>
            <PanelHeader
              title="Diagnóstico del parque"
              info="Último diagnóstico registrado de cada serial del resultado."
            />
            <div className="mt-3">
              <DonaEstado segmentos={segmentosDiagnostico} unidad="seriales" />
            </div>
          </section>

          <section className={cn(PANEL, 'min-w-0 px-4 pb-3 pt-3.5')}>
            <PanelHeader
              title="Distribución por ubicación"
              toolbar={
                <SelectPill
                  value={vistaUbicacion}
                  onChange={setVistaUbicacion}
                  ariaLabel="Ver distribución de"
                  options={[
                    { value: 'todas', label: 'Todas las ubicaciones' },
                    ...UBICACIONES.filter((t) => rows.some((b) => b.ubicacionTipo === t)).map((t) => ({
                      value: t,
                      label: UBICACION_LABEL[t] ?? t,
                    })),
                  ]}
                />
              }
            />
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <p className="text-body-xs text-ink-tertiary">
                {totalUbicaciones} seriales en los grupos con más existencias
              </p>
              <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {COMPOSICION.map((id) => (
                  <li key={id} className="flex items-center gap-1.5 text-body-xs text-ink-secondary">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: TONO_HEX[DIAGNOSTICO_TONO[id]] }}
                      aria-hidden="true"
                    />
                    {LABEL_DIAGNOSTICO(id)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-1.5">
              <BarrasComposicion filas={porUbicacion} />
            </div>
          </section>
        </div>

        <RegistrosRecientes
          titulo="Resultados"
          filas={filas}
          query={q}
          onQueryChange={setQ}
          placeholder="Serial, documento o nombre del cliente..."
          vacio={buscando ? `No hay resultados para «${q}».` : 'Ningún serial coincide con los filtros.'}
          estados={estadosFiltro}
          ubicaciones={ubicacionesFiltro}
          origenes={origenesFiltro}
          articulos={articulosFiltro}
          tamanoInicial={10}
          seleccionado={activo}
          onSeleccionar={setSeleccion}
        />
      </div>

      {activo ? <SerialDetailPanel serial={activo} onClose={cerrarDetalle} /> : null}
    </div>
  )
}
