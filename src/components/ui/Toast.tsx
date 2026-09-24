import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { useUiStore, type ToastTone } from '../../stores/uiStore'

const ICONS: Record<ToastTone, typeof Info> = {
  ok: CircleCheck,
  warn: CircleAlert,
  error: CircleAlert,
  info: Info,
}

const TONE: Record<ToastTone, string> = {
  ok: 'border-ok text-ok',
  warn: 'border-warn text-warn',
  error: 'border-danger text-danger',
  info: 'border-viamar-200 text-viamar-800',
}

export function ToastViewport() {
  const toasts = useUiStore((s) => s.toasts)
  const dismiss = useUiStore((s) => s.dismissToast)
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => {
        const Icon = ICONS[t.tone]
        return (
          <div
            key={t.id}
            className={`bg-white/95 backdrop-blur border rounded-xl shadow-lift px-3 py-2.5 flex items-start gap-2 page-enter ${TONE[t.tone]}`}
          >
            <Icon size={16} className="mt-0.5 shrink-0" />
            <p className="text-body-sm text-ink flex-1">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Cerrar">
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
