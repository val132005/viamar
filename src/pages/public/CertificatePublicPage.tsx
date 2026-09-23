import { useParams } from 'react-router-dom'
import { FileSearch } from 'lucide-react'
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
        icon={FileSearch}
        title="Sin certificado"
        description={`No hay un certificado para «${q}». Pruebe CIB-90954410 o una cédula del seed.`}
      />
    )
  }

  return (
    <div className="max-w-xl mx-auto bg-white border border-app-border rounded p-6 flex flex-col gap-3 print:shadow-none">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-headline-md text-viamar-800">Certificado digital</h1>
        <StatusBadge catalogId={cert.estado} />
      </div>
      <p className="font-code-serial text-viamar-700">{cert.serial}</p>
      <dl className="grid grid-cols-2 gap-2 text-body-sm">
        <dt className="text-ink-secondary">Cliente</dt>
        <dd>{cliente?.nombre ?? '—'}</dd>
        <dt className="text-ink-secondary">Documento</dt>
        <dd>{cliente?.documento ?? '—'}</dd>
        <dt className="text-ink-secondary">Venta</dt>
        <dd>{formatDate(cert.fechaVenta)}</dd>
        <dt className="text-ink-secondary">Full hasta</dt>
        <dd>{formatDate(cert.fechaFinFull)}</dd>
        <dt className="text-ink-secondary">Vehículo</dt>
        <dd>
          {cert.vehiculo.marca} {cert.vehiculo.modelo} {cert.vehiculo.anio}
        </dd>
        <dt className="text-ink-secondary">NCF</dt>
        <dd>{cert.facturaNcf}</dd>
      </dl>
    </div>
  )
}
