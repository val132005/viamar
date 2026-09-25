import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { useUiStore, type ToastTone } from '../../stores/uiStore'
import { cn } from '../../lib/cn'

const ICONS: Record<ToastTone, typeof Info> = {
  ok: CircleCheck,
  warn: CircleAlert,
  error: CircleAlert,
  info: Info,
}

/* Icono en círculo con el tono del aviso, como la actividad reciente del panel. */
const TONE: Record<ToastTone, string> = {
  ok: 'bg-success-soft text-success',
  warn: 'bg-warning-soft text-warning',
  error: 'bg-critical-soft text-critical',
  info: 'bg-viamar-50 text-viamar-600',
}

export function ToastViewport() {
  const toasts = useUiStore((s) => s.toasts)
  const dismiss = useUiStore((s) => s.dismissToast)
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[340px] flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.tone]
        return (
          <div
            key={t.id}
            role="status"
            className="animate-fade-in flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 shadow-lg"
          >
            <span className={cn('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full', TONE[t.tone])}>
              <Icon size={16} strokeWidth={2} aria-hidden="true" />
            </span>
            <p className="flex-1 text-body-sm text-ink">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Cerrar"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-tertiary transition-colors duration-fast hover:bg-surface-hover hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
