import { RefreshCw, Send } from 'lucide-react'
import { Pill } from './Pill'
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
    <article className="surface flex flex-col gap-2.5 p-4 transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-viamar-50 text-viamar-600">
          <Send size={16} aria-hidden="true" />
        </span>
        <p className="min-w-0 flex-1 truncate font-semibold tracking-[0.02em] text-viamar-600 text-[13px]">{verb}</p>
        <Pill tone={estado === 'enviado' ? 'ok' : estado === 'error' ? 'danger' : 'warn'} dot>
          {ESTADO_LABEL[estado]}
        </Pill>
      </div>
      {origenId ? <StatusBadge catalogId={origenId} /> : null}
      <pre className="scroll-slim overflow-x-auto rounded-lg border border-[#e6edf5] bg-[#f7fafd] p-2.5 font-mono text-[11.5px] text-ink">
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
