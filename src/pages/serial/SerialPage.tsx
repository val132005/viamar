import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  ArrowLeftRight,
  BadgeCheck,
  BatteryCharging,
  Copy,
  History,
  MapPin,
  ScanBarcode,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Stethoscope,
} from 'lucide-react'
import { PanelHeader, UnderlineTabs } from '../../components/panel/PanelWidgets'
import { MetricCard } from '../../components/ui/MetricCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pill } from '../../components/ui/Pill'
import { SectionCard } from '../../components/ui/SectionCard'
import { SerialCell } from '../../components/ui/SerialCell'
import { MetricGrid } from '../../components/ui/Workspace'
import { cn } from '../../lib/cn'
import { EVENT_LABEL, UBICACION_LABEL } from '../../domain/catalogs'
import { formatDate } from '../../domain/dates'
import { STAR_SERIAL, type EventoTipo } from '../../domain/entities'
import { usd } from '../../domain/money'
import { normalizeSerial } from '../../domain/serial'
import { coberturaMes } from '../../domain/warranty/engine'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { humanizeEstado } from '../../domain/estados'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Timeline } from '../../components/ui/Timeline'
import { isBatteryVisible } from '../../hooks/useVisibleBatteries'
import { accountById } from '../../seed/demoAccounts'
import { useAuthStore } from '../../stores/authStore'
import { useBatteryStore } from '../../stores/batteryStore'
import { useCertificateStore } from '../../stores/certificateStore'
import { useChargingStore } from '../../stores/chargingStore'
import { useConfigStore } from '../../stores/configStore'
import { useDistributorStore } from '../../stores/distributorStore'
import { useHistoryStore } from '../../stores/historyStore'
import { useInspectionStore } from '../../stores/inspectionStore'
import { useUiStore } from '../../stores/uiStore'
import { useWarrantyStore } from '../../stores/warrantyStore'

const TECNICOS: EventoTipo[] = ['CHEQUEO', 'ENVIO_CARGA', 'CARGA_COMPLETADA', 'DIAGNOSTICO']
const COMERCIALES: EventoTipo[] = [
  'INGRESO',
  'VENTA_DEALER',
  'VENTA_CLIENTE',
  'CERTIFICADO',
  'SOLICITUD_GARANTIA',
  'HONRA',
  'REEMPLAZO',
]

type Filtro = 'todos' | 'tecnicos' | 'comerciales'

export function SerialPage() {
  const { serial: raw = '' } = useParams()
  const serial = normalizeSerial(raw)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const toast = useUiStore((s) => s.pushToast)
  const user = useAuthStore((s) => s.usuarioActual)
  const bateria = useBatteryStore((s) => s.baterias[serial])
  const articulos = useBatteryStore((s) => s.articulos)
  const marcas = useBatteryStore((s) => s.marcas)
  const articulo = articulos.find((a) => a.id === bateria?.articuloId)
  const marca = marcas.find((m) => m.id === articulo?.marcaId)
  const certificados = useCertificateStore((s) => s.certificados)
  const dealers = useDistributorStore((s) => s.dealers)
  const clientes = useDistributorStore((s) => s.clientes)
  const honras = useWarrantyStore((s) => s.honras)
  const politicas = useConfigStore((s) => s.politicas)
  const solicitudes = useInspectionStore((s) => s.solicitudes)
  const procesos = useChargingStore((s) => s.procesos)
  const centros = useChargingStore((s) => s.centros)
  const allEventos = useHistoryStore((s) => s.eventos)

  const eventos = useMemo(
    () =>
      allEventos
        .filter((e) => e.serial === serial)
        .slice()
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [allEventos, serial],
  )

  if (!bateria || !isBatteryVisible(bateria, user, certificados)) {
    return (
      <EmptyState
        framed
        size="lg"
        icon={ShieldOff}
        title="Sin acceso"
        description={
          user?.rol === 'DISTRIBUIDOR'
            ? 'Este serial no pertenece a su inventario.'
            : `No hay ficha para ${serial}.`
        }
      />
    )
  }

  const certsOfSerial = certificados.filter((c) => c.serial === serial)
  const cert = certsOfSerial[certsOfSerial.length - 1]
  const cliente = cert ? clientes.find((c) => c.id === cert.clienteId) : undefined
  const dealer = cert
    ? dealers.find((d) => d.id === cert.dealerId)
    : bateria.ubicacionTipo === 'DEALER'
      ? dealers.find((d) => d.id === bateria.ubicacionId)
      : undefined
  const honra = honras.find((h) => h.serialOriginal === serial)
  const politica = politicas.find(
    (p) => p.id === bateria.politicaId && p.version === bateria.politicaVersion,
  )
  const linea = solicitudes.flatMap((s) => s.lineas).find((l) => l.serial === serial)
  const carga = procesos.filter((p) => p.serial === serial).slice(-1)[0]
  const centro = carga ? centros.find((c) => c.id === carga.centroId) : undefined
  const ubicacion =
    bateria.ubicacionTipo === 'DEALER'
      ? dealer?.nombre ?? UBICACION_LABEL.DEALER
      : UBICACION_LABEL[bateria.ubicacionTipo]

  const mesesUso = honra?.resultadoCalculo.mesesUso
  const mesesFull = politica?.mesesFull ?? 12
  const mesesProrrateo = politica?.mesesProrrateo ?? 24
  const pctPlazo = mesesUso != null ? Math.round((mesesUso / mesesProrrateo) * 1000) / 10 : 0
  const cob = mesesUso != null ? coberturaMes(mesesUso, mesesFull, mesesProrrateo) : null
  const pctFull = (mesesFull / mesesProrrateo) * 100
  const pctUsado = mesesUso != null ? (mesesUso / mesesProrrateo) * 100 : 0

  const filtrados = eventos.filter((e) => {
    if (filtro === 'tecnicos') return TECNICOS.includes(e.tipo)
    if (filtro === 'comerciales') return COMERCIALES.includes(e.tipo)
    return true
  })

  async function copySerial() {
    try {
      await navigator.clipboard.writeText(serial)
      toast('Serial copiado', 'ok')
    } catch {
      toast('No se pudo copiar', 'warn')
    }
  }

  const chequeo = solicitudes.find((s) => s.lineas.some((l) => l.serial === serial))
  const diagEvento = eventos.find((e) => e.tipo === 'DIAGNOSTICO')
  const cargaEvento = eventos.find((e) => e.tipo === 'CARGA_COMPLETADA')

  const diagItem = bateria.diagnosticoId
  const estadoServicio = honra
    ? `Honrada · ${honra.decisionVigencia}`
    : (UBICACION_LABEL[bateria.ubicacionTipo] ?? bateria.ubicacionTipo)

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeader
        breadcrumbs={[
          { label: 'Trazabilidad', to: '/buscar' },
          ...(chequeo ? [{ label: chequeo.numero, to: `/gestion-tecnica/${chequeo.id}` }] : []),
          { label: serial },
        ]}
        title={serial}
        chips={
          <>
            {diagItem ? <StatusBadge catalogId={diagItem} size="md" /> : null}
            <StatusBadge catalogId={bateria.origen} />
            {serial === STAR_SERIAL ? <Pill tone="brand">Serial estrella · {eventos.length} hitos</Pill> : null}
          </>
        }
        description={`${marca?.nombre ?? '—'} · ${articulo?.codigo ?? ''} · ${articulo?.descripcion ?? ''}`}
        actions={
          <>
            <Link to={chequeo ? `/gestion-tecnica/${chequeo.id}` : '/buscar'}>
              <Button variant="outlined" leadingIcon={<ArrowLeft size={15} />}>
                {chequeo ? `Volver a ${chequeo.numero}` : 'Volver'}
              </Button>
            </Link>
            <Button variant="secondary" leadingIcon={<Copy size={15} />} onClick={copySerial}>
              Copiar serial
            </Button>
            {cert ? (
              <Link to={`/certificado/${cert.id}`}>
                <Button leadingIcon={<ShieldCheck size={15} />}>Consultar certificado</Button>
              </Link>
            ) : null}
          </>
        }
      />

      <MetricGrid columns={4}>
        <MetricCard
          label="Estado de servicio"
          value={<span className="text-metric-lg">{estadoServicio}</span>}
          icon={honra ? ShieldAlert : ShieldCheck}
          tone={honra ? 'danger' : 'ok'}
          context={honra ? `Honra ${humanizeEstado(honra.estado).toLowerCase()}` : 'Sin honra registrada'}
        />
        <MetricCard
          label="Ubicación física"
          value={<span className="text-metric-lg">{ubicacion}</span>}
          icon={MapPin}
          tone="brand"
          context={dealer?.localidad ?? UBICACION_LABEL[bateria.ubicacionTipo]}
        />
        <MetricCard
          label="Certificado digital"
          value={<span className="text-metric-lg">{cert ? `CERT-${cert.estado}` : 'Sin certificado'}</span>}
          icon={BadgeCheck}
          tone={cert?.estado === 'C' ? 'danger' : cert ? 'ok' : 'neutral'}
          filled={Boolean(cert) && cert?.estado !== 'C' ? true : undefined}
          context={
            cert?.estado === 'C'
              ? 'Cancelado — no habilita honra'
              : cert
                ? `Vigente hasta ${formatDate(cert.fechaFinProrrateo)}`
                : 'Se activa con la venta al cliente'
          }
        />
        <MetricCard
          label="Eventos registrados"
          value={eventos.length}
          icon={History}
          tone="accent"
          context={eventos.length ? `Último: ${formatDate(eventos[eventos.length - 1].fecha)}` : 'Sin historial'}
        />
      </MetricGrid>

      <SectionCard title="Datos de la batería" icon={<ScanBarcode />}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3 xl:grid-cols-6">
          <Spec label="Responsable actual" value={ubicacion} hint={dealer?.localidad} />
          <Spec
            label="Canal / tipo de venta"
            value={cert?.dealerId ? 'Venta a distribuidor' : 'Mostrador'}
            hint={cert?.facturaNcf}
          />
          <Spec
            label="Fecha venta original"
            value={cert ? formatDate(cert.fechaVenta) : '—'}
            hint={mesesUso != null ? `Uso a la honra: ${mesesUso} meses` : undefined}
          />
          <Spec
            label="Póliza aplicable"
            value={
              politica
                ? `${politica.nombre} v${politica.version}`
                : `${bateria.politicaId} v${bateria.politicaVersion}`
            }
            hint={politica ? `${politica.mesesFull}m full / ${politica.mesesProrrateo}m prorr.` : undefined}
          />
          <Spec label="Artículo" value={articulo?.codigo ?? '—'} hint={marca?.nombre} />
          <Spec label="Cliente" value={cliente?.nombre ?? '—'} hint={cliente?.documento} />
        </dl>
      </SectionCard>

      <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Certificado digital"
          icon={BadgeCheck}
          badge={cert ? <StatusBadge catalogId={cert.estado} /> : null}
        >
          {mesesUso != null && politica ? (
            <>
              <p className="text-metric-lg text-ink">
                Mes {mesesUso}{' '}
                <span className="text-body-sm font-normal text-ink-secondary">/ {mesesProrrateo} meses</span>
              </p>
              <p className="text-body-xs text-ink-secondary">{pctPlazo} % del plazo</p>
              <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-neutral-100">
                <span className="rounded-l-full bg-success" style={{ width: `${Math.min(pctUsado, pctFull)}%` }} />
                <span className="bg-info" style={{ width: `${Math.max(0, pctUsado - pctFull)}%` }} />
              </div>
              <Nota>
                Cobertura al honrar:{' '}
                <strong className="text-viamar-600">
                  {cob === 100 ? 'Full 100 %' : `Prorrateo ${cob?.toFixed(0)} %`}
                </strong>
              </Nota>
            </>
          ) : (
            <p className="text-body-sm text-ink-secondary">Sin venta registrada.</p>
          )}
        </Card>

        <Card
          title="Último diagnóstico"
          icon={Stethoscope}
          badge={bateria.diagnosticoId ? <StatusBadge catalogId={bateria.diagnosticoId} /> : null}
        >
          {linea ? (
            <>
              <p className="text-metric-lg text-ink">
                {linea.voltaje.toFixed(2)} V{' '}
                <span className="text-body-sm font-normal text-ink-secondary">· {linea.densidad} g/cm³</span>
              </p>
              <p className="text-body-xs text-ink-secondary">
                Capacidad medida: <strong className="text-critical-text">{linea.capacidadMedida} %</strong>
                {articulo ? ` de ${articulo.capacidadNominal} CCA` : ''}
              </p>
              <Nota tono="danger">{linea.accionSugerida}</Nota>
            </>
          ) : (
            <p className="text-body-sm text-ink-secondary">
              {diagEvento?.descripcion ?? 'Sin diagnóstico registrado.'}
            </p>
          )}
        </Card>

        <Card title="Proceso de carga" icon={BatteryCharging}>
          {carga ? (
            <>
              <p className="text-metric-lg text-ink">{carga.porcentajeCarga} %</p>
              <p className="text-body-xs text-ink-secondary">{centro?.nombre ?? carga.centroId}</p>
              <Nota>Resultado: {humanizeEstado(carga.resultado)}</Nota>
            </>
          ) : (
            <p className="text-body-sm text-ink-secondary">
              {cargaEvento?.descripcion ?? 'Sin proceso de carga.'}
            </p>
          )}
        </Card>

        <Card
          title="Unidad sustituta"
          icon={ArrowLeftRight}
          badge={honra ? <Pill tone="brand">Honra {humanizeEstado(honra.estado)}</Pill> : null}
        >
          {bateria.serialReemplazadoPor ? (
            <>
              <SerialCell serial={bateria.serialReemplazadoPor} className="text-headline-md" />
              {honra ? (
                <Nota>
                  Vigencia del reemplazo: <strong>{honra.decisionVigencia}</strong>
                  {honra.decisionVigencia === 'HEREDA'
                    ? ' — conserva la fecha de activación original (WI #2926).'
                    : ' — nueva garantía desde la honra (WI #2926).'}
                </Nota>
              ) : null}
            </>
          ) : (
            <p className="text-body-sm text-ink-secondary">Sin reemplazo.</p>
          )}
        </Card>
      </div>

      {honra && bateria.serialReemplazadoPor ? (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-viamar-200 bg-gradient-to-br from-white to-viamar-50 px-4 py-3 shadow-xs md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-viamar-100/80 text-viamar-600">
              <ArrowLeftRight size={19} />
            </span>
            <div>
              <p className="text-label-lg text-ink">Cadena de identidad: original vs reemplazo</p>
              <p className="text-body-sm text-ink-secondary">
                <span className="font-semibold text-ink">{serial}</span> queda retirada. El serial{' '}
                <SerialCell serial={bateria.serialReemplazadoPor} /> hereda o resetea vigencia según el momento de
                la honra — no se transfiere la póliza a ciegas.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone="neutral">Cliente pagó {usd(honra.resultadoCalculo.montoCliente)}</Pill>
            <Pill tone="brand">Acreditado {usd(honra.resultadoCalculo.montoAcreditar)}</Pill>
          </div>
        </div>
      ) : null}

      {bateria.serialReemplazoDe ? (
        <p className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-body-sm shadow-xs">
          <ArrowLeftRight size={15} className="text-viamar-500" aria-hidden="true" />
          Esta unidad reemplaza a <SerialCell serial={bateria.serialReemplazoDe} />
        </p>
      ) : null}

      <section className="surface px-4 pb-4 pt-3.5">
        <PanelHeader
          title="Trazabilidad cronológica"
          info={`Registro inmutable. ${eventos.length} evento${eventos.length === 1 ? '' : 's'}${serial === STAR_SERIAL ? ' — los 11 hitos del serial estrella.' : '.'}`}
        />
        <div className="mb-4 mt-2">
          <UnderlineTabs
            active={filtro}
            onChange={setFiltro}
            tabs={[
              { id: 'todos', label: 'Todos', count: eventos.length },
              { id: 'tecnicos', label: 'Técnicos', count: eventos.filter((e) => TECNICOS.includes(e.tipo)).length },
              {
                id: 'comerciales',
                label: 'Comerciales',
                count: eventos.filter((e) => COMERCIALES.includes(e.tipo)).length,
              },
            ]}
          />
        </div>
        <Timeline
          events={filtrados.map((e) => ({
            id: e.id,
            title: EVENT_LABEL[e.tipo] ?? e.tipo,
            description: e.descripcion,
            date: formatDate(e.fecha),
            origenId: e.origen,
            actor: accountById(e.usuarioId)?.nombre ?? e.usuarioId,
          }))}
        />
      </section>
    </div>
  )
}

function Spec({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-body-xs text-ink-tertiary">{label}</dt>
      <dd className="mt-0.5 truncate text-label-lg text-ink">{value}</dd>
      {hint ? <dd className="truncate text-body-xs text-ink-secondary">{hint}</dd> : null}
    </div>
  )
}

function Nota({ children, tono = 'brand' }: { children: ReactNode; tono?: 'brand' | 'danger' }) {
  return (
    <p
      className={cn(
        'mt-2 rounded-lg border px-3 py-2 text-body-sm',
        tono === 'danger'
          ? 'border-critical-border/60 bg-critical-soft/60 text-critical-text'
          : 'border-[#e6edf5] bg-[#f7fafd] text-ink',
      )}
    >
      {children}
    </p>
  )
}

function Card({
  title,
  icon: Icon,
  badge,
  children,
}: {
  title: string
  icon: LucideIcon
  badge?: ReactNode
  children: ReactNode
}) {
  return (
    <article className="surface flex flex-col gap-1 p-4 transition-shadow duration-200 hover:shadow-md">
      <div className="mb-2 flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-viamar-50 text-viamar-600">
          <Icon size={16} aria-hidden="true" />
        </span>
        <p className="min-w-0 flex-1 truncate text-headline-sm text-ink">{title}</p>
        {badge}
      </div>
      {children}
    </article>
  )
}
