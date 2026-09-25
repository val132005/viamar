import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { LucideIcon } from 'lucide-react'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

export type ModalTone = 'brand' | 'danger' | 'ok' | 'neutral'

const ICONO: Record<ModalTone, string> = {
  brand: 'bg-viamar-50 text-viamar-600',
  danger: 'bg-critical-soft text-critical',
  ok: 'bg-success-soft text-success',
  neutral: 'bg-neutral-100 text-ink',
}

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** Contexto bajo el título: qué se va a hacer y sobre qué. */
  description?: ReactNode
  /** Icono en círculo, como la cabecera del panel de detalle del serial. */
  icon?: LucideIcon
  tone?: ModalTone
  size?: 'md' | 'lg'
}

/**
 * Diálogo con la piel del panel de detalle de Trazabilidad: icono en círculo,
 * título con su contexto, cierre redondo y un pie gris azulado para las
 * acciones. Escape y el clic fuera lo cierran.
 */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  description,
  icon: Icon,
  tone = 'brand',
  size = 'md',
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  /* Portal al body: la animación de entrada de la página crea un contenedor
     con transform que, si no, recortaría el velo a la zona de contenido. */
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#0b2b4c]/35 backdrop-blur-[3px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'animate-fade-in relative flex max-h-[calc(100vh-32px)] w-full flex-col overflow-hidden rounded-xl border border-line bg-white shadow-lg',
          size === 'lg' ? 'max-w-2xl' : 'max-w-lg',
        )}
      >
        <header className="flex shrink-0 items-start gap-3 px-5 pb-3 pt-4">
          {Icon ? (
            <span
              className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full', ICONO[tone])}
              aria-hidden="true"
            >
              <Icon size={19} strokeWidth={2} />
            </span>
          ) : null}
          <div className={cn('min-w-0 flex-1', Icon && 'pt-0.5')}>
            <h2 id="modal-title" className="text-headline-md text-ink">
              {title}
            </h2>
            {description ? <p className="mt-0.5 text-body-sm text-ink-secondary">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-secondary transition-colors duration-fast hover:bg-surface-hover hover:text-ink"
          >
            <X size={17} />
          </button>
        </header>
        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-2">{children}</div>
        {footer ? (
          <footer className="flex shrink-0 justify-end gap-2 border-t border-[#edf1f6] bg-[#f7fafd] px-5 py-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
