import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowLeftRight, Copy, MapPin, ShieldCheck, ShieldOff } from 'lucide-react'
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 surface p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <nav className="flex flex-wrap items-center gap-1 text-label-sm text-ink-secondary">
            <Link className="hover:text-viamar-700" to="/">
              Trazabilidad
            </Link>
            <span>/</span>
            <span>Ficha de batería</span>
            <span>/</span>
            <span className="rounded bg-viamar-100 px-1.5 py-0.5 font-code-serial text-viamar-700">{serial}</span>
          </nav>
          {chequeo ? (
            <Link
              className="mt-2 inline-flex items-center gap-1 text-label-md text-viamar-700 hover:text-viamar-link-hover"
              to={`/gestion-tecnica/${chequeo.id}`}
            >
              <ArrowLeft size={16} />
              Volver a solicitud {chequeo.numero}
            </Link>
          ) : (
            <Link
              className="mt-2 inline-flex items-center gap-1 text-label-md text-viamar-700 hover:text-viamar-link-hover"
              to="/"
            >
              <ArrowLeft size={16} />
              Volver al dashboard
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outlined" onClick={copySerial}>
            <Copy size={16} /> Copiar serial
          </Button>
          {cert ? (
            <Link
              className="inline-flex h-10 items-center gap-2 rounded bg-viamar-500 px-4 text-body-md font-semibold text-white hover:bg-viamar-600"
              to={`/certificado/${cert.id}`}
            >
              <ShieldCheck size={16} /> Consultar certificado
            </Link>
          ) : null}
        </div>
      </div>

      <section className="surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-viamar-500 px-2 py-0.5 text-label-sm uppercase tracking-widest text-white">
            {marca?.nombre ?? '—'}
          </span>
          <span className="rounded bg-app-surface-alt px-2 py-0.5 text-label-sm">{articulo?.codigo}</span>
          <StatusBadge catalogId={bateria.origen} />
          {serial === STAR_SERIAL ? (
            <span className="rounded bg-viamar-50 px-2 py-0.5 text-label-sm text-viamar-700">
              Serial estrella · {eventos.length} hitos
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-label-sm uppercase tracking-widest text-ink-secondary">
          Código de identificación de batería (CIB)
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-code-serial text-headline-xl text-viamar-700">{serial}</h1>
            <p className="mt-1 text-headline-sm">{articulo?.descripcion}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded bg-danger/10 p-2">
              <ShieldCheck className="text-danger" size={18} />
              <div>
                <p className="text-label-sm uppercase text-danger">Estado de servicio</p>
                <p className="text-label-md">
                  {honra ? `Honrada · ${honra.decisionVigencia}` : UBICACION_LABEL[bateria.ubicacionTipo]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded bg-app-surface-alt p-2">
              <MapPin className="text-viamar-500" size={18} />
              <div>
                <p className="text-label-sm uppercase text-ink-secondary">Ubicación física</p>
                <p className="text-label-md">{ubicacion}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded bg-app-surface-alt p-3 md:grid-cols-3 lg:grid-cols-6">
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
          <Spec
            label="Certificado digital"
            value={cert ? `CERT-${cert.estado}` : '—'}
            hint={
              cert?.estado === 'C'
                ? 'Cancelado — no habilita honra'
                : cert
                  ? `Vigente hasta ${formatDate(cert.fechaFinProrrateo)}`
                  : undefined
            }
          />
          <Spec label="Cliente" value={cliente?.nombre ?? '—'} hint={cliente?.documento} />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Certificado digital" badge={cert ? <StatusBadge catalogId={cert.estado} /> : null}>
          {mesesUso != null && politica ? (
            <>
              <p className="text-headline-lg text-viamar-700">
                Mes {mesesUso}{' '}
                <span className="text-body-sm font-normal text-ink-secondary">/ {mesesProrrateo} meses</span>
              </p>
              <p className="text-label-sm text-ink-secondary">{pctPlazo} % del plazo</p>
              <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-app-border">
                <span className="bg-viamar-500" style={{ width: `${Math.min(pctUsado, pctFull)}%` }} />
                <span className="bg-viamar-accent" style={{ width: `${Math.max(0, pctUsado - pctFull)}%` }} />
              </div>
              <p className="mt-2 rounded bg-app-surface-alt p-2 text-body-sm">
                Cobertura al honrar:{' '}
                <strong className="text-viamar-700">
                  {cob === 100 ? 'Full 100 %' : `Prorrateo ${cob?.toFixed(0)} %`}
                </strong>
              </p>
            </>
          ) : (
            <p className="text-body-sm text-ink-secondary">Sin venta registrada.</p>
          )}
        </Card>

        <Card
          title="Último diagnóstico"
          badge={bateria.diagnosticoId ? <StatusBadge catalogId={bateria.diagnosticoId} /> : null}
        >
          {linea ? (
            <>
              <p className="text-headline-lg text-danger">
                {linea.voltaje.toFixed(2)} V{' '}
                <span className="text-body-sm font-normal text-ink-secondary">| {linea.densidad} g/cm³</span>
              </p>
              <p className="text-body-sm text-ink-secondary">
                Capacidad medida: <strong className="text-danger">{linea.capacidadMedida} %</strong>
                {articulo ? ` de ${articulo.capacidadNominal} CCA` : ''}
              </p>
              <p className="mt-2 rounded bg-danger/10 p-2 text-body-sm">{linea.accionSugerida}</p>
            </>
          ) : (
            <p className="text-body-sm text-ink-secondary">
              {diagEvento?.descripcion ?? 'Sin diagnóstico registrado.'}
            </p>
          )}
        </Card>

        <Card title="Proceso de carga">
          {carga ? (
            <>
              <p className="text-headline-lg">{carga.porcentajeCarga} %</p>
              <p className="text-body-sm text-ink-secondary">{centro?.nombre ?? carga.centroId}</p>
              <p className="mt-2 rounded bg-app-surface-alt p-2 text-body-sm">Resultado: {carga.resultado}</p>
            </>
          ) : (
            <p className="text-body-sm text-ink-secondary">
              {cargaEvento?.descripcion ?? 'Sin proceso de carga.'}
            </p>
          )}
        </Card>

        <Card
          title="Unidad sustituta"
          badge={
            honra ? (
              <span className="rounded-sm bg-viamar-50 px-2 py-0.5 text-label-md text-viamar-800 ring-1 ring-inset ring-viamar-200">
                Honra {humanizeEstado(honra.estado)}
              </span>
            ) : null
          }
        >
          {bateria.serialReemplazadoPor ? (
            <>
              <Link
                className="font-code-serial text-headline-md text-viamar-700 hover:text-viamar-link-hover"
                to={`/serial/${bateria.serialReemplazadoPor}`}
              >
                {bateria.serialReemplazadoPor}
              </Link>
              {honra ? (
                <p className="mt-2 rounded bg-viamar-50 p-2 text-body-sm">
                  Vigencia del reemplazo: <strong>{honra.decisionVigencia}</strong>
                  {honra.decisionVigencia === 'HEREDA'
                    ? ' — conserva la fecha de activación original (WI #2926).'
                    : ' — nueva garantía desde la honra (WI #2926).'}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-body-sm text-ink-secondary">Sin reemplazo.</p>
          )}
        </Card>
      </div>

      {honra && bateria.serialReemplazadoPor ? (
        <div className="flex flex-col items-start justify-between gap-3 surface p-4 md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-viamar-100 text-viamar-700">
              <ArrowLeftRight size={22} />
            </span>
            <div>
              <p className="text-label-lg">Cadena de identidad: original vs reemplazo</p>
              <p className="text-body-sm text-ink-secondary">
                <span className="font-code-serial text-ink">{serial}</span> queda retirada. El serial{' '}
                <span className="font-code-serial text-viamar-700">{bateria.serialReemplazadoPor}</span>{' '}
                hereda o resetea vigencia según el momento de la honra — no se transfiere la póliza a ciegas.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded bg-app-surface-alt px-3 py-1 font-mono text-label-sm">
              Cliente pagó {usd(honra.resultadoCalculo.montoCliente)}
            </span>
            <span className="rounded bg-viamar-50 px-3 py-1 font-mono text-label-sm text-viamar-800">
              Acreditado {usd(honra.resultadoCalculo.montoAcreditar)}
            </span>
          </div>
        </div>
      ) : null}

      {bateria.serialReemplazoDe ? (
        <p className="text-body-sm">
          Esta unidad reemplaza a{' '}
          <Link
            className="font-code-serial text-viamar-700 hover:text-viamar-link-hover"
            to={`/serial/${bateria.serialReemplazoDe}`}
          >
            {bateria.serialReemplazoDe}
          </Link>
        </p>
      ) : null}

      <section className="surface p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-headline-lg text-viamar-800">Trazabilidad cronológica</h2>
            <p className="text-body-sm text-ink-secondary">
              Registro inmutable. {eventos.length} evento{eventos.length === 1 ? '' : 's'}
              {serial === STAR_SERIAL ? ' — los 11 hitos del serial estrella.' : '.'}
            </p>
          </div>
          <div className="flex rounded bg-app-surface-alt p-1">
            {(
              [
                ['todos', `Todos (${eventos.length})`],
                ['tecnicos', 'Técnicos'],
                ['comerciales', 'Comerciales'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFiltro(id)}
                className={
                  filtro === id
                    ? 'rounded bg-white px-3 py-1 text-label-sm text-viamar-700 shadow-panel'
                    : 'px-3 py-1 text-label-sm text-ink-secondary hover:text-ink'
                }
              >
                {label}
              </button>
            ))}
          </div>
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
    <div>
      <p className="text-label-sm text-ink-secondary">{label}</p>
      <p className="truncate text-label-md">{value}</p>
      {hint ? <p className="truncate text-body-sm text-ink-secondary">{hint}</p> : null}
    </div>
  )
}

function Card({ title, badge, children }: { title: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <article className="surface flex flex-col gap-1.5 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-label-md">{title}</p>
        {badge}
      </div>
      {children}
    </article>
  )
}
