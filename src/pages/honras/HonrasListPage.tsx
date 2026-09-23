import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { formatDate } from '../../domain/dates'
import { estadoDealerLabel } from './DealerAuthPage'
import { autorizarHonraDealer } from '../../stores/actions/honra'
import { useWarrantyStore } from '../../stores/warrantyStore'
import { useUiStore } from '../../stores/uiStore'
import { useCan } from '../../hooks/usePermission'

export function HonrasListPage() {
  const honras = useWarrantyStore((s) => s.honras)
  const canAuth = useCan('autorizar_honra_dealer')
  const toast = useUiStore((s) => s.pushToast)
  const rows = honras.slice().sort((a, b) => b.fechaCalculo.localeCompare(a.fechaCalculo))
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-headline-lg text-viamar-800">Honras</h1>
        <Link to="/honras/nueva">
          <Button>Nueva honra de mostrador</Button>
        </Link>
      </div>
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
          { key: 'origen', header: 'Origen' },
          {
            key: 'estado',
            header: 'Estado',
            render: (h) => (h.origen === 'dealer' ? estadoDealerLabel(h.estado) : h.estado),
          },
          { key: 'decisionVigencia', header: 'Vigencia' },
          {
            key: 'monto',
            header: 'USD cliente',
            render: (h) => h.resultadoCalculo.montoCliente.toFixed(2),
          },
          {
            key: 'fecha',
            header: 'Fecha',
            render: (h) => formatDate(h.fechaCalculo),
          },
          {
            key: 'acc',
            header: '',
            render: (h) =>
              canAuth && h.estado === 'SOLICITADA' ? (
                <Button
                  variant="outlined"
                  className="h-8 text-label-md"
                  onClick={() => {
                    const r = autorizarHonraDealer(h.id)
                    toast(
                      r.ok ? 'Autorizada · pendiente de reposición FIFO' : r.error,
                      r.ok ? 'ok' : 'error',
                    )
                  }}
                >
                  Autorizar
                </Button>
              ) : null,
          },
        ]}
        rows={rows}
        rowKey={(h) => h.id}
      />
    </div>
  )
}
