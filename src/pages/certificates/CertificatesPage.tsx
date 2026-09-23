import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FileX2 } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { FilterBar } from '../../components/ui/FilterBar'
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-headline-lg text-viamar-800">Certificados</h1>
        <Button onClick={() => setFormOpen(true)}>Emitir certificado</Button>
      </div>
      <FilterBar value={q} onChange={setQ} placeholder="Buscar por serial (p. ej. CIB-908…)">
        <div className="flex gap-1">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={
                filtro === f.id
                  ? 'h-10 px-3 rounded text-label-md bg-viamar-500 text-white font-semibold'
                  : 'h-10 px-3 rounded text-label-md bg-white border border-app-border-strong'
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </FilterBar>
      <DataTable
        columns={[
          {
            key: 'serial',
            header: 'Serial',
            render: (c: Certificado) => (
              <Link className="font-code-serial text-viamar-700" to={`/certificados/${c.id}`}>
                {c.serial}
              </Link>
            ),
          },
          {
            key: 'estado',
            header: 'Estado',
            render: (c: Certificado) => <StatusBadge catalogId={c.estado} />,
          },
          {
            key: 'heredado',
            header: 'Herencia',
            render: (c: Certificado) => (c.heredadoDe ? 'Heredado por honra' : '—'),
          },
          {
            key: 'cliente',
            header: 'Cliente',
            render: (c: Certificado) =>
              clientes.find((x) => x.id === c.clienteId)?.nombre ?? c.clienteId,
          },
          { key: 'ncf', header: 'NCF', render: (c: Certificado) => c.facturaNcf },
          {
            key: 'venta',
            header: 'Venta',
            render: (c: Certificado) => formatDate(c.fechaVenta),
          },
        ]}
        rows={rows}
        rowKey={(c) => c.id}
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
    <div className="flex flex-col gap-4 max-w-2xl">
      <Link className="text-body-sm text-viamar-700" to="/certificados">
        ← Certificados
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-headline-lg text-viamar-800 font-code-serial">{cert.serial}</h1>
        <StatusBadge catalogId={cert.estado} />
        {cert.heredadoDe ? (
          <span className="text-label-sm px-2 py-0.5 rounded-sm border border-viamar-300 bg-viamar-50 text-viamar-700">
            Heredado por honra
          </span>
        ) : null}
      </div>
      <div className="bg-white border border-app-border rounded p-4">
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
      <div className="flex flex-wrap gap-2">
        <Link className="font-code-serial" to={`/serial/${cert.serial}`}>
          <Button variant="outlined">Ver ficha del serial</Button>
        </Link>
        {cert.estado === 'E' ? (
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Cancelar certificado
          </Button>
        ) : (
          <p className="text-body-sm text-ink-secondary self-center">
            Certificado cancelado: la honra está bloqueada para este serial.
          </p>
        )}
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
