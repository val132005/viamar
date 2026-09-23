import { RefreshCw } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { Button } from './Button'

type Props = {
  verb: string
  payload: string
  estado: 'pendiente' | 'enviado' | 'error'
  origenId?: string
  onRetry?: () => void
}

const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  enviado: 'Enviado',
  error: 'Error',
}

export function IntegrationCard({ verb, payload, estado, origenId, onRetry }: Props) {
  return (
    <article className="bg-white border border-app-border rounded p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="font-code-serial text-viamar-700 text-[13px]">{verb}</p>
        <span className="text-label-sm uppercase text-ink-secondary">{ESTADO_LABEL[estado]}</span>
      </div>
      {origenId ? <StatusBadge catalogId={origenId} /> : null}
      <pre className="text-[12px] bg-app-bg border border-app-border rounded p-2 overflow-x-auto">
        {payload}
      </pre>
      {estado === 'error' && onRetry ? (
        <Button variant="outlined" className="self-start h-8 text-label-md" onClick={onRetry}>
          <RefreshCw size={14} />
          Reintentar
        </Button>
      ) : null}
    </article>
  )
}
