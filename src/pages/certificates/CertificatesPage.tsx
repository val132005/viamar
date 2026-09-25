import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  BadgePlus,
  Car,
  FileText,
  FileX2,
  Repeat,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { DonaEstado, PanelHeader, Ranking, type SegmentoDona } from '../../components/panel/PanelWidgets'
import { PANEL } from '../../components/panel/tonos'
import { SectionCard } from '../../components/ui/SectionCard'
import { cn } from '../../lib/cn'
import { DataTable } from '../../components/ui/DataTable'
import { SerialCell } from '../../components/ui/SerialCell'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { MetricCard } from '../../components/ui/MetricCard'
import { MetricGrid } from '../../components/ui/Workspace'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageTabs } from '../../components/ui/PageTabs'
import { Pill } from '../../components/ui/Pill'
import { FormField, SelectField, TextAreaField } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { addMonths, formatDate, iso, monthsElapsed } from '../../domain/dates'
import { normalizeSerial } from '../../domain/serial'
import type { Certificado } from '../../domain/entities'
import { useBatteryStore } from '../../stores/batteryStore'
import { useCertificateStore } from '../../stores/certificateStore'
import { useConfigStore } from '../../stores/configStore'
import { useDistributorStore } from '../../stores/distributorStore'
import { withHistory } from '../../stores/historyStore'
import { useUiStore } from '../../stores/uiStore'

type FiltroEstado = 'todos' | 'E' | 'C' | 'heredado'

const FILTROS: { id: FiltroEstado; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'E', label: 'CERT-E vigentes' },
  { id: 'C', label: 'CERT-C cancelados' },
  { id: 'heredado', label: 'Heredados por honra' },
]

export function CertificatesPage() {
  const certificados = useCertificateStore((s) => s.certificados)
  const clientes = useDistributorStore((s) => s.clientes)
  const dealers = useDistributorStore((s) => s.dealers)
  const [filtro, setFiltro] = useState<FiltroEstado>('todos')
  const [q, setQ] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const rows = useMemo(() => {
    const needle = q.trim().toUpperCase()
    return certificados
      .filter((c) => {
        if (filtro === 'E' || filtro === 'C') return c.estado === filtro
        if (filtro === 'heredado') return Boolean(c.heredadoDe)
        return true
      })
      .filter((c) => (needle ? c.serial.toUpperCase().includes(needle) : true))
      .slice()
      .sort((a, b) => b.fechaVenta.localeCompare(a.fechaVenta))
  }, [certificados, filtro, q])

  /* Los contadores describen el universo completo, no el filtro activo: una
     pestaña tiene que decir cuántos hay al otro lado antes de pulsarla. */
  const conteos = useMemo<Record<FiltroEstado, number>>(
    () => ({
      todos: certificados.length,
      E: certificados.filter((c) => c.estado === 'E').length,
      C: certificados.filter((c) => c.estado === 'C').length,
      heredado: certificados.filter((c) => Boolean(c.heredadoDe)).length,
    }),
    [certificados],
  )

  const porEstado: SegmentoDona[] = [
    { id: 'E', label: 'CERT-E vigentes', valor: conteos.E - certificados.filter((c) => c.estado === 'E' && c.heredadoDe).length, tono: 'ok' },
    { id: 'heredado', label: 'Heredados por honra', valor: certificados.filter((c) => c.estado === 'E' && c.heredadoDe).length, tono: 'accent' },
    { id: 'C', label: 'CERT-C cancelados', valor: conteos.C, tono: 'danger' },
  ]
  const porDealer = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const c of certificados) {
      const k = c.dealerId ?? 'directo'
      mapa.set(k, (mapa.get(k) ?? 0) + 1)
    }
    return [...mapa.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, valor]) => ({
        id,
        label: id === 'directo' ? 'Venta directa Viamar' : (dealers.find((d) => d.id === id)?.nombre ?? id),
        valor,
        to: id === 'directo' ? undefined : `/distribuidores/${id}`,
      }))
  }, [certificados, dealers])

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeader
        title="Certificados"
        description="Emisión, vigencia y cancelación del certificado digital que acompaña a cada batería vendida."
        actions={
          <Button leadingIcon={<BadgePlus size={15} />} onClick={() => setFormOpen(true)}>
            Emitir certificado
          </Button>
        }
        tabs={
          <PageTabs
            active={filtro}
            onChange={(id) => setFiltro(id as FiltroEstado)}
            tabs={FILTROS.map((f) => ({
              id: f.id,
              label: f.label,
              count: conteos[f.id],
              tone: f.id === 'C' ? ('danger' as const) : ('default' as const),
            }))}
          />
        }
      />

      <MetricGrid columns={4}>
        <MetricCard
          label="Certificados emitidos"
          value={certificados.length}
          icon={BadgeCheck}
          tone="brand"
          context="Histórico completo"
        />
        <MetricCard
          label="CERT-E vigentes"
          value={conteos.E}
          icon={ShieldCheck}
          tone="ok"
          filled={conteos.E > 0}
          context={
            certificados.length
              ? `${Math.round((conteos.E / certificados.length) * 100)}% del total emitido`
              : undefined
          }
        />
        <MetricCard
          label="CERT-C cancelados"
          value={conteos.C}
          icon={FileX2}
          tone="danger"
          filled={conteos.C > 0}
          context="Bloquean la honra de su serial"
        />
        <MetricCard
          label="Heredados por honra"
          value={conteos.heredado}
          icon={Repeat}
          tone="accent"
          filled={conteos.heredado > 0}
          context="Emitidos al reemplazar una batería"
        />
      </MetricGrid>

      <div className="grid gap-3.5 lg:grid-cols-[45fr_55fr]">
        <section className={cn(PANEL, 'min-w-0 px-4 pb-4 pt-3.5')}>
          <PanelHeader title="Certificados por estado" info="Estado actual de cada certificado emitido." />
          <div className="mt-3">
            <DonaEstado segmentos={porEstado} unidad="certificados" />
          </div>
        </section>
        <section className={cn(PANEL, 'min-w-0 px-4 pb-3 pt-3.5')}>
          <PanelHeader title="Certificados por punto de venta" info="Dónde se vendió la batería certificada." />
          <div className="mt-1.5">
            <Ranking filas={porDealer} total={certificados.length} />
          </div>
        </section>
      </div>

      <DataTable
        title="Certificados emitidos"
        fill={false}
        search={{ value: q, onChange: setQ, placeholder: 'Buscar por serial (p. ej. CIB-908…)' }}
        columns={[
          {
            key: 'serial',
            header: 'Serial',
            primary: true,
            width: '170px',
            sortable: true,
            render: (c: Certificado) => (
              <SerialCell serial={c.serial} to={`/certificados/${c.id}`} />
            ),
          },
          {
            key: 'estado',
            header: 'Estado',
            width: '170px',
            sortable: true,
            render: (c: Certificado) => <StatusBadge catalogId={c.estado} />,
          },
          {
            key: 'heredado',
            header: 'Herencia',
            width: '160px',
            render: (c: Certificado) =>
              c.heredadoDe ? (
                <Pill tone="info">Heredado por honra</Pill>
              ) : (
                <span className="text-ink-disabled">—</span>
              ),
          },
          {
            key: 'cliente',
            header: 'Cliente',
            sortable: true,
            sortValue: (c: Certificado) =>
              clientes.find((x) => x.id === c.clienteId)?.nombre ?? c.clienteId,
            render: (c: Certificado) =>
              clientes.find((x) => x.id === c.clienteId)?.nombre ?? c.clienteId,
          },
          {
            key: 'ncf',
            header: 'NCF',
            width: '140px',
            secondary: true,
            render: (c: Certificado) => c.facturaNcf,
          },
          {
            key: 'venta',
            header: 'Venta',
            align: 'right',
            width: '130px',
            sortable: true,
            sortValue: (c: Certificado) => c.fechaVenta,
            render: (c: Certificado) => formatDate(c.fechaVenta),
          },
        ]}
        rows={rows}
        rowKey={(c) => c.id}
        rowTone={(c) => (c.estado === 'C' ? 'danger' : 'default')}
        emptyTitle="Sin certificados"
        emptyDescription="Ningún certificado coincide con el filtro actual."
      />
      <EmitirCertificadoModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}

function EmitirCertificadoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const baterias = useBatteryStore((s) => s.baterias)
  const patch = useBatteryStore((s) => s.patchBattery)
  const certificados = useCertificateStore((s) => s.certificados)
  const upsertCert = useCertificateStore((s) => s.upsert)
  const clientes = useDistributorStore((s) => s.clientes)
  const dealers = useDistributorStore((s) => s.dealers)
  const tiposUso = useConfigStore((s) => s.tiposUso)
  const toast = useUiStore((s) => s.pushToast)
  const ask = useUiStore((s) => s.askConfirm)
  const navigate = useNavigate()

  const [serialRaw, setSerialRaw] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [dealerId, setDealerId] = useState('')
  const [ncf, setNcf] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [anio, setAnio] = useState(String(new Date().getFullYear()))
  const [tipoUsoId, setTipoUsoId] = useState('')

  const norm = normalizeSerial(serialRaw)
  const bateria = baterias[norm]
  const certActivo = certificados
    .filter((c) => c.serial === norm && c.estado === 'E')
    .slice(-1)[0]
  const serialValido = Boolean(bateria) && !certActivo

  function validar(): string | null {
    if (!serialRaw.trim()) return 'Ingrese el serial.'
    if (!bateria) return `Serial ${norm} no existe en inventario.`
    if (certActivo)
      return `${norm} ya tiene un CERT-E vigente. Cancele o honre antes de emitir otro. Un certificado C bloquea la honra, no habilita una emisión duplicada.`
    if (!clienteId) return 'Seleccione el cliente final.'
    if (!/^B\d{8,}$/i.test(ncf.trim()))
      return 'NCF inválido: debe iniciar con B seguido de al menos 8 dígitos.'
    if (!marca.trim() || !modelo.trim()) return 'Indique marca y modelo del vehículo.'
    const y = Number(anio)
    const current = new Date().getFullYear()
    if (!Number.isInteger(y) || y < 1980 || y > current + 1)
      return `Año inválido (1980–${current + 1}).`
    if (!tipoUsoId) return 'Seleccione el tipo de uso.'
    return null
  }

  async function emitir() {
    const error = validar()
    if (error) {
      toast(error, 'warn')
      return
    }
    const ok = await ask({
      title: 'Emitir certificado',
      message: `Se emitirá CERT-E para ${norm} a nombre del cliente seleccionado. La batería pasará a ubicación CLIENTE.`,
      confirmLabel: 'Emitir',
    })
    if (!ok) return
    const now = new Date()
    const id = `cert-${norm}-${Date.now()}`
    const cert: Certificado = {
      id,
      serial: norm,
      clienteId,
      dealerId: dealerId || undefined,
      facturaNcf: ncf.trim().toUpperCase(),
      fechaVenta: iso(now),
      fechaActivacion: iso(now),
      fechaFinFull: iso(addMonths(now, 12)),
      fechaFinProrrateo: iso(addMonths(now, 24)),
      estado: 'E',
      vehiculo: { marca: marca.trim(), modelo: modelo.trim(), anio: Number(anio) },
      tipoUsoId,
    }
    upsertCert(cert)
    patch(norm, { ubicacionTipo: 'CLIENTE', ubicacionId: clienteId })
    withHistory(norm, 'VENTA_CLIENTE', `Venta con CERT-E ${cert.facturaNcf}`, () => undefined, {
      estadoNuevo: 'CLIENTE',
    })
    withHistory(norm, 'CERTIFICADO', 'CERT-E emitido (interno)', () => undefined, {
      estadoNuevo: 'E',
      referenciaId: id,
    })
    toast('CERT-E emitido', 'ok')
    onClose()
    navigate(`/certificados/${id}`)
  }

  return (
    <Modal
      open={open}
      title="Emitir certificado"
      description="CERT-E digital para la batería vendida al cliente final."
      icon={BadgePlus}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => void emitir()}>Emitir</Button>
        </>
      }
    >
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="sm:col-span-2">
        <FormField
          label="Serial (sin CERT-E vigente)"
          value={serialRaw}
          onChange={(e) => setSerialRaw(e.target.value)}
          placeholder="CIB-…"
          className="font-code-serial"
          hint={
            serialRaw.trim()
              ? !bateria
                ? 'Serial no encontrado.'
                : certActivo
                  ? 'Bloqueado: ya tiene CERT-E vigente.'
                  : 'Serial disponible para emisión.'
              : undefined
          }
        />
        </div>
        <SelectField label="Cliente final" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          <option value="">Seleccione…</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} · {c.documento}
            </option>
          ))}
        </SelectField>
        <SelectField label="Dealer (opcional)" value={dealerId} onChange={(e) => setDealerId(e.target.value)}>
          <option value="">—</option>
          {dealers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </SelectField>
        <FormField
          label="NCF"
          value={ncf}
          onChange={(e) => setNcf(e.target.value)}
          placeholder="B01…"
          hint="Formato: B + al menos 8 dígitos."
        />
        <div className="grid grid-cols-3 gap-3.5 sm:col-span-2">
          <FormField label="Marca" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="KIA" />
          <FormField label="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Rio" />
          <FormField label="Año" value={anio} onChange={(e) => setAnio(e.target.value)} inputMode="numeric" />
        </div>
        <SelectField label="Tipo de uso" value={tipoUsoId} onChange={(e) => setTipoUsoId(e.target.value)}>
          <option value="">Seleccione…</option>
          {tiposUso.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </SelectField>
        {!serialValido && serialRaw.trim() ? (
          <p className="text-body-sm text-ink-secondary sm:col-span-2">Complete un serial válido para habilitar la emisión.</p>
        ) : null}
      </div>
    </Modal>
  )
}

export function CertificateDetailPage() {
  const { id = '' } = useParams()
  const cert = useCertificateStore((s) => s.certificados.find((c) => c.id === id))
  const cancelar = useCertificateStore((s) => s.cancelar)
  const clientes = useDistributorStore((s) => s.clientes)
  const dealers = useDistributorStore((s) => s.dealers)
  const tiposUso = useConfigStore((s) => s.tiposUso)
  const toast = useUiStore((s) => s.pushToast)
  const ask = useUiStore((s) => s.askConfirm)
  const [motivo, setMotivo] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!cert) {
    return (
      <EmptyState
        icon={FileX2}
        title="Certificado no encontrado"
        description={`No existe un certificado con id «${id}».`}
        action={
          <Link to="/certificados">
            <Button variant="outlined">Volver a certificados</Button>
          </Link>
        }
      />
    )
  }

  const cliente = clientes.find((c) => c.id === cert.clienteId)
  const dealer = dealers.find((d) => d.id === cert.dealerId)
  const transcurridos = Math.max(0, monthsElapsed(new Date(cert.fechaActivacion), new Date()))
  const tramo =
    cert.estado !== 'E'
      ? 'Cancelado'
      : transcurridos < 12
        ? 'Cobertura completa'
        : transcurridos < 24
          ? 'Prorrateo'
          : 'Vencido'

  async function confirmarCancelar() {
    if (!motivo.trim()) {
      toast('Indique el motivo de la cancelación.', 'warn')
      return
    }
    const ok = await ask({
      title: 'Cancelar certificado',
      message: `El certificado de ${cert!.serial} pasará a estado C (Cancelado). Un certificado C bloquea la honra de ese serial. Motivo: ${motivo.trim()}`,
      confirmLabel: 'Cancelar certificado',
      danger: true,
    })
    if (!ok) return
    cancelar(cert!.id)
    withHistory(
      cert!.serial,
      'CERTIFICADO',
      `CERT-C: certificado cancelado. Motivo: ${motivo.trim()}`,
      () => undefined,
      { estadoAnterior: 'E', estadoNuevo: 'C', referenciaId: cert!.id },
    )
    toast('Certificado cancelado (CERT-C). La honra queda bloqueada para este serial.', 'ok')
    setConfirmOpen(false)
    setMotivo('')
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeader
        breadcrumbs={[{ label: 'Certificados', to: '/certificados' }, { label: cert.serial }]}
        title={cert.serial}
        chips={
          <>
            <StatusBadge catalogId={cert.estado} />
            {cert.heredadoDe ? <Pill tone="info">Heredado por honra</Pill> : null}
          </>
        }
        actions={
          <>
            <Link to={`/serial/${cert.serial}`}>
              <Button variant="secondary">Ver ficha del serial</Button>
            </Link>
            {cert.estado === 'E' ? (
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                Cancelar certificado
              </Button>
            ) : null}
          </>
        }
      />

      {cert.estado !== 'E' ? (
        <aside className="flex items-center gap-3 rounded-xl border border-critical-border/60 bg-gradient-to-br from-critical-soft/40 to-critical-soft/80 px-4 py-2.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-critical">
            <FileX2 size={16} aria-hidden="true" />
          </span>
          <p className="text-body-sm text-critical-text">
            Certificado cancelado: la honra está bloqueada para este serial.
          </p>
        </aside>
      ) : null}

      <MetricGrid columns={4}>
        <MetricCard
          label="Estado de la cobertura"
          value={<span className="text-metric-lg">{tramo}</span>}
          icon={cert.estado === 'E' ? ShieldCheck : FileX2}
          tone={cert.estado !== 'E' ? 'danger' : tramo === 'Vencido' ? 'neutral' : 'ok'}
          context={`${transcurridos} meses desde la activación`}
        />
        <MetricCard
          label="Cobertura completa hasta"
          value={<span className="text-metric-lg">{formatDate(cert.fechaFinFull)}</span>}
          icon={BadgeCheck}
          tone="brand"
          context="12 meses desde la activación"
        />
        <MetricCard
          label="Prorrateo hasta"
          value={<span className="text-metric-lg">{formatDate(cert.fechaFinProrrateo)}</span>}
          icon={Repeat}
          tone="accent"
          context="24 meses desde la activación"
        />
        <MetricCard
          label="Venta"
          value={<span className="text-metric-lg">{formatDate(cert.fechaVenta)}</span>}
          icon={FileText}
          tone="neutral"
          context={`NCF ${cert.facturaNcf}`}
        />
      </MetricGrid>

      <section className={cn(PANEL, 'px-4 pb-4 pt-3.5')}>
        <PanelHeader title="Vigencia de la garantía" info="Tramo completo los primeros 12 meses; prorrateo hasta el mes 24." />
        <div className="mt-4">
          <div className="relative flex h-3 overflow-hidden rounded-full bg-neutral-100">
            <span className="h-full w-1/2 bg-success/80" />
            <span className="h-full w-1/2 bg-info/70" />
            <span
              aria-hidden="true"
              className="absolute inset-y-0 w-[3px] rounded-full bg-[#0b2b4c] shadow-[0_0_0_2px_white]"
              style={{ left: `${Math.min(100, (transcurridos / 24) * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-body-xs text-ink-tertiary">
            <span>Activación · {formatDate(cert.fechaActivacion)}</span>
            <span>Fin completa · {formatDate(cert.fechaFinFull)}</span>
            <span>Fin prorrateo · {formatDate(cert.fechaFinProrrateo)}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-3.5 lg:grid-cols-2">
        <SectionCard title="Cliente y venta" icon={<UserRound />}>
          <dl className="divide-y divide-line-subtle">
            <Fila label="Cliente">{cliente?.nombre ?? cert.clienteId}</Fila>
            <Fila label="Documento">{cliente?.documento ?? '—'}</Fila>
            <Fila label="Dealer">{dealer?.nombre ?? 'Venta directa Viamar'}</Fila>
            <Fila label="NCF">{cert.facturaNcf}</Fila>
            <Fila label="Venta / activación">
              {formatDate(cert.fechaVenta)} / {formatDate(cert.fechaActivacion)}
            </Fila>
          </dl>
        </SectionCard>
        <SectionCard title="Vehículo y uso" icon={<Car />}>
          <dl className="divide-y divide-line-subtle">
            <Fila label="Vehículo">
              {cert.vehiculo.marca} {cert.vehiculo.modelo} {cert.vehiculo.anio}
            </Fila>
            <Fila label="Tipo de uso">{tiposUso.find((t) => t.id === cert.tipoUsoId)?.nombre ?? cert.tipoUsoId}</Fila>
            <Fila label="Serial">
              <SerialCell serial={cert.serial} />
            </Fila>
            {cert.heredadoDe ? (
              <Fila label="Heredado de">
                <Link
                  className="inline-flex items-center gap-1 font-semibold text-viamar-500 hover:underline"
                  to={`/certificados/${cert.heredadoDe}`}
                >
                  {cert.heredadoDe}
                  <ArrowRight size={13} />
                </Link>
              </Fila>
            ) : null}
          </dl>
        </SectionCard>
      </div>
      <Modal
        open={confirmOpen}
        title="Cancelar certificado"
        description={`El certificado de ${cert.serial} pasará a CERT-C y bloqueará la honra del serial.`}
        icon={FileX2}
        tone="danger"
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <Button variant="outlined" onClick={() => setConfirmOpen(false)}>
              Volver
            </Button>
            <Button variant="danger" onClick={() => void confirmarCancelar()}>
              Confirmar cancelación
            </Button>
          </>
        }
      >
        <TextAreaField
          label="Motivo de cancelación"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="P. ej. error en NCF, devolución…"
        />
      </Modal>
    </div>
  )
}

function Fila({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-3 py-2 text-body-sm">
      <dt className="text-ink-tertiary">{label}</dt>
      <dd className="min-w-0 text-ink">{children}</dd>
    </div>
  )
}
