import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { BadgeCheck, Car, FileSearch, UserRound } from 'lucide-react'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { formatDate } from '../../domain/dates'
import { normalizeSerial } from '../../domain/serial'
import { useCertificateStore } from '../../stores/certificateStore'
import { useDistributorStore } from '../../stores/distributorStore'

export function CertificatePublicPage() {
  const { id = '' } = useParams()
  const q = decodeURIComponent(id)
  const serial = normalizeSerial(q)
  const certificados = useCertificateStore((s) => s.certificados)
  const clientes = useDistributorStore((s) => s.clientes)
  const digits = q.replace(/-/g, '')
  const cert =
    certificados.find((c) => c.serial === serial) ??
    certificados.find((c) => {
      const cli = clientes.find((x) => x.id === c.clienteId)
      return Boolean(
        cli &&
          (cli.documento.replace(/-/g, '') === digits ||
            cli.nombre.toLowerCase() === q.toLowerCase()),
      )
    })
  const cliente = cert ? clientes.find((c) => c.id === cert.clienteId) : undefined

  if (!cert) {
    return (
      <EmptyState
        framed
        size="lg"
        kind="no-results"
        icon={FileSearch}
        title="Sin certificado"
        description={`No hay un certificado para «${q}». Pruebe CIB-90954410 o una cédula del seed.`}
      />
    )
  }

  return (
    <div className="surface-raised mx-auto flex max-w-xl flex-col overflow-hidden print:shadow-none">
      <div
        className={
          cert.estado === 'E'
            ? 'flex items-center gap-3.5 border-b border-line-subtle bg-gradient-to-br from-white to-success-soft/70 px-6 py-5'
            : 'flex items-center gap-3.5 border-b border-line-subtle bg-gradient-to-br from-white to-critical-soft/70 px-6 py-5'
        }
      >
        <span
          className={
            cert.estado === 'E'
              ? 'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success-soft text-success'
              : 'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-critical-soft text-critical'
          }
        >
          <BadgeCheck size={23} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body-sm text-ink-secondary">Certificado digital</p>
          <h1 className="text-headline-xl tabular-nums text-viamar-600">{cert.serial}</h1>
        </div>
        <StatusBadge catalogId={cert.estado} size="md" />
      </div>
      <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
        <Bloque icon={UserRound} titulo="Cliente">
          <Dato label="Nombre" value={cliente?.nombre ?? '—'} />
          <Dato label="Documento" value={cliente?.documento ?? '—'} />
          <Dato label="NCF" value={cert.facturaNcf} />
        </Bloque>
        <Bloque icon={Car} titulo="Garantía y vehículo">
          <Dato label="Venta" value={formatDate(cert.fechaVenta)} />
          <Dato label="Cobertura completa hasta" value={formatDate(cert.fechaFinFull)} />
          <Dato label="Vehículo" value={`${cert.vehiculo.marca} ${cert.vehiculo.modelo} ${cert.vehiculo.anio}`} />
        </Bloque>
      </div>
    </div>
  )
}

function Bloque({ icon: Icon, titulo, children }: { icon: typeof Car; titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[#e6edf5] bg-[#f7fafd] px-4 py-3">
      <h2 className="mb-2 flex items-center gap-2 text-headline-sm text-ink">
        <Icon size={15} className="text-viamar-500" aria-hidden="true" />
        {titulo}
      </h2>
      <dl className="flex flex-col gap-2">{children}</dl>
    </section>
  )
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-body-xs text-ink-tertiary">{label}</dt>
      <dd className="text-label-lg text-ink">{value}</dd>
    </div>
  )
}
