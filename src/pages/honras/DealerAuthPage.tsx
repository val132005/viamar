import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { SelectField, TextAreaField } from '../../components/ui/FormField'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { formatDate } from '../../domain/dates'
import { useBatteryStore } from '../../stores/batteryStore'
import { useCertificateStore } from '../../stores/certificateStore'
import { useDistributorStore } from '../../stores/distributorStore'
import { useWarrantyStore } from '../../stores/warrantyStore'
import { useUiStore } from '../../stores/uiStore'
import {
  autorizarHonraDealer,
  ejecutarReposicionDealer,
  fifoCandidatos,
  rechazarHonraDealer,
} from '../../stores/actions/honra'

export function estadoDealerLabel(estado: string): string {
  if (estado === 'SOLICITADA') return 'PENDIENTE'
  if (estado === 'APROBADA') return 'AUTORIZADA'
  return estado
}

export function DealerAuthPage() {
  const honras = useWarrantyStore((s) => s.honras)
  const baterias = useBatteryStore((s) => s.baterias)
  const certificados = useCertificateStore((s) => s.certificados)
  const dealers = useDistributorStore((s) => s.dealers)
  const toast = useUiStore((s) => s.pushToast)
  const [motivo, setMotivo] = useState('')
  const [rechazoId, setRechazoId] = useState<string | null>(null)
  const [reposicionId, setReposicionId] = useState<string | null>(null)
  const [reemplazo, setReemplazo] = useState('')

  const dealerDe = (serial: string): string => {
    const certs = certificados.filter((c) => c.serial === serial)
    const dealerId = certs[certs.length - 1]?.dealerId ?? baterias[serial]?.ubicacionId
    return dealers.find((d) => d.id === dealerId)?.nombre ?? dealerId ?? '—'
  }

  const pendientes = useMemo(
    () =>
      honras
        .filter((h) => h.origen === 'dealer' && h.estado === 'SOLICITADA')
        .slice()
        .sort((a, b) => b.fechaCalculo.localeCompare(a.fechaCalculo)),
    [honras],
  )
  const autorizadas = useMemo(
    () =>
      honras
        .filter((h) => h.origen === 'dealer' && h.estado === 'APROBADA')
        .slice()
        .sort((a, b) => b.fechaCalculo.localeCompare(a.fechaCalculo)),
    [honras],
  )
  const historial = useMemo(
    () =>
      honras
        .filter((h) => h.origen === 'dealer' && h.estado !== 'SOLICITADA' && h.estado !== 'APROBADA')
        .slice()
        .sort((a, b) => b.fechaCalculo.localeCompare(a.fechaCalculo)),
    [honras],
  )
  const candidatos = reposicionId ? fifoCandidatos(reposicionId) : []

  function autorizar(honraId: string) {
    const r = autorizarHonraDealer(honraId, motivo.trim() ? motivo.trim() : undefined)
    toast(r.ok ? 'Solicitud AUTORIZADA · habilita reposición FIFO' : r.error, r.ok ? 'ok' : 'error')
    if (r.ok) setMotivo('')
  }

  function rechazar() {
    if (!rechazoId) return
    const r = rechazarHonraDealer(rechazoId, motivo)
    toast(r.ok ? 'Solicitud rechazada' : r.error, r.ok ? 'ok' : 'error')
    if (r.ok) {
      setRechazoId(null)
      setMotivo('')
    }
  }

  function confirmarReposicion() {
    if (!reposicionId || !reemplazo) {
      toast('Seleccione el serial de reemplazo (FIFO)', 'warn')
      return
    }
    const r = ejecutarReposicionDealer(reposicionId, reemplazo)
    toast(r.ok ? `Reposición ejecutada · ${r.reemplazo}` : r.error, r.ok ? 'ok' : 'error')
    if (r.ok) {
      setReposicionId(null)
      setReemplazo('')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-headline-lg text-viamar-800">Autorización de honras dealer</h1>
        <p className="text-body-sm text-ink-secondary">
          Bandeja piloto: autoriza o rechaza con motivo. Al autorizar, la reposición sale del stock
          Viamar del mismo artículo, el más antiguo primero (FIFO).
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-headline-sm">Pendientes ({pendientes.length})</h2>
        <DataTable
          columns={[
            {
              key: 'serial',
              header: 'Serial',
              render: (h) => (
                <Link className="font-code-serial text-viamar-700" to={`/serial/${h.serialOriginal}`}>
                  {h.serialOriginal}
                </Link>
              ),
            },
            { key: 'dealer', header: 'Dealer', render: (h) => dealerDe(h.serialOriginal) },
            {
              key: 'dx',
              header: 'Diagnóstico',
              render: (h) =>
                baterias[h.serialOriginal] ? (
                  <StatusBadge catalogId={baterias[h.serialOriginal].diagnosticoId} />
                ) : (
                  '—'
                ),
            },
            { key: 'vigencia', header: 'Vigencia', render: (h) => h.decisionVigencia },
            {
              key: 'usd',
              header: 'USD cliente',
              render: (h) => h.resultadoCalculo.montoCliente.toFixed(2),
            },
            {
              key: 'acc',
              header: '',
              render: (h) => (
                <div className="flex gap-2">
                  <Button
                    variant="outlined"
                    className="h-8 text-label-md"
                    onClick={() => autorizar(h.id)}
                  >
                    Autorizar
                  </Button>
                  <Button
                    variant="outlined"
                    className="h-8 text-label-md"
                    onClick={() => {
                      setRechazoId(h.id)
                      setMotivo('')
                    }}
                  >
                    Rechazar
                  </Button>
                </div>
              ),
            },
          ]}
          rows={pendientes}
          rowKey={(h) => h.id}
          emptyTitle="Sin solicitudes pendientes"
          emptyDescription="Las solicitudes del portal dealer aparecen aquí."
        />
        <TextAreaField
          label="Motivo / nota de autorización (opcional, queda en trazabilidad)"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-headline-sm">Autorizadas · pendientes de reposición ({autorizadas.length})</h2>
        <DataTable
          columns={[
            {
              key: 'serial',
              header: 'Serial',
              render: (h) => (
                <Link className="font-code-serial text-viamar-700" to={`/serial/${h.serialOriginal}`}>
                  {h.serialOriginal}
                </Link>
              ),
            },
            { key: 'dealer', header: 'Dealer', render: (h) => dealerDe(h.serialOriginal) },
            { key: 'estado', header: 'Estado', render: () => 'AUTORIZADA' },
            {
              key: 'acc',
              header: '',
              render: (h) => (
                <Button
                  className="h-8 text-label-md"
                  onClick={() => {
                    setReposicionId(h.id)
                    setReemplazo('')
                  }}
                >
                  Reponer (FIFO)
                </Button>
              ),
            },
          ]}
          rows={autorizadas}
          rowKey={(h) => h.id}
          emptyTitle="Sin reposiciones pendientes"
          emptyDescription="Las solicitudes autorizadas esperan el serial de reemplazo."
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-headline-sm">Historial dealer</h2>
        <DataTable
          columns={[
            {
              key: 'serial',
              header: 'Serial',
              render: (h) => (
                <Link className="font-code-serial text-viamar-700" to={`/serial/${h.serialOriginal}`}>
                  {h.serialOriginal}
                </Link>
              ),
            },
            { key: 'estado', header: 'Estado', render: (h) => estadoDealerLabel(h.estado) },
            {
              key: 'reemplazo',
              header: 'Reemplazo',
              render: (h) =>
                h.serialReemplazo ? (
                  <Link className="font-code-serial text-viamar-700" to={`/serial/${h.serialReemplazo}`}>
                    {h.serialReemplazo}
                  </Link>
                ) : (
                  '—'
                ),
            },
            {
              key: 'motivo',
              header: 'Motivo',
              render: (h) => h.resultadoCalculo.motivoRechazo ?? '—',
            },
            { key: 'fecha', header: 'Fecha', render: (h) => formatDate(h.fechaCalculo) },
          ]}
          rows={historial}
          rowKey={(h) => h.id}
          emptyTitle="Sin historial"
          emptyDescription="Las solicitudes decididas aparecen aquí."
        />
      </section>

      <Modal
        open={rechazoId !== null}
        title="Rechazar solicitud"
        onClose={() => setRechazoId(null)}
        footer={
          <>
            <Button variant="outlined" onClick={() => setRechazoId(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={rechazar}>
              Rechazar con motivo
            </Button>
          </>
        }
      >
        <TextAreaField
          label="Motivo del rechazo (obligatorio)"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </Modal>

      <Modal
        open={reposicionId !== null}
        title="Reposición FIFO desde stock Viamar"
        onClose={() => setReposicionId(null)}
        footer={
          <>
            <Button variant="outlined" onClick={() => setReposicionId(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarReposicion} disabled={!reemplazo}>
              Confirmar reemplazo
            </Button>
          </>
        }
      >
        <SelectField
          label="Serial de reemplazo (mismo artículo, más antiguo primero)"
          value={reemplazo}
          onChange={(e) => setReemplazo(e.target.value)}
        >
          <option value="">Seleccione…</option>
          {candidatos.map((b, i) => (
            <option key={b.serial} value={b.serial}>
              {b.serial} · ingreso {b.fechaIngreso.slice(0, 10)}{i === 0 ? ' · FIFO' : ''}
            </option>
          ))}
        </SelectField>
        {candidatos.length === 0 ? (
          <p className="text-body-sm text-ink-secondary">
            Sin stock Viamar del mismo artículo para reponer.
          </p>
        ) : null}
      </Modal>
    </div>
  )
}
