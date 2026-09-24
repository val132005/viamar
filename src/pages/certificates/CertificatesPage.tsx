import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BadgeCheck, BadgePlus, FileX2, Repeat, ShieldCheck } from 'lucide-react'
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
import { addMonths, formatDate, iso } from '../../domain/dates'
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

  return (
    <div className="page-fill">
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

      <DataTable
        title="Certificados emitidos"
        icon={<BadgeCheck size={15} />}
        density="compact"
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
      <div className="flex flex-col gap-3">
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
        <div className="grid grid-cols-3 gap-2">
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
          <p className="text-body-sm text-ink-secondary">Complete un serial válido para habilitar la emisión.</p>
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
    <div className="flex max-w-3xl flex-col gap-4">
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
        <aside className="flex items-start gap-2 rounded-md bg-critical-soft px-3 py-2 ring-1 ring-inset ring-critical-border">
          <FileX2 size={15} className="mt-0.5 shrink-0 text-critical" aria-hidden="true" />
          <p className="text-body-sm text-critical-text">
            Certificado cancelado: la honra está bloqueada para este serial.
          </p>
        </aside>
      ) : null}

      <div className="surface p-4">
        <dl className="grid grid-cols-2 gap-2 text-body-sm">
          <dt className="text-ink-secondary">Cliente</dt>
          <dd>{cliente?.nombre ?? cert.clienteId}</dd>
          <dt className="text-ink-secondary">Documento</dt>
          <dd>{cliente?.documento ?? '—'}</dd>
          <dt className="text-ink-secondary">Dealer</dt>
          <dd>{dealer?.nombre ?? '—'}</dd>
          <dt className="text-ink-secondary">NCF</dt>
          <dd>{cert.facturaNcf}</dd>
          <dt className="text-ink-secondary">Venta / activación</dt>
          <dd>
            {formatDate(cert.fechaVenta)} / {formatDate(cert.fechaActivacion)}
          </dd>
          <dt className="text-ink-secondary">Full hasta</dt>
          <dd>{formatDate(cert.fechaFinFull)} (12 meses)</dd>
          <dt className="text-ink-secondary">Prorrateo hasta</dt>
          <dd>{formatDate(cert.fechaFinProrrateo)} (24 meses)</dd>
          <dt className="text-ink-secondary">Vehículo</dt>
          <dd>
            {cert.vehiculo.marca} {cert.vehiculo.modelo} {cert.vehiculo.anio}
          </dd>
          <dt className="text-ink-secondary">Tipo de uso</dt>
          <dd>{tiposUso.find((t) => t.id === cert.tipoUsoId)?.nombre ?? cert.tipoUsoId}</dd>
          {cert.heredadoDe ? (
            <>
              <dt className="text-ink-secondary">Heredado de</dt>
              <dd>
                <Link className="text-viamar-700" to={`/certificados/${cert.heredadoDe}`}>
                  {cert.heredadoDe}
                </Link>
              </dd>
            </>
          ) : null}
        </dl>
      </div>
      <Modal
        open={confirmOpen}
        title="Cancelar certificado"
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

